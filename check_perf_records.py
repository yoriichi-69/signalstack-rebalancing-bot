#!/usr/bin/env python3

from backend.models.virtual_account import VirtualAccountManager

def main():
    vam = VirtualAccountManager()
    account = vam.get_account('default_user')
    
    print("=== ALL PERFORMANCE RECORDS ===")
    perf_history = account.get('performance_history', [])
    print(f"Total records: {len(perf_history)}")
    
    for i, record in enumerate(perf_history):
        print(f"Record {i}:")
        print(f"  Timestamp: {record.get('timestamp', 0)}")
        print(f"  PnL: ${record.get('pnl', 0)}")
        print(f"  PnL%: {record.get('pnl_percent', 0)}%")
        print(f"  Total Value: ${record.get('total_value', 0)}")
        print()

if __name__ == "__main__":
    main()
