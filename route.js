// app/api/analyze/route.js

export async function POST(request) {
  try {
    const { imageBase64, imageType, mode } = await request.json();

    if (!imageBase64 || !imageType || !mode) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GROQ_API_KEY not set in .env.local" }, { status: 500 });
    }

    const modeContext = {
      general:      "General style and fashion analysis",
      dating:       "Dating app profile photo — assess attractiveness, confidence projection, and swipe-right potential",
      professional: "Professional/interview setting — assess appropriateness, authority, polish, and first impression",
    }[mode] || "General style and fashion analysis";

    const prompt = `You are FitCheck AI — an elite fashion stylist and image consultant with deep expertise in color theory, personal styling, and occasion dressing.

Mode: ${modeContext}

Analyze this outfit photo with brutally honest but constructive expert feedback.
Respond ONLY in this exact JSON format. No markdown. No explanation. No extra text whatsoever:

{
  "overallScore": <integer 0-100>,
  "grades": {
    "colorCoordination": <integer 0-100>,
    "fitAndSilhouette": <integer 0-100>,
    "styleCoherence": <integer 0-100>,
    "occasionScore": <integer 0-100>,
    "vibeScore": <integer 0-100>
  },
  "vibeMatch": "<exactly one of: Old Money | Quiet Luxury | Gorpcore | Dark Academia | Y2K Revival | Coastal Grandma | Streetcore | Clean Girl | Avant-Garde | Business Casual>",
  "verdict": "<3-5 word punchy verdict e.g. Understated Excellence or Almost There or Needs Work>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific actionable improvement 1>", "<specific actionable improvement 2>", "<specific actionable improvement 3>"],
  "wardrobeGap": "<1 key missing item with a specific product suggestion>",
  "lightingNote": "<brief note if bad lighting or angle is hurting the photo, or null if fine>",
  "modeSpecificInsight": "<1-2 sentence insight specifically about the ${mode} context>"
}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 1024,
        temperature: 0.4,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return Response.json({ error: "Groq API error", details: errText }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const rawText = groqData?.choices?.[0]?.message?.content || "";

    const clean = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Analyze route error:", error);
    return Response.json({ error: "Analysis failed", details: error.message }, { status: 500 });
  }
}