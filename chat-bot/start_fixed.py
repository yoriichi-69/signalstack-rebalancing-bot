"""
CryptoRizz Chatbot Fixed Starter
This script sets up the environment and starts the chatbot with improved error handling.
"""
import os
import sys
import time
import subprocess

def setup_env_file():
    """Create or update the .env file with proper API keys"""
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    
    # Create default .env if it doesn't exist
    if not os.path.exists(env_file):
        print("📝 Creating new .env file with placeholder API keys...")
        with open(env_file, 'w') as f:
            f.write("""# CryptoRizz ChatBot Environment Variables
# Created by auto-setup script

# CoinGecko API Key (for cryptocurrency price data)
# Get a free API key at https://www.coingecko.com/en/api/pricing
COINGECKO_API_KEY=12345678abcdefg987654321

# OpenAI API Key (for AI-powered responses) - Optional
# Get an API key at https://platform.openai.com
# OPENAI_API_KEY=your_api_key_here
""")
        print("✅ .env file created with placeholder API keys")
    else:
        print("✅ .env file already exists")
    
    return env_file

def install_requirements():
    """Install required packages"""
    required_packages = [
        "flask", "flask-cors", "requests", "python-dotenv"
    ]
    
    optional_packages = [
        "langchain", "langchain-openai", "langchain-community", "langchain-huggingface", "faiss-cpu"
    ]
    
    print("📦 Checking required packages...")
    for package in required_packages:
        try:
            __import__(package.replace("-", "_").split(">=")[0])
            print(f"  ✅ {package} already installed")
        except ImportError:
            print(f"  ⚙️ Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
    print("\n📦 Checking optional packages for AI features...")
    for package in optional_packages:
        try:
            __import__(package.replace("-", "_").split(">=")[0])
            print(f"  ✅ {package} already installed")
        except ImportError:
            try:
                print(f"  ⚙️ Installing {package}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", package])
                print(f"  ✅ {package} installed successfully")
            except Exception as e:
                print(f"  ⚠️ Could not install {package}: {e}")
                print(f"  ℹ️ This is OK - some advanced features will be limited")

def start_chatbot_server():
    """Start the chatbot server with proper error handling"""
    print("\n🚀 Starting CryptoRizz chat server...")
    
    bot_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bot.py')
    if not os.path.exists(bot_file):
        print(f"❌ ERROR: Could not find bot.py file at {bot_file}")
        return False
    
    try:
        # Run the bot.py script
        subprocess.run([sys.executable, bot_file], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ ERROR: Bot server crashed with exit code {e.returncode}")
        return False
    except KeyboardInterrupt:
        print("\n👋 Bot server stopped by user")
        return True
    except Exception as e:
        print(f"❌ ERROR: Failed to start bot server: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("  🤖 CryptoRizz Chatbot Enhanced Starter")
    print("=" * 60)
    
    # Setup .env file
    env_file = setup_env_file()
    
    # Install requirements
    install_requirements()
    
    # Start the server
    print("\n" + "=" * 60)
    success = start_chatbot_server()
    
    if not success:
        print("\n❌ Failed to start chatbot server. Please check errors above.")
        print("   You can try running 'python bot.py' directly to see detailed errors.")
        sys.exit(1) 