---
title: StudyForge Ternary Bonsai 2 Engine
emoji: 🌲
colorFrom: green
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---

# StudyForge AI Engine: Ternary Bonsai 2 (4B / 9B)

A self-hosted, 100% free OpenAI-compatible API running **Ternary Bonsai 2** on Hugging Face Spaces (CPU Basic, 2 vCPU, 16 GB RAM).

This service replaces external paid/quota-limited APIs with an in-house model for evaluating study sessions on **StudyForge OS**.

---

## 🚀 Quick Deployment Guide (2 Minutes)

### Step 1: Create a New Hugging Face Space
1. Log into your [Hugging Face](https://huggingface.co/) account.
2. Click **New Space** (or visit https://huggingface.co/new-space).
3. Name your space (e.g. `studyforge-ai-engine`).
4. Select License: `Apache 2.0` or `MIT`.
5. Select Space SDK: **Docker** -> **Blank**.
6. Select Hardware: **CPU Basic • 2 vCPU • 16 GB RAM • Free**.
7. Click **Create Space**.

### Step 2: Upload Files to the Space
Clone your new Space repository or upload the files directly via the Hugging Face web UI:
- `Dockerfile`
- `requirements.txt`
- `app.py`
- `README.md`

### Step 3: Configure Environment Secrets (Recommended)
In your Space:
1. Go to **Settings** -> **Variables and secrets**.
2. Click **New secret**:
   - **Name**: `STUDYFORGE_API_KEY`
   - **Value**: Any secret string you choose (e.g., `sf-bonsai-key-2026`)
3. Optional Variables (under **Variables**):
   - `MODEL_REPO_ID`: `prism-ml/Ternary-Bonsai-2-4B-gguf` (Default: 4B, fast ~8s per session) OR `prism-ml/Ternary-Bonsai-2-9B-gguf` (9B, deeper ~25s per session)
   - `MODEL_FILENAME`: `Ternary-Bonsai-2-4B-Q2_0.gguf` (for 4B) OR `Ternary-Bonsai-2-9B-Q2_0.gguf` (for 9B)
   - `N_THREADS`: `2`
   - `N_CTX`: `2048`

### Step 4: Link with StudyForge App
Once your Space builds and shows **Running** (green indicator):
Your direct endpoint URL will be:
`https://<username>-<space-name>.hf.space/v1/chat/completions`

You can test it directly with curl:
```bash
curl -X POST https://<username>-<space-name>.hf.space/v1/chat/completions \
  -H "Authorization: Bearer YOUR_STUDYFORGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Respond with CONNECTED only."}]
  }'
```

To connect it to StudyForge:
Run the setup script or update the `free_keys` table in Supabase:
- `provider`: `"huggingface"`
- `model`: `"prism-ml/Ternary-Bonsai-2-4B-gguf"`
- `endpoint`: `"https://<username>-<space-name>.hf.space/v1/chat/completions"`
- `key`: `"YOUR_STUDYFORGE_API_KEY"`
- `label`: `"🌲 Ternary Bonsai 2 (4B)"`
