#!/bin/bash

# docker compose down
# docker compose build
# docker compose up


# docker compose build worker-admin

docker compose down kv-service
docker compose build kv-service
docker compose up kv-service

