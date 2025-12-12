import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData, VisualComplexity, CharacterBlueprint, Gender } from "../types";

// Note: API Key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STORYBOARD_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image"; // Efficient image generation

/**
 * Generates the storyboard structure: Character Blueprint + Page Breakdown.
 */
export const generateStoryboard = async (
  storyText: string,
  complexity: VisualComplexity,
  gender: Gender
): Promise<StoryboardData> => {
  
  const complexityGuide = complexity === VisualComplexity.MINIMAL 
    ? "Keep backgrounds solid color or empty. Focus purely on the main action." 
    : "Standard storybook composition.";

  const prompt = `
    You are an expert Special Education teacher and illustrator. 
    Analyze the following story text and break it down into a visual storyboard suitable for a child with Autism Spectrum Disorder (ASD).
    
    Story to Visualize:
    """
    ${storyText}
    """
    
    Visual Complexity Level: ${complexity} (${complexityGuide})
    Main Character Gender: ${gender}

    Task:
    1. Extract a consistent main character "blueprint" (must be a young ${gender}).
    2. Break the story into 5-8 distinct pages (scenes).
    3. For each page, write the simple text for the child to read, and a precise visual description for an AI image generator.
    4. Ensure specific emotional cues and hand gestures are explicitly described in the action_description.

    Return JSON matching this schema:
    {
      "title": "Title of story",
      "purpose": "Educational goal (e.g. Learning to Wait)",
      "character_blueprint": {
        "age": number,
        "hair": "string",
        "skin_tone": "string",
        "clothing": "string",
        "expression_style": "string"
      },
      "pages": [
        {
          "id": number,
          "text": "The sentence on the page",
          "action_description": "Visual description of the character's action and setting"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: STORYBOARD_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            purpose: { type: Type.STRING },
            character_blueprint: {
              type: Type.OBJECT,
              properties: {
                age: { type: Type.NUMBER },
                hair: { type: Type.STRING },
                skin_tone: { type: Type.STRING },
                clothing: { type: Type.STRING },
                expression_style: { type: Type.STRING },
              },
              required: ["age", "hair", "clothing"],
            },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  action_description: { type: Type.STRING },
                },
                required: ["id", "text", "action_description"],
              },
            },
          },
          required: ["title", "character_blueprint", "pages"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Inject metadata for history tracking
    const storyData: StoryboardData = {
      ...data,
      uid: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    
    return storyData;
  } catch (error) {
    console.error("Storyboard generation failed", error);
    throw new Error("Failed to generate storyboard structure.");
  }
};

/**
 * Generates a single image for a specific page using the blueprint.
 */
export const generatePageImage = async (
  pageDesc: string,
  blueprint: CharacterBlueprint,
  complexity: VisualComplexity
): Promise<string> => {
  
  // Construct a prompt that enforces consistency
  const characterDesc = `Child, age ${blueprint.age}, ${blueprint.hair} hair, ${blueprint.skin_tone} skin, wearing ${blueprint.clothing}`;
  
  let stylePrompt = "";
  switch (complexity) {
    case VisualComplexity.MINIMAL:
      stylePrompt = "Flat vector art, white background, no background details, high contrast, thick outlines, clear focal point.";
      break;
    case VisualComplexity.BALANCED:
      stylePrompt = "Soft digital illustration, simple background, clear colors, easy to read emotions, clean lines.";
      break;
    case VisualComplexity.RICH:
      stylePrompt = "Detailed children's book watercolor style, warm lighting, textured background.";
      break;
  }

  const finalPrompt = `
    Children's book illustration.
    Style: ${stylePrompt}
    Character: ${characterDesc}.
    Action: ${pageDesc}.
    Ensure the character matches the description exactly. The expression should be distinct and clear.
  `;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        // Not using 'imageConfig' for nano banana as per strict instructions, relying on prompt.
        // But we want aspect ratio. Let's try to set it if supported, or rely on model default (usually 1:1).
        // gemini-2.5-flash-image generates 1:1 by default.
      }
    });

    // Extract Base64 image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image generation failed", error);
    throw error;
  }
};