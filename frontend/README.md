# SignalStack Frontend

SignalStack is a fully autonomous crypto portfolio manager that operates directly on-chain. This frontend application provides a modern, intuitive interface for managing your crypto portfolio using AI-powered trading strategies.

## Features

- **Dashboard**: Real-time portfolio overview with key metrics and performance indicators
- **Portfolio Management**: Detailed asset allocation and rebalancing controls
- **Trading Strategies**: Monitor and configure AI-powered trading strategies
- **Analytics**: Comprehensive performance metrics and trading history
- **Settings**: Customize system behavior and risk parameters

## Tech Stack

- React 18
- TypeScript
- Material-UI v5
- Redux Toolkit
- React Query
- Recharts
- React Router v6

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/signalstack-rebalancing-bot.git
cd signalstack-rebalancing-bot/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_INFURA_KEY=your_infura_key
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── store/         # Redux store and slices
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── services/      # API services
└── assets/        # Static assets
```

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

### Code Style

This project uses ESLint and Prettier for code formatting. The configuration is included in the project.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- Recharts for the charting library
- The Ethereum community for the blockchain infrastructure 