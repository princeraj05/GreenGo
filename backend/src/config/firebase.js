import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || "greengo-102bd";
  if (serviceAccountJson) {
    try {
      // Clean wrapping single quotes if present
      const cleanJson = serviceAccountJson.trim().replace(/^'|'$/g, "");
      const serviceAccount = JSON.parse(cleanJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully using service account certificate.");
    } catch (err) {
      console.error("Failed to parse or initialize Firebase Admin with service account certificate:", err);
      admin.initializeApp({
        projectId: fallbackProjectId
      });
      console.log(`Firebase Admin fallback initialized with Project ID: ${fallbackProjectId}`);
    }
  } else {
    admin.initializeApp({
      projectId: fallbackProjectId
    });
    console.log(`Firebase Admin initialized successfully using Project ID: ${fallbackProjectId}`);
  }
}

export default admin;
