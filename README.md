# EIP-7702 Account Abstraction Demo with Privy & Pimlico

A Next.js demo application showcasing EIP-7702 authorization with Privy embedded wallets and Permissionless SDK for gasless transactions. This app enables users to upgrade their EOA (Externally Owned Account) to behave like a smart account using EIP-7702, allowing them to send sponsored transactions through Pimlico bundler/paymaster services.

## 🚀 Features

- **EIP-7702 Account Abstraction**: Transform EOAs into smart accounts temporarily
- **Privy Integration**: Secure embedded wallet management and authentication
- **Gasless Transactions**: Sponsored transactions via Pimlico paymaster
- **ERC-20 Gas Payments**: Pay transaction fees using USDC tokens
- **Secure API Proxy**: Hide Pimlico API keys from frontend exposure
- **Cloud Deployment**: Standalone proxy server for production use

## 🏗️ Architecture

```
Frontend (Next.js) → Proxy Server → Pimlico API
                  ↓
              Sepolia Testnet
```

### Key Components

- **Frontend**: React components with Privy wallet integration
- **Proxy Layer**: Secure API key management and request forwarding
- **Smart Account**: EIP-7702 enabled account abstraction
- **Paymaster**: Pimlico service for transaction sponsorship

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Pimlico Configuration (Server-side only)
PIMLICO_API_KEY=pim_your_actual_api_key

# Network Configuration
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://1rpc.io/sepolia

# Optional: Sponsorship Policy
NEXT_PUBLIC_SPONSORSHIP_POLICY_ID=sp_your_policy_id

# Proxy Configuration
NEXT_PUBLIC_PIMLICO_PROXY_URL=http://localhost:3000/api/pimlico-proxy
# For production: http://your-server:8081/pimlico-proxy
```

## 🔧 Development

```bash
# Start development server
pnpm dev

# Code formatting
pnpm format

# Linting
pnpm lint

# Build for production
pnpm build
```

## 🌐 Deployment Options

### Option 1: Next.js API Route (Development)

The built-in API route at `/api/pimlico-proxy.ts` provides a simple proxy for development.

### Option 2: Standalone Proxy Server (Production)

For production deployments, use the independent Express server:

```bash
cd src/proxy

# Install dependencies
npm install

# Start server
npm start

# Or with PM2 for production
npm run pm2
```

#### Cloud Server Deployment

```bash
# On your cloud server
git clone [your-repo]
cd permissionless-privy-7702/src/proxy

# Install dependencies
npm ci --only=production

# Set environment variables
echo "PIMLICO_API_KEY=your_key" > .env
echo "PROXY_PORT=8081" >> .env
echo "ALLOWED_ORIGINS=https://yourdomain.com" >> .env

# Start with PM2
npm run pm2
```

#### Docker Deployment

```bash
cd src/proxy
docker build -t pimlico-proxy .
docker run -p 8081:8080 -e PIMLICO_API_KEY=your_key pimlico-proxy
```

## 🔐 Security Features

### API Key Protection
- ✅ API keys stored server-side only
- ✅ Frontend never exposes sensitive credentials
- ✅ Transparent proxy maintains SDK compatibility

### Request Validation
- ✅ CORS protection with configurable origins
- ✅ Request size limiting
- ✅ Error handling and logging

### Production Hardening
- ✅ Rate limiting (recommended)
- ✅ Request filtering
- ✅ Health check endpoints

## 💡 Usage Examples

### Basic 7702 Transaction

```typescript
// The UserOperation component handles:
// 1. Privy authentication
// 2. Smart account creation
// 3. EIP-7702 authorization signing
// 4. Transaction submission
```

### Gasless Transaction

```typescript
// Send sponsored transaction
await smartAccountClient.sendTransaction({
  calls: [{
    to: zeroAddress,
    data: "0x",
    value: BigInt(0)
  }],
  factory: '0x7702',
  factoryData: '0x',
  paymasterContext: {
    sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
  },
  authorization
})
```

### ERC-20 Gas Payment

```typescript
// Pay gas with USDC tokens
await smartAccountClient.sendTransaction({
  calls: [
    {
      to: USDC_TOKEN,
      abi: parseAbi(["function approve(address,uint256)"]),
      functionName: "approve",
      args: [paymaster, maxUint256]
    },
    {
      to: targetContract,
      data: "0x1234"
    }
  ],
  paymasterContext: {
    token: USDC_TOKEN
  },
  authorization
})
```

## 📊 Transaction Flow

1. **Authentication**: User logs in via Privy embedded wallet
2. **Account Setup**: Create smart account client with EIP-7702 support
3. **Authorization**: Sign EIP-7702 authorization to upgrade EOA
4. **Transaction**: Submit UserOperation with authorization
5. **Execution**: Pimlico processes and sponsors the transaction

## 🔍 Monitoring & Debugging

### Development Logs

```bash
# View detailed request logs
pnpm dev

