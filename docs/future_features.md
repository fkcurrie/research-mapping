# Future Features & Product Roadmap

To grow the Avian Influenza Surveillance Portal from a premium interactive dashboard into an indispensable tool for epidemiology, researchers can target several potential high-value extensions:

---

## 1. Advanced GIS & Spatial Mapping Layer
While the current node-link graph maps social and collaborative connections beautifully, adding physical location overlays on geographical maps would provide critical outbreak context.
- **Leaflet / Mapbox Integration:** Overlay active stakeholder, researcher, and outbreak coordinates on an interactive world map.
- **Outbreak Layer Syncing:** Fetch public outbreak coordinates from the Canadian Food Inspection Agency (CFIA) and overlay them with research laboratory proximity.
- **Spatial Heatmaps:** Generate geographic density heatmaps showing where H5N1 literature, animal infections, and specialized researchers are concentrated.

---

## 2. Dynamic Temporal Surveillance Slider
Epidemics and research interest are highly time-sensitive. A timeline feature would allow researchers to analyze how network collaborations and research focuses evolved.
- **Interactive Time-Slider:** Let users slide through years/months (e.g., 2022 to Present) to see when organizations joined the research network.
- **Velocity Charts:** Map the rate of publication releases alongside H5N1 agricultural cases to analyze correlation and response times.

---

## 3. Automated Epidemiological Alerts
Public health departments need real-time situational awareness. Automating alerts will ensure researchers don't have to manually check the portal daily.
- **Weekly Digests:** Send an automated email summarizing new PubMed literature and RSS bulletins matching user interest.
- **Outbreak Notification Rules:** Trigger immediate Slack, Discord, or SMS alerts if a CFIA bulletin reports a major jump in local animal cases or species groups (e.g., dairy cattle, poultry).
- **Service Integration:** Implement this with a **Cloud Function** triggered daily by Cloud Scheduler, utilizing **SendGrid** or **Amazon SES** for email dispatch.

---

## 4. Advanced Scientific Collaboration Metrics
To help agencies optimize research funding and identify institutional gaps, we can leverage graph theory metrics:
- **Centrality Scores:** Calculate degree centrality and betweenness centrality to identify "key opinion leaders" (KOLs) or major institutional bridges.
- **Co-authorship Cohesion:** Filter the network graph to display only co-authorship relationships, highlighting dense research clusters and isolated research nodes that could benefit from partnerships.

---

## 5. Community-Led Resource Indexing
Encourage public health community contributions directly through the portal:
- **Researcher Claim Profiles:** Allow researchers to log in via secure authentication (e.g., Firebase Auth with ORCID integration) to claim and manually update their publications, contact info, and collaborative affiliations.
- **Manual Stakeholder Requests:** Provide a submission form where agencies can request to be listed in the "One Health" portal, subject to admin approval.
