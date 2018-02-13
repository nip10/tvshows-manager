FROM node:9-alpine

# Set our `WORKDIR` to /home/node/example-app
# Recommended by Dockerfile best practices - https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/#workdir
WORKDIR $HOME/tvm

# Add bash
RUN apk add --update bash && rm -rf /var/cache/apk/*

# Copy package*.json files
COPY package.json .
COPY package-lock.json .

# Install app dependencies
RUN npm config set registry http://registry.npmjs.org \
    && npm install --silent --production \
    # npm cache is of no use. So remove cache so that docker image size is small(er)
    && npm cache clean --force \
    && rm -rf /tmp/* \
    && rm -rf $HOME/.node-gyp

# Copy all the app files
COPY .env .
COPY migrate.sh .
COPY wait-for-it.sh .
ADD dist .

# DEBUG
RUN ls