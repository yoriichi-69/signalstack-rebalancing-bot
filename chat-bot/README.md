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

## Troubleshooting

If you see "Offline mode - Limited functionality" in the chat interface:

1. Make sure the chatbot server is running (`python bot.py`)
2. Check if there are any error messages in the terminal
3. Ensure port 6502 is not blocked by your firewall
4. For AI-powered responses, verify your OpenAI API key in the `.env` file

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
