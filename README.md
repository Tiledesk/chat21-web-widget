[![npm version](https://badge.fury.io/js/%40chat21%2Fchat21-web-widget.svg)](https://badge.fury.io/js/%40chat21%2Fchat21-web-widget)

# Tiledesk Introduction

Tiledesk-server is the server engine of Tiledesk. Tiledesk is an Open Source Live Chat platform with integrated Chatbots written in NodeJs and Express. Build your own customer support with a multi-channel platform for Web, Android and iOS.

Designed to be open source since the beginning, we actively worked on it to create a totally new, first class customer service platform based on instant messaging.

What is Tiledesk today? It became the open source “conversational app development” platform that everyone needs 😌

You can use Tiledesk to increase sales for your website or for post-sales customer service. Every conversation can be automated using our first class native chatbot technology. You can also connect your own applications using our APIs or Webhooks. Moreover you can deploy entire visual applications inside a conversation. And your applications can converse with your chatbots or your end-users! We know this is cool 😎

Tiledesk is multichannel in a totally new way. You can write your chatbot scripts with images, buttons and other cool elements that your channels support. But you will configureyour chatbot replies only once. They will run on every channel, auto-adapting the responses to the target channel whatever it is, Whatsapp, Facebook Messenger, Telegram etc.

# Tiledesk web-widget

> ***🚀 Do you want to install Tiledesk on your server with just one click?***
> 
> ***Use [Docker Compose Tiledesk installation](https://github.com/Tiledesk/tiledesk-deployment/blob/master/docker-compose/README.md) guide***

Tiledesk web-widget is a Free Live Chat Widget built on Firebase with Angular5 that lets you support and chat with visitors and customers on your website. 
More information about web widget here : http://www.tiledesk.com

<img width="600" alt="dialogo_widgetchat_2" src="https://user-images.githubusercontent.com/47848430/151355859-f94be6a7-3098-43a2-924c-d411e10d5815.png">

With Tiledesk web-widget you can:
* Invite your website visitors to share feedback and suggestions to better understand their needs.
* Answer questions from website visitors instantly to increase trust
* Add a code snippet to your website easly 
* It's a HTML5 widget built with Google Firebase, Angular5 and Bootstrap

# Community? Questions? Support ?
If you need help or just want to hang out, come, say hi on our [<img width="15" alt="Tiledesk discord" src="https://seeklogo.com/images/D/discord-color-logo-E5E6DFEF80-seeklogo.com.png"> Discord](https://discord.gg/nERZEZ7SmG) server or make a post on our [Forum](https://tiledesk.discourse.group)

# Features
* Send a direct message to a preset user
* Receive realtime support from your team
* Form to enter the chat sentiment
* Configure the widget with company logo and colors
* Tiledesk Web Widget is free and open source.

# Prerequisites #
* Install Git
* Install Angular CLI with  `npm install -g @angular/cli`. More info here https://github.com/angular/angular-cli#installation
* Create a Firebase project. Create one free on `https://firebase.google.com`
* "Chat21 Firebase cloud functions" installed. Instructions:`https://github.com/chat21/chat21-cloud-functions`

# Run Tiledesk with Docker Compose

Do you want to install all the Tiledesk components on your server with just one click?
Use [Docker Compose Tiledesk installation guide](https://github.com/Tiledesk/tiledesk-deployment/blob/master/docker-compose/README.md)

# Installation

* Clone the repository from master (or use a tagged release) with command: ```git clone https://github.com/Tiledesk/chat21-web-widget <YOUR_PATH>```
* Move to the downloaded project path ```cd <YOUR_PATH>```
* Build running: `npm install`

## Dev configuration 

Configure the environment.ts file in `src/environments/`.
Use the Firebase configuration file from your Firebase project to correctly configure the 'firebase' section.

#### environment.ts
```typescript
export const environment = {
  production: true,
  version: require('../../package.json').version,
  remoteConfig: false, // for performance don't load settings from remote
  remoteConfigUrl: '/widget-config.json',
  loadRemoteTranslations: true,
  remoteTranslationsUrl: 'https://<YOUR_REMOTE_TRANSLATIONS_URL>/',
  chatEngine: "mqtt", // OR YOUR CUSTOM CHAT ENGINE
  updloaEngine: "native", // OR YOUR CUSTOM UPLOAD ENGINE
  logLevel: '<YOUR-PREFERRED-LOG-LEVEL-NUMBER>',
  firebaseConfig: {
    apiKey: '123ABC..',
    authDomain: 'XYZ.firebaseapp.com',
    databaseURL: 'https://XYZ.firebaseio.com',
    projectId: 'XYZ',
    storageBucket: 'XYZ.appspot.com',
    messagingSenderId: '123456',
    appId: "CHANGEIT",
    tenant: 'tilechat', 
  },
  chat21Config: {
    appId: 'tilechat',
    MQTTendpoint: 'mqtt://<YOUR-MQTT-ENPOINT>',
    APIendpoint: 'http://<YOUR-MQTT-API-ENPOINT>'
  },
  apiUrl: 'https://<YOUR-TILEDESK-API-URL>/',
  baseImageUrl: 'https://<YOUR-BASE-IMAGE-URL>/',
  dashboardUrl: "https://<YOUR-TILEDESK-DASHBOARD-URL>/",
  defaultLang : 'en',
  storage_prefix : 'widget_sv5',
  authPersistence: 'LOCAL',
  supportMode: true,
  enbedJs: true,
};
```

* `logLevel`: The Tiledesk web-widget supports 4 log levels. The order is as follows:
  `Error < Warn < Info < Debug`

### RUN in dev

Run the app with `ng serve`

## Prod configuration

For production installation, configure the environment.prod.ts file in `src/environments/`.

#### environment.prod.ts
```typescript
export const environment = {
  production: true,
  ...
};

```

# Build for production
 
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

Build for production with :  `ng build --prod --base-href --output-hashing none`


# Deploy

## Deploy to a Web Server
Copy the content of the dist folder to your Web Server (for example Apache or Nginx)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Widget in action
You can see a configuration of this widget in action on 'https://www.tiledesk.com'

# Deploy
## Deploy to a web Server
Copy the content of the dist folder to your Web Server (for example Apache or Nginx)

## Deploy to AWS S3 (Optional)

Run : `aws s3 sync . s3://tiledesk-widget`

Or With a different AWS Profile: 

Run : `aws --profile f21 s3 sync . s3://tiledesk-widget`

If you use AWS Cloud Front enable gzip compression.


# Run with docker

  
To run Tiledesk web-widget on port 4200 run:

```

curl https://raw.githubusercontent.com/chat21/chat21-web-widget/master/env.sample --output .env

nano .env #configure .env file properly

docker run -p 4200:80 --env-file .env chat21/chat21-web-widget

```


