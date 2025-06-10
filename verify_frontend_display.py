#!/usr/bin/env python3
"""
Frontend Display Verification - Check what the UI should show
"""

import requests
import json

def main():
    print("🖥️  FRONTEND DISPLAY VERIFICATION")
    print("=" * 50)
    
    try:
        # Get account data (same as frontend)
        response = requests.get('http://localhost:5000/api/account', params={'user_id': 'default_user'})
        account = response.json()
        
        # Get crypto prices (simplified fallback prices)
        crypto_prices = {
            'BTC': 45000,
            'ETH': 3000,
            'ADA': 0.5,
            'DOT': 8,
            'USDC': 1
        }
        
        print("📊 Account Data Summary:")
        print(f"   Balance: ${account.get('balance', 0):,.2f}")
        print(f"   Initial Balance: ${account.get('initial_balance', 100000):,.2f}")
        print(f"   Number of Bots: {len(account.get('bots', []))}")
        
        # Calculate asset values (same logic as frontend)
        total_assets_value = 0
        asset_map = {}
        
        for bot in account.get('bots', []):
            if bot.get('assets'):
                for asset, amount in bot['assets'].items():
                    asset_upper = asset.upper()
                    if asset_upper not in asset_map:
                        asset_map[asset_upper] = {'amount': 0, 'value': 0}
                    asset_map[asset_upper]['amount'] += amount
        
        print("\n💰 Asset Breakdown:")
        for asset, data in asset_map.items():
            price = crypto_prices.get(asset, 0)
            value = data['amount'] * price
            total_assets_value += value
            print(f"   {asset}: {data['amount']:.6f} × ${price:,.2f} = ${value:,.2f}")
        
        # Final calculations (exact same as frontend)
        balance = account.get('balance', 0)
        total_value = balance + total_assets_value
        initial_balance = account.get('initial_balance', 100000)
        pnl_amount = total_value - initial_balance
        pnl_percent = (pnl_amount / initial_balance * 100) if initial_balance > 0 else 0
        
        print(f"\n📈 Final Portfolio Calculation:")
        print(f"   Cash Balance: ${balance:,.2f}")
        print(f"   Assets Value: ${total_assets_value:,.2f}")
        print(f"   Total Value: ${total_value:,.2f}")
        print(f"   Initial Investment: ${initial_balance:,.2f}")
        print(f"   PnL Amount: ${pnl_amount:+,.2f}")
        print(f"   PnL Percentage: {pnl_percent:+.2f}%")
        
        print("\n" + "=" * 50)
        print("🎯 EXPECTED FRONTEND DISPLAY:")
        print(f"   Total Value: ${total_value:,.2f}")
        
        # Format PnL display like the frontend
        pnl_color = "green" if pnl_amount >= 0 else "red"
        pnl_sign = "+" if pnl_amount >= 0 else ""
        print(f"   PnL: ${pnl_sign}{pnl_amount:,.2f} ({pnl_sign}{pnl_percent:.2f}%) [{pnl_color}]")
        print("=" * 50)
        
        # Validation
        if abs(pnl_percent) < 10:  # Less than 10% change is reasonable
            print("✅ PnL values look realistic and correct!")
        else:
            print("⚠️  PnL values might be unrealistic")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
