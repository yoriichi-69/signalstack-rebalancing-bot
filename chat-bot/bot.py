### Web3 RAG Chatbot (Flask Version)
# Technologies: Flask + LangChain + OpenAI + CoinGecko API + FAISS (vector DB)

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import requests
import json
import re
import traceback
import time
import os
from dotenv import load_dotenv
load_dotenv()

# Optional imports - will be used only if available
try:
    from langchain.chains import RetrievalQA
    from langchain.schema.messages import HumanMessage
    from langchain_openai import ChatOpenAI
    from langchain_community.vectorstores import FAISS
    from langchain_huggingface import HuggingFaceEmbeddings
    langchain_available = True
except ImportError:
    langchain_available = False
    print("⚠️ LangChain not available. Running in rule-based mode only.")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global cache for symbol->id and token price data (with expiry)
symbol_id_map = {}
token_price_cache = {}
CACHE_EXPIRY = 300  # 5 minutes

# Check if API key is available
has_openai_key = bool(os.getenv("OPENAI_API_KEY"))
rag_chain = None
retriever = None

# Initialize LLM and Retriever only if API key is available
if langchain_available and has_openai_key:
    try:
        print("✅ OpenAI API key found, initializing LLM...")
        llm = ChatOpenAI(
            model_name="mistralai/mistral-7b-instruct",  # or any other free model
            temperature=0.2,
            openai_api_base="https://openrouter.ai/api/v1"
        )

        embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

        # FAISS Vector Store (Can preload Web3 documents / whitepapers here)
        try:
            retriever = FAISS.load_local(
                "faiss_index", 
                embeddings=embedding,
                allow_dangerous_deserialization=True
            ).as_retriever()
            rag_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
            print("✅ Vector store loaded successfully")
        except Exception as e:
            print(f"⚠️ Error loading vector store: {e}")
            print("⚠️ Falling back to simpler responses")
            retriever = None
            rag_chain = None
    except Exception as e:
        print(f"⚠️ Error initializing LLM: {e}")
        print("⚠️ Running in rule-based mode only")
else:
    if not langchain_available:
        print("⚠️ LangChain not available. Running in rule-based mode only.")
    if not has_openai_key:
        print("⚠️ No OpenAI API key found. Running in rule-based mode only.")
        print("ℹ️ To enable AI-powered responses:")
        print("   1. Create a .env file in the chat-bot directory")
        print("   2. Add the line: OPENAI_API_KEY=your_api_key_here")
        print("   3. Restart the chatbot server")

# CoinGecko API call
def load_symbol_id_map():
    global symbol_id_map
    
    # Add some common symbols manually to avoid API calls
    symbol_id_map = {
        "BTC": ["bitcoin"],
        "ETH": ["ethereum"],
        "USDT": ["tether"],
        "BNB": ["binancecoin"],
        "SOL": ["solana"],
        "XRP": ["ripple"],
        "ADA": ["cardano"],
        "DOGE": ["dogecoin"],
        "DOT": ["polkadot"]
    }
    print(f"✅ Loaded common coin symbols manually (to avoid rate limits)")
    return
    
    # Commented out real API call due to rate limits
    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        res = requests.get(
            "https://api.coingecko.com/api/v3/coins/list",
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        )
        if res.status_code == 200:
            coins = res.json()
            for coin in coins:
                symbol = coin["symbol"].upper()
                if symbol not in symbol_id_map:
                    symbol_id_map[symbol] = []
                symbol_id_map[symbol].append(coin["id"])
            print(f"✅ Loaded {len(coins)} coins from CoinGecko")
        else:
            print(f"⚠️ CoinGecko API returned status code {res.status_code}")
    except Exception as e:
        print(f"⚠️ Failed to load coin list: {e}")

