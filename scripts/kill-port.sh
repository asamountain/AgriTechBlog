#!/bin/bash

# Kill process on specified port
# Usage: ./scripts/kill-port.sh 3000

PORT=${1:-3000}

echo "🔍 Checking for processes on port $PORT..."

# Find process ID using the port
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
  echo "✅ Port $PORT is free"
  exit 0
else
  echo "⚠️  Found process $PID on port $PORT"
  echo "🔪 Killing process..."
  kill -9 $PID
  
  # Wait a moment for the port to be released
  sleep 1
  
  # Verify the port is now free
  NEW_PID=$(lsof -ti:$PORT)
  if [ -z "$NEW_PID" ]; then
    echo "✅ Successfully killed process on port $PORT"
    exit 0
  else
    echo "❌ Failed to kill process on port $PORT"
    exit 1
  fi
fi
