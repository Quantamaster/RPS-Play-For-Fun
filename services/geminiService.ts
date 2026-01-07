
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const resolveRoundTool: FunctionDeclaration = {
  name: 'resolve_round',
  description: 'Validates moves, determines round winner, and updates the game state.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userMove: {
        type: Type.STRING,
        description: 'The move the user chose: rock, paper, scissors, or bomb. Use "invalid" if input is nonsense.',
      },
      botMove: {
        type: Type.STRING,
        description: 'The move the bot chose for itself: rock, paper, scissors, or bomb.',
      },
    },
    required: ['userMove', 'botMove'],
  },
};

export const SYSTEM_INSTRUCTION = `
You are the "Ref-O-Matic", a witty and efficient game referee for Rock-Paper-Scissors-Console.
RULES:
1. Best of 3 rounds.
2. Moves: rock, paper, scissors, bomb.
3. Bomb: Beats all but bomb (draw). Use once per player per game.
4. Invalid inputs: Round wasted (opponent wins).

YOUR TASK:
- Explain rules in ≤ 5 lines at start.
- Be competitive! You are also the user's opponent.
- On every turn:
  1. Parse the user's move from their chat.
  2. Decide YOUR move (be smart or random).
  3. CALL the 'resolve_round' tool to update the official game state.
  4. After the tool returns, announce the result (round #, moves played, winner) and current score.
  5. If game is over, announce final result and stop.
- Do NOT hallucinate scores. Only use the tool output.
`;

export const getRefResponse = async (
  message: string,
  history: any[] = []
) => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: [resolveRoundTool] }],
    },
  });
  return response;
};
