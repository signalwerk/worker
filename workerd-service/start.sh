#!/bin/bash

# Start the restart watcher in the background
echo "Starting restart watcher..."
/app/restart-watcher.sh &

# Initial startup of workerd
echo "Starting workerd..."
/usr/local/bin/workerd serve /app/DATA/config.capnp > /app/workerd.log 2>&1 &
echo $! > /app/workerd.pid

echo "Services started. Workerd PID: $(cat /app/workerd.pid)"

# Keep the container running
tail -f /app/workerd.log 