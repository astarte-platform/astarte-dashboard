#!/bin/sh
# This script dynamically configures the Astarte Dashboard at startup.
# It merges environment variables with the configuration JSON, ensuring that
# environment variables take precedence even when a read-only ConfigMap is mounted.

# Set default values for core configuration variables using the DASHBOARD_ prefix
export DASHBOARD_ASTARTE_API_URL=${DASHBOARD_ASTARTE_API_URL:-"http://api.astarte.localhost"}
export DASHBOARD_DEFAULT_AUTH=${DASHBOARD_DEFAULT_AUTH:-"token"}
export DASHBOARD_AUTH_TYPE=${DASHBOARD_AUTH_TYPE:-"token"}

# Map the DASHBOARD_SHOW_SIDEBAR variable to the expected hideSidebar JSON boolean
if [ "${DASHBOARD_SHOW_SIDEBAR}" = "false" ]; then
    HIDE_SIDEBAR_VAL="true"
else
    HIDE_SIDEBAR_VAL="false"
fi

# Ensure DASHBOARD_ENABLE_FLOW_PREVIEW is strictly parsed as a boolean string for jq
if [ "${DASHBOARD_ENABLE_FLOW_PREVIEW}" = "true" ]; then
    FLOW_PREVIEW_VAL="true"
else
    FLOW_PREVIEW_VAL="false"
fi

# Define file paths
CONFIG_DIR="/usr/share/nginx/html/user-config"
MOUNTED_CONFIG="$CONFIG_DIR/config.json"
TEMPLATE_FILE="/usr/share/nginx/html/config.json.template"
RUNTIME_CONFIG="/tmp/runtime-config.json"

# Check if a user-provided config.json is mounted
if [ -f "$MOUNTED_CONFIG" ]; then
    echo "User-mounted config.json found. Merging with DASHBOARD_ environment variables..."
    
    jq --arg api "$DASHBOARD_ASTARTE_API_URL" \
       --arg auth "$DASHBOARD_DEFAULT_AUTH" \
       --argjson hide "$HIDE_SIDEBAR_VAL" \
       --argjson flow "$FLOW_PREVIEW_VAL" \
       '.astarte_api_url = $api | .default_auth = $auth | .enable_flow_preview = $flow | .ui = (.ui // {}) | .ui.hideSidebar = $hide' \
       "$MOUNTED_CONFIG" > "$RUNTIME_CONFIG"
else
    echo "No user-mounted config.json found. Generating from template..."
    
    envsubst < "$TEMPLATE_FILE" > "$RUNTIME_CONFIG"
    
    TMP_JSON=$(jq --argjson hide "$HIDE_SIDEBAR_VAL" --argjson flow "$FLOW_PREVIEW_VAL" '.enable_flow_preview = $flow | .ui = (.ui // {}) | .ui.hideSidebar = $hide' "$RUNTIME_CONFIG")
    echo "$TMP_JSON" > "$RUNTIME_CONFIG"
fi

echo "Runtime configuration ready at $RUNTIME_CONFIG"
