# 🤖 Rock-Paper-Scissors-Console

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_3_Flash-orange?logo=google-gemini)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-stakes, AI-powered "Ref-O-Matic" implementation of the classic game, enhanced with a strategic **Bomb** mechanic and a best-of-3 format.

## 🕹️ Game Overview
**Rock-Paper-Scissors-Console** is not just a game; it's a duel against a witty, competitive AI referee. Using the **Gemini 3 Flash** model, the referee interprets your natural language inputs, makes its own strategic moves, and enforces the rules of the arena.

### The Rules
*   **Best of 3**: The first player to win two rounds claims total victory.
*   **Standard Moves**: Rock, Paper, and Scissors follow classic logic.
*   **The BOMB**: A powerful move that beats all standard moves. However, it can only be used **once per match**.
*   **The Referee**: Don't try to cheat. The AI parses your intent; if you talk nonsense, you forfeit the round.

## ✨ Key Features
*   **🧠 AI-Driven Logic**: Powered by `gemini-3-flash-preview` for high-speed reasoning and personality-driven dialogue.
*   **🛠️ Deterministic State Management**: Uses **Gemini Function Calling** (`resolve_round`) to ensure the AI never hallucinates scores or cheats on game state.
*   **🔊 Procedural Audio**: A custom `SoundService` using the **Web Audio API** generates real-time SFX (taps, wins, losses, and explosive bomb sounds) without external assets.
*   **📱 Console Experience**: A sleek, dark-themed UI built with **Tailwind CSS**, optimized for both desktop and mobile "command line" aesthetics.
*   **💬 Natural Language Play**: Move beyond simple buttons—tell the ref "I'm feeling lucky, throw a rock!" and it will understand.

## 🛠️ Technical Architecture
### AI Orchestration
The app utilizes a system instruction that defines the "Ref-O-Matic" persona. Every user interaction is passed to Gemini, which then decides whether to trigger the `resolve_round` tool based on the user's intent.

### State Flow
1. **User Input**: Text or button click.
2. **AI Inference**: Gemini parses move + decides bot move.
3. **Function Call**: Gemini calls `resolve_round(userMove, botMove)`.
4. **State Update**: React logic processes the tool call, updates the score, and triggers SFX.
5. **Response**: AI narrates the result with trash talk or encouragement.

## 🚀 Getting Started
1. Ensure you have your `API_KEY` configured in your environment.
2. The application expects the Google GenAI SDK.
3. Launch the `index.html` to enter the arena.

---
*Built by a world-class senior frontend engineer for the ultimate AI gaming experience.*

Experience the Game
with AI Studio:
https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221SvYYoRkZ0dhCKWPHMSSwRuyikWixsl36%22%5D,%22action%22:%22open%22,%22userId%22:%22112051457885057469981%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing
