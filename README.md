### Franz-manager

This application cannot work without the franz-manager-api --> [here](https://github.com/GreenCom-Networks/Franz-manager-api)

This application is a smooth alternative to kafka-manager. It needs JMX to be enabled on your kafka server.

Features : 
 - Inspect cluster state (topics, consumers, offsets, brokers, replicas, settings).
 - Topics listing.
 - Topics creation / deletion.
 - Detailed topic information (metrics, settings, partitions, consumers, last messages).
 - Consumers listing.
 - Live consumption (gif below).
 - Detailed consumer information (partitions, topic offset, consumer offset, lag, commit timestamp).

#### Gifs

###### Live consumption

![live_consumption](https://github.com/GreenCom-Networks/Franz-manager/blob/master/demo_assets/live_consuming.gif)

#### Screenshots

###### Cluster view
![cluster view](https://github.com/GreenCom-Networks/Franz-manager/blob/master/demo_assets/cluster_view.png)
###### Topic view
![topic view](https://github.com/GreenCom-Networks/Franz-manager/blob/master/demo_assets/topic_view.png)
###### Consumers view
![consumers view](https://github.com/GreenCom-Networks/Franz-manager/blob/master/demo_assets/consumers_view.png)

#### Development

First, install the dependencies by running `npm install` or `yarn install`.

Then, run `npm start`, the command will execute a local server on port 8080.

Finally just go on localhost:8080 and enjoy.

#### Docker

Build your docker : `docker build -t franz-manager .`

Then run it : `docker run -e SERVER_URL=https://API_URL.net/franz-manager-api -p 8080:80 franz-manager`
(don't forget /franz-manager-api at the end of the url)

App should be available at localhost:8080
