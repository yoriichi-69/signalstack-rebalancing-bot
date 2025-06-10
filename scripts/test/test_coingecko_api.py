#!/usr/bin/env python3
"""
Test the CoinGecko API directly to see if it's working
"""

import requests
import json

def test_coingecko_api():
    """Test if CoinGecko API is responding correctly"""
    print("=== TESTING COINGECKO API ===")
    
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin,ethereum,cardano,polkadot,usd-coin",
            "vs_currencies": "usd"
        }
        
        print(f"Requesting: {url}")
        print(f"Params: {params}")
        
        response = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response.elapsed.total_seconds():.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Response Success!")
            print("Raw data:")
            print(json.dumps(data, indent=2))
            
            # Extract prices
            prices = {
                'BTC': data.get('bitcoin', {}).get('usd', 0),
                'ETH': data.get('ethereum', {}).get('usd', 0),
                'ADA': data.get('cardano', {}).get('usd', 0),
                'DOT': data.get('polkadot', {}).get('usd', 0),
                'USDC': data.get('usd-coin', {}).get('usd', 0),
            }
            
            print("\nExtracted prices:")
            for symbol, price in prices.items():
                print(f"{symbol}: ${price:,.2f}")
                
            return prices
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

if __name__ == "__main__":
    test_coingecko_api()
