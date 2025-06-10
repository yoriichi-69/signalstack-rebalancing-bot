#!/usr/bin/env python3

import time
from backend.models.virtual_account import VirtualAccountManager

def main():
    print("=== MANUAL PERFORMANCE UPDATE ===")
    
    vam = VirtualAccountManager()
    account = vam.get_account('default_user')
    
    if not account:
        print("❌ No account found!")
        return
    
    print(f"✓ Account found: {account['account_id']}")
    
    # Calculate current portfolio values
    try:
        current_prices = vam._get_current_prices()
        print(f"Current prices: {current_prices}")
        
        # Calculate bot values
        total_bot_value = 0
        for bot in account.get('bots', []):
            if bot['status'] == 'active' and bot.get('assets'):
                bot_value = 0
                print(f"\nBot {bot['bot_id']} assets:")
                for asset, amount in bot['assets'].items():
                    if asset in current_prices:
                        asset_value = amount * current_prices[asset]
                        bot_value += asset_value
                        print(f"  {asset}: {amount:.6f} × ${current_prices[asset]:.2f} = ${asset_value:.2f}")
                
                bot['portfolio_value'] = bot_value
                total_bot_value += bot_value
                print(f"Bot {bot['bot_id']}: ${bot_value:.2f}")
        
        # Calculate portfolio totals
        current_balance = account.get('balance', 90000)
        total_portfolio_value = current_balance + total_bot_value
        initial_balance = 100000
        
        pnl_amount = total_portfolio_value - initial_balance
        pnl_percent = (pnl_amount / initial_balance) * 100
        
        print(f"\n--- CALCULATED VALUES ---")
        print(f"Current balance: ${current_balance:,.2f}")
        print(f"Total bot value: ${total_bot_value:.2f}")
        print(f"Total portfolio value: ${total_portfolio_value:.2f}")
        print(f"Initial balance: ${initial_balance:,.2f}")
        print(f"PnL: ${pnl_amount:.2f} ({pnl_percent:.2f}%)")
        
        # Add new performance record
        new_record = {
            'timestamp': time.time(),
            'balance': current_balance,
            'portfolio_value': total_bot_value,
            'total_value': total_portfolio_value,
            'total_initial': initial_balance,
            'pnl': pnl_amount,
            'pnl_percent': pnl_percent
        }
        
        # Add to performance history
        if 'performance_history' not in account:
            account['performance_history'] = []
        
        account['performance_history'].append(new_record)
        
        # Save account
        vam.accounts[account['user_id']] = account
        vam.save_accounts()
        
        print(f"\n✅ Performance history updated!")
        print(f"Latest record: PnL ${pnl_amount:.2f} ({pnl_percent:.2f}%)")
        print(f"Frontend should now show: {pnl_percent:.2f}% Performance")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
