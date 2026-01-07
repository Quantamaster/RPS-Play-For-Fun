
import { GameState, Move, RoundResult } from '../types';

export const resolveRound = (
  currentState: GameState,
  userMove: Move,
  botMove: Move
): GameState => {
  if (currentState.isGameOver) return currentState;

  let winner: RoundResult['winner'] = 'draw';
  let reason = '';

  // Handle invalid moves
  if (userMove === 'invalid') {
    winner = 'bot';
    reason = 'Invalid input wastes the round for the user.';
  } else if (
    (userMove === 'bomb' && currentState.userUsedBomb) ||
    (botMove === 'bomb' && currentState.botUsedBomb)
  ) {
    // If bomb already used, treat as invalid or downgrade? 
    // The prompt says bomb "can be used once". Using it again is an invalid move for that player.
    if (userMove === 'bomb' && currentState.userUsedBomb) {
        winner = 'bot';
        reason = 'User tried to use bomb twice! Round wasted.';
    } else {
        winner = 'user';
        reason = 'Bot tried to use bomb twice! Round wasted.';
    }
  } else {
    // Standard logic
    if (userMove === botMove) {
      winner = 'draw';
      reason = `Both players played ${userMove}. It's a draw!`;
    } else if (userMove === 'bomb') {
      winner = 'user';
      reason = 'The Bomb obliterates everything!';
    } else if (botMove === 'bomb') {
      winner = 'bot';
      reason = 'The Bot used the Bomb! Total destruction.';
    } else if (
      (userMove === 'rock' && botMove === 'scissors') ||
      (userMove === 'paper' && botMove === 'rock') ||
      (userMove === 'scissors' && botMove === 'paper')
    ) {
      winner = 'user';
      reason = `${userMove} beats ${botMove}.`;
    } else {
      winner = 'bot';
      reason = `${botMove} beats ${userMove}.`;
    }
  }

  const updatedRounds = [
    ...currentState.rounds,
    {
      roundNumber: currentState.currentRound,
      userMove,
      botMove,
      winner,
      reason,
    },
  ];

  const userScore = winner === 'user' ? currentState.userScore + 1 : currentState.userScore;
  const botScore = winner === 'bot' ? currentState.botScore + 1 : currentState.botScore;
  const isGameOver = currentState.currentRound >= 3;
  
  let finalWinner: GameState['finalWinner'] = null;
  if (isGameOver) {
    if (userScore > botScore) finalWinner = 'user';
    else if (botScore > userScore) finalWinner = 'bot';
    else finalWinner = 'draw';
  }

  return {
    ...currentState,
    currentRound: currentState.currentRound + 1,
    userScore,
    botScore,
    userUsedBomb: userMove === 'bomb' ? true : currentState.userUsedBomb,
    botUsedBomb: botMove === 'bomb' ? true : currentState.botUsedBomb,
    rounds: updatedRounds,
    isGameOver,
    finalWinner,
  };
};
