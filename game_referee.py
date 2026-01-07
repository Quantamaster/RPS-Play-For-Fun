"""
Rock-Paper-Scissors-Plus Game Referee using Google Generative AI
Minimal implementation with tool-based state management and agent orchestration
"""

import json
import random
import sys
from typing import Any
import google.generativeai as genai

# ============================================================================
# STATE MODEL
# ============================================================================

class GameState:
    """
    Immutable-style state management for the game.
    All mutations go through explicit tools (enforcing auditability).
    """
    def __init__(self):
        self.round_number = 0
        self.user_score = 0
        self.bot_score = 0
        self.user_bomb_used = False
        self.bot_bomb_used = False
        self.game_over = False
        self.move_history = []  # Track all moves for debugging/replay
        self.game_result = None  # "USER_WIN", "BOT_WIN", "DRAW"

    def to_dict(self) -> dict:
        """Serialize state for tools and agent context."""
        return {
            "round_number": self.round_number,
            "user_score": self.user_score,
            "bot_score": self.bot_score,
            "user_bomb_used": self.user_bomb_used,
            "bot_bomb_used": self.bot_bomb_used,
            "game_over": self.game_over,
            "move_history": self.move_history,
            "game_result": self.game_result,
        }


# ============================================================================
# GAME LOGIC TOOLS (Pure Functions)
# ============================================================================

def validate_move(user_input: str, user_bomb_used: bool) -> dict:
    """
    Tool 1: Validate and normalize user input.
    Returns: { valid: bool, move: str or None, error: str or None }
    """
    move = user_input.strip().lower()
    valid_moves = {"rock", "paper", "scissors", "bomb"}
    
    if move not in valid_moves:
        return {
            "valid": False,
            "move": None,
            "error": f"Invalid move '{user_input}'. Valid moves: rock, paper, scissors, bomb."
        }
    
    if move == "bomb" and user_bomb_used:
        return {
            "valid": False,
            "move": None,
            "error": "You already used your bomb! Choose rock, paper, or scissors."
        }
    
    return {"valid": True, "move": move, "error": None}


def get_bot_move(bot_bomb_used: bool) -> dict:
    """
    Tool 2: Generate bot's next move with strategy.
    Simple strategy: use bomb with 15% chance (if available), otherwise random.
    Returns: { move: str }
    """
    if not bot_bomb_used and random.random() < 0.15:
        return {"move": "bomb"}
    
    moves = ["rock", "paper", "scissors"]
    return {"move": random.choice(moves)}


def resolve_round(user_move: str, bot_move: str) -> dict:
    """
    Tool 3: Resolve a single round.
    Returns: { winner: "USER" | "BOT" | "DRAW", explanation: str }
    """
    # Bomb logic
    if user_move == "bomb" and bot_move == "bomb":
        return {
            "winner": "DRAW",
            "explanation": "Both played bomb → Draw!"
        }
    if user_move == "bomb":
        return {
            "winner": "USER",
            "explanation": "Bomb beats all → You win this round!"
        }
    if bot_move == "bomb":
        return {
            "winner": "BOT",
            "explanation": "Bomb beats all → Bot wins this round!"
        }
    
    # Standard RPS logic
    if user_move == bot_move:
        return {"winner": "DRAW", "explanation": "Same move → Draw!"}
    
    # Rock vs Paper vs Scissors
    winning_combos = {
        ("rock", "scissors"),
        ("scissors", "paper"),
        ("paper", "rock"),
    }
    
    if (user_move, bot_move) in winning_combos:
        return {
            "winner": "USER",
            "explanation": f"{user_move} beats {bot_move} → You win this round!"
        }
    else:
        return {
            "winner": "BOT",
            "explanation": f"{bot_move} beats {user_move} → Bot wins this round!"
        }