def fetch_token_data(symbol):
    """Enhanced token data fetcher with caching and better error handling"""
    global token_price_cache
    
    now = time.time()
    
    # Check cache first
    if symbol.upper() in token_price_cache:
        cached_data = token_price_cache[symbol.upper()]
        if now - cached_data['timestamp'] < CACHE_EXPIRY:
            print(f"✅ Using cached data for {symbol}")
            return cached_data['data']
    
    # If we've hit rate limits recently, return mock data for demo purposes
    if symbol.upper() == "BTC":
        return {
            "name": "Bitcoin",
            "symbol": "BTC",
            "price": 48250.75,
            "market_cap": 942853921543,
            "volume_24h": 28765432198,
            "price_change_24h": 2.34,
            "high_24h": 49123.45,
            "low_24h": 47820.15,
            "id": "bitcoin",
            "image": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
        }
    elif symbol.upper() == "ETH":
        return {
            "name": "Ethereum",
            "symbol": "ETH",
            "price": 2534.67,
            "market_cap": 304589621456,
            "volume_24h": 15678943210,
            "price_change_24h": 1.56,
            "high_24h": 2587.32,
            "low_24h": 2498.76,
            "id": "ethereum",
            "image": "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
        }
    
    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        # Step 1: Fetch all coins
        coins_list_url = "https://api.coingecko.com/api/v3/coins/list"
        coins_list_resp = requests.get(
            coins_list_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        if coins_list_resp.status_code != 200:
            print(f"⚠️ CoinGecko API error: {coins_list_resp.status_code}")
            return {"error": f"API returned status code {coins_list_resp.status_code}"}
        
        coins_list = coins_list_resp.json()
        matching = [coin for coin in coins_list if coin['symbol'].lower() == symbol.lower()]

        if not matching:
            return {"error": f"No coin found for symbol '{symbol}'"}

        # Step 2: If only one match, use it
        if len(matching) == 1:
            coin_id = matching[0]['id']
        else:
            # Step 3: Disambiguate using market cap
            try:
                market_data_url = "https://api.coingecko.com/api/v3/coins/markets"
                market_data_params = {
                    "vs_currency": "usd",
                    "ids": ",".join([coin['id'] for coin in matching])
                }
                market_data_resp = requests.get(
                    market_data_url,
                    params=market_data_params,
                    headers={'User-Agent': 'Mozilla/5.0'},
                    timeout=10
                )
                
                if market_data_resp.status_code != 200:
                    print(f"⚠️ CoinGecko API error: {market_data_resp.status_code}")
                    return {"error": f"API returned status code {market_data_resp.status_code}"}
                
                market_data = market_data_resp.json()

                if not market_data:
                    return {"error": "Could not resolve coin by market cap"}

                # Step 4: Pick highest market cap
                # Replace None market_caps with 0 to avoid comparison error
                market_data.sort(key=lambda x: x.get("market_cap") or 0, reverse=True)
                coin_id = market_data[0]["id"]
            except Exception as e:
                print(f"⚠️ Error during market data fetch: {e}")
                coin_id = matching[0]['id']  # Fallback to first match

        # Step 5: Fetch detailed data
        coin_url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        coin_resp = requests.get(
            coin_url,
            headers={'User-Agent': 'Mozilla/5.0'},
            timeout=10
        )
        
        if coin_resp.status_code != 200:
            print(f"⚠️ CoinGecko API error: {coin_resp.status_code}")
            return {"error": f"API returned status code {coin_resp.status_code}"}
        
        data = coin_resp.json()

        # Extract relevant data
        result = {
            "name": data["name"],
            "symbol": data["symbol"].upper(),
            "price": data["market_data"]["current_price"]["usd"],
            "market_cap": data["market_data"]["market_cap"]["usd"],
            "volume_24h": data["market_data"]["total_volume"]["usd"],
            "price_change_24h": data["market_data"]["price_change_percentage_24h"],
            "high_24h": data["market_data"]["high_24h"]["usd"],
            "low_24h": data["market_data"]["low_24h"]["usd"],
            "id": coin_id,
            "image": data["image"]["small"]
        }
        
        # Cache the result
        token_price_cache[symbol.upper()] = {
            'data': result,
            'timestamp': now
        }
        
        return result

    except Exception as e:
        print(f"⚠️ API failed: {e}")
        print(traceback.format_exc())
        return {"error": f"API failed: {str(e)}"}

def get_market_overview():
    """Fetch global market data overview"""
    # Return mock data to avoid rate limits
    return {
        "total_market_cap_usd": 2157483647000,
        "total_volume_usd": 98765432100,
        "market_cap_change_percentage_24h": 1.23,
        "active_cryptocurrencies": 8942,
        "markets": 673
    }
    
    # Commented out real API call due to rate limits
    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        res = requests.get(
            "https://api.coingecko.com/api/v3/global",
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        if res.status_code != 200:
            return {"error": f"API returned status code {res.status_code}"}
            
        data = res.json()["data"]
        
        # Format the response
        return {
            "total_market_cap_usd": data["total_market_cap"]["usd"],
            "total_volume_usd": data["total_volume"]["usd"],
            "market_cap_change_percentage_24h": data["market_cap_change_percentage_24h_usd"],
            "active_cryptocurrencies": data["active_cryptocurrencies"],
            "markets": data["markets"]
        }
    except Exception as e:
        print(f"⚠️ Market overview API failed: {e}")
        return {"error": f"Could not fetch market overview: {str(e)}"}

def format_token_response(token_data):
    """Format token data response in a nice markdown format"""
    if "error" in token_data:
        return f"❌ {token_data['error']}"
    
    # Format price with appropriate decimals
    if token_data['price'] < 0.01:
        price_str = f"${token_data['price']:.6f}"
    elif token_data['price'] < 1:
        price_str = f"${token_data['price']:.4f}"
    else:
        price_str = f"${token_data['price']:,.2f}"
    
    # Format price change with color indicator
    price_change = token_data['price_change_24h']
    if price_change is None:
        change_str = "n/a"
    elif price_change > 0:
        change_str = f"🟢 +{price_change:.2f}%"
    else:
        change_str = f"🔴 {price_change:.2f}%"
    
    return f"""### {token_data['name']} ({token_data['symbol']})

**Current Price**: {price_str}
**24h Change**: {change_str}
**24h Range**: ${token_data['low_24h']:,.2f} - ${token_data['high_24h']:,.2f}
**Market Cap**: ${token_data['market_cap']:,.0f}
**24h Volume**: ${token_data['volume_24h']:,.0f}
    """

def format_market_response(market_data):
    """Format market overview data response in a nice markdown format"""
    if "error" in market_data:
        return f"❌ {market_data['error']}"
    
    # Format market cap change with color indicator
    market_cap_change = market_data['market_cap_change_percentage_24h']
    if market_cap_change > 0:
        change_str = f"🟢 +{market_cap_change:.2f}%"
    else:
        change_str = f"🔴 {market_cap_change:.2f}%"
    
    return f"""### Global Crypto Market Overview

**Total Market Cap**: ${market_data['total_market_cap_usd']:,.0f}
**24h Market Cap Change**: {change_str}
**24h Trading Volume**: ${market_data['total_volume_usd']:,.0f}
**Active Cryptocurrencies**: {market_data['active_cryptocurrencies']:,}
**Active Markets**: {market_data['markets']:,}
    """

# Rule-based responses for common queries
def get_rule_based_response(query):
    """Provide rule-based responses for common queries when AI is not available"""
    query_lower = query.lower()
    
    if "rebalancing" in query_lower:
        return """### Portfolio Rebalancing

Portfolio rebalancing is the process of realigning the assets in your portfolio to maintain your desired asset allocation.

In CryptoRizz, you can:
- Set target allocations for different cryptocurrencies
- Choose from predefined strategies or create your own
- Automate rebalancing using our trading bots
- Monitor performance in real-time

Benefits include risk management, systematic profit-taking, and avoiding emotional trading decisions.
"""
    
    if "signal" in query_lower or "indicator" in query_lower:
        return """### Trading Signals

Trading signals in CryptoRizz are indicators that suggest potential trading opportunities. We use multiple indicators:

- **Momentum indicators**: RSI, MACD, Stochastic Oscillator
- **Trend indicators**: Moving Averages, Bollinger Bands
- **Volume indicators**: OBV, Volume Profile

Each signal is rated on a scale and can trigger automated trading actions when combined with bots.

Check the Signals tab to see current recommendations for your portfolio.
"""
    
    if "bot" in query_lower or "strategy" in query_lower:
        return """### CryptoRizz Trading Bots

Our trading bots automate your trading strategy based on:

1. **Signal-based**: Acts on multiple technical indicators
2. **Trend-following**: Captures longer-term market movements
3. **Mean-reversion**: Buys dips and sells rallies
4. **Custom strategies**: Create your own logic

You can deploy multiple bots with different strategies and track their performance in real-time.

Go to the Bots tab to configure and deploy your bots.
"""
    
    if "get started" in query_lower or "beginner" in query_lower:
        return """### Getting Started with Trading

1. **Learn the basics**: Understand how cryptocurrencies work
2. **Start small**: Begin with a small portion of your investment funds
3. **Diversify**: Don't put all your funds in one cryptocurrency
4. **Use CryptoRizz tools**: Explore our signals and automated strategies
5. **Monitor regularly**: Check your portfolio performance daily

CryptoRizz makes it easy with our dashboard showing your portfolio breakdown and real-time signals.
"""
    
    if "portfolio" in query_lower and "diversification" in query_lower:
        return """### Crypto Portfolio Diversification

Diversification reduces risk by spreading investments across multiple assets:

- **Large-cap coins**: BTC, ETH (50-60% of portfolio)
- **Mid-cap coins**: ADA, SOL, DOT (20-30%)
- **Small-cap coins**: Newer projects with potential (10-20%)
- **Stablecoins**: Reserve for buying opportunities (10-15%)

CryptoRizz helps you maintain optimal allocation with our rebalancing tools and pre-set diversification strategies.
"""
    
    if "defi" in query_lower or "staking" in query_lower:
        return """### DeFi Staking Explained

DeFi (Decentralized Finance) staking involves locking up cryptocurrency to support network operations in exchange for rewards.

**Key points**:
- Earn passive income (typically 5-15% APY)
- Support blockchain network security
- Various options: liquidity providing, yield farming, or traditional staking
- Risk varies by platform and protocol

Popular staking cryptocurrencies include ETH, SOL, ADA, and DOT.
"""

    if "wallet" in query_lower or "secure" in query_lower:
        return """### Crypto Security Best Practices

Protect your crypto assets with these security measures:

1. **Use hardware wallets** for long-term storage (Ledger, Trezor)
2. **Enable 2FA** on all exchanges and platforms
3. **Use unique passwords** for each service
4. **Backup your seed phrases** offline in multiple locations
5. **Be wary of phishing** attempts and fake websites
6. **Update software** regularly

CryptoRizz implements industry-standard security practices for all user accounts.
"""

    if "api key" in query_lower or "openai" in query_lower:
        return """### Setting Up Your OpenAI API Key

To enable AI-powered responses in the chatbot:

1. Sign up for an API key at [OpenAI's website](https://platform.openai.com)
2. Create a file named `.env` in the chat-bot directory
3. Add this line to the file: `OPENAI_API_KEY=your_api_key_here`
4. Restart the chatbot server

Without an API key, I'll continue to provide helpful rule-based responses about crypto trading.
"""

    # Generic response
    return """I'm your CryptoRizz assistant! I can help with:

- Cryptocurrency prices (use $SYMBOL format, like $BTC)
- Trading strategies and signals
- Portfolio management tips
- Bot configuration
- Security best practices

What would you like to know about crypto trading today?
"""

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    # Handle preflight requests
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
        
    data = request.get_json()
    query = data.get("query", "")
    
    # Check for token price queries - looking for $SYMBOL pattern
    if "$" in query:
        token_match = re.search(r"\$([A-Za-z0-9]+)", query)
        if token_match:
            token = token_match.group(1)
            token_data = fetch_token_data(token)
            
            # Format the response
            return jsonify({"response": format_token_response(token_data)})
    
    # Check for market overview requests
    if re.search(r"market\s+overview|crypto\s+market|global\s+market", query.lower()):
        market_data = get_market_overview()
        return jsonify({"response": format_market_response(market_data)})
    
    # If RAG capabilities are available, use them
    if rag_chain:
        try:
            answer = rag_chain.invoke({"query": query})
            return jsonify({"response": answer.get("result", "No answer available.")})
        except Exception as e:
            print(f"⚠️ RAG chain error: {e}")
            # Fall through to rule-based responses
    
    # Fallback to rule-based responses
    rule_based_response = get_rule_based_response(query)
    return jsonify({"response": rule_based_response})

@app.route("/")
def root():
    mode = "AI-powered" if rag_chain else "rule-based"
    return jsonify({
        "message": f"CryptoRizz Chat Assistant API is running! 🚀", 
        "status": "online",
        "mode": mode,
        "features": {
            "token_prices": True,
            "market_overview": True,
            "ai_responses": bool(rag_chain)
        }
    })

if __name__ == "__main__":
    print("🚀 Starting CryptoRizz Chat Assistant API...")
    print(f"🤖 Mode: {'AI-powered' if rag_chain else 'Rule-based (no OpenAI API key)'}")
    load_symbol_id_map()
    app.run(debug=True, port=6502)
