import requests
import json
import time
import sys

def test_chatbot_api():
    """Test the chatbot API with different queries"""
    base_url = "http://localhost:6502"
    
    # Test 0: Check if server is running
    print("\n🔍 Checking if chatbot server is running...")
    try:
        resp = requests.get(f"{base_url}/")
        if resp.status_code == 200:
            print("✅ Server is running!")
            print(f"   Mode: {resp.json().get('mode', 'Unknown')}")
            print(f"   Features: {', '.join(k for k, v in resp.json().get('features', {}).items() if v)}")
        else:
            print(f"❌ Server returned unexpected status code: {resp.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Failed to connect to server. Is it running?")
        print("   Try running 'start_fixed.bat' or 'python bot.py'")
        sys.exit(1)
    
    # Test 1: Check system status
    print("\n📊 Testing system status...")
    try:
        resp = requests.post(
            f"{base_url}/chat",
            json={"query": "status"}
        )
        
        if resp.status_code == 200:
            print("✅ Status check successful")
            print(resp.json()["response"])
        else:
            print(f"❌ Failed with status code {resp.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Query Bitcoin price
    print("\n💰 Testing Bitcoin price query...")
    try:
        resp = requests.post(
            f"{base_url}/chat",
            json={"query": "What is the price of $BTC?"}
        )
        
        if resp.status_code == 200:
            print("✅ Bitcoin price query successful")
            print(resp.json()["response"])
        else:
            print(f"❌ Failed with status code {resp.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Market overview
    print("\n📈 Testing market overview...")
    try:
        resp = requests.post(
            f"{base_url}/chat",
            json={"query": "Show me the market overview"}
        )
        
        if resp.status_code == 200:
            print("✅ Market overview query successful")
            print(resp.json()["response"])
        else:
            print(f"❌ Failed with status code {resp.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: General question
    print("\n❓ Testing general question...")
    try:
        resp = requests.post(
            f"{base_url}/chat",
            json={"query": "What are rebalancing strategies?"}
        )
        
        if resp.status_code == 200:
            print("✅ General question query successful")
            print(resp.json()["response"])
        else:
            print(f"❌ Failed with status code {resp.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🤖 Testing CryptoRizz Chatbot API...")
    print("   Giving server time to start...")
    time.sleep(3)  # Give server time to start if needed
    test_chatbot_api() 