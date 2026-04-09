import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { goals, allergies } = await req.json();

    const apiKey = process.env.KIMI_API_KEY || process.env.OPENAI_API_KEY;
    
    // Choose provider based on which key is present
    const isKimi = !!process.env.KIMI_API_KEY;
    
    // Moonshot (Kimi) can use .cn or .ai depending on region. 
    // We'll prioritize a custom base URL if provided in .env.local
    let kimiBase = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1/chat/completions";
    // Ensure base URL is robust
    if (kimiBase.endsWith("/v1/")) kimiBase = kimiBase.slice(0, -1);
    if (!kimiBase.includes("/chat/completions")) {
      kimiBase = kimiBase.replace(/\/v1$/, "/v1/chat/completions");
    }
    
    const baseURL = isKimi ? kimiBase : "https://api.openai.com/v1/chat/completions";
    // Fallback model logic
    const model = isKimi ? (process.env.KIMI_MODEL || "kimi-k2.5") : "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json({
        recipes: [
          {
            title: "Miso-Glazed King Oyster Mushrooms",
            description: "A deeply savory, umami-rich vegan alternative that satisfies like a steak.",
            time: "25 min",
            calories: "320",
            image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop",
            ingredients: ["4 King Oyster mushrooms", "2 tbsp Miso paste", "1 tbsp Maple syrup"],
            instructions: ["Clean mushrooms", "Brush with miso mixture", "Roast at 200C for 20 mins"]
          }
        ]
      });
    }

    const systemPrompt = `You are a world-class chef and nutritionist for a premium editorial culinary app. 
CRITICAL: First, validate if the user's prompt is related to food, cooking, health, or nutrition.
If the prompt is completely unrelated (e.g. 'LEGO', 'car repairs'), return ONLY this JSON: {"invalid": true}.

If valid, generate ONE singular, highly detailed, and beautiful "Masterclass" recipe based on the user's dietary goals and allergies. 
Return ONLY a valid JSON object with a single 'recipe' (singular) object. DO NOT include markdown formatting or backticks.
CRITICAL: All generated text must be in English. Always close the JSON object properly.

The recipe object must include: 
- title (string, oversized and elegant)
- description (Large paragraph, poetic, sensory, and highly descriptive. Explain the biological benefits and why this dish matches their goals.)
- time (e.g. '30 min')
- calories (string)
- visual_keyword (string, a highly specific and accurate search term for Unsplash that focuses on the dish's core ingredients and presentation, e.g. "Poached Salmon Asparagus", "Steel Cut Oats Berries")
- ingredients (array of strings, specific measurements, including quality notes like 'organic' or 'freshly-pressed')
- instructions (array of strings, long-form, detailed method steps including chef tips and presentation notes).`;

    console.log(`[API] Generating recipes using endpoint: ${baseURL}`);

    const response = await fetch(baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Goals: ${goals}. Allergies: ${allergies}.` }
        ],
        temperature: 1,
        max_tokens: 8000
        // stream removed for batch mode
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Remote API Error [${response.status}]:`, errorText);
      throw new Error(`Failed to fetch recipes from API: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    let contentStr = data.choices[0].message.content;

    // Robust JSON extraction
    if (contentStr.includes("```json")) {
      contentStr = contentStr.split("```json")[1].split("```")[0];
    } else if (contentStr.includes("```")) {
      contentStr = contentStr.split("```")[1].split("```")[0];
    }

    try {
      const content = JSON.parse(contentStr.trim());
      return NextResponse.json(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON. Content preview:", contentStr.substring(0, 500) + "...");
      console.error("Full Content (check for truncation):", contentStr);
      throw parseError;
    }

  } catch (error: any) {
    console.error("Recipe generation error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate recipes",
      details: "Check your API key and endpoint configuration in the deployment dashboard."
    }, { status: 500 });
  }
}
