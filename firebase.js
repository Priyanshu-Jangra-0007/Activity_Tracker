import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuk1-E7-RfE7coqA9hh4rAFpTNIlyTbV8",
  authDomain: "activity-tracker-web-dc8bb.firebaseapp.com",
  projectId: "activity-tracker-web-dc8bb",
  storageBucket: "activity-tracker-web-dc8bb.firebasestorage.app",
  messagingSenderId: "243753651024",
  appId: "1:243753651024:web:3030467037a6c830b63a55"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
