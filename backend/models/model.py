import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

class PredictionModel:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'saved_model.pkl')
        self.load_or_train_model()
    
    def prepare_features(self, price_data):
        """
        Prepare features from price data
        - price_data: DataFrame with 'price' column
        """
        df = price_data.copy()
        
        # Technical indicators as features
        # SMA
        df['sma_7'] = df['price'].rolling(window=7).mean()
        df['sma_14'] = df['price'].rolling(window=14).mean()
        df['sma_30'] = df['price'].rolling(window=30).mean()
        
        # Price relative to SMA
        df['price_to_sma_7'] = df['price'] / df['sma_7']
        df['price_to_sma_14'] = df['price'] / df['sma_14']
        df['price_to_sma_30'] = df['price'] / df['sma_30']
        
        # Momentum (rate of change)
        df['roc_1'] = df['price'].pct_change(1)
        df['roc_7'] = df['price'].pct_change(7)
        df['roc_14'] = df['price'].pct_change(14)
        
        # Volatility
        df['volatility_7'] = df['price'].rolling(window=7).std() / df['price'].rolling(window=7).mean()
        df['volatility_14'] = df['price'].rolling(window=14).std() / df['price'].rolling(window=14).mean()
        
        # Target: Binary price direction in next period
        df['target'] = df['price'].shift(-1) > df['price']
        df['target'] = df['target'].astype(int)
        
        # Drop NaNs
        df = df.dropna()
        
        # Features and target
        features = df.drop(['price', 'target'], axis=1)
        target = df['target']
        
        return features, target
    
    def load_or_train_model(self):
        """Load a saved model or train a new one if it doesn't exist"""
        if os.path.exists(self.model_path):
            print("Loading existing model...")
            self.model = joblib.load(self.model_path)
        else:
            print("No model found. For a real implementation, train with historical data.")
            # For hackathon purposes, we'll create a dummy model
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            
            # Generate dummy data
            dummy_data = pd.DataFrame({
                'price': np.random.normal(100, 10, 1000)
            })
            for i in range(1, 1000):
                # Add some trend
                dummy_data.loc[i, 'price'] = dummy_data.loc[i-1, 'price'] * (1 + np.random.normal(0, 0.02))
            
            X, y = self.prepare_features(dummy_data)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            self.model.fit(X_train, y_train)
            print(f"Model accuracy: {self.model.score(X_test, y_test):.2f}")
            
            # Save model
            joblib.dump(self.model, self.model_path)
    
    def predict(self, features):
        """Make predictions using the trained model"""
        if self.model is None:
            self.load_or_train_model()
        
        return self.model.predict(features), self.model.predict_proba(features)
    
    def enhance_signals(self, signals, price_data):
        """
        Use ML model to enhance trading signals
        - signals: dict from SignalGenerator
        - price_data: dict mapping token to price DataFrame
        """
        enhanced_signals = signals.copy()
        
        for token, data in signals.items():
            if token in price_data:
                features, _ = self.prepare_features(price_data[token])
                if not features.empty:
                    latest_features = features.iloc[[-1]]
                    prediction, probabilities = self.predict(latest_features)
                    
                    # Probability of price increase
                    bull_probability = probabilities[0][1]
                    
                    # Adjust signal based on ML confidence
                    confidence_factor = (bull_probability - 0.5) * 2  # -1 to 1
                    ml_signal = 1 if confidence_factor > 0.2 else (-1 if confidence_factor < -0.2 else 0)
                    
                    # Add ML signal to total score
                    enhanced_signals[token]['ml_signal'] = ml_signal
                    enhanced_signals[token]['ml_confidence'] = bull_probability
                    enhanced_signals[token]['total_score'] += ml_signal
        
        return enhanced_signals

# Example usage
if __name__ == "__main__":
    model = PredictionModel()
    
    # Generate dummy price data
    dummy_price = pd.DataFrame({
        'price': np.random.normal(100, 10, 100)
    })
    for i in range(1, 100):
        dummy_price.loc[i, 'price'] = dummy_price.loc[i-1, 'price'] * (1 + np.random.normal(0, 0.02))
    
    features, _ = model.prepare_features(dummy_price)
    prediction, probabilities = model.predict(features.iloc[[-1]])
    
    print(f"Prediction for price movement: {'Up' if prediction[0] else 'Down'}")
    print(f"Confidence: {max(probabilities[0]):.2f}")
