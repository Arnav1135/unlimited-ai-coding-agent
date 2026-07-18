from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional
from .error_engine import analyze_error

class AgentState(TypedDict):
    task: str
    plan: Optional[str]
    code: Optional[str]
    error: Optional[str]
    iterations: int

def planner(state: AgentState) -> AgentState:
    print("Planning task...")
    return {"plan": "Generated Plan"}

def executor(state: AgentState) -> AgentState:
    print("Executing code...")
    # Simulate an error on first run to trigger Error Engine
    if state["iterations"] == 0:
        return {"code": "def faulty(): pass", "error": "SyntaxError: invalid syntax"}
    return {"code": "def fixed(): pass", "error": None}

def verifier(state: AgentState) -> AgentState:
    print("Verifying code...")
    if state["error"]:
        return state # error found during execution
    return state

def error_handler(state: AgentState) -> AgentState:
    print("Error Engine activated...")
    # Utilize Error Engine to self-correct
    corrected_plan = analyze_error(state["error"])
    return {"plan": corrected_plan, "error": None, "iterations": state["iterations"] + 1}

def route_next(state: AgentState):
    if state["error"] and state["iterations"] < 3:
        return "error_handler"
    elif state["error"]:
        return END
    return END

# Build Graph
graph_builder = StateGraph(AgentState)
graph_builder.add_node("planner", planner)
graph_builder.add_node("executor", executor)
graph_builder.add_node("verifier", verifier)
graph_builder.add_node("error_handler", error_handler)

graph_builder.set_entry_point("planner")
graph_builder.add_edge("planner", "executor")
graph_builder.add_edge("executor", "verifier")

graph_builder.add_conditional_edges(
    "verifier",
    route_next,
    {
        "error_handler": "error_handler",
        END: END
    }
)
graph_builder.add_edge("error_handler", "executor")

app = graph_builder.compile()
