# -----------------------------------------------------------------------------
# Google Cloud Run Deployment Script (PowerShell) - Avian Influenza Surveillance Portal
# -----------------------------------------------------------------------------
# This script automates containerizing the React app, submitting a build to 
# Google Cloud Build, storing it in Artifact Registry, and deploying it 
# serverless to Google Cloud Run.
# -----------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

# --- CONFIGURATION VARIABLES ---
$DEFAULT_PROJECT_ID = "sfle-hpai-surveillance"
$DEFAULT_REGION = "northamerica-northeast1" # Montreal region for Canadian low-latency
$DEFAULT_SERVICE_NAME = "surveillance-app"
$DEFAULT_REPO_NAME = "surveillance-repo"
$DEFAULT_IMAGE_NAME = "portal-frontend"

Write-Host "===================================================================" -ForegroundColor Blue
Write-Host "     AVIAN INFLUENZA SURVEILLANCE PORTAL - GCP DEPLOYMENT (PS)     " -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Blue

# 1. Project ID Setup
$PROJECT_ID = Read-Host "Enter Google Cloud Project ID [$DEFAULT_PROJECT_ID]"
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) { $PROJECT_ID = $DEFAULT_PROJECT_ID }

# 2. Region Setup
$REGION = Read-Host "Enter GCP Region [$DEFAULT_REGION]"
if ([string]::IsNullOrWhiteSpace($REGION)) { $REGION = $DEFAULT_REGION }

# 3. Service Name Setup
$SERVICE_NAME = Read-Host "Enter Cloud Run Service Name [$DEFAULT_SERVICE_NAME]"
if ([string]::IsNullOrWhiteSpace($SERVICE_NAME)) { $SERVICE_NAME = $DEFAULT_SERVICE_NAME }

# 4. Repo Name Setup
$REPO_NAME = Read-Host "Enter Artifact Registry Repo Name [$DEFAULT_REPO_NAME]"
if ([string]::IsNullOrWhiteSpace($REPO_NAME)) { $REPO_NAME = $DEFAULT_REPO_NAME }

# 5. Image Name Setup
$IMAGE_NAME = Read-Host "Enter Container Image Name [$DEFAULT_IMAGE_NAME]"
if ([string]::IsNullOrWhiteSpace($IMAGE_NAME)) { $IMAGE_NAME = $DEFAULT_IMAGE_NAME }

$IMAGE_TAG = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

Write-Host "`n>>> Step 1: Setting active Google Cloud Project to '${PROJECT_ID}'..." -ForegroundColor Yellow
gcloud config set project "$PROJECT_ID"

Write-Host "`n>>> Step 2: Enabling required Google Cloud APIs (Artifact Registry, Cloud Build, Cloud Run)..." -ForegroundColor Yellow
gcloud services enable `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    run.googleapis.com

Write-Host "`n>>> Step 3: Checking if Artifact Registry Repository '${REPO_NAME}' exists, creating if missing..." -ForegroundColor Yellow
$repoCheck = gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" 2>$null
if ($null -eq $repoCheck) {
    Write-Host "Creating repository '${REPO_NAME}' in region '${REGION}'..."
    gcloud artifacts repositories create "$REPO_NAME" `
        --repository-format=docker `
        --location="$REGION" `
        --description="Docker repository for Avian Influenza Surveillance Portal"
} else {
    Write-Host "Repository '${REPO_NAME}' already exists."
}

Write-Host "`n>>> Step 4: Submitting container build to Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --tag "$IMAGE_TAG" .

Write-Host "`n>>> Step 5: Deploying Container to Google Cloud Run..." -ForegroundColor Yellow
gcloud run deploy "$SERVICE_NAME" `
    --image "$IMAGE_TAG" `
    --platform managed `
    --region "$REGION" `
    --allow-unauthenticated `
    --port 8080 `
    --cpu 1 `
    --memory 512Mi `
    --max-instances 10 `
    --min-instances 0 # Zero-cost scale-to-zero when idle!

# Retrieve the URL
$SERVICE_URL = gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'

Write-Host "`n===================================================================" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "Your Cloud Run Service is live at: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`nNote on Domain Mapping to 'sfle.ca':" -ForegroundColor Yellow
Write-Host "To point this service to a subdomain like hpai.sfle.ca, follow either:"
Write-Host "`nOption A (Direct CNAME Integration - Easiest):" -ForegroundColor Magenta
Write-Host "1. Run command:"
Write-Host "   gcloud beta run domain-mappings create --service=$SERVICE_NAME --domain=hpai.sfle.ca --region=$REGION" -ForegroundColor Cyan
Write-Host "2. Add the provided DNS TXT/CNAME records inside your sfle.ca registrar domain configuration."
Write-Host "`nOption B (Global External HTTPS Load Balancer - Premium production performance):" -ForegroundColor Magenta
Write-Host "1. Create a serverless Network Endpoint Group (NEG) pointing to the Cloud Run service."
Write-Host "2. Set up a GCP Load Balancer with a static external IP, Google-managed SSL Certificate, and point to the NEG."
Write-Host "3. Add an A record for hpai.sfle.ca pointing to the Load Balancer IP."
Write-Host "==================================================================="
