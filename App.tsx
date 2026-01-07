
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_STATE, GameState, ChatMessage, Move } from './types';
import { getRefResponse } from './services/geminiService';
import { resolveRound } from './services/gameLogic';
import { sounds } from './services/soundService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync mute state
  useEffect(() => {
    sounds.setMuted(isMuted);
  }, [isMuted]);

  // Auto-start with rules
  useEffect(() => {
    const startIntro = async () => {
      setIsLoading(true);
      try {
        const response = await getRefResponse("Start the game and explain rules briefly.");
        const text = response.text || "Welcome to Rock-Paper-Scissors-Console! What's your first move?";
        setMessages([{ role: 'assistant', content: text }]);
        sounds.playRef();
      } catch (err) {
        setMessages([{ role: 'assistant', content: "Error connecting to Referee. Please refresh." }]);
      } finally {
        setIsLoading(false);
      }
    };
    startIntro();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || gameState.isGameOver) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);
    sounds.playTap();

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await getRefResponse(userText, history);
      
      let aiText = response.text || "";
      let roundOutcome: 'win' | 'lose' | 'draw' | 'bomb' | null = null;

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.functionCall && part.functionCall.name === 'resolve_round') {
            const { userMove, botMove } = part.functionCall.args as { userMove: string; botMove: string };
            
            const normalizedUser: Move = ['rock', 'paper', 'scissors', 'bomb'].includes(userMove.toLowerCase()) 
              ? userMove.toLowerCase() as Move 
              : 'invalid';
            const normalizedBot: Move = ['rock', 'paper', 'scissors', 'bomb'].includes(botMove.toLowerCase()) 
              ? botMove.toLowerCase() as Move 
              : 'rock';

            setGameState(prev => {
              const newState = resolveRound(prev, normalizedUser, normalizedBot);
              const last = newState.rounds[newState.rounds.length - 1];

              if (normalizedUser === 'bomb' || normalizedBot === 'bomb') {
                roundOutcome = 'bomb';
              } else if (last.winner === 'user') {
                roundOutcome = 'win';
              } else if (last.winner === 'bot') {
                roundOutcome = 'lose';
              } else {
                roundOutcome = 'draw';
              }

              if (!aiText) {
                aiText = `Round ${last.roundNumber}: ${last.reason}\nScore: User ${newState.userScore} - Bot ${newState.botScore}`;
                if (newState.isGameOver) {
                    aiText += `\nGAME OVER! Winner: ${newState.finalWinner?.toUpperCase()}`;
                }
              }
              return newState;
            });
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
      
      // Play sounds based on turn outcome
      if (roundOutcome === 'bomb') sounds.playBomb();
      else if (roundOutcome === 'win') sounds.playWin();
      else if (roundOutcome === 'lose') sounds.playLose();
      else if (roundOutcome === 'draw') sounds.playDraw();
      else sounds.playRef();

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I had a brain glitch. Try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveSelection = (move: string) => {
    setInput(move);
    // Auto-submit after state update
    setTimeout(() => {
      const form = document.getElementById('game-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  const resetGame = () => {
    sounds.playTap();
    setGameState(INITIAL_STATE);
    setMessages([]);
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto border-x border-gray-800 bg-gray-900 shadow-2xl overflow-hidden relative">
      {/* Repo Info Modal */}
      {isInfoOpen && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsInfoOpen(false)}
        >
          <div 
            className="bg-gray-800 border border-indigo-500 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-gray-700 pb-3">
              <div>
                <h2 className="text-2xl font-black text-indigo-400">REPO DESCRIPTION</h2>
                <p className="text-xs text-gray-400 font-mono">Rock-Paper-Scissors-Console</p>
              </div>
              <button 
                onClick={() => setIsInfoOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-sm leading-relaxed text-gray-300">
              <section>
                <h3 className="text-indigo-300 font-bold uppercase text-xs mb-1">Concept</h3>
                <p>A high-stakes "Console" implementation of RPS, featuring a rogue AI referee. Powered by Google Gemini API.</p>
              </section>

              <section>
                <h3 className="text-indigo-300 font-bold uppercase text-xs mb-1">Mechanics</h3>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Best of 3 Rounds wins the match.</li>
                  <li><span className="text-red-400 font-bold">BOMB</span>: One-time use. Destroy any standard move.</li>
                  <li>Ref interprets your chat; don't waste your moves!</li>
                </ul>
              </section>

              <section>
                <h3 className="text-indigo-300 font-bold uppercase text-xs mb-1">Tech Stack</h3>
                <p className="font-mono text-xs bg-black/40 p-2 rounded">
                  React 19 + Tailwind + Gemini 3 Flash + Web Audio API
                </p>
              </section>
            </div>

            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 mt-4"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-indigo-700 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-indigo-600 rounded-full transition-colors text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.982 5.982 0 0115 10a5.982 5.982 0 01-1.414 4.243 1 1 0 11-1.414-1.414A3.987 3.987 0 0013 10c0-1.104-.447-2.103-1.172-2.828a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="p-2 hover:bg-indigo-600 rounded-full transition-colors text-white"
              title="Repo Info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Ref-O-Matic</h1>
            <p className="text-[10px] text-indigo-200 uppercase font-mono tracking-widest leading-none">Console System</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-indigo-100 font-semibold">Match Score</span>
          <div className="text-xl font-mono text-white leading-none">
            {gameState.userScore} — {gameState.botScore}
          </div>
        </div>
      </header>

      {/* Game Stats Overlay */}
      <div className="bg-gray-800 p-2 flex justify-around text-[10px] uppercase tracking-wider border-b border-gray-700 shadow-sm relative z-0 text-gray-400">
        <div className="flex items-center gap-2">
          <span>Active Round: <span className="text-indigo-400 font-black">{Math.min(gameState.currentRound, 3)}/3</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span>User Bomb: </span>
          <span className={`px-2 py-0.5 rounded font-black transition-all ${gameState.userUsedBomb ? 'bg-red-900 text-red-200 line-through opacity-50' : 'bg-green-600 text-white shadow-lg'}`}>
            {gameState.userUsedBomb ? 'DEPLETED' : 'READY'}
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-900 to-black"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-lg border ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500' 
                : 'bg-gray-800 text-gray-100 border-gray-700 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700 animate-pulse text-gray-400 italic text-sm">
              Referee is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        {gameState.isGameOver ? (
          <div className="text-center space-y-3 py-2">
            <h2 className="text-3xl font-black text-yellow-400 animate-bounce tracking-tighter">
              {gameState.finalWinner === 'user' ? 'GLORY IS YOURS!' : 
               gameState.finalWinner === 'bot' ? 'YOU FAILED!' : 'STALEMATE!'}
            </h2>
            <button 
              onClick={resetGame}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-xl transition-all shadow-xl active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['Rock', 'Paper', 'Scissors', 'Bomb'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMoveSelection(m.toLowerCase())}
                  disabled={isLoading || gameState.isGameOver || (m === 'Bomb' && gameState.userUsedBomb)}
                  className={`flex-1 min-w-[80px] py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all active:scale-90 ${
                    m === 'Bomb' 
                      ? (gameState.userUsedBomb ? 'bg-gray-700 border-gray-800 text-gray-500 opacity-30' : 'bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-red-900/40 shadow-lg animate-pulse')
                      : 'bg-gray-700 border-gray-600 text-white hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            
            <form id="game-form" onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Talk to the Ref or pick a move..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-100 placeholder:text-gray-600 text-sm"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
              >
                SEND
              </button>
            </form>
          </div>
        )}
      </footer>
    </div>
  );
};

export default App;
