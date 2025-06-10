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
    """Enhanced token data fetcher with multiple API sources and caching"""
    global token_price_cache, API_FAILED
    
    now = time.time()
    
    # Check cache first
    if symbol.upper() in token_price_cache:
        cached_data = token_price_cache[symbol.upper()]
        if now - cached_data['timestamp'] < CACHE_EXPIRY:
            print(f"✅ Using cached data for {symbol}")
            return cached_data['data']
    
    # Use mock data if we're in mock mode or both APIs failed previously
    if MOCK_DATA_MODE or API_FAILED:
        return get_mock_token_data(symbol)

    # Try CoinGecko first if we have a key
    if has_coingecko_key:
        try:
            result = fetch_from_coingecko(symbol)
            if 'error' not in result:
                return result
            # If there's an error, try CoinMarketCap next
        except Exception as e:
            print(f"⚠️ CoinGecko API failed: {e}")
            # Let's continue to CoinMarketCap
    
    # Try CoinMarketCap if we have a key
    if has_coinmarketcap_key:
        try:
            result = fetch_from_coinmarketcap(symbol)
            if 'error' not in result:
                return result
        except Exception as e:
            print(f"⚠️ CoinMarketCap API failed: {e}")
    
    # If all APIs failed, use mock data
    API_FAILED = True
    return get_mock_token_data(symbol)

def get_mock_token_data(symbol):
    """Get mock data for a token"""
    global token_price_cache
    now = time.time()
    
    symbol = symbol.upper()
    
    # Mock data for common coins
    mock_data = {
        "BTC": {
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
        },
        "ETH": {
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
        },
        "USDT": {
            "name": "Tether",
            "symbol": "USDT",
            "price": 1.00,
            "market_cap": 83591234567,
            "volume_24h": 62987654321,
            "price_change_24h": 0.01,
            "high_24h": 1.002,
            "low_24h": 0.998,
            "id": "tether",
            "image": "https://assets.coingecko.com/coins/images/325/small/tether.png"
        },
        "BNB": {
            "name": "BNB",
            "symbol": "BNB",
            "price": 360.25,
            "market_cap": 56789012345,
            "volume_24h": 2345678901,
            "price_change_24h": -1.25,
            "high_24h": 366.50,
            "low_24h": 358.75,
            "id": "binancecoin",
            "image": "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png"
        }
    }
    
    # Get data for the requested token, or generate generic data if not found
    if symbol in mock_data:
        result = mock_data[symbol]
    else:
        # Generate mock data for unknown tokens
        result = {
            "name": f"{symbol} Token",
            "symbol": symbol,
            "price": 0.12345 + (ord(symbol[0]) % 10) * 0.1,  # Random-ish price based on first letter
            "market_cap": 123456789 + (ord(symbol[0]) % 10) * 10000000,
            "volume_24h": 9876543 + (ord(symbol[0]) % 10) * 1000000,
            "price_change_24h": ((ord(symbol[0]) % 10) - 5) * 0.5,  # Between -2.5% and +2.5%
            "high_24h": 0.12345 + (ord(symbol[0]) % 10) * 0.1 * 1.05,
            "low_24h": 0.12345 + (ord(symbol[0]) % 10) * 0.1 * 0.95,
            "id": symbol.lower(),
            "image": "https://assets.coingecko.com/coins/images/1/small/generic.png"
        }
    
    # Cache the mock result
    token_price_cache[symbol] = {
        'data': result,
        'timestamp': now
    }
    
    return result

