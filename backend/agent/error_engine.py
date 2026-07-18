from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(model="qwen2.5-coder", temperature=0.2)

def analyze_error(error_message: str, code: str) -> str:
    """
    Error Engine logic. 
    Queries Ollama to provide a fixed implementation based on the error.
    """
    print(f"Error Engine analyzing: {error_message}")
    
    prompt = f"""The following code produced an error during execution.
Code:
{code}

Error:
{error_message}

Analyze the error and provide an updated, fixed implementation plan and code structure.
"""
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content
