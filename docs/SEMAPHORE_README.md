# 🔐 Semaphore ZK Access Control for Rayls

## Overview

This implementation uses **Semaphore protocol** to create a zero-knowledge proof-based access control system for sensitive farmer data in the Rayls platform.

## ✨ What It Does

- **Protects sensitive data**: Farmer addresses, credit scores, loan details, etc.
- **Provides anonymity**: Operators/banks prove authorization without revealing identity
- **Maintains auditability**: All access is logged via nullifiers and on-chain events
- **Uses cutting-edge crypto**: ZK-SNARKs demonstrate innovation

## 🎯 The Problem

**Before**: Anyone visiting the website could see all farmer data, including:
- Personal information (names, addresses, phone numbers)
- Financial data (credit scores, loan amounts, outstanding debts)
- Business information (CNPJ, wallet addresses)

**After**: Only authorized operators and banks can access this data by generating zero-knowledge proofs that verify they're in the authorized group without revealing which specific operator/bank they are.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Semaphore Group: "Authorized Viewers"          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ Operator 1 │  │ Operator 2 │  │  Bank 1    │  │  Bank 2    ││
│  │ (commitment│  │ (commitment│  │ (commitment│  │ (commitment││
│  │    #123)   │  │    #456)   │  │    #789)   │  │    #ABC)   ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌────────────────────┐
                    │   ZK Proof         │
                    │  "I'm in the       │
                    │   group, but you   │
                    │   don't know which │
                    │   member I am"     │
                    └────────────────────┘
                              ↓
                    ┌────────────────────┐
                    │  Backend Verifies  │
                    │  → Grant Access    │
                    └────────────────────┘
                              ↓
                    ┌────────────────────┐
                    │  Sensitive Data    │
                    │  (farmers, loans,  │
                    │   repayments)      │
                    └────────────────────┘
```

## 📦 What's Included

### Smart Contracts
- `AccessControl.sol` - Manages authorization and Semaphore integration
- Deployment scripts with Hardhat Deploy
- Management scripts for groups and members

### Frontend Components
- `ProtectedRoute` - Wraps protected pages with ZK auth
- `SemaphoreStatus` - Shows user's authorization status
- `useSemaphoreAccess` - React hook for identity/proof management
- Utility functions for identity generation and proof creation

### Backend API
- `/api/verify-access` - Verifies ZK proofs
- `/api/farmers-protected` - Example protected endpoint
- Access token system with nullifier tracking

### Documentation
- Complete integration guide
- 15-minute quick start
- This README
- Implementation summary

## 🚀 Quick Start (15 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd apps/web
pnpm add @semaphore-protocol/identity @semaphore-protocol/proof @semaphore-protocol/group

# Contracts
cd ../../packages/contracts
pnpm add @semaphore-protocol/contracts @semaphore-protocol/identity hardhat-deploy

# Install all
pnpm install
```

### 2. Deploy Contracts

```bash
cd packages/contracts

# Deploy AccessControl
npx hardhat deploy --tags AccessControl --network rayls-devnet

# Create group and configure
SEMAPHORE_ADDRESS=0x... pnpm semaphore:create-group

# Add initial members
GROUP_ID=1 SEMAPHORE_ADDRESS=0x... pnpm semaphore:add-members
```

### 3. Configure Frontend

Update `apps/web/app/lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  // ... existing contracts ...
  AccessControl: "0x...", // Your deployed address
  Semaphore: "0x...",     // Semaphore.sol address
} as const;

export const AUTHORIZED_GROUP_ID = 1; // Your group ID
```

### 4. Test It

```bash
cd apps/web
pnpm dev

# Visit: http://localhost:3000/operator/farmers-protected
# Follow the prompts to generate identity and access data
```

## 📖 Documentation

### For Developers
- **[Integration Guide](./SEMAPHORE_INTEGRATION.md)** - Complete technical details
- **[Quick Start](./QUICK_START_SEMAPHORE.md)** - Get running in 15 minutes
- **[Implementation Summary](./SEMAPHORE_IMPLEMENTATION_SUMMARY.md)** - What was built

### Key Concepts
1. **Semaphore Identity**: Created from wallet signature, stored locally
2. **Group Membership**: Admins add identity commitments to on-chain group
3. **ZK Proof**: User proves group membership without revealing identity
4. **Nullifier**: Prevents proof replay attacks
5. **Access Token**: Short-lived token granted after proof verification

## 🛡️ How to Use

### For Operators/Banks (End Users)

1. **Connect Wallet**: Use RainbowKit to connect your wallet
2. **Generate Identity**: Sign a message to create your Semaphore identity
3. **Get Authorized**: Send your commitment to admin to be added to group
4. **Access Data**: Navigate to protected pages and generate proofs automatically

### For Admins (Group Managers)

```bash
# Add a new authorized user
COMMITMENT=0x123abc... \
GROUP_ID=1 \
SEMAPHORE_ADDRESS=0xdef456... \
pnpm semaphore:add-member

# Or batch add multiple users
GROUP_ID=1 \
SEMAPHORE_ADDRESS=0xdef456... \
pnpm semaphore:add-members
```

### For Developers (Integrating New Pages)

#### Protect a Page (3 lines)
```tsx
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ACCESS_SCOPES } from "@/app/lib/semaphore-utils";

export default function YourPage() {
  return (
    <ProtectedRoute scope={ACCESS_SCOPES.VIEW_FARMERS}>
      <YourSensitiveContent />
    </ProtectedRoute>
  );
}
```

#### Protect an API Endpoint (5 lines)
```typescript
import { verifyAccessToken } from "../verify-access/route";

export async function GET(req: NextRequest) {
  if (!await verifyAccessToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.json({ data: sensitiveData });
}
```

## 🔍 Testing Checklist

Before going to production:

- [ ] Contracts deployed to testnet/mainnet
- [ ] Group created with initial members
- [ ] Frontend configured with correct addresses
- [ ] Identity generation works
- [ ] Proof generation and verification work
- [ ] Protected pages reject unauthorized users
- [ ] Protected pages grant access to authorized users
- [ ] API endpoints enforce access control
- [ ] Nullifiers prevent replay attacks
- [ ] Access tokens expire correctly
- [ ] Error messages are clear and helpful

## 🔒 Security Best Practices

### For Production

1. **Store nullifiers in Redis/Database** (not in-memory)
2. **Use proper JWT for access tokens** (not base64)
3. **Implement rate limiting** on proof verification
4. **Use secure enclave** for identity storage (not localStorage)
5. **Monitor access logs** for abuse patterns
6. **Set up alerts** for failed verifications
7. **Implement automatic cleanup** for old nullifiers
8. **Deploy Semaphore subgraph** for efficient member fetching

### Security Features

✅ **Nullifier tracking** prevents replay attacks  
✅ **Merkle root validation** prevents stale proofs  
✅ **Short-lived tokens** (15min expiry)  
✅ **Cryptographic verification** of all proofs  
✅ **No PII on-chain** (only commitments stored)  
✅ **Auditable access** via nullifier logs  

## 📊 Project Structure

```
├── packages/contracts/
│   ├── contracts/
│   │   └── AccessControl.sol                    ← Access control contract
│   ├── deploy/
│   │   └── 02_deploy_access_control.ts         ← Deployment script
│   └── scripts/
│       ├── create-auth-group.ts                ← Create Semaphore group
│       ├── add-members.ts                      ← Batch add members
│       └── add-single-member.ts                ← Add single member
│
├── apps/web/app/
│   ├── lib/
│   │   ├── semaphore-utils.ts                  ← Core utilities
│   │   └── hooks/
│   │       └── useSemaphoreAccess.ts           ← React hook
│   ├── components/
│   │   └── auth/
│   │       ├── ProtectedRoute.tsx              ← Page wrapper
│   │       └── SemaphoreStatus.tsx             ← Status widget
│   ├── api/
│   │   ├── verify-access/route.ts              ← Proof verification
│   │   └── farmers-protected/route.ts          ← Example protected API
│   └── operator/
│       └── farmers-protected/page.tsx          ← Example protected page
│
└── docs/
    ├── SEMAPHORE_README.md                      ← This file
    ├── SEMAPHORE_INTEGRATION.md                 ← Technical guide
    ├── QUICK_START_SEMAPHORE.md                 ← Quick start
    └── SEMAPHORE_IMPLEMENTATION_SUMMARY.md      ← What was built
```

## 🎨 UI Screenshots

### Before Authorization
```
┌─────────────────────────────────────────┐
│  🔒 Protected Area                      │
│                                         │
│  This area contains sensitive farmer   │
│  data and is restricted to authorized  │
│  operators and banks.                  │
│                                         │
│  [Connect Wallet]                      │
└─────────────────────────────────────────┘
```

### Generate Identity
```
┌─────────────────────────────────────────┐
│  🔑 Generate ZK Identity                │
│                                         │
│  To access this area, generate a       │
│  zero-knowledge identity that proves   │
│  authorization without revealing your  │
│  specific identity.                    │
│                                         │
│  How it works:                         │
│  1. Sign message with wallet           │
│  2. Generate Semaphore identity        │
│  3. Prove group membership (ZK)        │
│  4. Access data privately              │
│                                         │
│  [Generate ZK Identity]                │
└─────────────────────────────────────────┘
```

### Access Granted
```
┌─────────────────────────────────────────┐
│  ✅ Protected Farmers Database          │
│                                         │
│  🔐 ZK-Protected Access                │
│  You're viewing data using Semaphore   │
│  zero-knowledge proofs.                │
│                                         │
│  [Load Sensitive Data]                 │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Farmer: Fazenda Primavera        │  │
│  │ CNPJ: 12.345.678/0001-90         │  │
│  │ Wallet: 0x1234...                │  │
│  │ Credit Score: 850                │  │
│  │ ...                              │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 💡 FAQ

### Q: Why Semaphore instead of simple wallet signatures?
**A**: Semaphore provides anonymity - operators can prove authorization without revealing which specific operator they are. It also adds innovation value to the project with ZK proofs.

### Q: Do I need to deploy my own Semaphore contracts?
**A**: No, you can use existing Semaphore deployments on major networks. Just create a new group for your authorized viewers.

### Q: What happens if I lose my identity?
**A**: You can regenerate it by signing the same message with your wallet (deterministic identity). Or generate a new one and have an admin add the new commitment to the group.

### Q: Can farmers use this for privacy too?
**A**: Yes! In future enhancements, farmers could generate Semaphore identities and prove properties about themselves (e.g., "I have credit score > 800") without revealing exact data.

### Q: Is this production-ready?
**A**: The MVP is functional but needs hardening for production (see Security Best Practices). Main TODOs: persistent nullifier storage, proper JWT, rate limiting, monitoring.

### Q: How much does it cost in gas?
**A**: Adding members costs ~100k gas. Proof verification is free (off-chain). Users only pay transaction fees when accessing on-chain data.

## 🎯 Roadmap

### Phase 1: MVP ✅ (You are here!)
- Basic identity generation
- Proof generation and verification
- Protected routes and API endpoints
- Example implementation

### Phase 2: Production (Next 2 weeks)
- Admin panel for group management
- Monitoring dashboard
- Integration with all sensitive pages
- Production security hardening

### Phase 3: Advanced (Future)
- Per-resource scopes and permissions
- Time-limited access grants
- Farmer privacy features
- Multi-group support

## 🤝 Contributing

### Adding New Protected Resources

1. **Add scope** to `semaphore-utils.ts`:
   ```typescript
   export const ACCESS_SCOPES = {
     // ... existing
     VIEW_NEW_RESOURCE: "rayls-view-new-resource",
   };
   ```

2. **Protect the page**:
   ```tsx
   <ProtectedRoute scope={ACCESS_SCOPES.VIEW_NEW_RESOURCE}>
     <YourContent />
   </ProtectedRoute>
   ```

3. **Protect the API**:
   ```typescript
   if (!await verifyAccessToken(req)) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
   }
   ```

### Reporting Issues

Please include:
- Error messages and stack traces
- Steps to reproduce
- Expected vs actual behavior
- Contract addresses and network
- Browser console logs

## 📞 Support

- **Documentation**: See files in `/docs` folder
- **Example Code**: Check `/operator/farmers-protected` page
- **Issues**: Open a GitHub issue
- **Team Chat**: Ask in Discord/Slack

## 🎉 Success Metrics

After implementation, you'll have:

✅ **Zero public farmer data leaks**  
✅ **Operator/bank privacy maintained**  
✅ **Auditable access control**  
✅ **Cutting-edge ZK technology**  
✅ **Easy-to-use developer API**  
✅ **Clear documentation**  

## 🏆 Credits

Built with:
- [Semaphore Protocol](https://semaphore.pse.dev/) by Privacy & Scaling Explorations
- [ZK-Kit](https://github.com/privacy-scaling-explorations/zk-kit) libraries
- [RainbowKit](https://www.rainbowkit.com/) for wallet connection
- [Wagmi](https://wagmi.sh/) for Web3 hooks

---

**Ready to protect your farmers? 🚜🔐**

Start with the [Quick Start Guide](./QUICK_START_SEMAPHORE.md) and have a working system in 15 minutes!

