#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

output="$(
  bash "$SCRIPT_DIR/extract-tag-endpoints.sh" Users <<'YAML'
openapi: 3.0.0
paths:
  /users:
    get:
      tags:
        - Users
      summary: List users
      operationId: ListUsers
      description: |-
        First line of a longer description.
        Second line should be preserved too.
      responses:
        '200':
          description: OK
YAML
)"

expected="First line of a longer description. Second line should be preserved too."

if [[ "$output" != *"$expected"* ]]; then
  echo "Expected multiline description to be preserved" >&2
  echo "$output" >&2
  exit 1
fi
