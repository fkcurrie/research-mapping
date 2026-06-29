# Application Features

The **Avian Influenza Surveillance Portal** is designed to provide public health officials, epidemiologists, and veterinary researchers with an interactive, rich map and analysis dashboard. It bridges the gap between disparate data streams (scientific publications and wildlife health bulletins) and actionable visualization.

Here is a comprehensive breakdown of the core features implemented in the portal:

---

## 1. Interactive Physics-Based Network Graph
The centerpiece of the portal is a high-performance **2D Physics Force-Directed Graph Engine** built entirely in React and SVG. 
- **Organizational & Researcher Mapping:** Toggle between analyzing organizational connections (health agencies, labs, universities) and individual researcher collaboration networks.
- **Dynamic Physics Controls:** Adjust parameters like center gravity and physics simulation states in real-time.
- **Interactive Manipulation:** Drag and drop nodes to reposition them, with automatic force-directed stabilization. Pan and zoom across the canvas to inspect dense sub-networks.
- **Micro-Animations & Hovers:** Hovering over any researcher or organization dynamically highlights all immediate connections, dimming unrelated nodes to reveal cluster sub-structures.

---

## 2. One Health Sector Segments
To support a comprehensive "One Health" (human, animal, and environmental) research perspective, the interface categorizes stakeholders across key dimensions using innovative visual layouts:
- **Bullseye Visualizer:** Organizes actors into concentric rings representing jurisdiction levels (International, National, Provincial, Regional, Municipal).
- **Cycle Flow Visualizer:** Maps entities along an inter-connected wheel representing the lifecycle of surveillance and response.
- **Interactive Tables:** A searchable, filterable spreadsheet interface for power users who need structured tabular analysis and data exports.

---

## 3. Autonomous Backend Ingestion Scanner
The portal's data feed is continuously enriched by an autonomous, serverless scraper residing in `/scanner`.
- **NCBI PubMed Querying:** Queries PubMed daily for newly published scientific literature matching terms such as `"avian influenza"`, `"H5N1"`, and `"HPAI"` associated with Canadian regions.
- **Wildlife & Agricultural RSS Parsing:** Parses official health bulletins directly from the **Canadian Wildlife Health Cooperative (CWHC)** and **Canadian Food Inspection Agency (CFIA)**.
- **Gemini AI Semantic Extraction:** Sends raw titles, dates, and abstracts to the Google Gemini API. Gemini extracts structured insights including key researchers, associated organizations, research categories, and geographic scopes.

---

## 4. Multi-Dimensional Sidebar Filters
Researchers can isolate exact subsets of surveillance data using the sidebar filters:
- **Search:** Search instantly across researcher names, publications, and organization names.
- **Jurisdiction Filter:** Filter by authority level (e.g., National, Provincial).
- **Geographic Filter:** Narrow research down to specific Canadian provinces (e.g., Ontario, British Columbia, Quebec).
- **Research Domains:** Filter by field of study (e.g., Virology, Epidemiology, Wildlife Ecology, Genomics, Policy).

---

## 5. Live Ingestion Database Fallback
To ensure maximum availability, the frontend utilizes a dual-mode database service:
- **Firestore Mode:** Pulls live data records dynamically from Google Cloud Firestore.
- **Static Fallback Mode:** Instantly falls back to local static files if Firestore credentials are unset or the service is unreachable. This guarantees that the site remains functional even under offline conditions.
- **Source Toggle:** A visual UI indicator displays the database source (`Firestore` or `Static Fallback`) with a manual refresh trigger to re-fetch live data.
