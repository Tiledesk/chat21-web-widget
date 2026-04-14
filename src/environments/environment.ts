// The file contents for the current environment will overwrite these during build2.
// The build2 system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build2 --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.


// -----> FIREBASE PROD V5 <----------
// export const environment = {
//   production: true,
//   version: require('../../package.json').version, // https://stackoverflow.com/questions/34907682/how-to-display-app-version-in-angular2
//   remoteConfig: false,
//   remoteConfigUrl: '/widget-config.json',
//   loadRemoteTranslations: true,
//   remoteTranslationsUrl: 'https://api.tiledesk.com/v2/',
//   chatEngine: 'firebase',
//   uploadEngine: 'firebase',
//   fileUploadAccept:"*/*",
//   logLevel: 'ERROR',
//   firebaseConfig: {
//     apiKey: 'AIzaSyDKfdKrlD7AYcbQ-U-xxgV-b3FUQ4xt7NM',
//     authDomain: 'tiledesk-prod-v2.firebaseapp.com',
//     databaseURL: 'https://tiledesk-prod-v2.firebaseio.com',
//     projectId: 'tiledesk-prod-v2',
//     storageBucket: 'tiledesk-prod-v2.appspot.com',
//     messagingSenderId: '92907897826',
//     appId: '1:92907897826:web:f255664014a7cc14ee2fbb',
//     tenant: 'tilechat',
//   },
//   chat21Config: {
//     appId: 'tilechat',
//     MQTTendpoint: 'mqtt://localhost:15675/ws', // MQTT endpoint
//     APIendpoint: 'http://localhost:8004/api'
//   },
//   apiUrl: 'https://api.tiledesk.com/v2/',
//   baseImageUrl: 'https://firebasestorage.googleapis.com/v0/b/',
//   dashboardUrl: 'https://console.tiledesk.com/v2/dashboard/',
//   defaultLang : 'en',
//   storage_prefix : 'widget_sv5',
//   authPersistence: 'LOCAL',
//   supportMode: true,
//   enbedJs: true
// };


// // -----> MQTT PROD V6 <----------
export const environment = {
  production: true,
  version: require('../../package.json').version, // https://stackoverflow.com/questions/34907682/how-to-display-app-version-in-angular2
  // globalRemoteJSSrc:"https://widget.tiledesk.com/scripts/segment_script.js",
  remoteConfig: false,
  remoteConfigUrl: '/widget-config.json',
  loadRemoteTranslations: true,
  remoteTranslationsUrl: 'https://api.tiledesk.com/v3/',
  chatEngine: 'mqtt',
  uploadEngine: 'native',
  logLevel: 'ERROR',
  firebaseConfig: {
    apiKey: 'AIzaSyDKfdKrlD7AYcbQ-U-xxgV-b3FUQ4xt7NM',
    authDomain: 'tiledesk-prod-v2.firebaseapp.com',
    databaseURL: 'https://tiledesk-prod-v2.firebaseio.com',
    projectId: 'tiledesk-prod-v2',
    storageBucket: 'tiledesk-prod-v2.appspot.com',
    messagingSenderId: '92907897826',
    appId: '1:92907897826:web:f255664014a7cc14ee2fbb',
    tenant: 'tilechat',
  },
  chat21Config: {
    appId: 'tilechat',
    MQTTendpoint: 'wss://eu.rtmv3.tiledesk.com/mqws/ws', // MQTT endpoint
    APIendpoint: 'https://eu.rtmv3.tiledesk.com/chatapi/api',
    log: false
  },
  apiUrl: 'https://api.tiledesk.com/v3/',
  baseImageUrl: 'https://eu.rtmv3.tiledesk.com/api/',
  dashboardUrl: 'https://panel.tiledesk.com/v3/dashboard/',
  defaultLang : 'en',
  storage_prefix : 'widget_sv6',
  authPersistence: 'LOCAL',
  supportMode: true,
  enbedJs: true,
};
