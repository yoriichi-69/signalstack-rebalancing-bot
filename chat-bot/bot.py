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

# Safely load environment variables without failing on encoding errors
try:
    load_dotenv()
except Exception as e:
    print(f"⚠️ Error loading .env file: {e}")
    print("ℹ️ Continuing without environment variables")

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
MOCK_DATA_MODE = os.getenv("MOCK_DATA_MODE", "false").lower() in ("true", "1", "yes")  # Can be set via env var
API_FAILED = False  # Set to True if both APIs fail, to reduce log spam

# Check if API key is available
has_openai_key = bool(os.getenv("OPENAI_API_KEY"))
has_coingecko_key = False
has_coinmarketcap_key = False

coingecko_key = os.getenv("COINGECKO_API_KEY")
coinmarketcap_key = os.getenv("COINMARKETCAP_API_KEY")

# Check if key exists and is not a placeholder/demo key
if coingecko_key and not coingecko_key.startswith(('CG-DEMO', 'your_')):
    has_coingecko_key = True

# Check if CMC key exists
if coinmarketcap_key and not coinmarketcap_key.startswith(('your_')):
    has_coinmarketcap_key = True

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
    
    # Use the CoinGecko API if we have a key, otherwise use the common symbols only
    if not has_coingecko_key and not has_coinmarketcap_key:
        print("⚠️ No CoinGecko or CoinMarketCap API keys found. Using limited coin set.")
        print("ℹ️ To enable full coin support:")
        print("   1. Create or update the .env file in the chat-bot directory")
        print("   2. Add one of the following lines:")
        print("      COINGECKO_API_KEY=your_api_key_here")
        print("      COINMARKETCAP_API_KEY=your_api_key_here")
        print("   3. Restart the chatbot server")
        return
    
    # If both APIs failed before, don't try again to reduce log spam
    global API_FAILED
    if API_FAILED:
        return

    # Try to load from CoinGecko with API key if available
    if has_coingecko_key:
        try_load_from_coingecko()
    # Try CoinMarketCap as fallback
    elif has_coinmarketcap_key:
        try_load_from_coinmarketcap()

def try_load_from_coingecko():
    """Try to load coin list from CoinGecko API"""
    global API_FAILED
    
    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        
        # Add API key to headers if available
        if has_coingecko_key:
            headers['x-cg-pro-api-key'] = coingecko_key
            base_url = "https://pro-api.coingecko.com/api/v3"
            print(f"✅ Using CoinGecko Pro API with authenticated key")
        else:
            base_url = "https://api.coingecko.com/api/v3"
            if coingecko_key:
                print(f"⚠️ CoinGecko API key appears to be a demo/placeholder key and will be ignored")
        
        res = requests.get(
            f"{base_url}/coins/list",
            headers=headers,
            timeout=10
        )
        if res.status_code == 200:
            coins = res.json()
            for coin in coins:
                symbol = coin["symbol"].upper()
                if symbol not in symbol_id_map:
                    symbol_id_map[symbol] = []
                symbol_id_map[symbol].append(coin["id"])
            print(f"✅ Loaded {len(coins)} coins from CoinGecko")
        elif res.status_code == 429:
            print(f"⚠️ CoinGecko API rate limit exceeded (429)")
            print("ℹ️ Consider getting a CoinGecko API key or waiting before retrying")
            API_FAILED = True
        elif res.status_code == 401 or res.status_code == 403:
            print(f"⚠️ CoinGecko API error: {res.status_code} - Authentication failed")
            # Try CoinMarketCap as fallback
            if has_coinmarketcap_key:
                print(f"ℹ️ Falling back to CoinMarketCap")
                try_load_from_coinmarketcap()
            API_FAILED = True
        else:
            print(f"⚠️ CoinGecko API returned status code {res.status_code}")
            API_FAILED = True
            # Try CoinMarketCap as fallback
            if has_coinmarketcap_key:
                print(f"ℹ️ Falling back to CoinMarketCap")
                try_load_from_coinmarketcap()
    except Exception as e:
        print(f"⚠️ Failed to load coin list from CoinGecko: {e}")
        API_FAILED = True
        # Try CoinMarketCap as fallback
        if has_coinmarketcap_key:
            print(f"ℹ️ Falling back to CoinMarketCap")
            try_load_from_coinmarketcap()

