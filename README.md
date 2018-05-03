### Franz-manager

This application cannot work without the franz-manager-api --> [here](https://github.com/GreenCom-Networks/Franz-manager-api)

#### Development

First, install the dependencies by running `npm install` or `yarn install`.

Then, run `npm start`, the command will execute a local server on port 8080.

Finally just go on localhost:8080 and enjoy.

#### Docker

Build your docker : `docker build -t franz-manager .`

Then run it : `docker run -p 8080:80 franz-manager`

App should be available at localhost:8080
