import requests
import json

try:
    r = requests.get('http://localhost:5000/api/account')
    data = r.json()
    
    print("=== ACCOUNT DATA STRUCTURE ===")
    print(f"balance: ${data['balance']:,.2f}")
    print(f"initial_balance: ${data['initial_balance']:,.2f}")
    print(f"Number of bots: {len(data['bots'])}")
    
    total_bot_value = 0
    for i, bot in enumerate(data['bots']):
        print(f"\nBot {i+1}:")
        print(f"  current_value: ${bot['current_value']:,.2f}")
        print(f"  allocated_amount: ${bot['allocated_amount']:,.2f}")
        print(f"  assets: {bot.get('assets', {})}")
        total_bot_value += bot['current_value']
    
    print(f"\n=== CALCULATION ANALYSIS ===")
    print(f"Cash Balance: ${data['balance']:,.2f}")
    print(f"Total Bot Value: ${total_bot_value:,.2f}")
    print(f"Current Total: ${data['balance'] + total_bot_value:,.2f}")
    print(f"Initial Investment: ${data['initial_balance']:,.2f}")
    print(f"Correct PnL: ${(data['balance'] + total_bot_value) - data['initial_balance']:,.2f}")
    
    # Check if balance includes allocated money
    total_allocated = sum(bot['allocated_amount'] for bot in data['bots'])
    print(f"\nTotal Allocated to Bots: ${total_allocated:,.2f}")
    print(f"Remaining Cash (should be balance): ${data['initial_balance'] - total_allocated:,.2f}")
    
except Exception as e:
    print(f"Error: {e}")
