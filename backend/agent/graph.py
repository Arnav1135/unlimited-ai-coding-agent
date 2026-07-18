from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from .error_engine import analyze_error
from .rag import retrieve_context

# Initialize Ollama LLM
llm = ChatOllama(model="qwen2.5-coder", temperature=0.2)

class AgentState(TypedDict):
    task: str
    plan: Optional[str]
    code: Optional[str]
    error: Optional[str]
    iterations: int

def planner(state: AgentState) -> AgentState:
    print("Planning task...")
    # Retrieve relevant context via RAG
    context = retrieve_context(state["task"])
    
    prompt = f"""You are an autonomous AI coding agent.
Given the following user task and codebase context, formulate a step-by-step implementation plan.
Context:
{context}

Task: {state['task']}
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    plan = response.content
    return {"plan": plan, "iterations": state["iterations"]}

def executor(state: AgentState) -> AgentState:
    print("Executing code...")
    
    prompt = f"""You are executing the following plan:
{state['plan']}

Write the final implementation code. Output ONLY the code, no markdown.
"""
    if state["error"] and state["iterations"] > 0:
        prompt += f"\nPrevious attempt failed with error:\n{state['error']}\nPlease fix this error in your new implementation."

    response = llm.invoke([HumanMessage(content=prompt)])
    
    # Simulate an error on first run to test Error Engine
    if state["iterations"] == 0 and "mock_error" in state["task"]:
        return {"code": response.content, "error": "SyntaxError: simulated error for testing"}
        
    return {"code": response.content, "error": None}

def verifier(state: AgentState) -> AgentState:
    print("Verifying code...")
    # In a real scenario, this would run tests or syntax checks
    if state["error"]:
        return state
    return state

def error_handler(state: AgentState) -> AgentState:
    print("Error Engine activated...")
    # Utilize Error Engine to self-correct
    corrected_plan = analyze_error(state["error"], state["code"])
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
