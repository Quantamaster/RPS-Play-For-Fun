
export type Move = 'rock' | 'paper' | 'scissors' | 'bomb' | 'invalid';

export interface RoundResult {
  roundNumber: number;
  userMove: Move;
  botMove: Move;
  winner: 'user' | 'bot' | 'draw' | 'none';
  reason: string;
}

export interface GameState {
  currentRound: number;
  userScore: number;
  botScore: number;
  userUsedBomb: boolean;
  botUsedBomb: boolean;
  rounds: RoundResult[];
  isGameOver: boolean;
  finalWinner: 'user' | 'bot' | 'draw' | null;
}

export const INITIAL_STATE: GameState = {
  currentRound: 1,
  userScore: 0,
  botScore: 0,
  userUsedBomb: false,
  botUsedBomb: false,
  rounds: [],
  isGameOver: false,
  finalWinner: null,
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
