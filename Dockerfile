FROM ubuntu:14.04

ENV DEBIAN_FRONTEND noninteractive

LABEL maintainer="Thomas Ferreira <thomas.ferreira@dailymotion.com>"

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential yui-compressor \
    && rm -rf /var/lib/apt/lists/*

COPY . /usr/src/

WORKDIR /usr/src
