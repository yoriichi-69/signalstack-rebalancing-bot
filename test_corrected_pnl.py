import requests
import json

try:
    r = requests.get('http://localhost:5000/api/account')
    data = r.json()
    
    print("=== TESTING CORRECTED PNL CALCULATION ===")
    
    # Frontend calculation (FIXED)
    balance = data['balance']
    total_bots_value = sum(bot['portfolio_value'] for bot in data['bots'])
    total_value = balance + total_bots_value
    
    # Use performance history
    if data['performance_history']:
        latest_perf = data['performance_history'][-1]
        pnl_amount = latest_perf['pnl']
        pnl_percent = latest_perf['pnl_percent']
    else:
        pnl_amount = total_value - 100000
        pnl_percent = (pnl_amount / 100000) * 100
    
    print(f"📊 CORRECTED Frontend Calculation:")
    print(f"   Cash Balance: ${balance:,.2f}")
    print(f"   Total Bot Values: ${total_bots_value:,.2f}")
    print(f"   Total Portfolio: ${total_value:,.2f}")
    print(f"   PnL Amount: ${pnl_amount:,.2f}")
    print(f"   PnL Percent: {pnl_percent:.2f}%")
    
    print(f"\n✅ Expected Frontend Display:")
    print(f"   Total Value: ${total_value:,.2f}")
    print(f"   PnL: ${pnl_amount:,.2f} ({pnl_percent:+.2f}%)")
    
    if abs(pnl_amount) < 500:  # Should be around +/- $100-300
        print(f"🎉 SUCCESS: PnL is now realistic!")
    else:
        print(f"❌ ISSUE: PnL still seems high")
        
except Exception as e:
    print(f"Error: {e}")
