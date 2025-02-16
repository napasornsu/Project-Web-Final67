import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAC-DWRmQDJZ-otDzbLLl69XP9L8UDYIm4",
    authDomain: "finalweb67.firebaseapp.com",
    projectId: "finalweb67",
    storageBucket: "finalweb67.appspot.com",
    messagingSenderId: "329238043303",
    appId: "1:329238043303:web:cdc6d1590f2e9627705982",
    measurementId: "G-J5JD8DWD73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };