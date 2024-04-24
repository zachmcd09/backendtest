# Chat with an intelligent assistant in your terminal
from openai import OpenAI
from openai import OpenAI
from llama_index import Document, LlamaIndex, EmbeddingDocumentStorage, SimpleVectorScoreScorer
import numpy as np
from microcore.embedding_db import AbstractEmbeddingDB, SearchResult
from llama_index import Index

class LlamaIndexDB(AbstractEmbeddingDB):
    def __init__(self, index: Index):
        self.index = index

    def get_all(self, collection: str) -> list[str | SearchResult]:
        # Retrieve all documents from the llama index collection
        return [doc.to_json() for doc in self.index.search(collection)]

    def search(
        self,
        collection: str,
        query: str,
        n_results: int = 5,
        where: dict = None,
        **kwargs,
    ) -> list[str | SearchResult]:
        # Perform a search on the llama index using the provided query and options
        return self.index.search(collection, query, top_n=n_results, **kwargs)

    def find_all(
        self, collection: str, query: str, where: dict = None, **kwargs
    ) -> list[str | SearchResult]:
        # Perform a full-text search on the llama index using the provided query and options
        return self.index.search(collection, query, **kwargs)

    # Implement other methods as needed...


# Point to the local server
client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")
client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")


# Initialize the llama_index instance
doc_storage = EmbeddingDocumentStorage()  # This will store documents as embeddings
index = LlamaIndex(scorer=SimpleVectorScoreScorer())
doc_storage.add_to_index(index)

history = [
    {"role": "system", "content": "You are an intelligent assistant. You always provide well-reasoned answers that are both correct and helpful."},
    {"role": "user", "content": "Hello, introduce yourself to someone opening this program for the first time. Be concise."},
]

# Initialize the microcore instance

# Function to add documents to the semantic search index
def add_document(text, metadata=None):
    doc = Document(content=text, metadata=metadata)
    embedding = doc.to_embedding()  # llama_index handles the embedding creation
    doc_storage.add_document(doc, embedding)


# Function to search the index and retrieve relevant documents
def search_documents(query, k=5):
    query_document = Document(content=query)
    query_embedding = query_document.to_embedding()  # Assuming this method is implemented
    results = index.search(np.array([query_embedding]), k=k)
    return [(doc.content, doc.metadata) for doc in results]


# Function to get the embedding of a text
def get_embedding(text, model="nomic", chunk_size=512):
    text = text.replace("\n", " ")
    
    # Split the text into chunks of up to chunk_size tokens
    words = text.split()
    chunks = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]
    embeddings = []

    for chunk in chunks:
        chunk_text = ' '.join(chunk)
        embedding = client.embeddings.create(input=[chunk_text], model=model).data[0].embedding
        embeddings.append(embedding)

    # Combine the embeddings from each chunk (you may choose to average or concatenate them)
    combined_embedding = [sum(values)/len(values) for values in zip(*embeddings)]  # Averaging
    return combined_embedding

# Define a function to get context for a message
def get_context_for_message(message):
    search_results = search_documents(message['content'], k=1)  # Get top 1 result
    if search_results:
        context, _ = search_results[0]
        return {"role": "assistant", "content": f"Context found: {context}"}
    return None

# While loop to get user input and generate responses
while True:
    user_message = input("> ")
    new_user_message = {"role": "user", "content": user_message}
    
    context_message = get_context_for_message(new_user_message)
    if context_message:
        history.append(context_message)
    
    completion = client.chat.completions.create(
        model="bartowski/aixcoder-7b-GGUF",
        messages=history,
        temperature=0.7,
        stream=True,
    )

    new_assistant_message = {"role": "assistant", "content": ""}
    
    for chunk in completion:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
            new_assistant_message["content"] += chunk.choices[0].delta.content
    
    history.append(new_user_message)
    history.append(new_assistant_message)
    
    # Uncomment to see chat history
    # import json
    # gray_color = "\033[90m"
    # reset_color = "\033[0m"
    # print(f"{gray_color}\n{'-'*20} History dump {'-'*20}\n")
    # print(json.dumps(history, indent=2))
    # print(f"\n{'-'*55}\n{reset_color}")

    print()
    history.append({"role": "user", "content": input("> ")})