def try_load_from_coinmarketcap():
    """Try to load coin list from CoinMarketCap API"""
    global API_FAILED
    
    try:
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        headers = {
            'X-CMC_PRO_API_KEY': coinmarketcap_key,
            'Accept': 'application/json'
        }
        
        res = requests.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map",
            headers=headers,
            timeout=10
        )
        
        if res.status_code == 200:
            data = res.json()
            if 'data' in data:
                coins = data['data']
                for coin in coins:
                    symbol = coin["symbol"].upper()
                    if symbol not in symbol_id_map:
                        symbol_id_map[symbol] = []
                    symbol_id_map[symbol].append(str(coin["id"]))
                print(f"✅ Loaded {len(coins)} coins from CoinMarketCap")
            else:
                print("⚠️ Invalid response format from CoinMarketCap")
                API_FAILED = True
        elif res.status_code == 429:
            print(f"⚠️ CoinMarketCap API rate limit exceeded (429)")
            API_FAILED = True
        elif res.status_code == 401 or res.status_code == 403:
            print(f"⚠️ CoinMarketCap API error: {res.status_code} - Authentication failed")
            API_FAILED = True
        else:
            print(f"⚠️ CoinMarketCap API returned status code {res.status_code}")
            API_FAILED = True
    except Exception as e:
        print(f"⚠️ Failed to load coin list from CoinMarketCap: {e}")
        API_FAILED = True

def fetch_token_data(symbol):
    """Fetch token data with enhanced error handling and fallbacks"""
    global token_price_cache, API_FAILED, symbol_id_map
    symbol_upper = symbol.upper()
    
    # Check cache first
    now = time.time()
    cache_key = f"TOKEN_{symbol_upper}"
    if cache_key in token_price_cache:
        cached_data = token_price_cache[cache_key]
        if now - cached_data['timestamp'] < CACHE_EXPIRY:
            print(f"✅ Using cached data for {symbol_upper}")
            return cached_data['data']
    
    # If we're in mock mode or API failed, return mock data
    if MOCK_DATA_MODE or API_FAILED:
        return get_mock_token_data(symbol_upper)
    
    try:
        # Use the preloaded symbol_id_map if available
        coin_id = None
        if symbol_upper in symbol_id_map:
            coin_ids = symbol_id_map[symbol_upper]
            if len(coin_ids) == 1:
                coin_id = coin_ids[0]
            else:
                # Multiple matches, need to disambiguate
                coin_id = disambiguate_by_market_cap(coin_ids)
        
        # If not found in map, try API search
        if not coin_id:
            coin_id = search_coin_by_symbol(symbol_upper)
        
        if not coin_id:
            return {"error": f"No coin found for symbol '{symbol_upper}'"}

        # Fetch detailed data with proper error handling
        result = fetch_coin_details(coin_id, symbol_upper)
        
        # Cache successful result
        if "error" not in result:
            token_price_cache[cache_key] = {
                'data': result,
                'timestamp': now
            }
        
        return result

    except Exception as e:
        print(f"⚠️ Error fetching token data for {symbol_upper}: {e}")
        return get_mock_token_data(symbol_upper)

def get_mock_token_data(symbol):
    """Return mock token data when APIs are unavailable"""
    mock_data = {
        "BTC": {"name": "Bitcoin", "symbol": "BTC", "price": 104890.85, "market_cap": 2065000000000, "id": "bitcoin"},
        "ETH": {"name": "Ethereum", "symbol": "ETH", "price": 3128.45, "market_cap": 376000000000, "id": "ethereum"},
        "DOGE": {"name": "Dogecoin", "symbol": "DOGE", "price": 0.185, "market_cap": 27000000000, "id": "dogecoin"},
        "ADA": {"name": "Cardano", "symbol": "ADA", "price": 0.48, "market_cap": 16800000000, "id": "cardano"},
        "DOT": {"name": "Polkadot", "symbol": "DOT", "price": 7.65, "market_cap": 8500000000, "id": "polkadot"},
        "SOL": {"name": "Solana", "symbol": "SOL", "price": 152.25, "market_cap": 42000000000, "id": "solana"},
        "XRP": {"name": "XRP", "symbol": "XRP", "price": 2.18, "market_cap": 123000000000, "id": "ripple"},
        "USDT": {"name": "Tether", "symbol": "USDT", "price": 1.00, "market_cap": 120000000000, "id": "tether"},
        "USDC": {"name": "USD Coin", "symbol": "USDC", "price": 1.00, "market_cap": 55000000000, "id": "usd-coin"},
        "BNB": {"name": "BNB", "symbol": "BNB", "price": 647.21, "market_cap": 94000000000, "id": "binancecoin"},
        "LINK": {"name": "Chainlink", "symbol": "LINK", "price": 28.45, "market_cap": 18000000000, "id": "chainlink"},
        "MATIC": {"name": "Polygon", "symbol": "MATIC", "price": 0.85, "market_cap": 8000000000, "id": "matic-network"},
        "AVAX": {"name": "Avalanche", "symbol": "AVAX", "price": 42.15, "market_cap": 16500000000, "id": "avalanche-2"},
    }
    
    if symbol in mock_data:
        return mock_data[symbol]
    else:
        return {
            "name": f"{symbol} Token",
            "symbol": symbol,
            "price": 1.00,
            "market_cap": 1000000000,
            "id": symbol.lower()
        }

