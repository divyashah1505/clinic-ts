// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALQjLvOqLVKbATxRSMbtKigtT374PfXJA",
  authDomain: "clinic-b8339.firebaseapp.com",
  projectId: "clinic-b8339",
  storageBucket: "clinic-b8339.firebasestorage.app",
  messagingSenderId: "317965324972",
  appId: "1:317965324972:web:caa083c021cb53288ec509",
  measurementId: "G-ZSZ7X01EJK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);