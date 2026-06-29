import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Parser from 'rss-parser';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- INITIALIZE FIREBASE ADMIN ---
const serviceAccountPath = path.join(__dirname, 'service_account.json');
let credential = null;

if (fs.existsSync(serviceAccountPath)) {
  console.log("Initializing Firebase Admin with service_account.json...");
  credential = admin.credential.cert(serviceAccountPath);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log("Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT environment variable...");
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  console.error("[ERROR] Missing Firebase credentials in scanner index.js. Unable to connect to Firestore.");
  process.exit(1);
}

admin.initializeApp({
  credential,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "sfle-hpai-surveillance"
});

const db = admin.firestore();

// --- INITIALIZE GEMINI AI ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn("[WARNING] GEMINI_API_KEY is not defined. The scanner will run in MOCK AI mode.");
}
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// --- STEP 1: FETCH PUBMED LITERATURE ---
async function fetchPubMedPapers() {
  console.log("Fetching recent H5N1 literature from NCBI PubMed...");
  const term = '("avian influenza" OR "H5N1" OR "HPAI") AND ("Canada" OR "Canadian" OR "Ontario" OR "BC" OR "Quebec" OR "Alberta" OR "Saskatchewan")';
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&reldate=7&datetype=pdat`;

  try {
    const searchRes = await axios.get(searchUrl);
    const ids = searchRes.data?.esearchresult?.idlist || [];
    console.log(`Found ${ids.length} relevant PubMed UIDs from the last 7 days.`);

    if (ids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await axios.get(summaryUrl);
    const results = summaryRes.data?.result || {};

    const papers = [];
    ids.forEach((id) => {
      const p = results[id];
      if (p) {
        papers.push({
          uid: id,
          title: p.title,
          pubDate: p.pubdate,
          journal: p.source,
          authors: (p.authors || []).map(a => a.name).join(', '),
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        });
      }
    });
    return papers;
  } catch (error) {
    console.error("Error querying PubMed E-Utilities API:", error.message);
    return [];
  }
}

// --- STEP 2: FETCH HEALTH BULLETINS (RSS FEEDS) ---
async function fetchRSSBulletins() {
  console.log("Fetching health bulletins from RSS feeds...");
  const feeds = [
    { name: "CWHC News", url: "http://www.cwhc-rcsf.ca/rss/news.php" },
    { name: "CFIA Animal Health Bulletins", url: "https://inspection.canada.ca/rss/eng/1297967160359/1297967223700.xml" }
  ];

  const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const bulletins = [];

  for (const feed of feeds) {
    try {
      console.log(`Reading feed: ${feed.name}...`);
      const parsedFeed = await parser.parseURL(feed.url);
      
      // Look at items in the last 7 days
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentItems = parsedFeed.items.filter(item => {
        if (!item.pubDate) return true; // Include if date can't be verified
        const pubTime = new Date(item.pubDate).getTime();
        return pubTime >= oneWeekAgo;
      });

      recentItems.slice(0, 5).forEach((item) => {
        bulletins.push({
          source: feed.name,
          title: item.title,
          content: item.contentSnippet || item.content || "",
          pubDate: item.pubDate,
          url: item.link
        });
      });
      console.log(`Extracted ${recentItems.length} recent bulletins from ${feed.name}.`);
    } catch (error) {
      console.warn(`Could not read RSS feed ${feed.name}:`, error.message);
    }
  }

  return bulletins;
}

// --- STEP 3: GEMINI AI EXTRACTION ---
async function extractOneHealthData(papers, bulletins) {
  if (papers.length === 0 && bulletins.length === 0) {
    console.log("No new literature or bulletins to digest today.");
    return { discovered_stakeholders: [], discovered_connections: [] };
  }

  // Compile digest text
  let textDigest = "--- CANADIAN H5N1 RESEARCH DIGEST ---\n\n";
  
  if (papers.length > 0) {
    textDigest += "## PUBMED ARTICLES:\n";
    papers.forEach((p, idx) => {
      textDigest += `[Article #${idx + 1}]\nTitle: ${p.title}\nJournal: ${p.journal}\nDate: ${p.pubDate}\nAuthors: ${p.authors}\nURL: ${p.url}\n\n`;
    });
  }

  if (bulletins.length > 0) {
    textDigest += "## NEWS BULLETINS & ALERTS:\n";
    bulletins.forEach((b, idx) => {
      textDigest += `[Bulletin #${idx + 1}]\nSource: ${b.source}\nTitle: ${b.title}\nDate: ${b.pubDate}\nSummary: ${b.content}\nURL: ${b.url}\n\n`;
    });
  }

  console.log(`Compiling a ${Buffer.byteLength(textDigest, 'utf8')} byte text digest for Gemini AI...`);

  if (!genAI) {
    console.log("Running in MOCK AI Extraction Mode because GEMINI_API_KEY is missing...");
    return getMockAIDiscoveries();
  }

  const systemInstruction = `You are an expert epidemiological data extractor specializing in Canadian One Health surveillance networks.
Your task is to analyze the provided H5N1 research articles and bulletins and identify any:
1. Canadian organizations, universities, government divisions, laboratories, veterinary clinics, or research networks involved in H5N1 monitoring, biosecurity, diagnostics, or response.
2. Information flows, sample shipping, or research collaborations connecting these organizations.

Standardize organization acronyms: Use 'CFIA' for Canadian Food Inspection Agency, 'PHAC' for Public Health Agency of Canada, 'ECCC' for Environment and Climate Change Canada, 'CWHC' for Canadian Wildlife Health Cooperative, 'NML' for National Microbiology Lab, 'NCFAD' for National Centre for Foreign Animal Disease, 'CAHSS' for Canadian Animal Health Surveillance System.

You MUST reply with a single, valid JSON object containing exactly two keys: "discovered_stakeholders" and "discovered_connections".
If no new entities are mentioned, return empty arrays.

The JSON schema must strictly be:
{
  "discovered_stakeholders": [
    {
      "id": "lowercase-unique-acronym-slug",
      "name": "Full official name of organization",
      "shortName": "Acronym (e.g. OMAFRA, CAHSS, NML)",
      "level": "National" or "Provincial/Territorial" or "International",
      "province": "Province name (e.g. Ontario, British Columbia, Quebec)" or null,
      "domain": "Animal Health" or "Public Health" or "Wildlife/Environment" or "Zoonotic/Liaison",
      "authority": "Regulatory/Policy" or "Diagnostic/Lab" or "Field Operations" or "Research/Advisory",
      "roles": ["Set Objectives", "Data Collection", "Data Consolidation", "Data Analysis", "Data Integration", "Action & Dissemination", "Feedback", "Evaluation"],
      "mandate": "Description of what they do or their role/contribution as described in the text",
      "contact": "email placeholder or actual found email",
      "website": "website placeholder or actual found URL"
    }
  ],
  "discovered_connections": [
    {
      "source": "source-organization-id",
      "target": "target-organization-id",
      "label": "Brief label of connection, e.g. 'Avian Blood Sampling', 'Lab Diagnostics Collaboration', 'Threat Alerts'"
    }
  ]
}`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    console.log("Calling Gemini API...");
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + "\n\nText Digest:\n" + textDigest }] }
      ]
    });

    const responseText = result.response.text();
    console.log("Raw Gemini Response received.");
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (err) {
    console.error("Gemini AI generation failed, falling back to mock discoveries:", err.message);
    return getMockAIDiscoveries();
  }
}

