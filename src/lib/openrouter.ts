const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateText(
  messages: ChatMessage[],
  model = "anthropic/claude-sonnet-4"
): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://electricsheep.ai",
      "X-Title": "Electric Sheep",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 300,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter text generation failed: ${response.status} ${error}`);
  }

  const data: ChatCompletionResponse = await response.json();
  return data.choices[0].message.content;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBase64FromResponse(data: any): string | null {
  // Format 1: choices[].message.images[].image_url.url (Gemini-style)
  const images = data?.choices?.[0]?.message?.images;
  if (images && images.length > 0) {
    const url = images[0]?.image_url?.url;
    if (url) {
      console.log("[ImageGen] Extracted image via format: message.images[].image_url.url");
      if (url.startsWith("data:")) {
        return url.split(",")[1];
      }
      return url;
    }
  }

  // Format 2: choices[].message.content containing a base64 data URL
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    // Check for raw data URL in content
    const dataUrlMatch = content.match(/data:image\/[a-zA-Z]+;base64,([A-Za-z0-9+/=]+)/);
    if (dataUrlMatch) {
      console.log("[ImageGen] Extracted image via format: message.content data URL");
      return dataUrlMatch[1];
    }

    // Check for markdown image syntax: ![...](data:image/...)
    const markdownMatch = content.match(/!\[.*?\]\((data:image\/[a-zA-Z]+;base64,([A-Za-z0-9+/=]+))\)/);
    if (markdownMatch) {
      console.log("[ImageGen] Extracted image via format: message.content markdown image");
      return markdownMatch[2];
    }

    // Check if content itself looks like a plain URL
    if (content.trim().startsWith("http")) {
      console.log("[ImageGen] Extracted image via format: message.content URL");
      return content.trim();
    }
  }

  // Format 3: data[].url (DALL-E style response)
  const dallEUrl = data?.data?.[0]?.url;
  if (dallEUrl) {
    console.log("[ImageGen] Extracted image via format: data[].url (DALL-E style)");
    if (dallEUrl.startsWith("data:")) {
      return dallEUrl.split(",")[1];
    }
    return dallEUrl;
  }

  return null;
}

const IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "openai/gpt-image-1",
] as const;

export async function generateImage(
  prompt: string,
  model?: string
): Promise<string> {
  const modelsToTry = model ? [model] : [...IMAGE_MODELS];
  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[ImageGen] Attempting image generation with model: ${currentModel}`);

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://electricsheep.ai",
          "X-Title": "Electric Sheep",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            {
              role: "user",
              content: `Generate an image: ${prompt}`,
            },
          ],
          modalities: ["image"],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[ImageGen] Model ${currentModel} returned HTTP ${response.status}: ${error}`);
        lastError = new Error(`OpenRouter image generation failed with ${currentModel}: ${response.status} ${error}`);
        continue;
      }

      const data = await response.json();
      console.log(
        "[ImageGen] Response structure:",
        JSON.stringify({
          hasChoices: !!data?.choices,
          choicesLength: data?.choices?.length,
          hasImages: !!data?.choices?.[0]?.message?.images,
          imagesLength: data?.choices?.[0]?.message?.images?.length,
          contentType: typeof data?.choices?.[0]?.message?.content,
          contentPreview: typeof data?.choices?.[0]?.message?.content === "string"
            ? data.choices[0].message.content.substring(0, 100)
            : undefined,
          hasData: !!data?.data,
          dataLength: data?.data?.length,
        })
      );

      const result = extractBase64FromResponse(data);
      if (result) {
        console.log(`[ImageGen] Successfully generated image with model: ${currentModel}`);
        return result;
      }

      console.error(`[ImageGen] Model ${currentModel} returned a response but no image could be extracted. Full response keys:`, Object.keys(data));
      lastError = new Error(`No image could be extracted from ${currentModel} response`);
    } catch (err) {
      console.error(`[ImageGen] Model ${currentModel} threw an error:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All image generation models failed");
}
