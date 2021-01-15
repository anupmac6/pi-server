const firebase = require("firebase");

const config = {
  apiKey: "AIzaSyCEeDoKZEV2LKV6OvL0cuHlsmccTUSlkFA",
  authDomain: "api-anup-macwan.firebaseapp.com",
  projectId: "api-anup-macwan",
  storageBucket: "api-anup-macwan.appspot.com",
  messagingSenderId: "791751209608",
  appId: "1:791751209608:web:39941ef842724f4250e53d",
  measurementId: "G-S804KSRDWX",
};

firebase.initializeApp(config);
const firestore = firebase.firestore();

const settings = { timestampsInSnapshots: true };
firestore.settings(settings);
exports.firestore = firestore;

exports.Timestamp = firebase.firestore.Timestamp;
