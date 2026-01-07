"""
Example test cases for Rock-Paper-Scissors-Plus Game Referee
These demonstrate the game logic and tool behavior
"""

# ============================================================================
# TEST: validate_move()
# ============================================================================

def test_validate_move():
    from game_referee import validate_move
    
    print("=" * 60)
    print("TEST: validate_move()")
    print("=" * 60)
    
    # Test 1: Valid moves
    print("\n✓ Test 1: Valid moves")
    for move in ["rock", "paper", "scissors", "bomb"]:
        result = validate_move(move, user_bomb_used=False)
        assert result["valid"] == True
        assert result["move"] == move
        print(f"  {move:12} → {result['valid']}")
    
    # Test 2: Case insensitivity
    print("\n✓ Test 2: Case insensitivity")
    result = validate_move("ROCK", user_bomb_used=False)
    assert result["valid"] == True
    assert result["move"] == "rock"
    print(f"  'ROCK' → {result['move']}")
    
    # Test 3: Whitespace trimming
    print("\n✓ Test 3: Whitespace trimming")
    result = validate_move("  scissors  ", user_bomb_used=False)
    assert result["valid"] == True
    assert result["move"] == "scissors"
    print(f"  '  scissors  ' → {result['move']}")
    
    # Test 4: Invalid move
    print("\n✓ Test 4: Invalid move")
    result = validate_move("xyz", user_bomb_used=False)
    assert result["valid"] == False
    assert "Invalid move" in result["error"]
    print(f"  'xyz' → Error: {result['error']}")
    
    # Test 5: Bomb already used
    print("\n✓ Test 5: Bomb already used")
    result = validate_move("bomb", user_bomb_used=True)
    assert result["valid"] == False
    assert "already used" in result["error"]
    print(f"  'bomb' (used) → Error: {result['error']}")
    
    print("\n✅ validate_move() tests passed!\n")


# ============================================================================
# TEST: resolve_round()
# ============================================================================

def test_resolve_round():
    from game_referee import resolve_round
    
    print("=" * 60)
    print("TEST: resolve_round()")
    print("=" * 60)
    
    test_cases = [
        # Bomb logic
        ("bomb", "bomb", "DRAW", "Both played bomb"),
        ("bomb", "rock", "USER", "Bomb beats rock"),
        ("rock", "bomb", "BOT", "Bomb beats rock"),
        
        # Same move
        ("rock", "rock", "DRAW", "Same move"),
        ("paper", "paper", "DRAW", "Same move"),
        
        # Rock vs Scissors
        ("rock", "scissors", "USER", "Rock beats scissors"),
        ("scissors", "rock", "BOT", "Rock beats scissors"),
        
        # Scissors vs Paper
        ("scissors", "paper", "USER", "Scissors beats paper"),
        ("paper", "scissors", "BOT", "Scissors beats paper"),
        
        # Paper vs Rock
        ("paper", "rock", "USER", "Paper beats rock"),
        ("rock", "paper", "BOT", "Paper beats rock"),
    ]
    
    for user_move, bot_move, expected_winner, description in test_cases:
        result = resolve_round(user_move, bot_move)
        assert result["winner"] == expected_winner, \
            f"Failed: {description} ({user_move} vs {bot_move})"
        print(f"✓ {user_move:12} vs {bot_move:12} → {result['winner']:6} | {description}")
    
    print("\n✅ resolve_round() tests passed!\n")


# ============================================================================
# TEST: update_game_state()
# ============================================================================

def test_update_game_state():
    from game_referee import GameState, update_game_state
    
    print("=" * 60)
    print("TEST: update_game_state()")
    print("=" * 60)
    
    # Initial state
    state = GameState().to_dict()
    assert state["round_number"] == 0
    assert state["user_score"] == 0
    assert state["bot_score"] == 0
    assert state["game_over"] == False
    print("✓ Initial state correct")
    
    # Round 1: User wins with rock vs scissors
    state = update_game_state(state, "rock", "scissors", "USER")
    assert state["round_number"] == 1
    assert state["user_score"] == 1
    assert state["bot_score"] == 0
    assert state["game_over"] == False
    assert len(state["move_history"]) == 1
    print("✓ Round 1: User wins (rock vs scissors)")
    
    # Round 2: Bot wins with bomb
    state = update_game_state(state, "paper", "bomb", "BOT")
    assert state["round_number"] == 2
    assert state["user_score"] == 1
    assert state["bot_score"] == 1
    assert state["bot_bomb_used"] == True
    assert state["game_over"] == False
    assert len(state["move_history"]) == 2
    print("✓ Round 2: Bot wins (bomb beats paper)")
    
    # Round 3: User wins with bomb (game should end)
    state = update_game_state(state, "bomb", "rock", "USER")
    assert state["round_number"] == 3
    assert state["user_score"] == 2
    assert state["bot_score"] == 1
    assert state["user_bomb_used"] == True
    assert state["game_over"] == True  # AUTO-TRIGGERED
    assert state["game_result"] == "USER_WIN"
    assert len(state["move_history"]) == 3
    print("✓ Round 3: User wins (bomb beats rock) → GAME OVER")
    print(f"  Final score: User {state['user_score']} - Bot {state['bot_score']}")
    print(f"  Result: {state['game_result']}")
    
    # Move history audit trail
    print("\n✓ Move history audit trail:")
    for entry in state["move_history"]:
        print(f"  Round {entry['round']}: {entry['user_move']:8} vs {entry['bot_move']:8} → {entry['winner']}")
    
    print("\n✅ update_game_state() tests passed!\n")


