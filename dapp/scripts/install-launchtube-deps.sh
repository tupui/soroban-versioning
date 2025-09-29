#!/bin/bash

# Install Launchtube Integration Dependencies
# This script installs the required React types for the Launchtube integration

echo "🚀 Installing Launchtube integration dependencies..."

# Check if we're in the dapp directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the dapp directory."
    exit 1
fi

# Install React types if not already present
if ! grep -q "@types/react" package.json; then
    echo "📦 Installing React types..."
    
    # Detect package manager
    if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
        echo "Using bun..."
        bun add -D @types/react@^18.3.12 @types/react-dom@^18.3.1
        bun add react@^18.3.1 react-dom@^18.3.1
    elif [ -f "yarn.lock" ]; then
        echo "Using yarn..."
        yarn add -D @types/react@^18.3.12 @types/react-dom@^18.3.1
        yarn add react@^18.3.1 react-dom@^18.3.1
    elif [ -f "pnpm-lock.yaml" ]; then
        echo "Using pnpm..."
        pnpm add -D @types/react@^18.3.12 @types/react-dom@^18.3.1
        pnpm add react@^18.3.1 react-dom@^18.3.1
    else
        echo "Using npm..."
        npm install -D @types/react@^18.3.12 @types/react-dom@^18.3.1
        npm install react@^18.3.1 react-dom@^18.3.1
    fi
else
    echo "✅ React types already installed"
fi

echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Get a testnet token from: https://testnet.launchtube.xyz/gen"
echo "2. Add to your .env file:"
echo "   PUBLIC_USE_LAUNCHTUBE=\"true\""
echo "   PUBLIC_LAUNCHTUBE_TOKEN=\"your-jwt-token-here\""
echo "3. Restart your development server"
echo "4. Test the integration: run 'testLaunchtube()' in browser console"
echo ""
echo "For detailed setup instructions, see: LAUNCHTUBE.md"
echo "For testing instructions, see: TESTING_LAUNCHTUBE.md"