def fetch_from_coingecko(symbol):
    """Fetch token data from CoinGecko API"""
    # Add delay to avoid rate limiting
    time.sleep(1)
    
    # Setup headers and base URL depending on whether we have an API key
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
    }
    
    if has_coingecko_key:
        headers['x-cg-pro-api-key'] = coingecko_key
        base_url = "https://pro-api.coingecko.com/api/v3"
    else:
        base_url = "https://api.coingecko.com/api/v3"
    
    # Step 1: Fetch all coins
    coins_list_url = f"{base_url}/coins/list"
    coins_list_resp = requests.get(
        coins_list_url,
        headers=headers,
        timeout=10
    )
    
    if coins_list_resp.status_code == 429:
        print(f"⚠️ CoinGecko API error: 429 - Rate limit exceeded")
        return {"error": "CoinGecko API rate limit exceeded. Using fallback data for popular coins or try again later."}
    elif coins_list_resp.status_code == 401 or coins_list_resp.status_code == 403:
        print(f"⚠️ CoinGecko API error: {coins_list_resp.status_code} - Authentication failed")
        return {"error": "CoinGecko API authentication failed. Please check your API key."}
    elif coins_list_resp.status_code != 200:
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
            market_data_url = f"{base_url}/coins/markets"
            market_data_params = {
                "vs_currency": "usd",
                "ids": ",".join([coin['id'] for coin in matching])
            }
            market_data_resp = requests.get(
                market_data_url,
                params=market_data_params,
                headers=headers,
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
    coin_url = f"{base_url}/coins/{coin_id}"
    coin_resp = requests.get(
        coin_url,
        headers=headers,
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
        'timestamp': time.time()
    }
    
    return result

def fetch_from_coinmarketcap(symbol):
    """Fetch token data from CoinMarketCap API"""
    # Add delay to avoid rate limiting
    time.sleep(1)
    
    headers = {
        'X-CMC_PRO_API_KEY': coinmarketcap_key,
        'Accept': 'application/json'
    }
    
    # Step 1: First query to get the coin ID
    lookup_url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map"
    params = {
        "symbol": symbol
    }
    
    lookup_resp = requests.get(
        lookup_url,
        params=params,
        headers=headers,
        timeout=10
    )
    
    if lookup_resp.status_code == 429:
        print(f"⚠️ CoinMarketCap API error: 429 - Rate limit exceeded")
        return {"error": "CoinMarketCap API rate limit exceeded"}
    elif lookup_resp.status_code == 401 or lookup_resp.status_code == 403:
        print(f"⚠️ CoinMarketCap API error: {lookup_resp.status_code} - Authentication failed")
        return {"error": "CoinMarketCap API authentication failed. Please check your API key."}
    elif lookup_resp.status_code != 200:
        print(f"⚠️ CoinMarketCap API error: {lookup_resp.status_code}")
        return {"error": f"API returned status code {lookup_resp.status_code}"}
    
    lookup_data = lookup_resp.json()
    if 'data' not in lookup_data or not lookup_data['data']:
        return {"error": f"No coin found for symbol '{symbol}'"}
    
    # Sort by rank to get the most relevant one first
    sorted_coins = sorted(lookup_data['data'], key=lambda x: x.get('rank', 9999))
    coin_id = sorted_coins[0]['id']
    coin_name = sorted_coins[0]['name']
    
    # Step 2: Get the latest quotes
    quotes_url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"
    params = {
        "id": coin_id,
        "convert": "USD"
    }
    
    quotes_resp = requests.get(
        quotes_url,
        params=params,
        headers=headers,
        timeout=10
    )
    
    if quotes_resp.status_code != 200:
        print(f"⚠️ CoinMarketCap API error: {quotes_resp.status_code}")
        return {"error": f"API returned status code {quotes_resp.status_code}"}
    
    quotes_data = quotes_resp.json()
    
    if 'data' not in quotes_data:
        return {"error": "Invalid response from CoinMarketCap"}
    
    coin_data = quotes_data['data'][str(coin_id)]
    quote = coin_data['quote']['USD']
    
    # Format the response to match our standard format
    result = {
        "name": coin_name,
        "symbol": symbol.upper(),
        "price": quote['price'],
        "market_cap": quote['market_cap'],
        "volume_24h": quote['volume_24h'],
        "price_change_24h": quote['percent_change_24h'],
        "high_24h": quote['price'] * (1 + abs(quote['percent_change_24h'] / 100)),  # Approximate high
        "low_24h": quote['price'] * (1 - abs(quote['percent_change_24h'] / 100)),   # Approximate low
        "id": str(coin_id),
        "image": f"https://s2.coinmarketcap.com/static/img/coins/64x64/{coin_id}.png"  # CMC image URL format
    }
    
    # Cache the result
    token_price_cache[symbol.upper()] = {
        'data': result,
        'timestamp': time.time()
    }
    
    return result

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
    
    # Special command to check API status
    if query.lower() in ["status", "check status", "api status"]:
        status_info = {
            "openai_api": "Available" if has_openai_key else "Not configured",
            "coingecko_api": "Available (Pro)" if has_coingecko_key else 
                           ("Available (Free - Rate Limited)" if not has_coingecko_key and not coingecko_key else 
                            "Invalid/Demo key detected"),
            "mode": "AI-powered" if rag_chain else "Rule-based",
            "vector_db": "Available" if retriever else "Not available",
        }
        
        status_message = f"""### System Status

**APIs:**
- CoinGecko Data API: {status_info['coingecko_api']}
- OpenAI API: {status_info['openai_api']}

**Configuration:**
- Operating Mode: {status_info['mode']}
- Vector Database: {status_info['vector_db']}

To configure API keys, edit the `.env` file in the chat-bot directory.
"""
        return jsonify({"response": status_message})
        
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
