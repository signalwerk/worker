#!/bin/bash

docker compose down
docker compose build worker-admin
docker compose up