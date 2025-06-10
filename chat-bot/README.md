# CryptoRizz Chat Assistant

A powerful AI-powered chat assistant for CryptoRizz, providing real-time information about cryptocurrencies, trading signals, strategies, and more.

## Features

- **Real-time cryptocurrency data**: Get current prices, market caps, and 24h changes for any token using `$SYMBOL` notation (e.g., `$BTC`, `$ETH`)
- **Market overview**: Ask about the global crypto market status
- **Trading knowledge**: Learn about portfolio rebalancing, trading signals, and bot strategies
- **AI-powered replies**: Uses RAG (Retrieval Augmented Generation) to answer complex questions about trading and Web3
- **Responsive UI**: Clean, modern interface that works on both desktop and mobile
- **Offline mode**: Works even without an OpenAI API key using rule-based responses

## Setup

### Prerequisites

- Python 3.8+
- Node.js (for the frontend)
- Internet connection (for API calls)
- OpenAI API key (optional - for enhanced AI responses)

### Installation

1. **Install Python dependencies:**

   ```bash
   pip install flask flask-cors langchain langchain_openai langchain_community langchain_huggingface requests python-dotenv
   ```

2. **Set up the OpenAI API key (optional but recommended):**

   - Create a file named `.env` in the chat-bot directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`
   - You can copy the template from `env-example.txt`
   - Without an API key, the chatbot will run in rule-based mode (still fully functional)

3. **Set up the vector database (optional):**
   If you have Web3 documentation that you'd like to include:

   ```bash
   python markdown_to_faiss.py
   ```

4. **Run the backend server:**
   ```bash
   python bot.py
   ```
   The server will start on port 6502.

## Usage

The chat assistant can be accessed in two ways:

1. **Integrated in CryptoRizz**: The chat assistant is available in the bottom right corner of both the landing page and main dashboard.

2. **Standalone Streamlit app**: You can run a standalone version using:
   ```bash
   python frontend_bot.py
   ```

## Operating Modes

The chatbot can run in two modes:

1. **Rule-based mode**: Works without an OpenAI API key

   - Provides pre-defined responses for common crypto questions
   - Still offers real-time cryptocurrency prices and market data
   - Shows a red status indicator in the UI

2. **AI-powered mode**: Requires an OpenAI API key
   - Provides dynamic AI-generated responses to any question
   - Uses RAG (Retrieval Augmented Generation) for better accuracy
   - Shows a green status indicator in the UI

## API Endpoints

### POST `/chat`

Accepts JSON with `query` parameter and returns AI response.

Example request:

```json
{
  "query": "What is the current price of $BTC?"
}
```

Example response:

```json
{
  "response": "### Bitcoin (BTC)\n\n**Current Price**: $60,123.45\n**24h Change**: 🟢 +2.34%\n**24h Range**: $59,234.56 - $61,345.67\n**Market Cap**: $1,234,567,890,000\n**24h Volume**: $45,678,912,345"
}
```

### GET `/`

Health check endpoint that confirms the API is running.

## Features and Capabilities

1. **Token Price Queries**: Use `$SYMBOL` notation (e.g., `$BTC`, `$ETH`, `$SOL`) to get current price and market data
2. **Market Overview**: Ask about "crypto market overview" or "global market"
3. **Rebalancing Information**: Ask about portfolio rebalancing strategies and benefits
4. **Trading Signals**: Ask about momentum, trend, and volume indicators
5. **Bot Strategies**: Learn about automated trading strategies in CryptoRizz
6. **Getting Started**: Ask about how to begin trading cryptocurrencies
7. **Portfolio Diversification**: Learn about balanced crypto portfolios
8. **Security Practices**: Discover how to keep your crypto assets safe

## API Key Setup

### Running Without Any API Keys

The chatbot now supports a **Mock Data Mode** which works completely offline with no API keys required:

1. Simply run the included `run_chatbot.bat` script
2. This will start the chatbot with simulated cryptocurrency data
3. Perfect for development, testing, or demo environments

### CoinMarketCap API (Recommended)

If you encounter a `CoinGecko API authentication failed` error, you can use CoinMarketCap as an alternative:

1. Sign up for a free CoinMarketCap API key at [https://coinmarketcap.com/api/](https://coinmarketcap.com/api/)
2. Create a `.env` file in the `chat-bot` directory (or edit if it exists)
3. Add your API key: `COINMARKETCAP_API_KEY=your_api_key_here`
4. Restart the chatbot server

### CoinGecko API Rate Limits

If you encounter a `429 Too Many Requests` error from the CoinGecko API, this indicates you've hit their rate limits. To resolve this:

1. **Option 1: Get a CoinGecko API Key (Alternative)**

   - Sign up for a CoinGecko Pro API key at [https://www.coingecko.com/en/api/pricing](https://www.coingecko.com/en/api/pricing)
   - Create a `.env` file in the `chat-bot` directory (or edit if it exists)
   - Add your API key: `COINGECKO_API_KEY=your_api_key_here`
   - Restart the chatbot server

2. **Option 2: Use CoinMarketCap API**

   - As described above, the system now supports CoinMarketCap as an alternative data source
   - The system will automatically fall back to this if CoinGecko fails

3. **Option 3: Use Mock Data Mode**
   - Run `run_chatbot.bat` which enables mock data mode
   - No API keys required, works completely offline

### OpenAI API Setup (For AI-Powered Responses)

To enable AI-powered responses:

1. Sign up for an API key at [OpenAI's website](https://platform.openai.com)
2. Add to your `.env` file: `OPENAI_API_KEY=your_api_key_here`
3. Restart the chatbot server

## Troubleshooting

### API authentication failed

If you see "CoinGecko API authentication failed" or "CoinMarketCap API authentication failed":

1. Check that your API key is correct in the `.env` file
2. Make sure the API key is not surrounded by quotes or extra spaces
3. Try using the other API service (both CoinGecko and CoinMarketCap are supported)
4. Use mock data mode by running `run_chatbot.bat` if you don't need real-time data

### API returned status code 429

This error means you've hit the rate limits for the API. Solutions:

1. Wait a few minutes and try again
2. Get a Pro API key as described above
3. Switch to the alternative API (CoinGecko or CoinMarketCap)
4. Use mock data mode by running `run_chatbot.bat`

## Contributing

To enhance the chatbot:

1. Add more examples to the RAG knowledge base in `web3_docs/` directory
2. Extend the rule-based responses in `bot.py` for common queries
3. Improve the UI in `ChatBot.js` and `ChatBot.css`

## Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  React UI     │────▶│  Flask API    │────▶│ CoinGecko API │
│  (ChatBot.js) │◀────│  (bot.py)     │◀────│               │
└───────────────┘     └───────┬───────┘     └───────────────┘
                             │
                      ┌──────▼──────┐     ┌───────────────┐
                      │ LangChain   │────▶│ FAISS Vector  │
                      │ RAG Chain   │◀────│ Store         │
                      └─────────────┘     └───────────────┘
```
