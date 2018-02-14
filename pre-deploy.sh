#! /bin/bash
npm run build:client
npm run build:server
docker build --no-cache -t nip10/tvshows-manager:latest .
docker push nip10/tvshows-manager:latest 