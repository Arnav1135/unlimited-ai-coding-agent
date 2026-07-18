import chromadb
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
import os

# Connect to ChromaDB running in Docker
chroma_client = chromadb.HttpClient(host="localhost", port=8000)

# Use Ollama for embeddings
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Initialize VectorStore
vector_store = Chroma(
    client=chroma_client,
    collection_name="agent_workspace",
    embedding_function=embeddings
)

def index_workspace(directory: str):
    """Indexes the workspace directory into ChromaDB."""
    print(f"Indexing workspace: {directory}...")
    documents = []
    
    # Simple file reader
    for root, _, files in os.walk(directory):
        if "node_modules" in root or "venv" in root or ".git" in root:
            continue
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    documents.append(Document(page_content=content, metadata={"source": file_path}))
            except Exception:
                pass # Skip binary files
                
    if not documents:
        print("No documents found to index.")
        return
        
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(documents)
    
    vector_store.add_documents(splits)
    print(f"Indexed {len(splits)} chunks into ChromaDB.")

def retrieve_context(query: str, k: int = 3) -> str:
    """Retrieves relevant context for the given query."""
    results = vector_store.similarity_search(query, k=k)
    context = "\n\n".join([f"Source: {doc.metadata['source']}\n{doc.page_content}" for doc in results])
    return context