def update_game_state(
    current_state: dict,
    user_move: str,
    bot_move: str,
    round_winner: str
) -> dict:
    """
    Tool 4: Atomically update game state after a round.
    Returns: Updated state dict
    """
    state = current_state.copy()
    
    # Increment round
    state["round_number"] += 1
    
    # Update scores
    if round_winner == "USER":
        state["user_score"] += 1
    elif round_winner == "BOT":
        state["bot_score"] += 1
    
    # Mark bomb as used
    if user_move == "bomb":
        state["user_bomb_used"] = True
    if bot_move == "bomb":
        state["bot_bomb_used"] = True
    
    # Record history
    state["move_history"].append({
        "round": state["round_number"],
        "user_move": user_move,
        "bot_move": bot_move,
        "winner": round_winner
    })
    
    # Check if game over (best of 3 = 2 rounds to win, max 3 rounds)
    if state["round_number"] >= 3:
        state["game_over"] = True
        if state["user_score"] > state["bot_score"]:
            state["game_result"] = "USER_WIN"
        elif state["bot_score"] > state["user_score"]:
            state["game_result"] = "BOT_WIN"
        else:
            state["game_result"] = "DRAW"
    
    return state


# ============================================================================
# AGENT ORCHESTRATION (Google Generative AI)
# ============================================================================

