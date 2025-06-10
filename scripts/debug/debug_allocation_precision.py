#!/usr/bin/env python3

"""
Debug script to understand why there's a discrepancy between allocated fund and calculated asset value.
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from models.virtual_account import VirtualAccountManager

def debug_allocation():
    """Debug the allocation calculation."""
    print("=== Debugging Asset Allocation ===")
    
    account_manager = VirtualAccountManager()
    
    # Get current prices
    prices = account_manager._get_current_prices()
    print(f"Current prices: {prices}")
    
    # Test the threshold strategy allocation
    strategy = 'threshold'
    allocated_fund = 10000
    allocation_weights = account_manager._get_initial_allocation(strategy)
    
    print(f"\nStrategy: {strategy}")
    print(f"Allocated fund: ${allocated_fund}")
    print(f"Allocation weights: {allocation_weights}")
    
    print(f"\nCalculating asset amounts:")
    total_calculated_value = 0
    
    for asset, weight in allocation_weights.items():
        if asset in prices and prices[asset] > 0:
            # Calculate USD value for this asset
            usd_value = allocated_fund * weight
            # Convert to actual cryptocurrency amount
            crypto_amount = usd_value / prices[asset]
            # Verify by calculating back
            verification_value = crypto_amount * prices[asset]
            total_calculated_value += verification_value
            
            print(f"  {asset}:")
            print(f"    Weight: {weight} ({weight*100}%)")
            print(f"    Target USD: ${usd_value:.2f}")
            print(f"    Price: ${prices[asset]:.2f}")
            print(f"    Crypto amount: {crypto_amount:.6f}")
            print(f"    Verification value: ${verification_value:.2f}")
    
    print(f"\nTotal calculated value: ${total_calculated_value:.2f}")
    print(f"Difference from allocated: ${total_calculated_value - allocated_fund:.2f}")
    
    # Check the difference percentage
    difference_percent = abs(total_calculated_value - allocated_fund) / allocated_fund * 100
    print(f"Difference percentage: {difference_percent:.4f}%")
    
    if difference_percent < 0.5:  # Less than 0.5% difference is acceptable
        print("✅ Difference is within acceptable range (likely due to price precision)")
    else:
        print("❌ Difference is too large, may indicate a calculation error")

if __name__ == "__main__":
    debug_allocation()
