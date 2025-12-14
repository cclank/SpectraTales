
export enum VisualComplexity {
  MINIMAL = 'Minimal', // Solid background, only essential elements
  BALANCED = 'Balanced', // Simple background, moderate detail
  RICH = 'Rich' // Detailed background (standard storybook)
}

export enum StoryMode {
  CUSTOM = 'Custom',
  TEMPLATE = 'Template'
}

export type Gender = 'boy' | 'girl';

export interface CharacterBlueprint {
  age: number;
  hair: string;
  skin_tone: string;
  clothing: string;
  expression_style: string;
  accessories?: string;
}

export interface StoryPage {
  id: number;
  text: string;
  action_description: string; // Internal description for the prompt
  image_url?: string;
  is_generating: boolean;
  error?: string;
}

export interface StoryboardData {
  uid: string;
  createdAt: number;
  title: string;
  purpose: string;
  character_blueprint: CharacterBlueprint;
  visual_style_guide: string; // The "Global Prompt" for consistency
  pages: StoryPage[];
}

export interface GenerationSettings {
  complexity: VisualComplexity;
  style_prompt: string;
}

export const TEMPLATES = [
  {
    id: 'sharing',
    title: 'Learning to Share',
    text: "Timmy is playing with a red truck. His friend Sarah wants to play too. Timmy feels sad to give it up. But Timmy hands the truck to Sarah. Sarah smiles and says thank you. Timmy feels happy he shared. Now they play together with blocks.",
    purpose: "Social Skill: Sharing and Turn Taking"
  },
  {
    id: 'calm_down',
    title: 'Calming Down',
    text: "The classroom is very loud. Jamie covers his ears. He feels frustrated and wants to scream. Jamie takes a deep breath. He counts to five: 1, 2, 3, 4, 5. Jamie goes to the quiet corner. Now he feels calm and safe.",
    purpose: "Emotional Regulation: Coping with sensory overload"
  },
  {
    id: 'greeting',
    title: 'Saying Hello',
    text: "Alex walks into the classroom. He sees his teacher, Mrs. Lee. Alex stops and looks at her. He waves his hand. He says 'Good morning, Mrs. Lee'. Mrs. Lee smiles and waves back. It is polite to say hello.",
    purpose: "Social Protocol: Greetings"
  }
];
