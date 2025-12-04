import { GoogleGenAI } from "@google/genai";
import { LogoStyle } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getStylePrompt = (style: LogoStyle, projectName: string): string => {
  const base = `A professional, high-quality vector logo for a brand named "${projectName}".`;
  
  switch (style) {
    case 'modern':
      return `${base} Modern minimalist style, clean lines, geometric shapes, inspired by Moroccan architecture but simplified. Flat design, solid colors (Moroccan red or green). White background.`;
    case 'traditional':
      return `${base} Traditional Moroccan style, intricate details, inspired by brass lamps and arches. Elegant calligraphy. Gold and deep red colors. White background.`;
    case 'tifinagh':
      return `${base} Featuring the Tifinagh letter 'Yaz' (ⵣ) creatively integrated. Bold symbol, indigenous Amazigh identity, earthy tones (ochre, terracotta). White background.`;
    case 'zellige':
      return `${base} Based on Zellige mosaic geometric patterns. Star patterns, symmetric, colorful (blue, green, yellow, white tiles). Islamic geometric art. White background.`;
    case 'mix':
      return `${base} A fusion of modern typography and traditional Moroccan patterns. Contemporary yet authentic. Chefchaouen blue tones. White background.`;
    default:
      return base;
  }
};

export const generateLogos = async (
  projectName: string,
  keywords: string,
  style: LogoStyle
): Promise<string[]> => {
  const generatedImages: string[] = [];
  const model = 'gemini-2.5-flash-image';
  
  // To get multiple variations, we'll make parallel requests or a batched request if supported.
  // For demo purposes, we will loop to get 2 distinct variations to save time/quota, 
  // but in a production app you'd want more. Let's try 2.
  const prompt = `${getStylePrompt(style, projectName)}. Keywords: ${keywords}. Ensure the design is centered, high contrast, suitable for a company logo. No photorealistic backgrounds.`;

  try {
    const promises = [1, 2].map(async () => {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
           // Nano banana series doesn't support responseMimeType, so we parse manually
        }
      });

      // Extract image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    });

    const results = await Promise.all(promises);
    results.forEach(res => {
        if(res) generatedImages.push(res);
    });

    return generatedImages;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const cleanupImageForSVG = async (base64Image: string): Promise<string> => {
  // Use Gemini Vision to "clean up" the image (remove noise, flatten colors) 
  // by asking it to regenerate a cleaner version.
  try {
    // Extract base64 raw data
    const base64Data = base64Image.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          {
            text: "Redraw this logo as a ultra-clean, black and white vector silhouette. Smooth curves, remove all noise, remove gradients, high contrast. Ready for SVG tracing."
          }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return base64Image; // Fallback to original if fails
  } catch (error) {
    console.error("Gemini Cleanup Error:", error);
    return base64Image; // Fallback
  }
};