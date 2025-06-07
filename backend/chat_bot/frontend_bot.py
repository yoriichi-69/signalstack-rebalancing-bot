### Streamlit Frontend for Web3 RAG Chatbot
# Assumes backend is running on http://localhost:6502

import streamlit as st
import requests

port = 6502

st.set_page_config(page_title="Web3 Chatbot", layout="wide")
st.title("🤖 Web3 Chatbot")

st.markdown("""
Ask me anything about:
- Token prices (e.g. `$ETH`, `$ARB`) Use `$` sign
- Web3 concepts (DeFi, staking, L2s, Agents)
- Smart contracts, swaps, rebalancing agents 🧠
- AIML concepts (Logistic regression, AI agents)
- Token rebalancing
""")

# Chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

user_input = st.chat_input("Type your question...")

if user_input:
    st.session_state.messages.append(("user", user_input))
    
    try:
        res = requests.post(f"http://localhost:{port}/chat", json={"query": user_input})
        bot_reply = res.json().get("response", "[Error: No response]")
    except Exception as e:
        bot_reply = f"[Error connecting to backend: {e}]"

    # Format dict replies (like token data)
    if isinstance(bot_reply, dict) and "price" in bot_reply:
        formatted = f"""
        ### 💰 {bot_reply.get("name", "Token")} (`{bot_reply.get("symbol", "").upper()}`)

        - **Price**: ${bot_reply.get("price", 0):,.2f}  
        - **Market Cap**: ${bot_reply.get("market_cap", 0):,.2f}
        """
        bot_reply = formatted

    elif isinstance(bot_reply, dict):  # fallback if dict but not a token
        import json
        bot_reply = f"```json\n{json.dumps(bot_reply, indent=2)}\n```"

    st.session_state.messages.append(("bot", bot_reply))

# Display conversation
for sender, message in st.session_state.messages:
    with st.chat_message("assistant" if sender == "bot" else "user"):
        st.markdown(message, unsafe_allow_html=True)
