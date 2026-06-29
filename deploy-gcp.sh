#!/bin/bash
# -----------------------------------------------------------------------------
# Google Cloud Run Deployment Script - Avian Influenza Surveillance Portal
# -----------------------------------------------------------------------------
# This script automates containerizing the React app, submitting a build to 
# Google Cloud Build, storing it in Artifact Registry, and deploying it 
# serverless to Google Cloud Run.
# -----------------------------------------------------------------------------

set -e # Exit immediately if a command exits with a non-zero status

# --- CONFIGURATION VARIABLES ---
DEFAULT_PROJECT_ID="sfle-hpai-surveillance"
DEFAULT_REGION="northamerica-northeast1" # Montreal region for Canadian low-latency
DEFAULT_SERVICE_NAME="surveillance-app"
DEFAULT_REPO_NAME="surveillance-repo"
DEFAULT_IMAGE_NAME="portal-frontend"

echo -e "\033[1;34m===================================================================\033[0m"
echo -e "\033[1;36m     AVIAN INFLUENZA SURVEILLANCE PORTAL - GCP DEPLOYMENT SCRIPT   \033[0m"
echo -e "\033[1;34m===================================================================\033[0m"

# 1. Project ID Setup
read -p "Enter Google Cloud Project ID [$DEFAULT_PROJECT_ID]: " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-$DEFAULT_PROJECT_ID}

# 2. Region Setup
read -p "Enter GCP Region [$DEFAULT_REGION]: " REGION
REGION=${REGION:-$DEFAULT_REGION}

# 3. Service Name Setup
read -p "Enter Cloud Run Service Name [$DEFAULT_SERVICE_NAME]: " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-$DEFAULT_SERVICE_NAME}

# 4. Repo Name Setup
read -p "Enter Artifact Registry Repo Name [$DEFAULT_REPO_NAME]: " REPO_NAME
REPO_NAME=${REPO_NAME:-$DEFAULT_REPO_NAME}

# 5. Image Name Setup
read -p "Enter Container Image Name [$DEFAULT_IMAGE_NAME]: " IMAGE_NAME
IMAGE_NAME=${IMAGE_NAME:-$DEFAULT_IMAGE_NAME}

IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo -e "\n\033[1;33m>>> Step 1: Setting active Google Cloud Project to '${PROJECT_ID}'...\033[0m"
gcloud config set project "${PROJECT_ID}"

echo -e "\n\033[1;33m>>> Step 2: Enabling required Google Cloud APIs (Artifact Registry, Cloud Build, Cloud Run)...\033[0m"
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com

echo -e "\n\033[1;33m>>> Step 3: Checking if Artifact Registry Repository '${REPO_NAME}' exists, creating if missing...\033[0m"
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" &>/dev/null; then
    echo "Creating repository '${REPO_NAME}' in region '${REGION}'..."
    gcloud artifacts repositories create "${REPO_NAME}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Docker repository for Avian Influenza Surveillance Portal"
else
    echo "Repository '${REPO_NAME}' already exists."
fi

echo -e "\n\033[1;33m>>> Step 4: Submitting container build to Google Cloud Build...\033[0m"
gcloud builds submit --tag "${IMAGE_TAG}" .

echo -e "\n\033[1;33m>>> Step 5: Deploying Container to Google Cloud Run...\033[0m"
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE_TAG}" \
    --platform managed \
    --region "${REGION}" \
    --allow-unauthenticated \
    --port 8080 \
    --cpu 1 \
    --memory 512Mi \
    --max-instances 10 \
    --min-instances 0 # Zero-cost scale-to-zero when idle!

# Retrieve the URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')

echo -e "\n\033[1;32m===================================================================\033[0m"
echo -e "\033[1;32m🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!\033[0m"
echo -e "\033[1;32m===================================================================\033[0m"
echo -e "Your Cloud Run Service is live at: \033[1;36m${SERVICE_URL}\033[0m"
echo -e "\n\033[1;33mNote on Domain Mapping to 'sfle.ca':\033[0m"
echo -e "To point this service to a subdomain like \033[1;34mhpai.sfle.ca\033[0m, follow either:"
echo -e "\n\033[1;35mOption A (Direct CNAME Integration - Easiest):\033[0m"
echo -e "1. Run command:"
echo -e "   \033[1;36mgcloud beta run domain-mappings create --service=${SERVICE_NAME} --domain=hpai.sfle.ca --region=${REGION}\033[0m"
echo -e "2. Add the provided DNS TXT/CNAME records inside your sfle.ca registrar domain configuration."
echo -e "\n\033[1;35mOption B (Global External HTTPS Load Balancer - Premium production performance):\033[0m"
echo -e "1. Create a serverless Network Endpoint Group (NEG) pointing to the Cloud Run service."
echo -e "2. Set up a GCP Load Balancer with a static external IP, Google-managed SSL Certificate, and point to the NEG."
echo -e "3. Add an A record for hpai.sfle.ca pointing to the Load Balancer IP."
echo -e "==================================================================="
