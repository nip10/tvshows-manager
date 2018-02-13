#!/usr/bin/env bash

docker-compose run --rm web npm run migrate
docker-compose run --rm web npm run seed