def get_crypto_recommendations():
    """Provide personalized crypto recommendations based on market conditions"""
    return """### 💡 Current Crypto Recommendations

**🚀 Large Cap (Lower Risk)**
- **Bitcoin (BTC)**: Digital gold, store of value
- **Ethereum (ETH)**: Smart contract platform leader

**⭐ Mid Cap (Medium Risk)**  
- **Solana (SOL)**: High-speed blockchain for DeFi/NFTs
- **Cardano (ADA)**: Academic approach to blockchain
- **Polkadot (DOT)**: Interoperability-focused network

**🔥 Emerging (Higher Risk)**
- **Chainlink (LINK)**: Oracle network for smart contracts
- **Polygon (MATIC)**: Ethereum scaling solution
- **Avalanche (AVAX)**: Fast, low-cost smart contracts

**⚠️ Risk Management Tips:**
- Never invest more than you can afford to lose
- Diversify across different market caps and use cases
- Dollar-cost average for long-term positions
- Keep 10-20% in stablecoins for opportunities

**📊 Current Market Sentiment:** Cautiously optimistic
*Always do your own research (DYOR) before investing!*"""

def get_trading_signals_explanation():
    """Explain trading signals in detail"""
    return """### 📊 Trading Signals Explained

**🎯 What Are Trading Signals?**
Trading signals are indicators that suggest potential buy/sell opportunities based on technical analysis and market data.

**📈 Signal Types in CryptoRizz:**

**1. Momentum Signals**
- **RSI (Relative Strength Index)**: Overbought/oversold conditions
- **MACD**: Trend changes and momentum shifts
- **Stochastic**: Short-term price momentum

**2. Trend Signals**
- **Moving Averages**: Price direction over time
- **Bollinger Bands**: Volatility and price extremes
- **Ichimoku Cloud**: Comprehensive trend analysis

**3. Volume Signals**
- **Volume Profile**: Price levels with high trading activity
- **OBV (On-Balance Volume)**: Money flow analysis

**🤖 How CryptoRizz Uses Signals:**
1. **Signal Generation**: Multiple indicators analyzed simultaneously
2. **Confidence Scoring**: Each signal rated 1-10 for reliability
3. **Risk Assessment**: Position sizing based on signal strength
4. **Automated Execution**: Bots can act on high-confidence signals

**⚡ Signal Strengths:**
- **🟢 Strong Buy**: 8-10 confidence, multiple confirmations
- **🟡 Moderate**: 5-7 confidence, some conflicting signals
- **🔴 Weak**: 1-4 confidence, uncertain market conditions

**💡 Pro Tips:**
- Never rely on a single signal
- Combine with fundamental analysis
- Consider market conditions and news
- Practice with small amounts first

Check the **Signals** tab for live market analysis!"""

