#!/usr/bin/env python3
"""Quick test script for the chatbot API"""

import requests
import json

def test_chatbot():
    base_url = "http://localhost:6502"
    
    # Test 1: Direct symbol query
    print("🔸 Testing: '$BTC' query...")
    try:
        response = requests.post(f"{base_url}/chat", json={"query": "$BTC"})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Success!")
            print(f"Response: {response.json()['response'][:200]}...")
        else:
            print(f"❌ Error: {response.json()}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print()
    
    # Test 2: Natural language query
    print("🔸 Testing: Natural language query...")
    try:
        response = requests.post(f"{base_url}/chat", json={"query": "What are the benefits of DeFi?"})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Success!")
            print(f"Response: {response.json()['response'][:200]}...")
        else:
            print(f"❌ Error: {response.json()}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    print()
    
    # Test 3: Market overview
    print("🔸 Testing: Market overview...")
    try:
        response = requests.post(f"{base_url}/chat", json={"query": "market overview"})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Success!")
            print(f"Response: {response.json()['response'][:200]}...")
        else:
            print(f"❌ Error: {response.json()}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_chatbot()
