#!/usr/bin/env python3

import requests
import json

def call_update_performance():
    """Call the new update performance endpoint"""
    
    print("=== CALLING UPDATE PERFORMANCE ENDPOINT ===")
    
    try:
        response = requests.post('http://localhost:5000/api/account/update-performance')
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('message', 'Performance updated')}")
            
            if 'performance' in result:
                perf = result['performance']
                print(f"Updated performance:")
                print(f"  P&L: ${perf.get('pnl', 0):,.2f}")
                print(f"  P&L%: {perf.get('pnl_percent', 0):+.2f}%")
                print(f"  Total Value: ${perf.get('total_value', 0):,.2f}")
            
            # Verify by checking the API again
            print("\n--- VERIFICATION ---")
            account_response = requests.get('http://localhost:5000/api/account')
            if account_response.status_code == 200:
                account = account_response.json()
                perf_history = account.get('performance_history', [])
                if perf_history:
                    latest = perf_history[-1]
                    print(f"Latest API performance record:")
                    print(f"  P&L: ${latest.get('pnl', 0):,.2f}")
                    print(f"  P&L%: {latest.get('pnl_percent', 0):+.2f}%")
                    print(f"  Total Value: ${latest.get('total_value', 0):,.2f}")
                    
                    print(f"\n✅ Frontend should now show: {latest.get('pnl_percent', 0):+.2f}%")
                else:
                    print("❌ No performance history found")
            else:
                print(f"❌ Failed to verify: {account_response.status_code}")
            
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    call_update_performance()
