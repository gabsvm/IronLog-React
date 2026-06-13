
export interface ScannedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

const getApiKey = (): string => {
  // @ts-ignore
  return process.env.API_KEY || process.env.VITE_API_KEY || '';
};

/**
 * Converts a File/Blob to a base64 string (data portion only, no prefix).
 */
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Sends an image of a nutrition label to Gemini Vision and returns
 * extracted nutritional data as a structured object.
 */
export const scanNutritionLabel = async (imageFile: File): Promise<ScannedFood> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.includes('INSERT_KEY')) {
    throw new Error('API key not configured');
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const base64Data = await toBase64(imageFile);
  const mimeType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/webp';

  const prompt = `You are a nutrition data extraction expert. Analyze this image carefully.

If this is a nutrition label / tabla nutricional:
- Extract the values PER SERVING (por porción)
- Return ONLY a valid JSON object, no other text

If this is a food photo (not a label):
- Estimate the nutritional content based on what you see
- Return ONLY a valid JSON object, no other text

JSON format required:
{
  "name": "product or food name (be specific)",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "servingSize": "e.g. 100g, 1 unit, 30g"
}

All macros in grams. Use 0 if a value is not visible or cannot be estimated. Do NOT wrap in markdown code blocks.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    }],
    config: { temperature: 0.1 }
  });

  const raw = (response.text || '').trim();
  // Remove any accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  let parsed: ScannedFood;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON. Please try scanning the label again.');
  }

  // Coerce all numeric fields
  return {
    name: String(parsed.name || 'Unknown food'),
    calories: Math.round(Number(parsed.calories) || 0),
    protein:  Math.round(Number(parsed.protein)  || 0),
    carbs:    Math.round(Number(parsed.carbs)    || 0),
    fat:      Math.round(Number(parsed.fat)      || 0),
    servingSize: parsed.servingSize ? String(parsed.servingSize) : undefined,
  };
};
