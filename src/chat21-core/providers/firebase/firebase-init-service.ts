import { Injectable } from '@angular/core';

// firebase
// import firebase from 'firebase/app';
/*
  Generated class for the AuthService provider.
  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
/**
 * DESC PROVIDER
 */
export class FirebaseInitService {

  public static firebaseInit: any;
  
  constructor() {
  }

  public static async initFirebase(firebaseConfig: any) {
    const { default: firebase} = await import("firebase/app");
    if(!FirebaseInitService.firebaseInit){
      if (!firebaseConfig || firebaseConfig.apiKey === 'CHANGEIT') {
        throw new Error('Firebase config is not defined. Please create your widget-config.json. See the Chat21-Web_widget Installation Page');
      } 
      FirebaseInitService.firebaseInit = firebase.initializeApp(firebaseConfig); 
    }
    return FirebaseInitService.firebaseInit
  }
}