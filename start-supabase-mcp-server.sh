#!/bin/bash
# Script to start Supabase MCP server locally with personal access token and project ref

# Export your Supabase personal access token as an environment variable
export SUPABASE_ACCESS_TOKEN="sbp_21826fbca726ef45f15e15a8b574ec23841f532c"

# Run the Supabase MCP server with project reference ID and read-only flag
npx -y @supabase/mcp-server-supabase@latest --project-ref=shoqsnzdwceqnisssqqh --read-only
