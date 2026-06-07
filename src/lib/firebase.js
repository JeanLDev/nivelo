import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCzNxm7fNbB6yp6TX98NETs10pw3dndFoY",
  authDomain: "naig-b3d9d.firebaseapp.com",
  projectId: "naig-b3d9d",
  storageBucket: "naig-b3d9d.firebasestorage.app",
  messagingSenderId: "933577447885",
  appId: "1:933577447885:web:94ce7a6f571b3d5b4c8c84",
  measurementId: "G-715LPQ5XKX"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);