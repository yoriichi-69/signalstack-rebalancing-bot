#!/usr/bin/env python3

import requests
import json

def check_performance_records():
    print("=== CHECKING PERFORMANCE RECORDS ===")
    
    try:
        response = requests.get('http://localhost:5000/api/account')
        if response.status_code == 200:
            data = response.json()
            
            perf_history = data.get('performance_history', [])
            print(f"Total performance records: {len(perf_history)}")
            
            for i, record in enumerate(perf_history):
                print(f"\nRecord {i+1}:")
                print(f"  Timestamp: {record.get('timestamp', 0)}")
                print(f"  P&L: ${record.get('pnl', 0):,.2f}")
                print(f"  P&L%: {record.get('pnl_percent', 0):+.2f}%")
                print(f"  Total Value: ${record.get('total_value', 0):,.2f}")
                
            # Check what the frontend logic would use
            if perf_history:
                latest = perf_history[-1]
                print(f"\n--- FRONTEND WOULD USE ---")
                print(f"Latest record P&L: ${latest.get('pnl', 0):,.2f}")
                print(f"Latest record P&L%: {latest.get('pnl_percent', 0):+.2f}%")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_performance_records()
