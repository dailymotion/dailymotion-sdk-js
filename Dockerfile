FROM node:12.6.0

LABEL maintainer "Player Squad <squad-player@dailymotion.com>"

# Configure app basedir

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install yuicompressor deps

RUN apt-get update && apt-get install -y java-common default-jre-headless java-wrappers libjargs-java

# Install Node deps

COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app
RUN npm install

# Copy app source

COPY src /usr/src/app/src

# Run!

CMD ["npm", "run", "build"]
