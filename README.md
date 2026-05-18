# FitCheck AI 🧥

> **Brutally honest AI fashion feedback — powered by Groq + Llama 4 Vision**

Upload a photo. Get scored. Dress better.

FitCheck AI is a Next.js 14 app that analyzes your outfit using multimodal AI. It grades your look across 5 style categories, detects your aesthetic vibe, surfaces wardrobe gaps, and adapts its feedback based on context — dating app photo, job interview, or everyday style.

---

## ✨ Features

| Feature | Details |
|---|---|
| **AI Outfit Scoring** | 5 categories: Color Coordination, Fit & Silhouette, Style Coherence, Occasion Score, Vibe Score |
| **3 Analysis Modes** | General · Dating · Professional |
| **Vibe Detector** | Matches to 10 aesthetics (Old Money, Gorpcore, Y2K Revival, etc.) |
| **Wardrobe Gap Analysis** | Identifies missing staples from your virtual wardrobe |
| **Outfit Combos** | Generates 3 outfit combinations from your saved wardrobe items |
| **Fit Check History** | Keeps a log of all your past analyses |
| **Shareable Score Card** | Download your results as a PNG |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router)
- **Vision Model**: `meta-llama/llama-4-scout-17b-16e-instruct` via [Groq](https://groq.com)
- **Wardrobe Model**: `llama-3.3-70b-versatile` via Groq
- **Styling**: Vanilla CSS (monospace-forward dark UI)
- **Deployment**: Vercel-ready

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org) (LTS recommended)
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/fitcheck-ai.git
cd fitcheck-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

Create a `.env.local` file in the project root:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

> Get your free key at [console.groq.com](https://console.groq.com). No credit card required.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload a fit. 🎉

---

## 📁 Project Structure

```
fitcheck-ai/
├── app/
│   ├── layout.js                 # Root layout + metadata
│   ├── page.js                   # Entry point
│   ├── globals.css               # Global styles
│   └── api/
│       ├── analyze/
│       │   └── route.js          # Image upload → Llama 4 Vision → scored JSON
│       └── wardrobe/
│           └── route.js          # Outfit combos + gap analysis
├── components/
│   └── FitCheckAI.jsx            # Full frontend UI
├── .env.local                    # Your API key (never commit this)
└── next.config.js
```

---

## 🔌 API Routes

### `POST /api/analyze`

Accepts a base64-encoded image and returns a structured outfit analysis.

**Request body:**
```json
{
  "imageBase64": "...",
  "imageType": "image/jpeg",
  "mode": "general" | "dating" | "professional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 78,
    "grades": {
      "colorCoordination": 80,
      "fitAndSilhouette": 75,
      "styleCoherence": 82,
      "occasionScore": 70,
      "vibeScore": 85
    },
    "vibeMatch": "Quiet Luxury",
    "verdict": "Understated but sharp",
    "strengths": ["..."],
    "improvements": ["..."],
    "wardrobeGap": "...",
    "lightingNote": null,
    "modeSpecificInsight": "..."
  }
}
```

### `POST /api/wardrobe`

Generates outfit combinations or a gap analysis from saved wardrobe items.

**Request body:**
```json
{
  "action": "combinations" | "gap-analysis",
  "wardrobeItems": [{ "tag": "tops", "name": "White Oxford Shirt" }]
}
```

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add your environment variable:
- `GROQ_API_KEY` → your Groq key

Your app will be live at `https://fitcheck-ai-xxxx.vercel.app`.

---

## 🔒 Privacy

Your API key is stored server-side in `.env.local` and never exposed to the browser. The app communicates only with `/api/analyze` and `/api/wardrobe` — Groq is called exclusively from the server.

---

## 🗺 Roadmap

- [ ] Claude Vision upgrade for higher accuracy
- [ ] User accounts + persistent wardrobe storage
- [ ] Side-by-side outfit comparison
- [ ] Color palette extraction
- [ ] Shopping recommendations by score gap

---

## 📄 License

MIT — use it, fork it, improve it.
