## Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get API Key
1. Go to https://ai.google.dev
2. Create a free account
3. Generate an API key in "API keys" section
4. Set environment variable:
   ```bash
   export GOOGLE_API_KEY="your-key-here"
   ```

### 3. Run Game
```bash
python game_referee.py
```

### 4. Play!
```
Your move: rock
Your move: paper
Your move: bomb
Your move: scissors
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME LOOP (main)                         │
│  Accepts user input → Calls process_turn() → Displays      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  GameReferee.process_turn()       │
         │  (Orchestrator)                   │
         │                                   │
         │  1. Build context from state      │
         │  2. Call agent with tools         │
         │  3. Handle tool responses         │
         │  4. Return formatted response     │
         └────────┬────────────┬─────────────┘
                  │            │
        ┌─────────▼──┐  ┌──────▼──────────┐
        │  TOOLS     │  │ GAME STATE      │
        │ (Pure Fn)  │  │                 │
        └────────────┘  └─────────────────┘
                │
    ┌───────────┼───────────┬───────────┐
    │           │           │           │
    ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│ validate │ │  get_bot │ │ resolve  │ │  update_    │
│  _move() │ │  _move() │ │ _round() │ │game_state() │
└──────────┘ └──────────┘ └──────────┘ └─────────────┘
   Intent      Decision     Game         State
   Check       Making       Logic        Mutation

        ┌──────────────────────────────────┐
        │   Google Generative AI Agent     │
        │   (gemini-2.0-flash)             │
        │                                  │
        │   - Reads tool definitions       │
        │   - Decides which tools to call  │
        │   - Chains tool calls            │
        │   - Generates natural responses  │
        └──────────────────────────────────┘
```

---

## Tool Call Sequence (Per Turn)

```
TURN 1:
  ┌─ User input: "rock"
  │
  ├─ validate_move("rock", user_bomb_used=False)
  │  └─> { "valid": true, "move": "rock", "error": null }
  │
  ├─ get_bot_move(bot_bomb_used=False)
  │  └─> { "move": "scissors" }
  │
  ├─ resolve_round("rock", "scissors")
  │  └─> { "winner": "USER", "explanation": "Rock beats scissors → You win!" }
  │
  ├─ update_game_state(
  │     current_state={...},
  │     user_move="rock",
  │     bot_move="scissors",
  │     round_winner="USER"
  │   )
  │  └─> {
  │       "round_number": 1,
  │       "user_score": 1,
  │       "bot_score": 0,
  │       "move_history": [{"round": 1, "user_move": "rock", ...}],
  │       ...
  │      }
  │
  └─ Agent generates: "Round 1\nYou: rock | Bot: scissors\n..."
```

---

## State Persistence Across Turns

```
START (Round 0)
  GameState {
    round_number: 0,
    user_score: 0,
    bot_score: 0,
    user_bomb_used: False,
    bot_bomb_used: False,
    game_over: False,
    move_history: []
  }

AFTER TURN 1 (process_turn("rock"))
  GameState {
    round_number: 1,
    user_score: 1,
    bot_score: 0,
    user_bomb_used: False,
    bot_bomb_used: False,
    game_over: False,
    move_history: [
      {round: 1, user_move: "rock", bot_move: "scissors", winner: "USER"}
    ]
  }

AFTER TURN 2 (process_turn("paper"))
  GameState {
    round_number: 2,
    user_score: 1,
    bot_score: 1,           ← Bot wins round 2
    user_bomb_used: False,
    bot_bomb_used: False,
    game_over: False,
    move_history: [
      {...round 1...},
      {round: 2, user_move: "paper", bot_move: "bomb", winner: "BOT"}
    ]
  }

AFTER TURN 3 (process_turn("bomb"))
  GameState {
    round_number: 3,
    user_score: 2,
    bot_score: 1,
    user_bomb_used: True,   ← Bomb used!
    bot_bomb_used: False,
    game_over: True,        ← Auto-triggered (3 rounds max)
    game_result: "USER_WIN",
    move_history: [
      {...round 1...},
      {...round 2...},
      {round: 3, user_move: "bomb", bot_move: "rock", winner: "USER"}
    ]
  }

GAME ENDS
```