# Check proxy server logs
cd src/proxy && npm run dev
```

### Production Logs

```bash
# PM2 logs
pm2 logs pimlico-proxy

# Docker logs
docker logs [container-id]

# Health check
curl http://your-server:8081/health
```

## 🚨 Troubleshooting

### Common Issues

**"No wallet found" Error**
```bash
# Solution: Ensure Privy embedded wallet is properly initialized
# Check: embeddedWallet?.address is available
```

**CORS Errors**
```bash
# Solution: Configure ALLOWED_ORIGINS in proxy server
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
```

**Transaction Failures**
```bash
# Check: Sufficient USDC balance for gas payments
# Check: Valid EIP-7702 authorization signature
# Check: Correct nonce (use EOA nonce, not smart account nonce)
```

**Proxy Connection Issues**
```bash
# Verify: NEXT_PUBLIC_PIMLICO_PROXY_URL points to running server
# Check: Firewall settings allow traffic on proxy port
```

## 🧪 Testing

### Manual Testing

1. Connect wallet via Privy
2. Send regular 7702 transaction
3. Send gasless test transaction  
4. Send USDC gas payment transaction
5. Verify transactions on [Sepolia Etherscan](https://sepolia.etherscan.io)

### Network Requirements

- **Testnet**: Sepolia
- **Test ETH**: Required for account setup
- **Test USDC**: Required for ERC-20 gas payments
- **Faucets**: [Sepolia Faucet](https://sepoliafaucet.com)

## 📚 Technical Stack

- **Framework**: Next.js 15 with React 19
- **Authentication**: Privy embedded wallets
- **Account Abstraction**: Permissionless SDK + EIP-7702
- **Blockchain**: Ethereum Sepolia testnet
- **Bundler/Paymaster**: Pimlico services
- **Styling**: Tailwind CSS + shadcn/ui
- **Proxy**: Express.js (standalone) / Next.js API routes

## 🔗 Useful Links

### Official Documentation
- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702) - Official EIP-7702 standard specification
- [Privy Documentation](https://docs.privy.io) - Complete Privy integration guide
- [Permissionless SDK](https://docs.pimlico.io/permissionless) - Account abstraction SDK documentation
- [Pimlico Documentation](https://docs.pimlico.io) - Bundler and paymaster service docs
- [Sepolia Testnet](https://sepolia.etherscan.io) - Ethereum testnet explorer

### Reference Implementation & Tutorials
- [🛠️ Permissionless + Privy + 7702 Example](https://github.com/pimlicolabs/permissionless-privy-7702/tree/main) - Official starter repository and complete implementation reference
- [📝 Privy EIP-7702 Authorization Guide](https://docs.privy.io/wallets/using-wallets/ethereum/sign-7702-authorization#react) - How to sign 7702 authorizations with Privy React hooks
- [🚀 Privy EIP-7702 Recipe](https://docs.privy.io/recipes/react/eip-7702#pimlico) - Step-by-step integration recipe for Privy + Pimlico + EIP-7702
- [💰 USDC Gas Payment Tutorial](https://docs.pimlico.io/guides/tutorials/tutorial-2#verify-you-have-usdc-on-the-counterfactual-sender-address) - Using ERC-20 tokens for transaction gas fees

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a demo application for educational purposes. Do not use in production without proper security audits and testing. Always verify transactions and smart contract interactions before deployment.