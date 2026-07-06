#!/usr/bin/env bash

# Execute a Clerk Backend API request with scope enforcement.
#
# Usage: bash execute-request.sh [--admin] <METHOD> <PATH> [BODY]
#
# Scope enforcement:
#   GET     — always allowed
#   POST, PUT, PATCH — requires CLERK_BAPI_SCOPES="write" or --admin flag
#   DELETE  — requires CLERK_BAPI_SCOPES="write,delete" or --admin flag

set -euo pipefail

_load_env_file() {
  local _line _key _value

  while IFS= read -r _line || [[ -n "$_line" ]]; do
    _line="${_line#"${_line%%[![:space:]]*}"}"
    [[ -z "$_line" || "${_line:0:1}" == "#" || "$_line" != *"=" ]] && continue

    if [[ "$_line" == export[[:space:]]* ]]; then
      _line="${_line#export}"
      _line="${_line#"${_line%%[![:space:]]*}"}"
    fi

    _key="${_line%%=*}"
    _value="${_line#*=}"
    _key="${_key%"${_key##*[![:space:]]}"}"
    _value="${_value#"${_value%%[![:space:]]*}"}"
    _value="${_value%"${_value##*[![:space:]]}"}"

    [[ "$_key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    if [[ "${#_value}" -ge 2 ]]; then
      if [[ "${_value:0:1}" == "\"" && "${_value: -1}" == "\"" ]]; then
        _value="${_value:1:${#_value}-2}"
      elif [[ "${_value:0:1}" == "'" && "${_value: -1}" == "'" ]]; then
        _value="${_value:1:${#_value}-2}"
      fi
    fi

    printf -v "$_key" '%s' "$_value"
    export "$_key"
  done < "$1"
}

# Walk up from $PWD to find .env/.env.local (mirrors Clerk CLI behavior).
# Stops at the first directory that provides CLERK_SECRET_KEY.
_dir="$PWD"
while true; do
  for _envfile in "$_dir/.env" "$_dir/.env.local"; do
    if [[ -f "$_envfile" ]]; then
      _load_env_file "$_envfile"
    fi
  done
  [[ -n "${CLERK_SECRET_KEY:-}" ]] && break
  _parent="$(dirname "$_dir")"
  [[ "$_parent" == "$_dir" ]] && break
  _dir="$_parent"
done
unset -f _load_env_file
unset _dir _parent _envfile

# Parse --admin flag
ADMIN=false
if [[ "${1:-}" == "--admin" ]]; then
  ADMIN=true
  shift
fi

METHOD="${1:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
PATH_ARG="${2:?Usage: execute-request.sh [--admin] <METHOD> <PATH> [BODY]}"
BODY="${3:-}"

METHOD_UPPER=$(echo "$METHOD" | tr '[:lower:]' '[:upper:]')
SCOPES="${CLERK_BAPI_SCOPES:-}"

# Scope check
if [[ "$ADMIN" == false ]]; then
  case "$METHOD_UPPER" in
    GET)
      ;; # always allowed
    POST|PUT|PATCH)
      if [[ "$SCOPES" != *"write"* ]]; then
        echo "ERROR: $METHOD_UPPER requests require CLERK_BAPI_SCOPES=\"write\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    DELETE)
      if [[ "$SCOPES" != *"write"* ]] || [[ "$SCOPES" != *"delete"* ]]; then
        echo "ERROR: DELETE requests require CLERK_BAPI_SCOPES=\"write,delete\" or --admin flag." >&2
        echo "Current CLERK_BAPI_SCOPES: \"$SCOPES\"" >&2
        exit 1
      fi
      ;;
    *)
      echo "ERROR: Unknown HTTP method: $METHOD_UPPER" >&2
      exit 1
      ;;
  esac
fi

# Base URL: use CLERK_BACKEND_API_URL if set, otherwise default to production
BASE_URL="${CLERK_BACKEND_API_URL:-https://api.clerk.com}"

# Build curl command
CURL_ARGS=(
  -s
  -f
  -X "$METHOD_UPPER"
  "${BASE_URL}/v1${PATH_ARG}"
  -H "Authorization: Bearer ${CLERK_SECRET_KEY:?CLERK_SECRET_KEY is not set}"
  -H "Content-Type: application/json"
)

if [[ -n "$BODY" ]]; then
  CURL_ARGS+=(-d "$BODY")
fi

curl "${CURL_ARGS[@]}"
