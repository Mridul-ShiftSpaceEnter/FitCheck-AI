// app/api/wardrobe/route.js

export async function POST(request) {
  try {
    const { action, wardrobeItems } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GROQ_API_KEY not set in .env.local" }, { status: 500 });
    }

    const itemList = wardrobeItems.map(i => `${i.tag}: ${i.name}`).join(", ");
    let prompt = "";

    if (action === "combinations") {
      prompt = `You are a professional stylist. The user has these wardrobe items: ${itemList}

Create 3 stylish outfit combinations using only items from the list above.
Reply ONLY in JSON, no markdown, no extra text:
{
  "combinations": [
    {
      "name": "<creative outfit name>",
      "items": ["<item name 1>", "<item name 2>", "<item name 3>"],
      "occasion": "<best occasion for this outfit>",
      "vibe": "<aesthetic vibe e.g. Quiet Luxury, Streetcore>",
      "tip": "<one specific styling tip>"
    }
  ]
}`;
    } else if (action === "gap-analysis") {
      prompt = `You are a wardrobe consultant. The user currently owns: ${itemList}

Identify what key pieces are missing for a complete, versatile wardrobe.
Reply ONLY in JSON, no markdown, no extra text:
{
  "gaps": ["<specific missing item 1>", "<specific missing item 2>", "<specific missing item 3>"],
  "staples": ["<essential staple they should add 1>", "<essential staple 2>"],
  "summary": "<1 sentence honest overview of the wardrobe's current state>"
}`;
    } else {
      return Response.json({ error: "Unknown action" }, { status: 400 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.5,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq wardrobe error:", errText);
      return Response.json({ error: "Groq API error", details: errText }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const rawText = groqData?.choices?.[0]?.message?.content || "{}";
    const clean = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Wardrobe route error:", error);
    return Response.json({ error: "Request failed", details: error.message }, { status: 500 });
  }
}