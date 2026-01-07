# Rock-Paper-Scissors-Plus Game Referee

A minimal AI-powered game referee for Rock-Paper-Scissors-Plus, built with Python and Google Generative AI using explicit tool-based state management.

## Overview

This chatbot acts as an intelligent referee that:
- Explains rules clearly (≤5 lines)
- Validates user moves with constraint checking
- Generates strategic bot moves
- Resolves rounds with explanations
- Tracks game state and enforces win conditions
- Automatically ends the game after 3 rounds

## Architecture

### 1. State Model (`GameState`)

**Design Decision:** Single immutable-style state object that persists across turns.

```python
{
  "round_number": int,           # 0-3 (incremented after each turn)
  "user_score": int,             # Wins accumulated
  "bot_score": int,              # Wins accumulated
  "user_bomb_used": bool,        # Tracks one-time bomb
  "bot_bomb_used": bool,         # Tracks one-time bomb
  "game_over": bool,             # Enforces 3-round limit
  "move_history": list,          # Audit trail for debugging
  "game_result": str             # "USER_WIN", "BOT_WIN", "DRAW"
}
```

**Why immutable-style?**
- All state mutations go through explicit tools → auditability
- Easier to reason about game logic
- Tools can validate before applying changes
- No hidden state mutations

---

### 2. Agent & Tool Design

#### Tool 1: `validate_move(user_input, user_bomb_used)`
**Intent Understanding**: Parse and validate user input.
- Normalizes input (lowercase, trim)
- Checks valid move set: {rock, paper, scissors, bomb}
- Enforces bomb usage constraint (once per game)
- **Output**: `{ valid: bool, move: str, error: str }`

#### Tool 2: `get_bot_move(bot_bomb_used)`
**Agent Decision Making**: Generate bot's move.
- Strategy: 15% chance to use bomb (if available), otherwise random RPS
- **Output**: `{ move: str }`

#### Tool 3: `resolve_round(user_move, bot_move)`
**Game Logic**: Determine round outcome.
- Bomb logic: bomb beats all, bomb vs bomb = draw
- Standard RPS: rock beats scissors, scissors beats paper, paper beats rock
- **Output**: `{ winner: "USER"|"BOT"|"DRAW", explanation: str }`

#### Tool 4: `update_game_state(current_state, user_move, bot_move, round_winner)`
**State Mutation**: Atomically update game state after round.
- Increments round counter
- Updates scores
- Marks bombs as used
- Records history
- Auto-detects game over condition (3 rounds max)
- **Output**: Updated state dict

#### Agent Orchestration: `GameReferee`
Uses Google Generative AI (`gemini-2.0-flash`) to:
1. Accept tool definitions (JSON schemas)
2. Process user input via chat
3. Decide which tools to call
4. Chain tool calls in logical sequence
5. Generate natural feedback responses

**Flow Per Turn:**
```
User Input
    ↓
Agent reads state context + user input
    ↓
Agent calls: validate_move()
    ├─ Invalid? → Return error, no state change
    └─ Valid? → Proceed
    ↓
Agent calls: get_bot_move()
    ↓
Agent calls: resolve_round()
    ↓
Agent calls: update_game_state()
    ↓
Agent generates human-readable response
    ↓
Return result to user
```

---

## Technical Decisions

### 1. Tool-Based State (Not Prompt-Based)
**Why?** Requirements demanded: "Game state must not live only in the prompt."

| Approach | Pros | Cons |
|----------|------|------|
| **Prompt-only** | Simple | Loses state on error, unpredictable |
| **Tool-based** | Auditable, atomic, debuggable | Requires explicit tool design |

**We chose:** Tool-based. All state lives in `GameState` object; tools are the only way to mutate it.

### 2. One Agent (Not Multiple)
**Why?** Game is simple enough; one orchestrator agent is clearer than splitting into intent/logic/response agents.

### 3. Structured Tool Outputs
**Why?** Ensures agent gets consistent, parseable feedback for chaining.

Example:
```json
{
  "valid": true,
  "move": "rock",
  "error": null
}
```

### 4. Fallback Response Handler
If the agent doesn't generate text (edge case), we construct a response from tool results to ensure no dead ends.

---

## Usage

### Installation
```bash
pip install google-generativeai
export GOOGLE_API_KEY="your-key-here"
```

### Run
```bash
python game_referee.py
```

### Example Session
```
🎮 Welcome to Rock-Paper-Scissors-Plus!

Rules (Best of 3):
• Valid moves: rock, paper, scissors, bomb
• Bomb beats everything (use once per player)
• Bomb vs bomb = draw
• Invalid input = lose the round
• Game ends after 3 rounds

Let's play! Enter your move:

Your move: rock

Round 1
You: rock | Bot: scissors
Rock beats scissors → You win this round!

Score: You 1 - Bot 0

Your move: paper

Round 2
You: paper | Bot: bomb
Bomb beats all → Bot wins this round!

Score: You 1 - Bot 1

Your move: bomb

Round 3
You: bomb | Bot: rock
Bomb beats all → You win this round!

Score: You 2 - Bot 1

========================================
🏁 GAME OVER!
========================================
Final Score: You 2 - Bot 1
🎉 You win the game!
```

