import admin from "firebase-admin";
import dotenv from 'dotenv'
import fs from 'fs';

dotenv.config()

 
const serviceAccountPath = "/secrets/firebase/serviceAccountKey.json";
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
try {
  if (fs.existsSync(serviceAccountPath)) {
    const jsonContent = fs.readFileSync(serviceAccountPath, 'utf-8');
    console.log("✅ Service Account JSON Found.");
    console.log("🔒 Service Account Preview (sanitized):", JSON.parse(jsonContent)?.project_id);
  } else {
    console.error("❌ Service account key file not found at:", serviceAccountPath);
  }
} catch (error) {
  console.error("❌ Error reading service account JSON:", error);
}


export const firebaseApp =admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
