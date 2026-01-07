# Project Structure & Setup Guide

## 📁 Complete Project Layout

```
rock-paper-scissors-plus-game-referee/
├── game_referee.py              (470 lines) - Main implementation
├── test_game_referee.py         (350+ lines) - Test suite
├── requirements.txt             - Dependencies
├── README.md                    - Architecture & design
├── GUIDE.md                     - Setup & diagrams
├── QUICK_REFERENCE.md           - One-page reference
├── IMPLEMENTATION.md            - Requirements matrix
├── INDEX.md                     - Navigation guide
└── SUMMARY.txt                  - Delivery summary
```

## 🎯 What Each File Does

### game_referee.py (MAIN IMPLEMENTATION)
```python
# State Model
class GameState:
    - round_number: int           # 0-3
    - user_score: int             # Wins
    - bot_score: int              # Wins
    - user_bomb_used: bool        # Constraint
    - bot_bomb_used: bool         # Constraint
    - game_over: bool             # Auto-detect
    - move_history: list          # Audit trail
    - game_result: str            # Final outcome

# Four Explicit Tools (Pure Functions)
def validate_move(input, bomb_used)          # Intent understanding
def get_bot_move(bomb_used)                   # Decision making
def resolve_round(user_move, bot_move)        # Game logic
def update_game_state(state, moves, winner)   # State mutation

# Agent Orchestrator
class GameReferee:
    - Uses Google Generative AI
    - Calls tools in sequence
    - Generates natural responses
    - Handles errors gracefully

# Entry Point
def main():
    - CLI game loop
    - Accepts user moves
    - Displays results
    - Ends when game_over
```

**Run**: `python game_referee.py`

### test_game_referee.py (TESTS)
```python
test_validate_move()          # Input validation
test_resolve_round()          # Game logic
test_update_game_state()      # State management
test_game_flow_simulation()   # End-to-end
test_edge_cases()             # Boundaries
```

**Run**: `python test_game_referee.py`

### requirements.txt (DEPENDENCIES)
```
google-generativeai>=0.4.0
```

**Install**: `pip install -r requirements.txt`

### README.md (ARCHITECTURE & DESIGN)
- Overview of features
- State model documentation
- Tool design explanation
- Technical decisions (with tradeoffs)
- Design rationale
- Future improvements
- Architecture summary

### GUIDE.md (SETUP & ARCHITECTURE)
- Quick start instructions
- Architecture diagram (ASCII)
- Tool call sequences (visual)
- State persistence examples
- Error handling guide
- Constraint enforcement
- Testing commands
- Performance notes

### QUICK_REFERENCE.md (ONE-PAGE REFERENCE)
- 3-step quick start
- File guide table
- Game rules summary
- One-page architecture
- Code structure
- Control flow diagram
- State transitions
- Design principles
- Troubleshooting

### IMPLEMENTATION.md (DETAILED REFERENCE)
- Requirements checklist (all ✅)
- Architecture components
- Execution flow diagram
- Design decisions matrix
- Metrics & performance
- Safety & constraints
- Test coverage details
- Requirements satisfaction matrix
- Learning outcomes

### INDEX.md (NAVIGATION GUIDE)
- Complete file descriptions
- Navigation by use case
- Quick links by topic
- Cross-references
- Verification checklist
- Documentation statistics
- Learning paths
- Next steps

### SUMMARY.txt (DELIVERY SUMMARY)
- Visual summary of all deliverables
- Requirements checklist
- Key features list
- Metrics summary
- Quick start instructions
- Documentation guide
- Overall status

---

## 🚀 Getting Started (3 Steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Get API Key
1. Visit https://ai.google.dev
2. Create account (free)
3. Go to "API keys" section
4. Create new API key
5. Set environment variable:
   ```bash
   export GOOGLE_API_KEY="your-key-here"
   ```

### Step 3: Run Game
```bash
python game_referee.py
```

---

## 📖 Documentation Paths

### Path 1: "Just Play" (5 min)
```
QUICK_REFERENCE.md (Quick Start)
      ↓
python game_referee.py
      ↓
Play!
```

### Path 2: "Understand It" (30 min)
```
QUICK_REFERENCE.md (Architecture)
      ↓
GUIDE.md (Architecture Diagram)
      ↓
README.md (Architecture section)
      ↓
Game logic understood ✅
```

### Path 3: "Read the Code" (1 hour)
```
GUIDE.md (Tool Call Sequence)
      ↓
game_referee.py (with docstrings)
      ↓
test_game_referee.py (example tests)
      ↓
Code understood ✅
```

### Path 4: "Deep Dive" (2+ hours)
```
README.md (complete)
      ↓
game_referee.py (complete)
      ↓
test_game_referee.py (all tests)
      ↓
IMPLEMENTATION.md (all details)
      ↓
Expert understanding ✅
```

---

## 🧪 Testing

### Run All Tests
```bash
python test_game_referee.py
```

### Expected Output
```
============================================================
RUNNING TEST SUITE FOR GAME REFEREE
============================================================

============================================================
TEST: validate_move()
============================================================

✓ Test 1: Valid moves
✓ Test 2: Case insensitivity
✓ Test 3: Whitespace trimming
✓ Test 4: Invalid move
✓ Test 5: Bomb already used

✅ validate_move() tests passed!

... (similar for other tests)

============================================================
✅ ALL TESTS PASSED!
============================================================
```