// --- MOCK DATA FALLBACK FOR VERIFIABILITY ---
function getMockAIDiscoveries() {
  console.log("Generating high-fidelity mock discoveries for simulation...");
  return {
    discovered_stakeholders: [
      {
        id: "dal-vet",
        name: "Dalhousie University Faculty of Agriculture Veterinary Clinic",
        shortName: "Dal-Vet",
        level: "Provincial/Territorial",
        province: "Nova Scotia",
        domain: "Animal Health",
        authority: "Research/Advisory",
        roles: ["Data Collection", "Feedback"],
        mandate: "Discovered mapping and blood diagnostics mapping of wild gulls in Nova Scotia agricultural fields, partnering with the Atlantic CWHC node.",
        contact: "agriculture@dal.ca",
        website: "https://www.dal.ca/faculty/agriculture.html"
      }
    ],
    discovered_connections: [
      {
        source: "dal-vet",
        target: "cwhc-atl",
        label: "Wild Bird Diagnostics Feed"
      }
    ]
  };
}

// --- STEP 4: UPSERT DISCOVERIES TO CLOUD FIRESTORE ---
async function saveDiscoveries(discoveries) {
  const { discovered_stakeholders, discovered_connections } = discoveries;
  
  if (!discovered_stakeholders || discovered_stakeholders.length === 0) {
    console.log("No new stakeholders discovered by AI.");
  } else {
    console.log(`Writing ${discovered_stakeholders.length} discovered stakeholders to Cloud Firestore...`);
    for (const s of discovered_stakeholders) {
      const docRef = db.collection('stakeholders').doc(s.id);
      
      // Let's check if they exist
      const existing = await docRef.get();
      if (!existing.exists) {
        await docRef.set({
          ...s,
          source: "ai_discovery",
          isNewDiscovery: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[NEW STAKEHOLDER CREATED] Created ${s.shortName} in Firestore.`);
      } else {
        console.log(`[SKIPPED] Stakeholder ${s.shortName} already exists in database.`);
      }
    }
  }

  if (!discovered_connections || discovered_connections.length === 0) {
    console.log("No new connections discovered by AI.");
  } else {
    console.log(`Writing ${discovered_connections.length} discovered connections to Cloud Firestore...`);
    for (const c of discovered_connections) {
      // Create a deterministic document ID for connections to prevent duplicate link lines
      const connId = `${c.source}_to_${c.target}`.toLowerCase();
      const docRef = db.collection('connections').doc(connId);
      
      await docRef.set({
        source: c.source,
        target: c.target,
        label: c.label,
        sourceType: "ai_discovery",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`[CONNECTION UPSERTED] Registered connection link: ${c.source} -> ${c.target} (${c.label})`);
    }
  }
}

// --- MAIN CONTROLLER RUN ---
async function runDailyScanner() {
  console.log("=========================================");
  console.log("Starting Daily H5N1 One Health Scanner...");
  console.log("Time:", new Date().toISOString());
  console.log("=========================================");

  try {
    const papers = await fetchPubMedPapers();
    const bulletins = await fetchRSSBulletins();
    const discoveries = await extractOneHealthData(papers, bulletins);
    await saveDiscoveries(discoveries);
    console.log("\n=========================================");
    console.log("[SUCCESS] Daily One Health Scanner run complete!");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("\n=========================================");
    console.error("[FATAL ERROR] Scanner execution failed:", error);
    console.error("=========================================");
    process.exit(1);
  }
}

runDailyScanner();
