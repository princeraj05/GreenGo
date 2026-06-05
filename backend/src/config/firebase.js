import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully using service account certificate.");
    } catch (err) {
      console.error("Failed to parse or initialize Firebase Admin with service account certificate:", err);
    }
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log("Firebase Admin initialized successfully using Project ID.");
  } else {
    console.warn("WARNING: Firebase environment variables (FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID) are missing. Firebase verification may fail.");
  }
}

export default admin;
