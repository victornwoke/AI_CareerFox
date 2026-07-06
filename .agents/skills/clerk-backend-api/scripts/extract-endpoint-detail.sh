#!/usr/bin/env bash
# extract-endpoint-detail.sh
#
# Extracts full details for a specific endpoint from an OpenAPI YAML spec (stdin),
# including parameters, request body, responses, and all referenced component schemas.
#
# Usage:
#   curl -s <spec-url> | bash extract-endpoint-detail.sh "/users/{user_id}/billing/subscription" "get"

set -euo pipefail

ENDPOINT="${1:?Usage: extract-endpoint-detail.sh <path> <method>}"
METHOD="${2:?Usage: extract-endpoint-detail.sh <path> <method>}"
TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

SPEC="$TMPDIR_WORK/spec.yml"
cat > "$SPEC"

node - "$ENDPOINT" "$METHOD" "$SPEC" <<'SCRIPT'
const fs = require("fs");
const endpoint = process.argv[2];
const method = process.argv[3].toLowerCase();
const specFile = process.argv[4];
const lines = fs.readFileSync(specFile, "utf8").split("\n");

const httpMethods = ["get", "post", "put", "patch", "delete", "options", "head"];

// Locate paths: and components: sections
let pathsStart = -1, pathsEnd = -1, componentsStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^paths:\s*$/.test(lines[i])) pathsStart = i;
  else if (pathsStart >= 0 && pathsEnd < 0 && /^\S/.test(lines[i]) && i > pathsStart) pathsEnd = i;
  if (/^components:\s*$/.test(lines[i])) componentsStart = i;
}
if (pathsEnd < 0) pathsEnd = lines.length;

// Find the target path + method block
let targetStart = -1, targetEnd = -1;
let currentPath = null;

for (let i = pathsStart + 1; i < pathsEnd; i++) {
  const line = lines[i];

  // Path line: exactly 2 spaces + /
  if (/^ {2}\/\S/.test(line)) {
    currentPath = line.trim().replace(/:$/, "");
    continue;
  }

  // Method line: exactly 4 spaces + method name
  const methodMatch = line.match(/^ {4}(\w+):\s*$/);
  if (methodMatch && httpMethods.includes(methodMatch[1])) {
    if (currentPath === endpoint && methodMatch[1] === method) {
      targetStart = i;
      // Find end of this method block
      for (let j = i + 1; j < pathsEnd; j++) {
        const nextLine = lines[j];
        // New method or new path
        if (/^ {2}\/\S/.test(nextLine) || (/^ {4}\w+:\s*$/.test(nextLine) && httpMethods.some(m => nextLine.trim().startsWith(m + ":")))) {
          targetEnd = j;
          break;
        }
      }
      if (targetEnd < 0) targetEnd = pathsEnd;
      break;
    }
  }
}

if (targetStart < 0) {
  console.error(`Endpoint not found: ${method.toUpperCase()} ${endpoint}`);
  process.exit(1);
}

const blockLines = lines.slice(targetStart, targetEnd);

// Collect all $refs from the block
const allRefs = new Set();
for (const bl of blockLines) {
  const refMatch = bl.match(/\$ref:\s*['"]?(#\/[^'"}\s]+)['"]?/);
  if (refMatch) allRefs.add(refMatch[1]);
}

function pointerPart(part) {
  return part.replace(/~1/g, "/").replace(/~0/g, "~");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineIndent(line) {
  return line.length - line.trimStart().length;
}

function findScopeEnd(start, indent) {
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    if (lineIndent(line) <= indent) return i;
  }
  return lines.length;
}

// Resolve a $ref path to the raw YAML lines for that component
function resolveRef(ref) {
  const parts = ref.replace("#/", "").split("/").map(pointerPart);
  let scopeStart = 0;
  let scopeEnd = lines.length;
  let foundIndex = -1;

  for (let p = 0; p < parts.length; p++) {
    const indent = p * 2;
    const keyPattern = new RegExp(`^ {${indent}}${escapeRegExp(parts[p])}:\\s*(?:.*)?$`);
    foundIndex = -1;

    for (let i = scopeStart; i < scopeEnd; i++) {
      if (keyPattern.test(lines[i])) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex < 0) {
      throw new Error(`Could not resolve ref segment "${parts[p]}" in ${ref}`);
    }

    scopeStart = foundIndex + 1;
    scopeEnd = findScopeEnd(foundIndex, indent);
  }

  // Collect lines for this component (until same or lower indent)
  const baseIndent = parts.length * 2;
  const result = [];
  for (let i = scopeStart; i < scopeEnd; i++) {
    const line = lines[i];
    if (line.trim() === "") { result.push(line); continue; }
    const indent = lineIndent(line);
    if (indent < baseIndent) break;
    result.push(line);
  }
  return result;
}

// Recursively resolve refs from component bodies
function collectDeepRefs(refSet, visited) {
  const toProcess = [...refSet].filter(r => !visited.has(r));
  for (const ref of toProcess) {
    visited.add(ref);
    const body = resolveRef(ref);
    for (const bl of body) {
      const refMatch = bl.match(/\$ref:\s*['"]?(#\/[^'"}\s]+)['"]?/);
      if (refMatch && !visited.has(refMatch[1])) {
        refSet.add(refMatch[1]);
      }
    }
  }
  // Recurse if new refs were found
  const newRefs = [...refSet].filter(r => !visited.has(r));
  if (newRefs.length > 0) collectDeepRefs(refSet, visited);
}

collectDeepRefs(allRefs, new Set());

// Output
console.log(`## \`${method.toUpperCase()}\` \`${endpoint}\`\n`);
console.log("### Endpoint Definition\n");
console.log("```yaml");
for (const bl of blockLines) {
  console.log(bl);
}
console.log("```\n");

if (allRefs.size > 0) {
  console.log(`### Referenced Components (${allRefs.size})\n`);
  const sorted = [...allRefs].sort();
  for (const ref of sorted) {
    const name = ref.split("/").pop();
    const category = ref.replace("#/", "").split("/").slice(0, -1).join("/");
    console.log(`#### \`${name}\` (${category})\n`);
    const body = resolveRef(ref);
    console.log("```yaml");
    for (const bl of body) console.log(bl);
    console.log("```\n");
  }
}
SCRIPT