# ============================================================================
# TEST: Game Flow (Simulation)
# ============================================================================

def test_game_flow_simulation():
    from game_referee import (
        GameState, 
        validate_move, 
        get_bot_move, 
        resolve_round, 
        update_game_state
    )
    
    print("=" * 60)
    print("TEST: Full game flow simulation")
    print("=" * 60)
    
    state = GameState().to_dict()
    moves = [
        ("rock", None, "USER"),      # Will resolve to: rock vs ? → depends on bot
        ("paper", None, "BOT"),      # Will resolve to: paper vs ? → depends on bot
        ("bomb", None, "USER"),      # Will resolve to: bomb vs ? → depends on bot
    ]
    
    for round_num, (user_move, _, expected_winner) in enumerate(moves, 1):
        print(f"\n--- Round {round_num} ---")
        
        # Step 1: Validate user move
        validation = validate_move(user_move, state["user_bomb_used"])
        assert validation["valid"], f"Invalid move: {validation['error']}"
        user_move_validated = validation["move"]
        print(f"User move: {user_move_validated}")
        
        # Step 2: Get bot move
        bot_move_result = get_bot_move(state["bot_bomb_used"])
        bot_move = bot_move_result["move"]
        print(f"Bot move:  {bot_move}")
        
        # Step 3: Resolve round
        resolution = resolve_round(user_move_validated, bot_move)
        winner = resolution["winner"]
        print(f"Result:    {resolution['explanation']}")
        
        # Step 4: Update state
        state = update_game_state(state, user_move_validated, bot_move, winner)
        print(f"Score:     User {state['user_score']} - Bot {state['bot_score']}")
        
        if state["game_over"]:
            print(f"\n🏁 GAME OVER!")
            print(f"Final: {state['game_result']}")
            print(f"Bombs used - User: {state['user_bomb_used']}, Bot: {state['bot_bomb_used']}")
            break
    
    assert state["game_over"] == True, "Game should end after 3 rounds"
    assert state["round_number"] == 3, "Should have exactly 3 rounds"
    print("\n✅ Game flow simulation passed!\n")


# ============================================================================
# TEST: Edge Cases
# ============================================================================

def test_edge_cases():
    from game_referee import GameState, update_game_state
    
    print("=" * 60)
    print("TEST: Edge cases")
    print("=" * 60)
    
    # Edge case 1: Game doesn't end before round 3
    state = GameState().to_dict()
    state = update_game_state(state, "rock", "paper", "BOT")
    assert state["game_over"] == False, "Game should not end after round 1"
    state = update_game_state(state, "paper", "scissors", "BOT")
    assert state["game_over"] == False, "Game should not end after round 2"
    print("✓ Game doesn't end before round 3")
    
    # Edge case 2: Game ends exactly at round 3
    state = update_game_state(state, "scissors", "rock", "BOT")
    assert state["game_over"] == True, "Game must end at round 3"
    assert state["game_result"] == "BOT_WIN"
    print("✓ Game ends exactly at round 3")
    
    # Edge case 3: Draw game
    state = GameState().to_dict()
    state = update_game_state(state, "rock", "rock", "DRAW")
    state = update_game_state(state, "paper", "paper", "DRAW")
    state = update_game_state(state, "scissors", "scissors", "DRAW")
    assert state["game_over"] == True
    assert state["game_result"] == "DRAW"
    assert state["user_score"] == state["bot_score"] == 1
    print("✓ Draw game handled correctly")
    
    # Edge case 4: All three rounds won by user
    state = GameState().to_dict()
    for _ in range(3):
        state = update_game_state(state, "rock", "scissors", "USER")
    # Actually, this would end after round 3 automatically, not after 3 wins
    # Let's test correct scenario:
    state = GameState().to_dict()
    state = update_game_state(state, "rock", "scissors", "USER")  # User: 1
    state = update_game_state(state, "paper", "rock", "USER")     # User: 2, Game ends
    assert state["game_over"] == True
    assert state["user_score"] == 2
    assert state["game_result"] == "USER_WIN"
    print("✓ Best-of-3 ends at 2 wins (doesn't need all 3 rounds if winner clear)")
    
    print("\n✅ Edge case tests passed!\n")


# ============================================================================
# MAIN: Run All Tests
# ============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("RUNNING TEST SUITE FOR GAME REFEREE")
    print("=" * 60 + "\n")
    
    try:
        test_validate_move()
        test_resolve_round()
        test_update_game_state()
        test_game_flow_simulation()
        test_edge_cases()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
