import admin from 'firebase-admin';

const serviceAccount = require('./firebase-adminsdk.json'); // Production SDK

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.PROD_DATABASE_URL,
  });
}

const db = admin.database();
export default db;