def search_coin_by_symbol(symbol):
    """Search for coin ID by symbol using API"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        if has_coingecko_key:
            headers['x-cg-pro-api-key'] = coingecko_key
            base_url = "https://pro-api.coingecko.com/api/v3"
        else:
            base_url = "https://api.coingecko.com/api/v3"
        
        response = requests.get(f"{base_url}/coins/list", headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"⚠️ CoinGecko API error: {response.status_code}")
            return None
            
        coins_list = response.json()
        if not isinstance(coins_list, list):
            print(f"⚠️ Unexpected response format from CoinGecko")
            return None
            
        matching = [coin for coin in coins_list if coin.get('symbol', '').lower() == symbol.lower()]
        
        if not matching:
            return None
        elif len(matching) == 1:
            return matching[0]['id']
        else:
            # Multiple matches, disambiguate by market cap
            coin_ids = [coin['id'] for coin in matching]
            return disambiguate_by_market_cap(coin_ids)
            
    except Exception as e:
        print(f"⚠️ Error searching for coin {symbol}: {e}")
        return None

def disambiguate_by_market_cap(coin_ids):
    """Choose coin with highest market cap from multiple matches"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        if has_coingecko_key:
            headers['x-cg-pro-api-key'] = coingecko_key
            base_url = "https://pro-api.coingecko.com/api/v3"
        else:
            base_url = "https://api.coingecko.com/api/v3"
        
        response = requests.get(
            f"{base_url}/coins/markets",
            params={"vs_currency": "usd", "ids": ",".join(coin_ids[:10])},  # Limit to 10 to avoid rate limits
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"⚠️ Market data API error: {response.status_code}")
            return coin_ids[0] if coin_ids else None
            
        market_data = response.json()
        if not isinstance(market_data, list) or not market_data:
            return coin_ids[0] if coin_ids else None
            
        # Sort by market cap and return highest
        market_data.sort(key=lambda x: x.get("market_cap") or 0, reverse=True)
        return market_data[0]["id"]
        
    except Exception as e:
        print(f"⚠️ Error disambiguating coins: {e}")
        return coin_ids[0] if coin_ids else None

def fetch_coin_details(coin_id, symbol):
    """Fetch detailed coin data from API"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        if has_coingecko_key:
            headers['x-cg-pro-api-key'] = coingecko_key
            base_url = "https://pro-api.coingecko.com/api/v3"
        else:
            base_url = "https://api.coingecko.com/api/v3"
        
        response = requests.get(f"{base_url}/coins/{coin_id}", headers=headers, timeout=10)
        
        if response.status_code == 429:
            print(f"⚠️ Rate limit exceeded, using mock data")
            return get_mock_token_data(symbol)
        elif response.status_code != 200:
            print(f"⚠️ API error {response.status_code}, using mock data")
            return get_mock_token_data(symbol)
        
        data = response.json()
        
        if not isinstance(data, dict):
            print(f"⚠️ Invalid response format, using mock data")
            return get_mock_token_data(symbol)
        
        # Validate required fields
        if "name" not in data or "market_data" not in data:
            print(f"⚠️ Missing required fields, using mock data")
            return get_mock_token_data(symbol)
        
        market_data = data.get("market_data", {})
        if not isinstance(market_data, dict):
            print(f"⚠️ Invalid market_data format, using mock data")
            return get_mock_token_data(symbol)
        
        current_price = market_data.get("current_price", {})
        market_cap = market_data.get("market_cap", {})
        
        if not isinstance(current_price, dict) or not isinstance(market_cap, dict):
            print(f"⚠️ Invalid price data format, using mock data")
            return get_mock_token_data(symbol)
        
        price = current_price.get("usd", 0)
        mcap = market_cap.get("usd", 0)
        
        return {
            "name": data.get("name", symbol),
            "symbol": data.get("symbol", symbol).upper(),
            "price": price,
            "market_cap": mcap,
            "id": coin_id
        }
        
    except Exception as e:
        print(f"⚠️ Error fetching coin details for {coin_id}: {e}")
        return get_mock_token_data(symbol)

def get_market_overview():
    """Fetch global market data overview"""
    # Check if we have recent market data in cache
    global token_price_cache
    now = time.time()
    
    if "GLOBAL_MARKET" in token_price_cache:
        cached_data = token_price_cache["GLOBAL_MARKET"]
        if now - cached_data['timestamp'] < CACHE_EXPIRY:
            print(f"✅ Using cached market data")
            return cached_data['data']
    
    # Return mock data if no API key or to avoid rate limits
    mock_data = {
        "total_market_cap_usd": 2157483647000,
        "total_volume_usd": 98765432100,
        "market_cap_change_percentage_24h": 1.23,
        "active_cryptocurrencies": 8942,
        "markets": 673
    }
    
    # Cache the mock result
    token_price_cache["GLOBAL_MARKET"] = {
        'data': mock_data,
        'timestamp': now
    }
    
    # If we don't have an API key, just return mock data
    if not has_coingecko_key and has_coinmarketcap_key:
        try:
            return get_coinmarketcap_market_overview()
        except Exception as e:
            print(f"⚠️ CoinMarketCap market overview API failed: {e}")
    
    # Return mock data in all other cases
    return get_mock_market_overview()

def get_mock_market_overview():
    """Get mock market overview data"""
    global token_price_cache
    now = time.time()
    
    mock_data = {
        "total_market_cap_usd": 2157483647000,
        "total_volume_usd": 98765432100,
        "market_cap_change_percentage_24h": 1.23,
        "active_cryptocurrencies": 8942,
        "markets": 673
    }
    
    # Cache the mock result
    token_price_cache["GLOBAL_MARKET"] = {
        'data': mock_data,
        'timestamp': now
    }
    
    return mock_data

def get_coinmarketcap_market_overview():
    """Get market overview from CoinMarketCap"""
    headers = {
        'X-CMC_PRO_API_KEY': coinmarketcap_key,
        'Accept': 'application/json'
    }
    
    global_url = "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest"
    
    resp = requests.get(
        global_url,
        headers=headers,
        timeout=10
    )
    
    if resp.status_code != 200:
        raise Exception(f"CoinMarketCap API returned status code {resp.status_code}")
    
    data = resp.json()
    quote = data['data']['quote']['USD']
    
    result = {
        "total_market_cap_usd": quote['total_market_cap'],
        "total_volume_usd": quote['total_volume_24h'],
        "market_cap_change_percentage_24h": quote['total_market_cap_yesterday_percentage_change'],
        "active_cryptocurrencies": data['data']['active_cryptocurrencies'],
        "markets": data['data']['active_exchanges']
    }
    
    # Cache the result
    token_price_cache["GLOBAL_MARKET"] = {
        'data': result,
        'timestamp': time.time()
    }
    
    return result

def format_token_response(token_data):
    """Format token data response in a nice markdown format"""
    if "error" in token_data:
        return f"❌ {token_data['error']}"
    
    # Format price with appropriate decimals
    price = token_data.get('price', 0)
    if price < 0.01:
        price_str = f"${price:.6f}"
    elif price < 1:
        price_str = f"${price:.4f}"
    else:
        price_str = f"${price:,.2f}"
    
    # Handle optional fields gracefully
    name = token_data.get('name', 'Unknown Token')
    symbol = token_data.get('symbol', 'N/A')
    market_cap = token_data.get('market_cap', 0)
    volume_24h = token_data.get('volume_24h', 0)
    price_change_24h = token_data.get('price_change_24h')
    low_24h = token_data.get('low_24h', 0)
    high_24h = token_data.get('high_24h', 0)
    
    # Format price change with color indicator
    if price_change_24h is not None:
        if price_change_24h > 0:
            change_str = f"🟢 +{price_change_24h:.2f}%"
        else:
            change_str = f"🔴 {price_change_24h:.2f}%"
    else:
        change_str = "N/A"
    
    response = f"""### {name} ({symbol})

