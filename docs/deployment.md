# Deployment Guidance

This document outlines the step-by-step setup for running the Avian Influenza Surveillance Portal locally, deploying it to Google Cloud Run, and configuring cloud alternatives.

---

## 1. Local Development Setup

To run and test the repository locally, clone the repository and set up the subdirectories:

### Prerequisites
- **Node.js** (v18 or v20 recommended)
- **Firebase Project:** Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com/).
- **Google Gemini API Key:** Obtain a key from the [Google AI Studio](https://aistudio.google.com/).

---

### Running the `/portal` Frontend
1. Navigate to the portal subdirectory:
   ```bash
   cd portal
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `/portal`:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=sfle-hpai-surveillance
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
4. Start the local Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173/`.*

---

### Running the `/scanner` Backend Scraper
1. Navigate to the scanner subdirectory:
   ```bash
   cd scanner
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Place your Firebase Admin service account credential JSON at `scanner/service_account.json` (ensure this remains gitignored!).
4. Create a `.env` file in `/scanner`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   VITE_FIREBASE_PROJECT_ID=sfle-hpai-surveillance
   ```
5. Seed initial mock records into Firestore:
   ```bash
   npm run seed
   ```
6. Run the active scrapper on demand:
   ```bash
   npm start
   ```

---

## 2. Google Cloud Run Deployment

Google Cloud Run is the recommended platform because it provides serverless scalability with zero cost when idle.

### Step 1: Prepare Scripts
Deployment automation is fully set up inside the `/deploy` directory:
- **Bash Script:** `deploy/deploy-gcp.sh` (Mac/Linux/Cloud Shell)
- **PowerShell Script:** `deploy/deploy-gcp.ps1` (Windows)

### Step 2: Trigger Deployment
Run the script of your choice from the repository root:
```powershell
# Windows
./deploy/deploy-gcp.ps1

# Linux / MacOS / Google Cloud Shell
bash ./deploy/deploy-gcp.sh
```

### Step 3: Script Actions Explained
1. **Configures the Active Project:** Sets active configuration context via `gcloud config set project [PROJECT_ID]`.
2. **Enables Google Cloud APIs:** Enables Artifact Registry, Cloud Build, and Cloud Run.
3. **Builds Container via Cloud Build:** Packages the codebase, compiles static assets using `deploy/Dockerfile`, and registers the compiled container image in Artifact Registry.
4. **Deploys Serverless to Cloud Run:** Deploys the built container with custom limits (`--cpu 1 --memory 512Mi --max-instances 10 --min-instances 0` to enable scale-to-zero free tier).

---

## 3. Subdomain Mapping & SSL (yourdomain.com)

To map the serverless endpoint to a custom domain (e.g., `hpai.yourdomain.com`), you have two direct options:

### Option A: Direct CNAME Integration (Easiest)
1. Run the domain-mapping command:
   ```bash
   gcloud beta run domain-mappings create --service=surveillance-app --domain=hpai.yourdomain.com --region=northamerica-northeast1
   ```
2. Retrieve the custom DNS records output by Google Cloud.
3. Navigate to your DNS Registrar (e.g., Cloudflare, GoDaddy) and add the corresponding `CNAME` and verification `TXT` records.
4. Google will automatically provision a free, auto-renewing SSL certificate for `hpai.yourdomain.com`.

### Option B: External Global HTTPS Load Balancer (Premium Production)
1. Create a serverless **Network Endpoint Group (NEG)** pointing to the Cloud Run service.
2. Set up a **Global External HTTP(S) Load Balancer** with a static external IP and Google-managed SSL Certificate.
3. Map the Load Balancer backend to the serverless NEG.
4. Set an `A` record in your DNS registrar pointing `hpai.yourdomain.com` directly to the Load Balancer's static external IP.

---

## 4. Cloud Deployment Alternatives

If you prefer not to deploy on Google Cloud Services, the monorepo structure makes it extremely simple to containerize and move:

### 1. Docker (Self-Hosted / VPS)
You can run the Nginx server on any Linux Virtual Private Server (VPS) like DigitalOcean, Linode, or Hetzner:
```bash
# Build the Docker image from the root directory
docker build -f deploy/Dockerfile -t surveillance-portal .

# Run the container locally mapping port 8080
docker run -d -p 80:8080 surveillance-portal
```

### 2. AWS (Amazon Web Services)
- **Frontend Portal:** Store the output of `npm run build` (`/portal/dist`) inside an **AWS S3 bucket** and distribute it globally with **AWS CloudFront** (S3 static hosting + CDN).
- **Inbound Scraper:** Deploy the `/scanner` script as an **AWS Lambda function** triggered daily by an **Amazon EventBridge cron rule**.

### 3. Vercel or Netlify (Serverless Frontend)
- Navigate to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
- Connect your GitHub Repository.
- Configure the **Build Settings**:
  - **Framework Preset:** Vite
  - **Root Directory:** `portal`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- Set your Firebase API environment variables inside the dashboard. Deployments will trigger automatically upon every `git push`.
