#!/bin/bash

# Builds the docker image for the web-platform pipeline.

export DOCKER_BUILDKIT=1

docker build -t aaronbaw/crimson-web-core -f ./docker-scripts/Dockerfile_web_core ./