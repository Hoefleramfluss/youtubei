# Deployment Guide: AI Channel GrowthOS

This guide covers how to deploy the autonomous YouTube Manager to Google Cloud Run, configure the scheduler, and perform the initial operator setup.

## 1. Prerequisites

Ensure you have the Google Cloud CLI (`gcloud`) installed and authorized.
You need a Google Cloud Project with billing enabled.

**Project Variables:**
```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="europe-west1"
export SERVICE_NAME="ai-channel-growthos"
export SERVICE_ACCOUNT="ai-growthos-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

## 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  firestore.googleapis.com \
  texttospeech.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  --project $PROJECT_ID
```

## 3. Create Service Account & Assign Roles

The agent needs permission to access Firestore, Storage, Vertex AI, and TTS.

```bash
# Create Service Account
gcloud iam service-accounts create ai-growthos-sa --display-name="AI GrowthOS Agent" --project $PROJECT_ID

# Assign Roles
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/aiplatform.user"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:${SERVICE_ACCOUNT}" --role="roles/cloudtts.editor"
```

## 4. Deploy to Cloud Run

**Note on Secrets:**
We will pass infrastructure keys (OAuth) via environment variables.
Runtime keys (Gemini) will be set via the UI later.

**Set your Admin Token:**
Choose a strong password. You will need this to unlock the Settings UI.
`export ADMIN_TOKEN="super-secret-admin-password"`

**Set your YouTube OAuth Config:**
(Obtained from Google Cloud Console > APIs & Services > Credentials)
`export GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"`
`export GOOGLE_CLIENT_SECRET="xxx"`
`export REDIRECT_URI="https://${SERVICE_NAME}-${PROJECT_ID}.a.run.app/api/auth/youtube/callback"`
*(Note: You might need to deploy once to get the URL, then update the REDIRECT_URI env var and your OAuth Consent Screen)*

**Deploy Command:**

```bash
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --service-account $SERVICE_ACCOUNT \
  --set-env-vars GCLOUD_PROJECT=$PROJECT_ID \
  --set-env-vars CONFIG_ADMIN_TOKEN=$ADMIN_TOKEN \
  --set-env-vars GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  --set-env-vars GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  --set-env-vars REDIRECT_URI=$REDIRECT_URI
```

*Wait for the deployment to finish. Note the Service URL.*

## 5. Configure Cloud Scheduler (Hourly Trigger)

This job triggers the agent every hour. It uses OIDC authentication to securely call your Cloud Run endpoint.

```bash
export SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

gcloud scheduler jobs create http ai-agent-hourly \
  --schedule="0 * * * *" \
  --uri="${SERVICE_URL}/api/agent/runHourly?userId=demo" \
  --http-method=POST \
  --oidc-service-account-email=$SERVICE_ACCOUNT \
  --oidc-token-audience=$SERVICE_URL \
  --location=$REGION
```

---

## 6. Operator Runbook (Initial Setup)

Follow these steps exactly to initialize the system after deployment.

### Step 1: System Configuration
1. Open your Cloud Run URL in the browser: `https://...run.app`
2. Navigate to the **Settings** tab (sidebar).
3. Enter your **Admin Token** (the one you set in `CONFIG_ADMIN_TOKEN`).
4. Configure the system keys:
   * **Gemini API Key:** Enter your AI Studio key.
   * **Media Bucket Name:** Enter a GCS bucket name (ensure the Service Account has write access).
   * **Veo Model:** Leave default (`veo-3.1-fast-generate-preview`) or change if needed.
   * **Default Language/Timezone:** Set as desired.
5. Click **Save Configuration**. You should see a success message.

### Step 2: Connect YouTube Channel
1. Go to the **Dashboard** tab.
2. Click **Connect YouTube Channel**.
3. Complete the Google OAuth flow.
4. *Verify:* The dashboard should show "Connected" with a green indicator.

### Step 3: Safe Test (Dry-Run)
*Before letting the AI post publicly, run a test.*
1. In **Dashboard** (or Automation tab), click **Run Full Test (Dry Run)**.
2. Go to the **Monitor** tab.
3. Watch the logs stream in. You should see:
   * `SYSTEM`: Cycle Started (Dry Run)
   * `TREND`: Trends fetched
   * `SCRIPT`: Content generated
   * `VEO`: Video generation submitted
   * `NATIVE_AUDIO`: Voiceover generated
   * `UPLOAD`: **Skipped (Dry Run)**
4. *Verify:* Check your YouTube channel to ensure NO video was uploaded.

### Step 4: Enable Full Automation
1. If the dry run looked good, go to the **Dashboard**.
2. Toggle **Autonomous Mode** to **ON**.
3. The Cloud Scheduler will now trigger the agent every hour.
4. *Verify:* Check the Monitor tab after the next hour mark to see real production activity.

---

## Summary of Config Locations

*   **Cloud Run Env Vars:**
    *   `CONFIG_ADMIN_TOKEN` (Security for Settings UI)
    *   `GOOGLE_CLIENT_ID` / `SECRET` (YouTube Auth)
    *   `REDIRECT_URI` (YouTube Callback)
    *   `GCLOUD_PROJECT` (Infrastructure)

*   **Settings UI (Firestore):**
    *   `Gemini API Key` (Runtime AI generation)
    *   `Media Bucket` (Asset storage)
    *   `Veo Model` & Defaults

*   **Operational Caveats:**
    *   **FFmpeg:** Muxing is CPU intensive. If Cloud Run crashes on upload, increase CPU/Memory (e.g., `--memory 2Gi --cpu 2`).
    *   **Veo 3:** Video generation can take 1-2 minutes. The agent polls for this. Ensure Cloud Run timeout is set appropriately if doing synchronous waits, though the current polling architecture handles this well via async steps.
