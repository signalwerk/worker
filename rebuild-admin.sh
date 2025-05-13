#!/bin/bash

docker compose down
docker compose build
# docker compose build worker-admin
# docker compose build kv-service
docker compose up