#!/usr/bin/env python3

import requests
import json

def test_account_api():
    try:
        print("=== TESTING BACKEND API ===")
        
        # Test account endpoint
        response = requests.get('http://localhost:5000/api/account')
        print(f"Account API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Account Data:")
            print(f"  User ID: {data.get('user_id', 'N/A')}")
            print(f"  Balance: ${data.get('balance', 0):,.2f}")
            print(f"  Number of bots: {len(data.get('bots', []))}")
            
            # Check bots
            for i, bot in enumerate(data.get('bots', [])):
                print(f"  Bot {i+1}: {bot.get('bot_id', 'N/A')}")
                print(f"    Status: {bot.get('status', 'N/A')}")
                print(f"    Allocated: ${bot.get('allocated_fund', 0):,.2f}")
                print(f"    Value: ${bot.get('portfolio_value', 0):,.2f}")
            
            # Check performance history
            perf_history = data.get('performance_history', [])
            print(f"  Performance records: {len(perf_history)}")
            if perf_history:
                latest = perf_history[-1]
                print(f"  Latest P&L: ${latest.get('pnl', 0):,.2f} ({latest.get('pnl_percent', 0):+.2f}%)")
                
            # Calculate what the frontend should show
            total_bot_value = sum(bot.get('portfolio_value', 0) for bot in data.get('bots', []) if bot.get('status') == 'active')
            total_value = data.get('balance', 0) + total_bot_value
            initial_value = 100000
            calculated_pnl = total_value - initial_value
            calculated_pnl_percent = (calculated_pnl / initial_value) * 100
            
            print(f"\n--- FRONTEND CALCULATION ---")
            print(f"Total Value: ${total_value:,.2f}")
            print(f"Calculated P&L: ${calculated_pnl:,.2f} ({calculated_pnl_percent:+.2f}%)")
            
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_account_api()
