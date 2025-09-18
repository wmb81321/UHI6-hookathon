# Convexo - Compliant DeFi Platform

A comprehensive compliance platform for DeFi built on Scaffold-ETH 2, featuring soulbound verification NFTs and seamless fiat-to-crypto onboarding.

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the `packages/nextjs` directory with:

```bash
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=1301
NEXT_PUBLIC_ADMIN_ADDRESS=0xYourAdminAddressHere

# Contract Addresses (Unichain Sepolia)
NEXT_PUBLIC_COMPLIANCE_NFT=0x6c54026fcccc54424848635edb10591d5fa4fee4
NEXT_PUBLIC_USDC=0x31d0220469e10c4E71834a79b1f276d740d3768F
NEXT_PUBLIC_ECOP=0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b

# Database
DATABASE_URL="file:./dev.db"

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=ekinoxis
```

### 2. Install Dependencies & Setup Database

```bash
cd packages/nextjs
yarn install
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Start the Application

```bash
# From the root directory
yarn chain    # Start local blockchain (optional)
yarn start    # Start the frontend
```

## Features

### 🔐 Compliance System
- **Soulbound NFTs**: Non-transferable compliance tokens with 1-year validity
- **KYC/AML Integration**: Dynamic forms for person and institution verification
- **Admin Controls**: Mint, renew, and revoke compliance NFTs

### 💰 Funding Infrastructure
- **Cash In**: Request fiat deposits and receive ECOP tokens
- **Cash Out**: Send tokens to treasury and request fiat withdrawals
- **Compliance Gating**: All funding features require valid compliance NFT

### 📊 Admin Panel
- **Verification Queue**: Review and manage KYC/AML requests
- **Cash Request Management**: Approve/reject funding requests
- **NFT Operations**: Direct contract interactions for compliance management

### 🔗 Integrations
- **Telegram Notifications**: Real-time alerts for new requests
- **Multi-Chain Support**: Configured for Unichain Sepolia (easily extensible)
- **ENS Support**: Full ENS resolution and display

## Architecture

### Smart Contracts
- **ComplianceNFT**: Soulbound ERC-721 with time-based validity
- **Treasury**: `0x3f9b734394FC1E96afe9523c69d30D227dF4ffca` (treasury.ekinoxis.eth)

### Database Schema
- **Users**: Account management and metadata
- **VerificationRequests**: KYC/AML submission tracking
- **CashRequests**: Funding request management
- **BankAccounts**: User banking information

### API Routes
- `POST /api/verification/submit` - Submit KYC/AML requests
- `GET /api/verification/list` - List verification requests
- `PATCH /api/verification/[id]` - Update request status
- `POST /api/cash/submit` - Submit funding requests
- `GET /api/cash/list` - List cash requests
- `PATCH /api/cash/[id]` - Update cash request status

## Pages

- **`/`** - Landing page with compliance status and navigation
- **`/profile`** - User profile, balances, and verification forms
- **`/funding`** - Cash in/out functionality (compliance-gated)
- **`/admin`** - Admin panel for request management and NFT operations

## Configuration

### Supported Chains
Currently configured for Unichain Sepolia (Chain ID: 1301). To add more chains:

1. Update `scaffold.config.ts` with new chain definitions
2. Add contract addresses to environment variables
3. Update `deployedContracts.ts` with new deployments

### Admin Access
Set `NEXT_PUBLIC_ADMIN_ADDRESS` to your admin wallet address. Only this address can:
- Mint, renew, and revoke compliance NFTs
- Update verification request statuses
- Manage cash request approvals

### Token Addresses
- **USDC**: `0x31d0220469e10c4E71834a79b1f276d740d3768F`
- **ECOP**: `0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b`
- **ETH**: Native token

## Development

### Form Schema
Verification forms are dynamically generated from CSV files:
- `public/data/personas.csv` - Individual verification fields
- `public/data/institutions.csv` - Institution verification fields

### Telegram Integration
Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to receive notifications for:
- New verification requests
- New cash in/out requests

### Database Management
```bash
# Reset database
npx prisma migrate reset

# View data
npx prisma studio

# Generate client after schema changes
npx prisma generate
```

## Security Considerations

1. **Admin Access**: Ensure `NEXT_PUBLIC_ADMIN_ADDRESS` is set to a secure wallet
2. **Environment Variables**: Never commit `.env.local` to version control
3. **Compliance Gating**: All funding features are properly gated by NFT compliance
4. **Soulbound Enforcement**: NFTs cannot be transferred, only minted/revoked by admin

## Future Enhancements

- [ ] SIWE (Sign-In with Ethereum) for enhanced security
- [ ] Multi-signature admin controls
- [ ] Advanced bank account management
- [ ] Uniswap v4 hook integration
- [ ] Multi-chain deployment automation
- [ ] Enhanced file upload handling for KYC documents

---

Built with ❤️ using Scaffold-ETH 2, Prisma, and modern Web3 technologies.
