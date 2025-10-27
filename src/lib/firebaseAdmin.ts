
// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

type MaybeAuth = admin.auth.Auth | undefined;
type MaybeApp = admin.app.App | undefined;
type MaybeFirestore = admin.firestore.Firestore | undefined;

let adminApp: MaybeApp = undefined;
let adminAuth: MaybeAuth = undefined;
let adminFirestore: MaybeFirestore = undefined;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// The private key from the .env file needs to have its newlines escaped.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

try {
  if (!admin.apps.length) {
    if (clientEmail && privateKey && projectId) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

        adminAuth = adminApp.auth();
        adminFirestore = adminApp.firestore();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ firebaseAdmin: Initialized admin SDK successfully.');
        }
    } else {
      if (process.env.NODE_ENV === 'development') {
        const missingVars = [
            !projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
            !clientEmail && 'FIREBASE_ADMIN_CLIENT_EMAIL',
            !privateKey && 'FIREBASE_ADMIN_PRIVATE_KEY'
        ].filter(Boolean).join(', ');
        
        console.warn(`🔥 firebaseAdmin: Admin SDK not initialized. Missing required environment variables: ${missingVars}.`);
      }
    }
  } else {
    adminApp = admin.app();
    adminAuth = adminApp.auth();
    adminFirestore = admin.firestore();
  }
} catch (err: any) {
  console.error('💥 firebaseAdmin: CRITICAL - Failed to initialize Firebase Admin SDK.');
  console.error('Error Code:', err.code);
  console.error('Error Message:', err.message);
  
  if (err.code === 'app/invalid-credential' || err.message.includes('invalid_grant')) {
      console.error('\n\n>>> ROOT CAUSE: The service account credentials in your .env.local file are invalid or have been revoked. Please generate a new private key from your Firebase project settings and update FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.\n\n');
  } else if (err.message.includes('private key')) {
      console.error('Hint: Check if the FIREBASE_ADMIN_PRIVATE_KEY in your .env.local file is formatted correctly as a single-line string with \\n characters.');
  }

  adminApp = undefined;
  adminAuth = undefined;
  adminFirestore = undefined;
}

export { adminApp, adminAuth, adminFirestore };
export default adminApp;