**Current Price**: {price_str}
**24h Change**: {change_str}"""

    # Add optional fields if available
    if low_24h > 0 and high_24h > 0:
        response += f"\n**24h Range**: ${low_24h:,.2f} - ${high_24h:,.2f}"
    
    if market_cap > 0:
        response += f"\n**Market Cap**: ${market_cap:,.0f}"
    
    if volume_24h > 0:
        response += f"\n**24h Volume**: ${volume_24h:,.0f}"
    
    response += "\n\n*Data from CoinGecko API*"
    
    return response

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
    
    # Check for cryptocurrency price queries
    if ("price" in query_lower or "cost" in query_lower) and any(crypto in query_lower for crypto in ["bitcoin", "btc", "ethereum", "eth", "dogecoin", "doge", "ada", "cardano", "polkadot", "dot", "solana", "sol"]):
        return """### Cryptocurrency Prices

I can help you get real-time cryptocurrency prices! Use the format **$SYMBOL** to get price information.

**Examples:**
- `$BTC` for Bitcoin price
- `$ETH` for Ethereum price  
- `$DOGE` for Dogecoin price
- `$ADA` for Cardano price

**Current approximate prices:**
- Bitcoin (BTC): ~$104,890
- Ethereum (ETH): ~$3,128
- Dogecoin (DOGE): ~$0.185
- Cardano (ADA): ~$0.48

Try asking: "What is the price of $BTC?" or just "$ETH" for quick results!
"""
    
    if "rebalancing" in query_lower:
        return """### Portfolio Rebalancing

Portfolio rebalancing is the process of realigning the assets in your portfolio to maintain your desired asset allocation.

**In CryptoRizz, you can:**
- Set target allocations for different cryptocurrencies
- Choose from predefined strategies or create your own
- Automate rebalancing using our trading bots
- Monitor performance in real-time

**Benefits include:**
✅ Risk management
✅ Systematic profit-taking
✅ Avoiding emotional trading decisions
✅ Maintaining optimal asset allocation

