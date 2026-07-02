import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || "greengo-102bd";
  if (serviceAccountJson) {
    try {
      // Clean wrapping quotes and remove all backslashes except those followed by 'n' (newlines) or 't' (tabs)
      let cleanJson = serviceAccountJson.trim();
      
      // Remove wrapping single or double quotes if the whole value is wrapped
      if ((cleanJson.startsWith("'") && cleanJson.endsWith("'")) || 
          (cleanJson.startsWith('"') && cleanJson.endsWith('"'))) {
        cleanJson = cleanJson.slice(1, -1);
      }
      
      // Strip backslashes that are not part of control characters (\n, \t)
      cleanJson = cleanJson.replace(/\\(?![nt])/g, '');
      
      // Convert double-escaped newlines (\\n) into single-escaped newlines (\n)
      cleanJson = cleanJson.replace(/\\\\n/g, '\\n');
      
      const serviceAccount = JSON.parse(cleanJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully using service account certificate.");
    } catch (err) {
      console.error("Failed to parse or initialize Firebase Admin with service account certificate:", err);
      // Fallback: If parsing still fails, try replacing all backslashes except before 'n' and parse
      try {
        const fallbackClean = serviceAccountJson.replace(/\\(?![nt])/g, '');
        const serviceAccount = JSON.parse(fallbackClean);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully using fallback sanitized service account.");
      } catch (fallbackErr) {
        console.error("Firebase Admin absolute fallback failed:", fallbackErr);
        admin.initializeApp({
          projectId: fallbackProjectId
        });
        console.log(`Firebase Admin fallback initialized with Project ID: ${fallbackProjectId}`);
      }
    }
  } else {
    admin.initializeApp({
      projectId: fallbackProjectId
    });
    console.log(`Firebase Admin initialized successfully using Project ID: ${fallbackProjectId}`);
  }
}

export default admin;
