# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER OmgImAlexis

# Install apt-get dependencies
RUN apt-get update
RUN apt-get -y install python build-essential wget git

# Install npm
RUN wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
ENV SHIPPABLE_NODE_VERSION=v6.6.0
RUN . $HOME/.nvm/nvm.sh && nvm install $SHIPPABLE_NODE_VERSION && nvm alias default $SHIPPABLE_NODE_VERSION && nvm use default

# Install global NPM packages
RUN . $HOME/.nvm/nvm.sh && npm install -g nodemon

RUN mkdir /src \
    && cd /src \
    && git init . \
    && git remote add -t \* -f origin https://github.com/OmgImAlexis/Twistly.git \
    && git checkout master \
    && echo "{}" > /src/config.json

# Install node deps from package.json
RUN . $HOME/.nvm/nvm.sh && cd /src && npm install bcrypt && npm install --production

# Expose port
EXPOSE 3000

# Run app using nodemon
CMD . $HOME/.nvm/nvm.sh && cd /src/ && nodemon app.js
