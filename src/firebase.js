// Firebase Configuration & Initialization
import { initializeApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCEoP5c0IMv6VscSQ9-jKWwo6w-6BVN4js",
  authDomain: "rotary-central.firebaseapp.com",
  projectId: "rotary-central",
  storageBucket: "rotary-central.firebasestorage.app",
  messagingSenderId: "699965210773",
  appId: "1:699965210773:web:de5b7ddbb60f932add1b9c",
  measurementId: "G-ERTXPESVDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection References
export const MEMBERS_COLLECTION = "members";
export const STORAGE_FOLDER = "member_profiles";

export default app;