Visit the **Bots** tab to deploy automated rebalancing strategies.
"""
    
    if "signal" in query_lower or "indicator" in query_lower:
        return """### Trading Signals & Indicators

CryptoRizz provides advanced trading signals derived from multiple technical indicators:

**📊 Momentum Indicators:**
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence) 
- Stochastic Oscillator

**📈 Trend Indicators:**
- Moving Averages (SMA, EMA)
- Bollinger Bands
- Ichimoku Cloud

**📉 Volume Indicators:**
- OBV (On-Balance Volume)
- Volume Profile
- Money Flow Index

Each signal is rated on a scale and can trigger automated trading actions when combined with bots.

Check the **Signals** tab to see current recommendations for your portfolio.
"""
    
    if "bot" in query_lower or "strategy" in query_lower:
        return """### CryptoRizz Trading Bots

Our intelligent trading bots automate your investment strategy:

**🤖 Available Strategies:**
1. **Signal-based**: Acts on multiple technical indicators
2. **Trend-following**: Captures longer-term market movements  
3. **Mean-reversion**: Buys dips and sells rallies
4. **Custom strategies**: Create your own trading logic

**✨ Features:**
- Deploy multiple bots with different strategies
- Real-time performance tracking
- Risk management controls
- Automated execution

**Getting Started:**
1. Go to the **Bots** tab
2. Choose a strategy and risk level
3. Set your investment amount
4. Deploy and monitor your bot

Your bots will trade 24/7 based on market conditions and signals.
"""
    
    if "get started" in query_lower or "beginner" in query_lower:
        return """### Getting Started with CryptoRizz

Welcome to intelligent crypto trading! Here's your step-by-step guide:

**🚀 Quick Start:**
1. **Learn the basics**: Understand how cryptocurrencies work
2. **Start small**: Begin with a small portion of your investment funds
3. **Diversify**: Don't put all your funds in one cryptocurrency
4. **Use CryptoRizz tools**: Explore our signals and automated strategies
5. **Monitor regularly**: Check your portfolio performance daily

**📱 Key Features to Explore:**
- **Dashboard**: Overview of your portfolio and performance
- **Signals**: Real-time trading recommendations
- **Bots**: Automated trading strategies
- **Market**: Live price data and analysis

**💡 Pro Tips:**
- Start with conservative strategies
- Always do your own research (DYOR)
- Never invest more than you can afford to lose
- Use dollar-cost averaging for long-term investments

CryptoRizz makes it easy with our intuitive dashboard and automated tools!
"""
    
    if "portfolio" in query_lower and ("diversification" in query_lower or "diversify" in query_lower):
        return """### Crypto Portfolio Diversification

Diversification reduces risk by spreading investments across multiple assets:

**📊 Recommended Allocation:**
- **Large-cap coins**: BTC, ETH (50-60% of portfolio)
- **Mid-cap coins**: ADA, SOL, DOT (20-30%)
- **Small-cap coins**: Newer projects with potential (10-20%)
- **Stablecoins**: Reserve for buying opportunities (10-15%)

**🎯 Diversification Strategies:**
1. **By Market Cap**: Mix large, mid, and small-cap tokens
2. **By Sector**: DeFi, Layer 1s, Gaming, NFTs, etc.
3. **By Use Case**: Store of value, smart contracts, payments
4. **Geographic**: Consider global vs regional projects

**⚖️ Risk Management:**
- Never put more than 5% in any single small-cap token
- Rebalance quarterly to maintain target allocations
- Consider correlation between assets

CryptoRizz helps you maintain optimal allocation with our rebalancing tools and pre-set diversification strategies.
"""

    if "defi" in query_lower or "staking" in query_lower:
        return """### DeFi & Staking Explained

**🏦 DeFi (Decentralized Finance)** refers to financial services operating on blockchain without centralized intermediaries.

**🔒 Staking** involves locking up cryptocurrency to support network operations in exchange for rewards.

**💰 Key Benefits:**
- Earn passive income (typically 5-15% APY)
- Support blockchain network security
- No traditional banking intermediaries
- 24/7 global access

**📝 Staking Options:**
- **Native Staking**: Direct validation on PoS networks
- **Liquid Staking**: Keep liquidity while earning rewards
- **Yield Farming**: Provide liquidity to DeFi protocols
- **Lending**: Lend crypto for interest

**🪙 Popular Staking Cryptocurrencies:**
- Ethereum 2.0 (ETH): ~4-6% APY
- Solana (SOL): ~6-8% APY  
- Cardano (ADA): ~4-5% APY
- Polkadot (DOT): ~10-12% APY