---

## Error Handling

### Invalid Input (e.g., "xyz")
```
validate_move("xyz", False) → {
  "valid": False,
  "move": None,
  "error": "Invalid move 'xyz'. Valid moves: rock, paper, scissors, bomb."
}

Agent generates: "❌ Invalid move 'xyz'. Valid moves: rock, paper, scissors, bomb."
User can retry.
```

### Bomb Already Used
```
validate_move("bomb", True) → {
  "valid": False,
  "move": None,
  "error": "You already used your bomb! Choose rock, paper, or scissors."
}

Agent generates: "❌ You already used your bomb! Choose rock, paper, or scissors."
User can retry.
```

### Game Over
```
if GameState.game_over:
  process_turn() returns formatted_game_end()
  No more turns accepted.
```

---

## Constraint Enforcement

### 1. Move Validation
- Only {rock, paper, scissors, bomb} allowed
- Checked by: `validate_move()`
- Enforced: Before `resolve_round()`

### 2. Bomb Once Per Player
- `user_bomb_used` flag = True after bomb is played
- `bot_bomb_used` flag = True after bot plays bomb
- Checked by: `validate_move()` and `get_bot_move()`
- Enforced: Before `resolve_round()`

### 3. 3-Round Limit
- `round_number` incremented by `update_game_state()`
- Game auto-ends when `round_number >= 3`
- Checked by: `update_game_state()` logic

### 4. No Dead Ends
- Invalid input → Error message + retry prompt
- Agent always generates response (or fallback handler)
- Game loop only exits on `game_over` or user interrupt

---

## Testing Commands

```bash
# Test imports
python -c "import game_referee; print('✓ Imports OK')"

# Test validate_move
python -c "
from game_referee import validate_move
print('Test 1: Valid move')
print(validate_move('rock', False))
print('\nTest 2: Invalid move')
print(validate_move('xyz', False))
print('\nTest 3: Bomb after used')
print(validate_move('bomb', True))
"

# Test resolve_round
python -c "
from game_referee import resolve_round
print('Test 1: Rock vs Scissors')
print(resolve_round('rock', 'scissors'))
print('\nTest 2: Bomb vs Rock')
print(resolve_round('bomb', 'rock'))
print('\nTest 3: Bomb vs Bomb')
print(resolve_round('bomb', 'bomb'))
"

# Test update_game_state
python -c "
from game_referee import GameState, update_game_state
state = GameState().to_dict()
print('Initial:', state)
updated = update_game_state(state, 'rock', 'scissors', 'USER')
print('\nAfter round 1:')
print('Round:', updated['round_number'])
print('User score:', updated['user_score'])
print('Move history:', updated['move_history'])
"
```

---

## Design Rationale

### Why Tool-Based State?
✓ All mutations auditable
✓ Tools enforce constraints before state change
✓ No hidden side effects
✓ Easy to debug/replay from move_history
✗ Slightly more code than prompt-only approach

### Why Single Agent?
✓ Simple orchestration
✓ Clear control flow
✓ Sufficient for scope
✗ Less composable than multi-agent

### Why Explicit Tools?
✓ Named, typed, validated
✓ Can be tested in isolation
✓ Meets requirement: "must define at least one explicit tool"
✗ More upfront schema definition

### Why Google Generative AI?
✓ Free tier available
✓ Supports tool/function calling
✓ Good for text generation & reasoning
✓ Minimal setup (API key only)

---

## Performance Notes

- **Latency**: ~1-2 seconds per turn (API call to Google)
- **Cost**: Free tier supports ~100 calls/day
- **Memory**: Single GameState object, ~1KB per game
- **Storage**: None (no persistence)

---

## Next Steps

1. Run `pip install -r requirements.txt`
2. Set `GOOGLE_API_KEY` environment variable
3. Run `python game_referee.py`
4. Play 3 rounds of Rock-Paper-Scissors-Plus!
