import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyAC-DWRmQDJZ-otDzbLLl69XP9L8UDYIm4",
    authDomain: "finalweb67.firebaseapp.com",
    projectId: "finalweb67",
    storageBucket: "finalweb67.appspot.com",
    messagingSenderId: "329238043303",
    appId: "1:329238043303:web:cdc6d1590f2e9627705982",
    measurementId: "G-J5JD8DWD73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };