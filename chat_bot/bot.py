### Web3 RAG Chatbot (Flask Version)
# Technologies: Flask + LangChain + OpenAI + CoinGecko API + FAISS (vector DB)

from flask import Flask, request, jsonify
from langchain.chains import RetrievalQA
from langchain.schema.messages import HumanMessage

from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

import requests
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# Global cache for symbol->id
symbol_id_map = {}

# Init LLM and Retriever
llm = ChatOpenAI(
    model_name="mistralai/mistral-7b-instruct",  # or any other free model
    temperature=0.2,
    openai_api_base="https://openrouter.ai/api/v1"
)

embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# FAISS Vector Store (Can preload Web3 documents / whitepapers here)
retriever = FAISS.load_local(
    "faiss_index", 
    embeddings=embedding,
    allow_dangerous_deserialization=True
).as_retriever()
rag_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

# CoinGecko API call
def load_symbol_id_map():
    global symbol_id_map
    try:
        res = requests.get("https://api.coingecko.com/api/v3/coins/list")
        coins = res.json()
        for coin in coins:
            symbol = coin["symbol"].upper()
            if symbol not in symbol_id_map:
                symbol_id_map[symbol] = []
            symbol_id_map[symbol].append(coin["id"])
    except Exception as e:
        print("Failed to load coin list:", e)

def fetch_token_data(symbol):
    try:
        # Step 1: Fetch all coins
        coins_list = requests.get("https://api.coingecko.com/api/v3/coins/list").json()
        matching = [coin for coin in coins_list if coin['symbol'].lower() == symbol.lower()]

        if not matching:
            return {"error": f"No coin found for symbol '{symbol}'"}

        # Step 2: If only one match, use it
        if len(matching) == 1:
            coin_id = matching[0]['id']
        else:
            # Step 3: Disambiguate using market cap
            market_data = requests.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "ids": ",".join([coin['id'] for coin in matching])
                }
            ).json()

            if not market_data:
                return {"error": "Could not resolve coin by market cap"}

            # Step 4: Pick highest market cap
            # Replace None market_caps with 0 to avoid comparison error
            market_data.sort(key=lambda x: x.get("market_cap") or 0, reverse=True)
            coin_id = market_data[0]["id"]

        # Step 5: Fetch detailed data
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        data = requests.get(url).json()

        return {
            "name": data["name"],
            "symbol": data["symbol"].upper(),
            "price": data["market_data"]["current_price"]["usd"],
            "market_cap": data["market_data"]["market_cap"]["usd"],
            "id": coin_id
        }

    except Exception as e:
        return {"error": f"API failed: {e}"}

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    query = data.get("query", "")

    if "$" in query:
        import re
        match = re.search(r"\$([A-Za-z0-9]+)", query)
        if match:
            token = match.group(1)
            token_data = fetch_token_data(token)

            # 🛡️ Handle API or symbol errors
            if "error" in token_data:
                return jsonify({"response": f"❌ {token_data['error']}"})

            return jsonify({
                "response": f"""
📈 **{token_data['name']} ({token_data['symbol']})**
- 💰 Price: ${token_data['price']:,}
- 🏦 Market Cap: ${token_data['market_cap']:,}
- 🔗 ID: {token_data['id']}
"""})

    # Fallback to RAG if no token match
    answer = rag_chain.invoke({"query": query})
    return jsonify({"response": answer.get("result", "No answer available.")})

@app.route("/")
def root():
    return jsonify({"message": "Web3 RAG Chatbot is running (Flask)!"})

if __name__ == "__main__":
    load_symbol_id_map()  # Load mapping before running server
    # print(symbol_to_id)
    app.run(debug=True, port=6502)
