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
      admin.initializeApp({
        projectId: "byte-bite-placeholder"
      });
    }
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID || "byte-bite-placeholder";
    admin.initializeApp({
      projectId: projectId
    });
    console.log(`Firebase Admin initialized successfully using Project ID: ${projectId}`);
  }
}

export default admin;
