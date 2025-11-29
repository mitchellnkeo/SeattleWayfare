# Seattle Wayfare

Intelligent transit companion that helps Seattle riders navigate unreliable transit with smart delay predictions, alternative route suggestions, and transfer protection.

## Development Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Initialize Husky (pre-commit hooks):
```bash
npm run prepare
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
seattle-wayfare/
├── src/
│   ├── components/      # UI components
│   ├── screens/         # Screen components
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── data/            # Static data files
│   └── __mocks__/       # Mock data for testing
├── assets/              # Images, fonts, etc.
├── app.json             # Expo configuration
└── package.json
```

## API Keys

This app requires:
- **OneBusAway API Key**: Request from oba_api_key@soundtransit.org
- See `DATA_SOURCES.md` for all data sources

## Testing Strategy

See `TESTING.md` for comprehensive testing procedures.

## Development Guidelines

- **Small commits**: Keep commits focused and manageable
- **Test before commit**: Pre-commit hooks will run linting and formatting
- **Write tests**: Aim for 60%+ code coverage
- **Follow ESLint rules**: Run `npm run lint:fix` before committing

## License

Private project - All rights reserved

