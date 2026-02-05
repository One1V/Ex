import admin from 'firebase-admin';
import { env, required } from './env.js';

let serviceAccount;
try {
  serviceAccount = JSON.parse(required('FIREBASE_SERVICE_ACCOUNT_JSON', env.FIREBASE_SERVICE_ACCOUNT_JSON));
} catch (e) {
  throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ' + e.message);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const firebaseAuth = admin.auth();