---

## Functional Requirements Met

| Requirement | Implementation |
|-------------|-----------------|
| Explain rules ≤5 lines | `start_game()` returns 5-line rule summary |
| Prompt for move | `input()` in game loop |
| Validate input | `validate_move()` tool with constraint checking |
| Decide & explain outcome | `resolve_round()` tool provides explanation |
| Track round & score | `GameState.round_number`, `.user_score`, `.bot_score` |
| End after 3 rounds | `update_game_state()` checks round count → auto `game_over` |
| Bomb once per player | `user_bomb_used`, `bot_bomb_used` flags in state |
| Invalid inputs handled | `validate_move()` returns error; user can retry |
| No crashes on edge cases | All inputs validated; fallback response handler |
| State persists | Single `GameState` object updated by tools |

---

## Architecture Separation

### Intent Understanding
- Agent reads user input + game state
- Calls `validate_move()` → determines if input is valid/what move was intended
- Agent routes to error handler or proceeds

### Game Logic
- `resolve_round()` implements winning rules
- `update_game_state()` enforces constraints (bomb once, 3-round limit)

### Response Generation
- Agent generates natural text from tool results
- Fallback handler constructs response if agent doesn't output text

---

## Tradeoffs Made

| Decision | Tradeoff | Rationale |
|----------|----------|-----------|
| Single agent | Less composable than multi-agent | Simpler, sufficient for scope |
| Deterministic bot strategy | Less fun (predictable) | Focus on game logic over AI |
| No database | Game lost on process exit | Requirements: no databases |
| No external APIs | Can't persist across sessions | Requirements: no external APIs |
| Tool-based state | More code | Meets requirement: state not in prompt |
| Fallback response | Less natural if triggered | Ensures no dead ends |

---

## What I Would Improve With More Time

### 1. **Multi-Turn State Persistence**
- Add SQLite to persist game history
- Enable "replay previous game" feature

### 2. **Better Bot Strategy**
- Implement minimax logic (predict user moves)
- Learn from game history within session
- Add difficulty levels (easy/medium/hard)

### 3. **Error Recovery**
- More granular error messages (e.g., "Did you mean 'rock'?")
- Spell-correction for typos

### 4. **UI/UX Enhancements**
- Web interface (FastAPI + HTML)
- Game statistics dashboard
- ASCII art for moves
- Colored terminal output

### 5. **Testing**
- Unit tests for all tools (validate, resolve, update)
- Property-based testing for invariants:
  - `round_number` never exceeds 3
  - `score` never exceeds 3
  - Bomb never used more than once per player
- Agentic tests (simulate user moves, verify responses)

### 6. **Agent Robustness**
- Handle concurrent turns
- Timeout mechanism for long responses
- Retry logic if agent fails

### 7. **Scalability**
- Support multiplayer (user vs user)
- Tournament mode (best of N games)
- Leaderboard (if database added)

---

## File Structure

```
game_referee.py          # All-in-one implementation
  ├── GameState          # State model
  ├── Tools              # validate_move, get_bot_move, resolve_round, update_game_state
  ├── GameReferee        # Agent orchestrator
  └── main()             # Game loop
```

---

## Key Engineering Decisions

1. **No Prompt State**: State lives in `GameState` object, not in context.
2. **Explicit Tools**: Every game action is a named tool → auditability.
3. **Atomic State Updates**: `update_game_state()` is single transaction.
4. **Structured Outputs**: Tools return JSON-like dicts for reliable parsing.
5. **Fallback Response**: If agent doesn't output text, construct from tool results.
6. **Constraint Enforcement**: Bomb, round limit, move validation all in tools.

---

## Running Tests Manually

```bash
# Test validate_move
python -c "from game_referee import validate_move; print(validate_move('rock', False))"

# Test resolve_round
python -c "from game_referee import resolve_round; print(resolve_round('rock', 'scissors'))"

# Test update_game_state
python -c "from game_referee import update_game_state, GameState; 
state = GameState().to_dict(); 
print(update_game_state(state, 'rock', 'scissors', 'USER'))"
```

---

## Summary

This implementation provides a **minimal, auditable, tool-driven game referee** that:
- ✅ Separates concerns cleanly (intent, logic, response)
- ✅ Uses explicit tools for all state mutations
- ✅ Leverages Google Generative AI for orchestration
- ✅ Handles edge cases without crashes
- ✅ Tracks state across turns
- ✅ Provides clear, round-by-round feedback

The codebase is <500 lines, follows Python best practices, and meets all functional & technical requirements.
