# 🏗️ Convexo - Compliant DeFi Platform

> A comprehensive compliance platform for DeFi, featuring soulbound verification NFTs, Uniswap v4 hooks, and seamless fiat-to-crypto onboarding.

[![Built with Scaffold-ETH 2](https://img.shields.io/badge/built%20with-Scaffold--ETH%202-blue)](https://scaffoldeth.io/)
[![Uniswap v4](https://img.shields.io/badge/Uniswap-v4%20Hooks-pink)](https://docs.uniswap.org/contracts/v4/overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

Convexo is a production-grade DeFi platform that enforces AML/CFT compliance through:

- **🔒 Soulbound ComplianceNFTs** - 1-year validity, non-transferable verification tokens
- **🔗 Uniswap v4 Hooks** - Permissioned liquidity pools (USDC/ECOP)
- **👤 Role-Based Access** - Admin and User roles with proper gating
- **💰 Funding Module** - Cash-in/cash-out requests for verified users
- **📊 Admin Dashboard** - Complete NFT and request management

## 🏗️ Architecture

### **Smart Contracts**
- **ComplianceNFT.sol** - Soulbound ERC721 with 1-year validity
- **CompliantLPHook.sol** - Uniswap v4 hook for gated USDC/ECOP pools

### **Frontend Stack**
- **Next.js 15** - App Router with TypeScript
- **Wagmi/Viem** - Ethereum interactions
- **Prisma** - Database ORM (SQLite dev, Postgres prod)
- **Tailwind CSS + DaisyUI** - Styling

### **Supported Networks**
- **Unichain Sepolia** (Chain ID: 1301) - Primary testnet
- **Localhost** (Chain ID: 31337) - Development

## 🚀 Quick Start

### **Prerequisites**
- Node.js >= v20.18.3
- Yarn v1 or v2+
- Git

### **Installation**
```bash
git clone https://github.com/wmb81321/UHI6-hookathon.git
cd UHI6-hookathon/convexo
yarn install
```

### **Development Setup**

#### **1. Start Local Blockchain**
```bash
yarn chain
```

#### **2. Deploy Contracts**
```bash
# Deploy to localhost
yarn deploy

# Deploy to Unichain Sepolia (requires keystore)
yarn deploy --network unichainSepolia --keystore 0
```

#### **3. Start Frontend**
```bash
yarn start
```

Visit: **http://localhost:3000**

## 📋 Features

### **🏠 Landing Page (`/`)**
- Connect wallet interface
- Compliance status display
- Feature navigation (Profile, Funding, Admin)

### **👤 User Profile (`/profile`)**
- **Identity Management**: Address, Username, Email, ENS
- **Compliance Panel**: NFT status, Token ID, expiry date
- **Verification Requests**: Dynamic forms (Person/Institution)
- **Token Balances**: ETH, USDC, ECOP with send functionality

### **💰 Funding Module (`/funding`)**
- **Compliance Gated**: Only verified users can access
- **Cash In/Out**: Request management with bank account linking
- **Request History**: Status tracking and updates

### **⚙️ Admin Panel (`/admin`)**
- **NFT Management**: Mint, renew, revoke ComplianceNFTs
- **Verification Queue**: Review and approve user requests
- **Cash Requests**: Manage funding requests
- **Contract Information**: Live contract stats and holder lists

### **🔍 Debug Section (`/debug`)**
- **Interactive Contract UI**: Test all contract functions
- **ComplianceNFT**: Mint, renew, revoke, compliance checks
- **CompliantLPHook**: Hook configuration and compliance testing

## 🔧 Configuration

### **Environment Variables**

Create `.env.local` in `packages/nextjs/`:

```bash
# Admin Configuration
NEXT_PUBLIC_ADMIN_ADDRESS=0x70478DBB02b4026437E5015A0B4798c99E04C564

# Contract Addresses (update after deployment)
NEXT_PUBLIC_COMPLIANCE_NFT=0x[ComplianceNFT_Address]
NEXT_PUBLIC_COMPLIANT_HOOK=0x[CompliantLPHook_Address]

# Token Addresses (Unichain Sepolia)
NEXT_PUBLIC_USDC=0x31d0220469e10c4E71834a79b1f276d740d3768F
NEXT_PUBLIC_ECOP=0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=1301

# Optional: Telegram Notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### **Database Setup**

The app uses Prisma with SQLite for development:

```bash
# Initialize database
cd packages/nextjs
npx prisma generate
npx prisma db push
```

## 🌐 Deployment

### **Smart Contracts**

#### **Unichain Sepolia Addresses**
- **PoolManager**: `0x00B036B58a818B1BC34d502D3fE730Db729e62AC`
- **Universal Router**: `0xf70536b3bcc1bd1a972dc186a2cf84cc6da6be5d`
- **Position Manager**: `0xf969aee60879c54baaed9f3ed26147db216fd664`

#### **Deployment Scripts**
- `Deploy.s.sol` - Main deployment script
- `DeployComplianceNFT.s.sol` - Individual NFT deployment
- `DeployCompliantLPHook.s.sol` - Individual hook deployment
- `DeployConvexoComplete.s.sol` - Complete platform deployment

### **Frontend Deployment**

```bash
# Build for production
yarn build

# Deploy to Vercel/Netlify
yarn deploy
```

## 🔐 Security Features

### **Compliance Enforcement**
- **Soulbound NFTs** - Non-transferable, 1-year validity
- **Admin-Only Minting** - Only authorized admin can issue NFTs
- **Automatic Expiry** - Time-based compliance validation

### **Pool Access Control**
- **Hook-Gated Pools** - Only NFT holders can participate
- **Swap Restrictions** - Compliance check before every swap
- **Liquidity Gating** - Compliance check for LP operations

### **Role-Based Access**
- **Admin Functions** - Restricted to configured admin address
- **User Verification** - Wallet-based authentication
- **Request Gating** - Compliance-based feature access

## 🔗 Uniswap v4 Integration

### **CompliantLPHook**
- **Hook Address**: `0x[YourDeployedHookAddress]`
- **Permissions**: `beforeSwap` + `beforeModifyPosition`
- **Enforcement**: Only ComplianceNFT holders can interact

### **Creating Compliant Pools**

1. **Go to**: https://app.uniswap.org
2. **Switch to**: Unichain Sepolia (Chain ID: 1301)
3. **Create Pool** with:
   - **Token A**: USDC (`0x31d0220469e10c4E71834a79b1f276d740d3768F`)
   - **Token B**: ECOP (`0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b`)
   - **Hook**: Your deployed CompliantLPHook address
   - **Fee**: 0.3% (3000)

## 📊 API Reference

### **Verification Endpoints**
- `POST /api/verification/submit` - Submit verification request
- `GET /api/verification/list` - List verification requests (admin)
- `PATCH /api/verification/:id` - Update request status (admin)

### **Cash Request Endpoints**
- `POST /api/cash/submit` - Submit cash request
- `GET /api/cash/list` - List cash requests (user/admin scoped)
- `PATCH /api/cash/:id` - Update request status (admin)

## 🧪 Testing

### **Local Development**
```bash
# Start local chain
yarn chain

# Deploy contracts
yarn deploy

# Run tests
yarn test
```

### **Contract Testing**
- Use the **Debug section** (`/debug`) for interactive testing
- Test compliance gating with different addresses
- Verify admin functions work correctly

## 🛠️ Development

### **Project Structure**
```
convexo/
├── packages/
│   ├── foundry/          # Smart contracts
│   │   ├── contracts/    # Solidity contracts
│   │   ├── script/       # Deployment scripts
│   │   └── test/         # Contract tests
│   └── nextjs/           # Frontend application
│       ├── app/          # Next.js app router
│       ├── components/   # React components
│       ├── contracts/    # Contract ABIs and addresses
│       └── utils/        # Utility functions
```

### **Key Components**
- **ComplianceStatus.tsx** - Shows user compliance status
- **DynamicForm.tsx** - Renders verification forms from CSV
- **ERC20Balance.tsx** - Displays token balances
- **AdminContractInfo.tsx** - Contract information display

### **Adding New Features**
1. **Smart Contracts**: Add to `packages/foundry/contracts/`
2. **Deployment**: Create script in `packages/foundry/script/`
3. **Frontend**: Add pages/components in `packages/nextjs/`
4. **API**: Add routes in `packages/nextjs/app/api/`

## 🔧 Troubleshooting

### **Common Issues**

**Contracts not showing in debug section?**
- Check `deployedContracts.ts` has correct addresses
- Restart the development server
- Verify network configuration

**Admin functions not working?**
- Ensure `NEXT_PUBLIC_ADMIN_ADDRESS` matches your wallet
- Check ComplianceNFT is deployed and configured
- Verify contract addresses in deployedContracts.ts

**Hook deployment fails?**
- Check Unichain Sepolia RPC is working
- Ensure keystore has sufficient ETH
- Try deploying to localhost first

**Frontend build errors?**
- Run `yarn lint --fix` to fix formatting
- Check TypeScript errors with `yarn build`
- Ensure all environment variables are set

### **Network Issues**
- **Unichain Sepolia RPC**: `https://sepolia.unichain.org`
- **Chain ID**: 1301
- **Block Explorer**: `https://sepolia.uniscan.xyz`

## 📖 Documentation

### **Contract Documentation**
- **ComplianceNFT**: Soulbound ERC721 with admin controls
- **CompliantLPHook**: Uniswap v4 hook with compliance gating

### **API Documentation**
- REST APIs for verification and cash requests
- Telegram integration for notifications
- Prisma database schema

### **Frontend Documentation**
- React components with TypeScript
- Wagmi hooks for contract interactions
- Scaffold-ETH utilities and components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Scaffold-ETH 2](https://scaffoldeth.io/)
- Powered by [Uniswap v4](https://docs.uniswap.org/contracts/v4/overview)
- Deployed on [Unichain](https://unichain.org/)

---

**🎉 Ready for compliant DeFi! Deploy, configure, and start building the future of regulated decentralized finance.**