### Run Individual Tests
```bash
python -c "from test_game_referee import test_validate_move; test_validate_move()"
python -c "from test_game_referee import test_resolve_round; test_resolve_round()"
python -c "from test_game_referee import test_update_game_state; test_update_game_state()"
python -c "from test_game_referee import test_game_flow_simulation; test_game_flow_simulation()"
python -c "from test_game_referee import test_edge_cases; test_edge_cases()"
```

---

## 🎮 Playing the Game

### Start
```bash
python game_referee.py
```

### Game Flow
```
Initializing Game Referee...
🎮 Welcome to Rock-Paper-Scissors-Plus!

Rules (Best of 3):
• Valid moves: rock, paper, scissors, bomb
• Bomb beats everything (use once per player)
• Bomb vs bomb = draw
• Invalid input = lose the round
• Game ends after 3 rounds

Let's play! Enter your move:
```

### Example Session
```
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

Thanks for playing!
```

---

## 🔧 Troubleshooting

### "ModuleNotFoundError: No module named 'google'"
```bash
pip install google-generativeai
```

### "Error: GOOGLE_API_KEY not found"
```bash
export GOOGLE_API_KEY="your-key-here"
python game_referee.py
```

### "Game hangs or timeout"
- Check internet connection
- Verify API key validity
- Check Google API status at https://status.cloud.google.com

### Tests fail
```bash
# Check Python version (requires 3.8+)
python --version

# Check dependencies
pip install -r requirements.txt

# Run tests with verbose output
python test_game_referee.py
```

### "Invalid move" always appears
- Make sure to enter lowercase (rock, paper, scissors, bomb)
- No typos or extra spaces
- Valid moves: exactly "rock", "paper", "scissors", or "bomb"

---

## 📊 File Statistics

| File | Lines | Purpose |
|------|-------|---------|
| game_referee.py | 470 | Main implementation |
| test_game_referee.py | 350+ | Test suite |
| README.md | 350+ | Architecture |
| GUIDE.md | 400+ | Setup & diagrams |
| QUICK_REFERENCE.md | 300+ | Quick reference |
| IMPLEMENTATION.md | 400+ | Requirements |
| INDEX.md | 350+ | Navigation |
| **Total** | **2,620+** | **Project** |

---

## ✅ Verification Checklist

Run through this to verify everything works:

- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Set API key: `export GOOGLE_API_KEY="your-key"`
- [ ] Run tests: `python test_game_referee.py` (all pass ✅)
- [ ] Play game: `python game_referee.py`
  - [ ] Beat bot: play 3 rounds, win at least 2
  - [ ] Verify round numbering: shows "Round 1", "Round 2", "Round 3"
  - [ ] Verify move display: shows "You: X | Bot: Y"
  - [ ] Verify winner: shows "You win" or "Bot wins" or "Draw"
  - [ ] Verify bomb: use bomb once, can't use again
  - [ ] Verify game end: automatically ends after 3 rounds

All checks passed? ✅ Everything works!

---

## 🎓 Learning Outcomes

By reading this project, you'll learn:

### Concepts
- ✅ Agent orchestration patterns
- ✅ Tool-based state management
- ✅ Constraint enforcement strategies
- ✅ Error handling and graceful degradation
- ✅ Test-driven development

### Technologies
- ✅ Python (3.8+)
- ✅ Google Generative AI API
- ✅ Function calling / tool use
- ✅ JSON schemas
- ✅ Unit testing

### Best Practices
- ✅ Clean code organization
- ✅ Clear separation of concerns
- ✅ Comprehensive documentation
- ✅ Complete test coverage
- ✅ Design pattern implementation

---

## 📚 Documentation Index

| Document | Best For | Time |
|----------|----------|------|
| QUICK_REFERENCE.md | Quick overview | 5 min |
| INDEX.md | Navigation | 5 min |
| GUIDE.md | Setup & architecture | 20 min |
| README.md | Design understanding | 30 min |
| game_referee.py | Code study | 30 min |
| test_game_referee.py | Testing examples | 20 min |
| IMPLEMENTATION.md | Detailed reference | 30 min |

**Total time to expert understanding**: 2-3 hours

---

## 🚀 Next Steps

### Beginner
1. Read QUICK_REFERENCE.md
2. Play the game
3. Run tests

### Intermediate
1. Read GUIDE.md
2. Read game_referee.py
3. Study test_game_referee.py

### Advanced
1. Read README.md (design rationale)
2. Read IMPLEMENTATION.md (detailed specs)
3. Modify code and add features
4. Write new tests

### Expert
1. Master all documentation
2. Modify architecture
3. Add new features
4. Create variant games

---

## ✨ Quick Summary

A **minimal, production-ready game referee** for Rock-Paper-Scissors-Plus:

- ✅ Uses explicit tools for state management
- ✅ Leverages Google Generative AI for orchestration
- ✅ Handles all edge cases gracefully
- ✅ Provides clear round-by-round feedback
- ✅ Includes comprehensive tests
- ✅ Extensively documented
- ✅ Ready to play and learn from

**Status**: Complete and ready for use! 🎉

---

**Start with**: `python game_referee.py`

**Learn from**: `README.md` or `GUIDE.md`

**Test with**: `python test_game_referee.py`

**Navigate with**: `INDEX.md`

Enjoy! 🎮
