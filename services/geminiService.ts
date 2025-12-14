import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardData, VisualComplexity, CharacterBlueprint, Gender } from "../types";

// Note: API Key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STORYBOARD_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image"; // Efficient image generation

/**
 * Generates the storyboard structure: Character Blueprint + Page Breakdown + Master Style Guide.
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
    1. Extract a consistent main character "blueprint".
    2. Create a "Master Visual Style Guide" (Global Prompt). 
       - MUST include: Art style definition (e.g., "Soft watercolor", "Vibrant digital art"), Character details (exact hair color/style, skin tone, clothing colors/patterns).
       - MUST NOT include: Specific actions (like "running"), specific settings (like "park"), or specific emotions. It must be neutral enough to apply to ANY scene.
       - GOAL: This paragraph defines WHO is in the book and HOW it looks, but not WHAT is happening.
    3. Break the story into 5-8 distinct pages (scenes).
    4. IMPORTANT: Ensure the FIRST page explicitly visually introduces the Main Character in a clear, neutral pose.
    5. For each page, generate:
       - text: Simple sentence for the child.
       - action_description: A COMPLETE, VIVID STORYBOARD PROMPT.
         * Start with the CAMERA ANGLE (e.g., "Low angle shot looking up at...", "Extreme close-up of hands...", "Wide shot of the room...").
         * Describe the LIGHTING (e.g., "Warm sunny afternoon light", "Cool blue night shadows").
         * Describe the Character's ACTION dynamically (avoid static standing).
         * VISUALIZE INNER THOUGHTS & EMOTIONS: To help children understand feelings (Theory of Mind), explicitly describe visual metaphors in the scene (e.g., "a thought bubble showing a red truck", "stormy scribbles above head to show frustration", "bright sparkles around hands to show sharing magic", "a heart glowing on the chest").
         * Make the setting INSPIRING and detailed to spark curiosity (unless complexity is Minimal).
         * CRITICAL: You MUST vary the camera angles and compositions significantly between pages.

    Return JSON matching this schema:
    {
      "title": "Title of story",
      "purpose": "Educational goal",
      "character_blueprint": {
        "age": number,
        "hair": "string",
        "skin_tone": "string",
        "clothing": "string",
        "expression_style": "string"
      },
      "visual_style_guide": "The comprehensive global prompt paragraph (Style + Character ONLY)",
      "pages": [
        {
          "id": number,
          "text": "The sentence on the page",
          "action_description": "Detailed visual description including camera angle, lighting, action, and setting"
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
            visual_style_guide: { type: Type.STRING },
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
          required: ["title", "character_blueprint", "visual_style_guide", "pages"],
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
 * Generates a single image using the Master Style Guide (Global Prompt) AND Visual References.
 */
export const generatePageImage = async (
  pageDesc: string,
  styleConfig: {
    globalPrompt?: string, // The new Master Style Guide
    blueprint?: CharacterBlueprint, // Fallback
    complexity: VisualComplexity
  },
  referenceImageUrls: string[] = []
): Promise<string> => {
  
  // 1. Construct the Core Prompt
  let baseDescription = "";
  
  if (styleConfig.globalPrompt) {
    baseDescription = `[VISUAL STYLE & CHARACTER ID (IMMUTABLE)]\n${styleConfig.globalPrompt}`;
  } else if (styleConfig.blueprint) {
    const bp = styleConfig.blueprint;
    baseDescription = `[CHARACTER]\nChild, age ${bp.age}, ${bp.hair} hair, ${bp.skin_tone} skin, wearing ${bp.clothing}.`;
  }

  let finalPrompt = `
    **TASK**: Generate a consistent, inspiring children's book illustration.
    
    ${baseDescription}
    
    [CURRENT SCENE SPECIFICATION (PRIORITY FOR COMPOSITION)]
    SCENE: ${pageDesc}.
    
    **GENERATION RULES**:
    1. **STYLE**: Follow [VISUAL STYLE] for art technique and character colors.
    2. **COMPOSITION**: Follow [CURRENT SCENE] for the Camera Angle, Pose, and Background. 
       - IF the scene says "Close-up", you MUST generate a close-up. 
       - IF the scene says "Wide shot", you MUST generate a wide shot.
    3. **INNER WORLD**: If described, clearly render visual metaphors for thoughts or emotions (e.g., thought bubbles, stylized worry lines, magical sparkles). These are critical for the child to understand what the character is feeling.
    4. **INSPIRATION**: The image should spark curiosity. Use interesting lighting and details to make the world feel alive and magical, even for simple social stories.
  `;

  const parts: any[] = [];

  // 2. Add Visual References (The Anchor)
  referenceImageUrls.forEach((url) => {
    const match = url.match(/^data:(.+);base64,(.+)$/);
    if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }
  });

  if (referenceImageUrls.length > 0) {
    finalPrompt += `\n\n[REFERENCE IMAGE HANDLING]
    - **IDENTITY**: The reference images define EXACTLY what the character looks like. Match the face, hair, and clothes perfectly.
    - **ART STYLE**: Match the brush strokes, line weight, and color palette of the reference.
    - **POSE**: DO NOT COPY THE POSE from the reference. The character must be performing the action described in [CURRENT SCENE SPECIFICATION].
    - **BACKGROUND**: DO NOT COPY THE BACKGROUND. Use the setting described in [CURRENT SCENE SPECIFICATION].`;
  }

  // Add the text prompt
  parts.push({ text: finalPrompt });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: parts,
      },
    });

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