class GameReferee:
    """
    Minimal AI referee using Google Generative AI.
    Orchestrates tool calls and generates natural responses.
    """
    
    def __init__(self, api_key: str = None):
        """Initialize the referee with Google Generative AI."""
        if api_key:
            genai.configure(api_key=api_key)
        
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.state = GameState()
        self.tools = self._define_tools()
    
    def _define_tools(self) -> list:
        """Define available tools for the agent."""
        return [
            {
                "name": "validate_move",
                "description": "Validate user's move input and check bomb usage constraints",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_input": {
                            "type": "string",
                            "description": "Raw user input (rock, paper, scissors, or bomb)"
                        },
                        "user_bomb_used": {
                            "type": "boolean",
                            "description": "Whether user has already used their bomb"
                        }
                    },
                    "required": ["user_input", "user_bomb_used"]
                }
            },
            {
                "name": "get_bot_move",
                "description": "Generate bot's next move with strategy",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "bot_bomb_used": {
                            "type": "boolean",
                            "description": "Whether bot has already used its bomb"
                        }
                    },
                    "required": ["bot_bomb_used"]
                }
            },
            {
                "name": "resolve_round",
                "description": "Determine round winner and provide explanation",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_move": {
                            "type": "string",
                            "description": "User's validated move"
                        },
                        "bot_move": {
                            "type": "string",
                            "description": "Bot's move"
                        }
                    },
                    "required": ["user_move", "bot_move"]
                }
            },
            {
                "name": "update_game_state",
                "description": "Update game state after round resolution",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "user_move": {
                            "type": "string",
                            "description": "User's move this round"
                        },
                        "bot_move": {
                            "type": "string",
                            "description": "Bot's move this round"
                        },
                        "round_winner": {
                            "type": "string",
                            "enum": ["USER", "BOT", "DRAW"],
                            "description": "Who won this round"
                        }
                    },
                    "required": ["user_move", "bot_move", "round_winner"]
                }
            }
        ]
    
    def _execute_tool(self, tool_name: str, params: dict) -> Any:
        """Execute a tool with given parameters."""
        if tool_name == "validate_move":
            return validate_move(params["user_input"], params["user_bomb_used"])
        elif tool_name == "get_bot_move":
            return get_bot_move(params["bot_bomb_used"])
        elif tool_name == "resolve_round":
            return resolve_round(params["user_move"], params["bot_move"])
        elif tool_name == "update_game_state":
            self.state.__dict__.update(update_game_state(
                self.state.to_dict(),
                params["user_move"],
                params["bot_move"],
                params["round_winner"]
            ))
            return self.state.to_dict()
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    
    def start_game(self) -> str:
        """Initialize and explain the game."""
        rules = """🎮 Welcome to Rock-Paper-Scissors-Plus!

Rules (Best of 3):
• Valid moves: rock, paper, scissors, bomb
• Bomb beats everything (use once per player)
• Bomb vs bomb = draw
• Invalid input = lose the round
• Game ends after 3 rounds

Let's play! Enter your move:"""
        return rules
    
    def process_turn(self, user_input: str) -> str:
        """
        Process a user's turn with agent orchestration.
        This is where tools get called via the agent.
        """
        if self.state.game_over:
            return self._format_game_end()
        
        # Build context for agent
        current_state = self.state.to_dict()
        context = f"""Game State:
- Round: {current_state['round_number']}/3
- Score: User {current_state['user_score']} - Bot {current_state['bot_score']}
- User bomb used: {current_state['user_bomb_used']}
- Bot bomb used: {current_state['bot_bomb_used']}

User's input: "{user_input}"

Process this turn:
1. Validate the user's move
2. Generate bot's move
3. Resolve the round
4. Update game state
5. Report the round result clearly"""
        
        # Call agent with tools
        messages = [
            {"role": "user", "content": context}
        ]
        
        # Use native tool use if available, otherwise simulate
        response = self._call_agent_with_tools(messages)
        
        return response
    
    def _call_agent_with_tools(self, messages: list) -> str:
        """
        Call the agent and handle tool calls in an agentic loop.
        """
        tool_results = {}
        
        # Make initial request
        response = self.model.generate_content(
            messages,
            tools=self.tools
        )
        
        # Process tool calls if any
        while response.candidates[0].content.parts:
            part = response.candidates[0].content.parts[0]
            
            # Check if it's a tool call
            if hasattr(part, 'function_call'):
                tool_call = part.function_call
                tool_name = tool_call.name
                params = dict(tool_call.args)
                
                # Execute tool
                result = self._execute_tool(tool_name, params)
                tool_results[tool_name] = result
                
                # Add assistant response and tool result
                messages.append({"role": "model", "content": response.content})
                messages.append({
                    "role": "user",
                    "content": {
                        "function_response": {
                            "name": tool_name,
                            "response": result
                        }
                    }
                })
                
                # Get next response
                response = self.model.generate_content(messages, tools=self.tools)
            else:
                break
        
        # Extract text response
        if response.text:
            return response.text
        else:
            return self._fallback_response(tool_results)
    
    def _fallback_response(self, tool_results: dict) -> str:
        """
        Fallback response if agent doesn't generate text.
        This ensures we always have a response.
        """
        if not tool_results:
            return "Error processing turn. Please try again."
        
        # Construct response from tool results
        parts = []
        
        if "validate_move" in tool_results:
            if not tool_results["validate_move"]["valid"]:
                return f"❌ {tool_results['validate_move']['error']}"
        
        current_state = self.state.to_dict()
        parts.append(f"Round {current_state['round_number']}")
        
        if "resolve_round" in tool_results:
            result = tool_results["resolve_round"]
            user_move = [h["user_move"] for h in current_state["move_history"]][-1] if current_state["move_history"] else "?"
            bot_move = [h["bot_move"] for h in current_state["move_history"]][-1] if current_state["move_history"] else "?"
            parts.append(f"You: {user_move} | Bot: {bot_move}")
            parts.append(result["explanation"])
        
        parts.append(f"\nScore: You {current_state['user_score']} - Bot {current_state['bot_score']}")
        
        if current_state["game_over"]:
            parts.append(self._format_game_end())
        
        return "\n".join(parts)
    
    def _format_game_end(self) -> str:
        """Format final game result."""
        state = self.state.to_dict()
        result = f"\n{'='*40}\n🏁 GAME OVER!\n{'='*40}\n"
        result += f"Final Score: You {state['user_score']} - Bot {state['bot_score']}\n"
        
        if state['game_result'] == "USER_WIN":
            result += "🎉 You win the game!"
        elif state['game_result'] == "BOT_WIN":
            result += "🤖 Bot wins the game!"
        else:
            result += "🤝 It's a draw!"
        
        return result


# ============================================================================
# MAIN GAME LOOP
# ============================================================================

def main():
    """Run the game in a conversational loop."""
    print("Initializing Game Referee...")
    referee = GameReferee()
    
    # Start game
    print(referee.start_game())
    
    # Game loop
    while not referee.state.game_over:
        try:
            user_input = input("\nYour move: ").strip()
            if not user_input:
                print("Please enter a move (rock, paper, scissors, or bomb).")
                continue
            
            result = referee.process_turn(user_input)
            print(result)
            
        except KeyboardInterrupt:
            print("\n\nGame interrupted by user.")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("Please try again.")
    
    print("\nThanks for playing!")


if __name__ == "__main__":
    main()
