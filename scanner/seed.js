import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TS STRIPPING MATH FOR HARMONIOUS INTEGRATION ---
const tsFilePath = path.join(__dirname, '../src/data/stakeholders.ts');
const tempJsPath = path.join(__dirname, 'temp_stakeholders.js');

console.log("Reading static stakeholders from:", tsFilePath);
if (!fs.existsSync(tsFilePath)) {
  console.error("Error: stakeholders.ts file not found at " + tsFilePath);
  process.exit(1);
}

const tsContent = fs.readFileSync(tsFilePath, 'utf8');

// Strip interface definition and TS typing declaration
const jsContent = tsContent
  .replace(/export interface Stakeholder \{[\s\S]*?\}/, '')
  .replace(': Stakeholder[]', '');

fs.writeFileSync(tempJsPath, jsContent, 'utf8');

const { STAKEHOLDERS } = await import('./temp_stakeholders.js');

// Cleanup temp JS file
try {
  fs.unlinkSync(tempJsPath);
} catch {
  // Ignored
}

console.log(`Successfully extracted ${STAKEHOLDERS.length} stakeholders from stakeholders.ts.`);


// --- TS STRIPPING MATH FOR RESEARCHERS INTEGRATION ---
const resTsFilePath = path.join(__dirname, '../src/data/researchers.ts');
const tempResJsPath = path.join(__dirname, 'temp_researchers.js');

console.log("Reading static researchers from:", resTsFilePath);
if (!fs.existsSync(resTsFilePath)) {
  console.error("Error: researchers.ts file not found at " + resTsFilePath);
  process.exit(1);
}

const resTsContent = fs.readFileSync(resTsFilePath, 'utf8');

const resJsContent = resTsContent
  .replace(/export interface Researcher \{[\s\S]*?\}/g, '')
  .replace(/export interface ResearcherConnection \{[\s\S]*?\}/g, '')
  .replace(': Researcher[]', '')
  .replace(': ResearcherConnection[]', '');

fs.writeFileSync(tempResJsPath, resJsContent, 'utf8');

const { RESEARCHERS, RESEARCHER_CONNECTIONS } = await import('./temp_researchers.js');

// Cleanup temp JS file
try {
  fs.unlinkSync(tempResJsPath);
} catch {
  // Ignored
}

console.log(`Successfully extracted ${RESEARCHERS.length} researchers and ${RESEARCHER_CONNECTIONS.length} researcher connections from researchers.ts.`);


// --- FIREBASE ADMIN INITIALIZATION ---
const serviceAccountPath = path.join(__dirname, 'service_account.json');
let credential = null;

