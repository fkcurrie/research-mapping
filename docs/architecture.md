# System Architecture & Data Flow

This project is organized as a clean, production-grade **Monorepo** designed to easily scale. It splits data ingestion, user visualization, and cloud orchestration into logical, isolated subdirectories.

---

## 1. Directory Structure & Modular Layout

The repository is organized as follows:

- **`/portal` (Frontend):** 
  Built with **Vite**, **React 19**, and **TypeScript**. Houses the main interactive mapping dashboard, SVG-based force-directed physics engine, and Firestore interface.
- **`/scanner` (Backend Ingestion):** 
  Built with **Node.js**. A serverless pipeline utilizing NCBI PubMed APIs, RSS feed parsers, and **Google Gemini AI** (via `@google/generative-ai`) to extract structured data and load it into Firestore.
- **`/deploy` (Orchestration & DevOps):** 
  Contains production deployment assets. This includes `Dockerfile` (multi-stage compilation), `nginx.conf` (static asset routing), and script templates for automated Google Cloud Run builds.
- **`/.` (Root):** 
  Kept strictly clean. Contains project configs (`.gitignore`, `.oxlintrc.json` for rapid linting) and high-level summaries (`README.md`).

---

## 2. End-to-End Data Pipeline

The flow of information through the ecosystem follows this sequence:

```
[ PubMed APIs ]  ──> [ Node.js Scanner ] ──> [ Gemini AI API ]
[ RSS Bulletins] ──> [ (Ingests Daily) ] ──> [ (Extracts Entities) ]
                                                    │
                                                    ▼
[ User Browser ] <── [ Nginx Container ] <── [ Cloud Firestore ]
```

1. **Scheduling & Ingestion:** 
   A daily cron job (e.g., Cloud Scheduler) wakes up the **Scanner container**. The scanner retrieves metadata from PubMed search results and parsers CWHC/CFIA RSS feeds.
2. **AI-Driven Refinement:** 
   Raw titles and abstracts are processed via **Google Gemini Pro**. Gemini extracts named entities: researchers, institutions, research categories, and geographic scopes.
3. **Database Upsert:** 
   The scanner formats the parsed results into a standardized schema and commits them to **Cloud Firestore** via the `firebase-admin` SDK.
4. **Static Assets & Host Routing:** 
   Vite builds the `/portal` React application into static HTML/CSS/JS. An **Nginx Alpine container** serves these static files on Cloud Run.
5. **Client-Side Hydration:** 
   The client's browser downloads the portal. It queries Cloud Firestore to retrieve live researchers and organizational nodes, feeding them into the custom force-directed network graph engine.

---

## 3. Database Schema (Firestore Collections)

The scraper stores processed literature and bulleted events in the following collections:

### `stakeholders`
Represents public health agencies, universities, labs, or individual research organizations.
```json
{
  "id": "string",
  "name": "string",
  "shortName": "string",
  "level": "International | National | Provincial | Regional | Municipal",
  "province": "string",
  "domain": ["Virology", "Epidemiology", "Wildlife Ecology", "Genomics", "Policy"],
  "latitude": 0.0,
  "longitude": 0.0,
  "url": "string"
}
```

### `researchers`
Represents principal investigators, key scientists, and public authors.
```json
{
  "id": "string",
  "name": "string",
  "organization": "string",
  "title": "string",
  "researchDomain": "string",
  "email": "string",
  "publications": [
    {
      "title": "string",
      "journal": "string",
      "pubDate": "string",
      "url": "string"
    }
  ]
}
```

### `connections`
Represents dynamic professional or publication-based partnerships.
```json
{
  "source": "string (stakeholder/researcher ID)",
  "target": "string (stakeholder/researcher ID)",
  "label": "string (e.g., Co-Authorship, Agency Funding, Network Link)"
}
```
