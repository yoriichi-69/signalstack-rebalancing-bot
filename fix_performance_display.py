#!/usr/bin/env python3

import time
from backend.models.virtual_account import VirtualAccountManager

def main():
    print("=== CHECKING CURRENT ACCOUNT STATE ===")
    
    vam = VirtualAccountManager()
    account = vam.get_account('default_user')
    
    if not account:
        print("❌ No account found!")
        return
    
    print(f"✓ Account found: {account['account_id']}")
    print(f"Balance: ${account.get('balance', 0):,.2f}")
    print(f"Number of bots: {len(account.get('bots', []))}")
    
    # Check bots
    total_bot_value = 0
    for bot in account.get('bots', []):
        print(f"\nBot {bot['bot_id']}:")
        print(f"  Status: {bot.get('status', 'unknown')}")
        print(f"  Allocated Fund: ${bot.get('allocated_fund', 0):,.2f}")
        print(f"  Current Value: ${bot.get('portfolio_value', 0):,.2f}")
        if bot.get('status') == 'active':
            total_bot_value += bot.get('portfolio_value', 0)
    
    # Calculate total portfolio
    total_value = account.get('balance', 0) + total_bot_value
    initial_value = 100000  # Initial balance
    pnl = total_value - initial_value
    pnl_percent = (pnl / initial_value) * 100
    
    print(f"\n--- PORTFOLIO SUMMARY ---")
    print(f"Available Balance: ${account.get('balance', 0):,.2f}")
    print(f"Total Bot Value: ${total_bot_value:,.2f}")
    print(f"Total Portfolio Value: ${total_value:,.2f}")
    print(f"Initial Value: ${initial_value:,.2f}")
    print(f"P&L: ${pnl:,.2f} ({pnl_percent:+.2f}%)")
    
    # Check performance history
    perf_history = account.get('performance_history', [])
    print(f"\n--- PERFORMANCE HISTORY ---")
    print(f"Records: {len(perf_history)}")
    
    if perf_history:
        latest = perf_history[-1]
        print(f"Latest record:")
        print(f"  PnL: ${latest.get('pnl', 0):,.2f}")
        print(f"  PnL%: {latest.get('pnl_percent', 0):+.2f}%")
        print(f"  Total Value: ${latest.get('total_value', 0):,.2f}")
    
    # Now create a correct performance record
    print(f"\n--- ADDING CORRECT PERFORMANCE RECORD ---")
    new_record = {
        'timestamp': time.time(),
        'balance': account.get('balance', 0),
        'portfolio_value': total_bot_value,
        'total_value': total_value,
        'total_initial': initial_value,
        'pnl': pnl,
        'pnl_percent': pnl_percent
    }
    
    account['performance_history'].append(new_record)
    
    # Save
    vam.accounts[account['user_id']] = account
    vam.save_accounts()
    
    print(f"✅ Added performance record: P&L ${pnl:,.2f} ({pnl_percent:+.2f}%)")
    
if __name__ == "__main__":
    main()
