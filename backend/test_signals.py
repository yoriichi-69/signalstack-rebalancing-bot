from signals.strategy import SignalGenerator

def main():
    print("Testing SignalStack signal generator...")
    
    # Create generator
    generator = SignalGenerator(['BTC', 'ETH', 'USDC'])
    
    # Generate signals
    signals = generator.generate_signals()
    
    # Calculate target weights
    weights = generator.calculate_target_weights()
    
    # Print results
    print("\nSignal Summary:")
    print("--------------")
    for token, data in signals.items():
        print(f"Token: {token}")
        print(f"Mean Reversion: {data['mean_reversion']}")
        print(f"Momentum: {data['momentum']}")
        print(f"Volatility: {data['volatility']}")
        print(f"Breakout: {data['breakout']}")
        print(f"Total Score: {data['total_score']}")
        print(f"Target Weight: {weights[token]}%")
        print("-" * 30)

if __name__ == "__main__":
    main()