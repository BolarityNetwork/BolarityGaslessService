# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js demo application showcasing EIP-7702 authorization with Privy embedded wallets and Permissionless SDK for gasless transactions. The app enables users to upgrade their EOA (Externally Owned Account) to behave like a smart account using EIP-7702, allowing them to send sponsored transactions through Pimlico bundler/paymaster services.

## Development Commands

### Core Development
- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm format` - Format code with Biome (includes import organization)
- `pnpm lint` - Lint code with Biome
- `pnpm check` - Run Biome checks and auto-fix issues

The project uses Biome for linting and formatting with specific configurations:
- 4-space indentation
- 80 character line width
- Semicolons as needed
- No trailing commas
- All linter rules enabled (except accessibility and some style rules)

## Architecture

### Key Technologies
- **Next.js 15** with React 19 - Main framework
- **Privy** - Authentication and embedded wallet management
- **Permissionless SDK** - Smart account abstraction and EIP-7702 support
- **Wagmi/Viem** - Ethereum interaction layer
- **Pimlico** - Bundler and paymaster services for gasless transactions
- **Tailwind CSS** - Styling with shadcn/ui components

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout with providers
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/
│   ├── Providers.tsx   # Wraps Privy and Wagmi providers
│   ├── UserOperation.tsx # Main demo component for 7702 transactions
│   └── ui/             # shadcn/ui components
└── lib/
    ├── privyConfig.ts  # Privy configuration
    ├── wagmiConfig.ts  # Wagmi configuration (Sepolia testnet)
    └── utils.ts        # Utility functions
```

### Key Components

**UserOperation.tsx**: Core demo component that:
1. Manages Privy authentication and embedded wallet setup
2. Creates a simple smart account using Permissionless SDK
3. Signs EIP-7702 authorization to upgrade EOA
4. Sends gasless transactions via Pimlico bundler/paymaster

**Configuration Files**:
- `privyConfig.ts` - Embedded wallet creation, login methods, UI theming
- `wagmiConfig.ts` - Sepolia testnet configuration
- `next.config.js` - Webpack polyfills for crypto/stream/http in browser

### Environment Variables Required
- `NEXT_PUBLIC_PIMLICO_API_KEY` - Pimlico API key for bundler/paymaster
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` - Sepolia RPC endpoint
- `NEXT_PUBLIC_SPONSORSHIP_POLICY_ID` - Pimlico sponsorship policy (optional)

### EIP-7702 Transaction Flow
1. User authenticates with Privy (embedded wallet created)
2. Smart account client configured with Simple Account implementation
3. EIP-7702 authorization signed (upgrades EOA to smart account behavior)
4. Transaction sent with authorization, sponsored by Pimlico paymaster
5. Transaction hash displayed with Etherscan link

### Testing
The project includes `test-7702.ts` for testing 7702 functionality. No specific test framework is configured in package.json - tests would need to be run directly with Node.js or a test runner of choice.