if (fs.existsSync(serviceAccountPath)) {
  console.log("Using local service_account.json credentials...");
  credential = admin.credential.cert(serviceAccountPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log("Using credentials from FIREBASE_SERVICE_ACCOUNT environment variable...");
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  console.log("No explicit service account provided. Attempting to use Google Application Default Credentials (ADC)...");
  try {
    credential = admin.credential.applicationDefault();
  } catch (err) {
    console.error("\n[ERROR] Failed to initialize Firebase Admin with Application Default Credentials!", err);
    console.error("Please place your Firebase Service Account JSON file at 'scanner/service_account.json' or set the 'FIREBASE_SERVICE_ACCOUNT' environment variable.");
    process.exit(1);
  }
}

admin.initializeApp({
  credential,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sfle-hpai-surveillance"
});

const db = admin.firestore();

async function seedDatabase() {
  console.log("Seeding Cloud Firestore...");
  const batch = db.batch();
  const collectionRef = db.collection('stakeholders');

  STAKEHOLDERS.forEach((s) => {
    // Generate document reference with explicit s.id as the document ID
    const docRef = collectionRef.doc(s.id);
    batch.set(docRef, {
      ...s,
      roles: s.roles || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "baseline_paper"
    }, { merge: true });
  });

  try {
    await batch.commit();
    console.log(`\n[SUCCESS] Seeding complete! Uploaded/merged ${STAKEHOLDERS.length} stakeholders into Firestore.`);

    // --- SEED CONNECTIONS ---
    console.log("Seeding baseline connections into Cloud Firestore...");
    const connCollectionRef = db.collection('connections');
    const initialConnections = [
      { source: "cwhc-nat-wcvm", target: "cwhc", label: "National Admin Hub" },
      { source: "cwhc-on", target: "cwhc", label: "ON Regional Feed" },
      { source: "cwhc-bc", target: "cwhc", label: "BC Regional Feed" },
      { source: "cwhc-qc", target: "cwhc", label: "QC Regional Feed" },
      { source: "cwhc-ab", target: "cwhc", label: "AB Regional Feed" },
      { source: "cwhc-atl", target: "cwhc", label: "Atlantic Regional Feed" },

      { source: "cwhc", target: "cfia", label: "Wildlife Alerts" },
      { source: "cwhc", target: "phac", label: "Zoonotic Spillovers" },
      { source: "cwhc", target: "eccc", label: "Migratory Syntheses" },

      { source: "ahl-guelph", target: "omafra", label: "Presumptive Reports" },
      { source: "ahl-guelph", target: "ncfad", label: "Confirmatory Shipping" },

      { source: "ahc-abbotsford", target: "bc-agri", label: "Presumptive Reports" },
      { source: "ahc-abbotsford", target: "ncfad", label: "Confirmatory Shipping" },

      { source: "inspq-lab", target: "msss-qc", label: "Human Diagnostic Feed" },
      { source: "inspq-lab", target: "nml", label: "Genetic Sequencing Data" },

      { source: "cfia", target: "ncfad", label: "Lab Directives" },
      { source: "cfia", target: "cahss", label: "Outbreak Geospatial Data" },
      { source: "phac", target: "nml", label: "Diagnostic Directives" },

      { source: "cezd", target: "cahss", label: "Threat Intelligence Integration" },
      { source: "cahss", target: "omafra", label: "Outbreak Dashboards" },
      { source: "cahss", target: "bc-agri", label: "Outbreak Dashboards" },
      { source: "cahss", target: "mapaq", label: "Outbreak Dashboards" },

      { source: "cfc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "efc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "tfc", target: "cfia", label: "Producer Biosecurity Compliance" },
      { source: "efc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "cfc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "tfc", target: "oahn", label: "Clinical Trend Reports" },
      { source: "oahn", target: "omafra", label: "Joint Veterinary Advisories" },
      { source: "oahn", target: "cfia", label: "Epidemiological Summaries" },
      { source: "oahn", target: "cahss", label: "Provincial Surveillance Rollups" },

      // --- EXPANDED HIGH-FIDELITY CONNECTIONS (LAST 12 MONTHS) ---
      { source: "cfia", target: "usda-aphis", label: "Transboundary Swine/Cattle H5N1 Genome Sharing" },
      { source: "phac", target: "who", label: "Pandemic Treaty & Spillover Reporting" },
      { source: "cfia", target: "woah", label: "WAHIS H5N1 Bovine Outbreak Alerts" },
      { source: "cwhc", target: "eccc", label: "Wild Bird GPS & Flyway Cross-referencing" },
      { source: "nml", target: "glam", label: "Wastewater Genomics Dashboards" },
      { source: "oahn", target: "cahss", label: "Ontario Poultry/Bovine Surveillance Integration" },
      { source: "wecahn", target: "cahss", label: "Western Poultry/Bovine Surveillance Integration" },
      { source: "cfc", target: "cahss", label: "Poultry Outbreak Live Dashboards" },
      { source: "efc", target: "cahss", label: "Egg Producer Biosecurity Data Sharing" },
      { source: "tfc", target: "cahss", label: "Turkey Industry H5N1 Case Aggregation" },
      { source: "phac", target: "cahss", label: "One Health Swine-Avian Coordination" },
      { source: "ncfad", target: "nml", label: "BSL-4 Joint Avian-Swine Reassortant Genotyping" }
    ];

    const connBatch = db.batch();
    initialConnections.forEach((c) => {
      const connId = `${c.source}_to_${c.target}`.toLowerCase();
      const docRef = connCollectionRef.doc(connId);
      connBatch.set(docRef, {
        source: c.source,
        target: c.target,
        label: c.label,
        sourceType: "baseline_paper",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await connBatch.commit();
    console.log(`Successfully seeded ${initialConnections.length} connections into Firestore.`);

    // --- SEED RESEARCHERS ---
    console.log("Seeding researchers into Cloud Firestore...");
    const researcherRef = db.collection('researchers');
    const resBatch = db.batch();
    RESEARCHERS.forEach((r) => {
      const docRef = researcherRef.doc(r.id);
      resBatch.set(docRef, {
        ...r,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await resBatch.commit();
    console.log(`Successfully seeded ${RESEARCHERS.length} researchers into Firestore.`);

    // --- SEED RESEARCHER CONNECTIONS ---
    console.log("Seeding researcher connections into Cloud Firestore...");
    const resConnRef = db.collection('researcher_connections');
    const resConnBatch = db.batch();
    RESEARCHER_CONNECTIONS.forEach((rc) => {
      const connId = `${rc.source}_to_${rc.target}`.toLowerCase();
      const docRef = resConnRef.doc(connId);
      resConnBatch.set(docRef, {
        ...rc,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await resConnBatch.commit();
    console.log(`Successfully seeded ${RESEARCHER_CONNECTIONS.length} researcher connections into Firestore.`);

  } catch (error) {
    console.error("Failed to commit batch upload to Firestore:", error);
    process.exit(1);
  }
}

seedDatabase();
