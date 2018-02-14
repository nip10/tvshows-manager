#!/usr/bin/env bash

docker-compose run --rm web npm run migrate:prod
docker-compose run --rm web npm run seed:prod