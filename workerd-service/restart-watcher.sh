#!/bin/bash

SIGNAL_FILE="/app/DATA/.restart-workerd"
PID_FILE="/app/workerd.pid"
LAST_TIMESTAMP=""

echo "Workerd restart watcher started"
echo "Monitoring $SIGNAL_FILE for changes"

while true; do
  if [ -f "$SIGNAL_FILE" ]; then
    CURRENT_TIMESTAMP=$(cat "$SIGNAL_FILE")
    
    if [ "$CURRENT_TIMESTAMP" != "$LAST_TIMESTAMP" ]; then
      echo "$(date): Restart signal detected ($CURRENT_TIMESTAMP)"
      
      if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        
        if ps -p $PID > /dev/null; then
          echo "Sending SIGTERM to workerd process (PID: $PID)"
          kill -15 $PID
          
          # Wait for process to exit
          for i in {1..10}; do
            if ! ps -p $PID > /dev/null; then
              break
            fi
            sleep 0.5
          done
          
          # Force kill if still running
          if ps -p $PID > /dev/null; then
            echo "Process didn't exit gracefully, sending SIGKILL"
            kill -9 $PID
          fi
        else
          echo "Process with PID $PID is not running"
        fi
      else
        echo "PID file not found"
      fi
      
      echo "Starting workerd..."
      nohup /usr/local/bin/workerd serve /app/DATA/config.capnp > /app/workerd.log 2>&1 &
      echo $! > "$PID_FILE"
      echo "Workerd restarted with PID $(cat $PID_FILE)"
      
      LAST_TIMESTAMP="$CURRENT_TIMESTAMP"
    fi
  fi
  
  # Check every 2 seconds
  sleep 2
done 