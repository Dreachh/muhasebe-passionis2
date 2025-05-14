'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyAdAvS2I5ErlCcchaSzOP3225Qd0w1vayI",
  authDomain: "passionis-travel.firebaseapp.com",
  projectId: "passionis-travel",
  storageBucket: "passionis-travel.appspot.com",
  messagingSenderId: "1094253004348",
  appId: "1:1094253004348:web:b1a0ec2ed6d8137a2e6539",
  databaseURL: "https://passionis-travel-default-rtdb.europe-west1.firebasedatabase.app"
};

// Firebase başlat (tek bir instance oluştur)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase servislerini al
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

// Firebase servislerini dışa aktar
export const getDb = () => db;
export const getRtdb = () => rtdb;
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;

// Doğrudan erişim için
export { db, rtdb, app, auth };