**⚠️ Risks to Consider:**
- Smart contract risks
- Impermanent loss (for liquidity providing)
- Lock-up periods
- Protocol governance changes

Always research protocols thoroughly before staking!
"""

    if "wallet" in query_lower or "secure" in query_lower or "security" in query_lower:
        return """### Crypto Security Best Practices

Protect your crypto assets with these essential security measures:

**🔐 Wallet Security:**
1. **Use hardware wallets** for long-term storage (Ledger, Trezor)
2. **Enable 2FA** on all exchanges and platforms
3. **Use unique passwords** for each service
4. **Backup your seed phrases** offline in multiple locations
5. **Be wary of phishing** attempts and fake websites
6. **Update software** regularly

**🛡️ CryptoRizz Security:**
- Industry-standard encryption
- Secure API connections
- Regular security audits
- No storage of private keys
- Real-time monitoring

**🚨 Red Flags to Avoid:**
- Requests for seed phrases or private keys
- Unrealistic returns or "guaranteed profits"
- Pressure to invest quickly
- Unverified or suspicious URLs
- Social media "giveaways"

**📱 Additional Tips:**
- Use separate devices for crypto activities
- Keep software updated
- Verify URLs before entering credentials
- Never share private information
- Use official apps only

Your security is our priority at CryptoRizz!
"""

    if "api key" in query_lower or "openai" in query_lower:
        return """### Setting Up Your OpenAI API Key

To enable AI-powered responses in the chatbot:

**🔧 Setup Steps:**
1. Sign up for an API key at [OpenAI's website](https://platform.openai.com)
2. Create a file named `.env` in the chat-bot directory
3. Add this line to the file: `OPENAI_API_KEY=your_api_key_here`
4. Restart the chatbot server

**💡 Benefits of AI Mode:**
- More detailed technical analysis
- Advanced portfolio recommendations  
- Complex market analysis
- Natural conversation flow
- Custom research assistance

**💰 Cost Considerations:**
- OpenAI charges per API call
- Typical costs: $0.01-0.10 per conversation
- Set usage limits in your OpenAI dashboard

Without an API key, I'll continue to provide helpful rule-based responses about crypto trading, signals, and portfolio management.
"""

    if "help" in query_lower or "support" in query_lower:
        return """### How Can I Help You?

I'm your CryptoRizz AI assistant! Here's what I can help you with:

**💰 Price Information:**
- Real-time crypto prices (use $SYMBOL format like $BTC)
- Market cap and volume data
- Price change analysis

**📊 Trading & Analysis:**
- Trading strategies and signals explanation
- Technical indicator guidance
- Portfolio management tips
- Risk assessment advice

**🤖 Bot Configuration:**
- Automated trading strategies
- Bot setup and optimization
- Performance monitoring tips

**🔒 Security & Best Practices:**
- Wallet security recommendations
- DeFi safety guidelines
- Platform security features

**📚 Education:**
- Cryptocurrency basics
- DeFi and staking explanation
- Market analysis fundamentals

**🛠️ Platform Features:**
- CryptoRizz feature explanations
- Navigation assistance
- Troubleshooting help

**Quick Examples:**
- "What is the price of $BTC?"
- "Explain portfolio rebalancing"
- "How do trading signals work?"
- "Best security practices for crypto"

What would you like to know about crypto trading today?
"""

    # Check for market-related queries
    if any(term in query_lower for term in ["market", "overview", "global", "total cap", "volume"]):
        return """### Crypto Market Analysis

I can provide global cryptocurrency market insights!

**📊 Market Metrics I Track:**
- Total market capitalization
- 24-hour trading volume
- Market cap changes
- Active cryptocurrencies count
- Market sentiment indicators

**📈 Current Market Highlights:**
- Total Crypto Market Cap: ~$2.1 Trillion
- 24h Volume: ~$98.7 Billion
- Active Cryptocurrencies: 8,900+
- Bitcoin Dominance: ~48-52%

**🔍 Try These Queries:**
- "crypto market overview"
- "global market stats" 
- "market cap analysis"

**💡 Market Analysis Tips:**
- Watch Bitcoin dominance for market sentiment
- High volume often indicates strong price movements
- Market cap changes show overall crypto adoption
- Compare current metrics to historical data

Ask about specific market data and I'll provide detailed analysis!
"""

    # Generic response for unmatched queries
    return """### I'm Your CryptoRizz Assistant! 🚀

I can help with:

**💰 Cryptocurrency Prices**
- Use **$SYMBOL** format (like $BTC, $ETH, $DOGE)
- Real-time price data and market stats

**📊 Trading & Strategies**
- Portfolio rebalancing guidance
- Trading signals and technical indicators
- Risk management strategies

**🤖 Automated Trading Bots**
- Bot configuration and strategies
- Performance monitoring
- Automated rebalancing

**🔒 Security & Best Practices**
- Wallet security recommendations
- DeFi safety guidelines

**📚 Crypto Education**
- Beginner guides and explanations
- Market analysis fundamentals
- Platform feature tutorials

**Quick Examples:**
• "What is the price of $BTC?"
• "Explain portfolio rebalancing"
• "How do I deploy a trading bot?"
• "Best crypto security practices"

What would you like to know about crypto trading today?
"""

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    """Enhanced chat endpoint with better error handling and response formatting"""
    # Handle preflight requests (keep for frontend integration)
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"response": "⚠️ No data provided in request"}), 400
            
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"response": "⚠️ Please provide a query"}), 400

        print(f"📩 Received query: {query}")

        # Check for cryptocurrency price queries (e.g., $BTC, $ETH)
        if "$" in query:
            match = re.search(r"\$([A-Za-z0-9]+)", query)
            if match:
                token = match.group(1).upper()
                print(f"💰 Fetching price data for {token}")
                token_data = fetch_token_data(token)
                
                # Handle API errors gracefully
                if "error" in token_data:
                    return jsonify({"response": f"❌ {token_data['error']}\n\nTry asking about Bitcoin with **$BTC** or Ethereum with **$ETH**"})
                
                # Format the response nicely
                price_str = f"${token_data['price']:,.6f}" if token_data['price'] < 0.01 else f"${token_data['price']:,.2f}"
                mcap_str = f"${token_data['market_cap']:,.0f}" if token_data['market_cap'] > 0 else "N/A"
                
                response_text = f"""💰 **{token_data['name']} ({token_data['symbol']})**

**Current Price:** {price_str}
**Market Cap:** {mcap_str}
**CoinGecko ID:** {token_data['id']}

*Data from CoinGecko API - Use $SYMBOL format for other coins (e.g., $ETH, $DOGE)*"""
                
                return jsonify({"response": response_text})

        # Check for market overview requests
        if re.search(r"market\s+overview|crypto\s+market|global\s+market|market\s+cap", query.lower()):
            print("📊 Fetching market overview data")
            market_data = get_market_overview()
            return jsonify({"response": format_market_response(market_data)})
        
        # If RAG capabilities are available, use them for complex queries
        if rag_chain:
            try:
                print("🤖 Using AI-powered response")
                answer = rag_chain.invoke({"query": query})
                ai_response = answer.get("result", "No answer available.")
                
                # Add helpful context to AI responses
                if len(ai_response.strip()) < 50:  # Very short response, add context
                    ai_response += "\n\n💡 *For crypto prices, use $SYMBOL format (e.g., $BTC). For trading help, ask about bots, signals, or portfolio management.*"
                
                return jsonify({"response": ai_response})
            except Exception as e:
                print(f"⚠️ RAG chain error: {e}")
                # Fall through to rule-based responses
        
        # Fallback to enhanced rule-based responses
        print("📝 Using rule-based response")
        rule_based_response = get_rule_based_response(query)
        return jsonify({"response": rule_based_response})
        
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        error_response = """⚠️ I encountered an error processing your request.

**Quick Help:**
- For crypto prices: Use **$BTC**, **$ETH**, **$DOGE** format
- For trading help: Ask about "portfolio rebalancing" or "trading bots"
- For security: Ask about "crypto security best practices"

Please try again with a different query!"""
        
        return jsonify({"response": error_response}), 500

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
    
    if has_coingecko_key:
        print(f"💰 CoinGecko API: Using Pro API with key")
    elif coingecko_key:
        print(f"💰 CoinGecko API: Found key but appears to be a demo/placeholder (using public API)")
    else:
        print(f"💰 CoinGecko API: Not configured")
        
    if has_coinmarketcap_key:
        print(f"💰 CoinMarketCap API: Using API with key")
    else:
        print(f"💰 CoinMarketCap API: Not configured")
        
    if not has_coingecko_key and not has_coinmarketcap_key:
        print(f"⚠️ No cryptocurrency API keys available. Using mock data only.")
        MOCK_DATA_MODE = True
        
    load_symbol_id_map()
    app.run(debug=True, port=6502)
