#!/usr/bin/env python3

import requests
import json
import time

def force_backend_performance_update():
    """Force the backend to recalculate and update performance data"""
    
    print("=== FORCING BACKEND PERFORMANCE UPDATE ===")
    
    try:
        # Get current account data
        response = requests.get('http://localhost:5000/api/account')
        if response.status_code != 200:
            print(f"❌ Failed to get account data: {response.status_code}")
            return False
        
        account_data = response.json()
        print(f"✓ Got account data for {account_data['user_id']}")
        
        # Calculate correct values
        balance = account_data.get('balance', 0)
        total_bot_value = sum(bot.get('portfolio_value', 0) for bot in account_data.get('bots', []) if bot.get('status') == 'active')
        total_value = balance + total_bot_value
        initial_value = 100000
        
        pnl = total_value - initial_value
        pnl_percent = (pnl / initial_value) * 100
        
        print(f"Current values:")
        print(f"  Balance: ${balance:,.2f}")
        print(f"  Bot Value: ${total_bot_value:,.2f}")
        print(f"  Total Value: ${total_value:,.2f}")
        print(f"  Calculated P&L: ${pnl:,.2f} ({pnl_percent:+.2f}%)")
        
        # Now I need to find a way to update the backend's performance history
        # Since there's no direct API for this, let me try deploying and stopping a bot to trigger the update
        
        print("\n--- TRYING TO TRIGGER PERFORMANCE UPDATE ---")
        
        # Deploy a minimal bot
        deploy_data = {
            'strategy': 'momentum',
            'risk_profile': 50,
            'allocated_fund': 1  # Minimal amount
        }
        
        deploy_response = requests.post('http://localhost:5000/api/bots/deploy', json=deploy_data)
        if deploy_response.status_code == 200:
            bot_info = deploy_response.json()
            bot_id = bot_info.get('bot', {}).get('bot_id')
            print(f"✓ Deployed temporary bot: {bot_id}")
            
            # Immediately stop it
            stop_response = requests.post(f'http://localhost:5000/api/bots/{bot_id}/stop')
            if stop_response.status_code == 200:
                print(f"✓ Stopped temporary bot: {bot_id}")
                
                # Check account again
                final_response = requests.get('http://localhost:5000/api/account')
                if final_response.status_code == 200:
                    final_account = final_response.json()
                    
                    # Check latest performance record
                    perf_history = final_account.get('performance_history', [])
                    if perf_history:
                        latest = perf_history[-1]
                        print(f"\n--- UPDATED PERFORMANCE ---")
                        print(f"Latest P&L: ${latest.get('pnl', 0):,.2f} ({latest.get('pnl_percent', 0):+.2f}%)")
                        print(f"Total Value: ${latest.get('total_value', 0):,.2f}")
                        
                        if abs(latest.get('pnl_percent', 0) - pnl_percent) < 0.01:
                            print("✅ Performance data updated correctly!")
                            return True
                        else:
                            print("⚠️ Performance data still not matching")
                    
            else:
                print(f"❌ Failed to stop bot: {stop_response.status_code}")
        else:
            print(f"❌ Failed to deploy bot: {deploy_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    return False

if __name__ == "__main__":
    force_backend_performance_update()
