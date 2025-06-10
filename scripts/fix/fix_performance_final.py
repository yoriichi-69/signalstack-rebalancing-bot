#!/usr/bin/env python3

import time
import requests
from backend.models.virtual_account import VirtualAccountManager

def fix_performance_history():
    print("=== FIXING PERFORMANCE HISTORY ===")
    
    # Get current data from API (what frontend sees)
    try:
        response = requests.get('http://localhost:5000/api/account')
        if response.status_code == 200:
            api_data = response.json()
            print("✓ Got current API data")
            
            # Calculate actual performance
            balance = api_data.get('balance', 0)
            total_bot_value = sum(bot.get('portfolio_value', 0) for bot in api_data.get('bots', []) if bot.get('status') == 'active')
            total_value = balance + total_bot_value
            initial_value = 100000
            
            pnl = total_value - initial_value
            pnl_percent = (pnl / initial_value) * 100
            
            print(f"Current values:")
            print(f"  Balance: ${balance:,.2f}")
            print(f"  Bot Value: ${total_bot_value:,.2f}")
            print(f"  Total Value: ${total_value:,.2f}")
            print(f"  P&L: ${pnl:,.2f} ({pnl_percent:+.2f}%)")
            
            # Update performance history in storage
            vam = VirtualAccountManager()
            account = vam.get_account('default_user')
            
            if account:
                # Add new performance record with correct data
                new_record = {
                    'timestamp': time.time(),
                    'balance': balance,
                    'portfolio_value': total_bot_value,
                    'total_value': total_value,
                    'total_initial': initial_value,
                    'pnl': pnl,
                    'pnl_percent': pnl_percent
                }
                
                # Replace the last record or add new one
                if 'performance_history' not in account:
                    account['performance_history'] = []
                
                account['performance_history'].append(new_record)
                
                # Save
                vam.accounts[account['user_id']] = account
                vam.save_accounts()
                
                print(f"✅ Updated performance history")
                print(f"Frontend Performance section should now show: {pnl_percent:+.2f}%")
                
                # Verify the update
                updated_account = vam.get_account('default_user')
                latest_perf = updated_account['performance_history'][-1]
                print(f"✓ Verification - Latest record: P&L ${latest_perf['pnl']:,.2f} ({latest_perf['pnl_percent']:+.2f}%)")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_performance_history()
