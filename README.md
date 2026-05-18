# FitCheck AI — Gemini Edition Setup Guide
### 100% Free to Run · No Credit Card Required

---

## What's Inside

| Feature | Status |
|---|---|
| AI Outfit Scoring (5 categories) | ✅ Gemini 1.5 Flash Vision |
| 3 Modes: Fit Check / Dating / Work | ✅ |
| Vibe Detector (10 aesthetics) | ✅ |
| Wardrobe Gap Analysis | ✅ |
| Virtual Wardrobe + Outfit Combos | ✅ |
| Shareable Score Card (PNG download) | ✅ |
| Fit Check History | ✅ |
| Face privacy blur on share card | ✅ |

---

## Prerequisites — Install These First

### 1. Node.js (required)
- Go to: **https://nodejs.org**
- Download the **LTS** version (green button)
- Install it (just click Next → Next → Finish)
- To verify: open Terminal and type `node -v` — you should see something like `v20.x.x`

### 2. A code editor (recommended)
- Download **VS Code**: https://code.visualstudio.com (free)
- Not required, but makes things easier

---

## Step 1 — Get Your FREE Gemini API Key

1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key — it looks like `AIzaSy...`

> **Free tier limits:** 15 requests/minute, 1 million tokens/day.
> For personal use, you'll never hit this limit.

---

## Step 2 — Create the Project

Open **Terminal** (Mac/Linux) or **Command Prompt** (Windows):

```bash
# Create a brand new Next.js project
npx create-next-app@14 fitcheck-ai --js --app --no-tailwind --no-eslint --no-src-dir --import-alias "@/*"

# Move into the project folder
cd fitcheck-ai
```

When it asks questions, just press **Enter** for all of them (accept defaults).

---

## Step 3 — Add Your Gemini API Key

Inside the `fitcheck-ai` folder, create a file called `.env.local`:

**Mac / Linux — run this in Terminal:**
```bash
echo 'GEMINI_API_KEY=YOUR_KEY_HERE' > .env.local
```

**Windows — run this in Command Prompt:**
```
echo GEMINI_API_KEY=YOUR_KEY_HERE > .env.local
```

**Or manually:** Open VS Code, create a new file called `.env.local` in the root of the project, and paste:
```
GEMINI_API_KEY=AIzaSyYOUR_ACTUAL_KEY_HERE
```

Replace `AIzaSyYOUR_ACTUAL_KEY_HERE` with the key you copied in Step 1.

---

## Step 4 — Copy the App Files

Your project folder should look like this when done:

```
fitcheck-ai/
├── .env.local                        ← you created this in Step 3
├── next.config.js                    ← replace with provided file
├── package.json                      ← replace with provided file
├── app/
│   ├── layout.js                     ← replace with provided file
│   ├── page.js                       ← replace with provided file
│   ├── globals.css                   ← keep as-is (or clear its contents)
│   └── api/
│       ├── analyze/
│       │   └── route.js              ← CREATE folder + file
│       └── wardrobe/
│           └── route.js              ← CREATE folder + file
└── components/
    └── FitCheckAI.jsx                ← CREATE folder + file
```

### How to do it:

**1. Replace `app/layout.js`** — delete existing content, paste content from provided `layout.js`

**2. Replace `app/page.js`** — delete existing content, paste content from provided `page.js`

**3. Replace `package.json`** — delete existing content, paste content from provided `package.json`

**4. Replace `next.config.js`** — delete existing content, paste content from provided `next.config.js`

**5. Create the components folder and main file:**
```bash
mkdir components
```
Then create `components/FitCheckAI.jsx` and paste the full content of `FitCheckAI_Gemini.jsx`

**6. Create the API routes:**
```bash
mkdir -p app/api/analyze
mkdir -p app/api/wardrobe
```
- Create `app/api/analyze/route.js` — paste content from provided analyze `route.js`
- Create `app/api/wardrobe/route.js` — paste content from provided wardrobe `route.js`

---

## Step 5 — Run It

```bash
npm install
npm run dev
```

Open your browser and go to:
**http://localhost:3000**

You should see the FitCheck AI app. Upload a photo and hit Analyze! 🎉

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `command not found: node` | Install Node.js from nodejs.org and restart Terminal |
| `npm install` fails | Try `npm install --legacy-peer-deps` |
| `GEMINI_API_KEY not set` | Check `.env.local` exists in root folder, not inside `app/` |
| Port 3000 busy | Run `npm run dev -- -p 3001`, open localhost:3001 |
| Blank page | Press F12 in browser → Console tab → read the red error |
| `Cannot find module '../components/FitCheckAI'` | File must be named exactly `FitCheckAI.jsx` (capital F, capital C, capital AI) |
| API returns 400/500 | Check your Gemini key is correct in `.env.local` |
| "Analysis failed" error | Image might be too large — try a photo under 4MB |

---

## Folder Structure Explained

```
app/api/analyze/route.js   → handles image uploads, calls Gemini Vision
app/api/wardrobe/route.js  → handles outfit combos + gap analysis
components/FitCheckAI.jsx  → the entire frontend UI (one file)
.env.local                 → your secret API key (never share this)
```

The API key **never leaves your server**. The browser only talks to `/api/analyze`
and `/api/wardrobe` — your key is invisible to anyone using the app.

---

## Deploy Free to Vercel (optional)

When you're ready to share with friends:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

During setup, Vercel will ask for environment variables.
Add `GEMINI_API_KEY` with your key value.

Your app will be live at `https://fitcheck-ai-xxxx.vercel.app` for free.

---

## Upgrading to Anthropic Claude Later

When you're ready to upgrade to Claude for better vision accuracy:

1. Get an Anthropic API key from **https://console.anthropic.com**
2. In `app/api/analyze/route.js`, swap the Gemini fetch for the Anthropic SDK call
3. Change the model to `claude-sonnet-4-20250514`
4. The frontend (`FitCheckAI.jsx`) needs zero changes

---

*Built with Next.js 14 · Powered by Google Gemini 1.5 Flash (Free Tier)*
