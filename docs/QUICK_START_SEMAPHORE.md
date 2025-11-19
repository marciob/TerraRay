# Quick Start: Semaphore ZK Access Control

This guide will walk you through setting up and testing the Semaphore-based access control system.

## 🚀 Quick Setup (15 minutes)

### 1. Install Dependencies

```bash
# Frontend (Next.js)
cd apps/web
pnpm add @semaphore-protocol/identity @semaphore-protocol/proof @semaphore-protocol/group

# Contracts (Hardhat)
cd ../../packages/contracts
pnpm add @semaphore-protocol/contracts
```

### 2. Deploy Contracts

#### Option A: Use Existing Semaphore Deployment (Recommended for Testing)

If Semaphore contracts are already deployed on your network:

```bash
# Just deploy AccessControl
cd packages/contracts
npx hardhat deploy --tags AccessControl --network rayls-devnet
```

Then configure it with existing Semaphore address:

```solidity
// In Hardhat console or script
const accessControl = await ethers.getContract("AccessControl");
await accessControl.configureSemaphore(
  "0x...", // Semaphore.sol address
  1        // Your group ID
);
```

#### Option B: Deploy Full Semaphore Stack (For Production)

```bash
# Install Semaphore
pnpm add -D @semaphore-protocol/contracts

# Deploy everything
npx hardhat deploy --network rayls-devnet
```

### 3. Create Authorized Viewers Group

Using the Semaphore contract, create a group for authorized viewers:

```typescript
// scripts/create-auth-group.ts
import { ethers } from "hardhat";

async function main() {
  const semaphore = await ethers.getContractAt(
    "ISemaphore",
    "0x..." // Semaphore address
  );
  
  // Create group (returns group ID)
  const tx = await semaphore.createGroup();
  const receipt = await tx.wait();
  
  // Get group ID from events
  const event = receipt.events?.find(e => e.event === "GroupCreated");
  const groupId = event?.args?.groupId;
  
  console.log("Created group:", groupId);
}
```

### 4. Add Members to Group

Add operator and bank identity commitments to the group:

```typescript
// scripts/add-members.ts
import { Identity } from "@semaphore-protocol/identity";

async function main() {
  const semaphore = await ethers.getContractAt("ISemaphore", "0x...");
  const groupId = 1; // Your group ID
  
  // Create identities for authorized users
  // In production, users create their own identities
  const operator1 = new Identity();
  const operator2 = new Identity();
  const bank1 = new Identity();
  
  // Add members to group
  await semaphore.addMembers(groupId, [
    operator1.commitment,
    operator2.commitment,
    bank1.commitment,
  ]);
  
  console.log("Added members to group");
  console.log("Operator 1 private key:", operator1.export());
  console.log("Operator 2 private key:", operator2.export());
  console.log("Bank 1 private key:", bank1.export());
}
```

**⚠️ Important**: Save these private keys securely! Users will need them to import their identities.

### 5. Update Frontend Configuration

Update the contract addresses in your frontend:

```typescript
// apps/web/app/lib/contracts.ts
export const CONTRACT_ADDRESSES = {
  // ... existing contracts ...
  AccessControl: "0x...", // Your deployed AccessControl address
  Semaphore: "0x...",     // Semaphore.sol address
} as const;

export const AUTHORIZED_GROUP_ID = 1; // Your group ID
```

### 6. Test the System

#### A. Connect Wallet
1. Open http://localhost:3000
2. Connect your wallet

#### B. Generate Identity
1. Navigate to /operator/farmers-protected
2. Click "Generate ZK Identity"
3. Sign the message with your wallet
4. Your Semaphore identity is created and stored locally

#### C. Join the Group (Admin Step)
Since you just generated a new identity, you need to add it to the authorized group:

```typescript
// Copy the identity commitment from the "Access Denied" page
const newCommitment = "0x..."; // From UI

// Add to group (admin only)
const semaphore = await ethers.getContractAt("ISemaphore", "0x...");
await semaphore.addMember(groupId, newCommitment);
```

#### D. Access Protected Data
1. Refresh the page
2. You should now see "Generate Proof" option
3. Click to generate ZK proof
4. Sensitive farmer data loads!

## 📝 Usage in Your Code

### Protect a Page

```tsx
// app/your-page/page.tsx
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ACCESS_SCOPES } from "@/app/lib/semaphore-utils";

export default function YourProtectedPage() {
  return (
    <ProtectedRoute scope={ACCESS_SCOPES.VIEW_FARMERS}>
      <YourSensitiveContent />
    </ProtectedRoute>
  );
}
```

### Protect an API Route

```typescript
// app/api/your-endpoint/route.ts
import { verifyAccessToken } from "../verify-access/route";

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAccessToken(req);
  
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  
  // Return sensitive data
  return NextResponse.json({ data: sensitiveFarmerData });
}
```

### Use the Hook

```tsx
// In any component
import { useSemaphoreAccess } from "@/app/lib/hooks/useSemaphoreAccess";

function MyComponent() {
  const { identity, isAuthorized, generateProof } = useSemaphoreAccess();
  
  const accessData = async () => {
    const proof = await generateProof(ACCESS_SCOPES.VIEW_FARMERS);
    // Use proof to call protected API
  };
}
```

## 🔍 Testing Checklist

- [ ] Contracts deployed successfully
- [ ] Group created with authorized members
- [ ] Frontend can generate identities
- [ ] Identity commitments stored on-chain
- [ ] Proof generation works
- [ ] Proof verification works
- [ ] Protected pages show "Access Denied" for unauthorized users
- [ ] Protected pages show content for authorized users
- [ ] API endpoints reject requests without valid tokens
- [ ] Nullifiers prevent replay attacks

## 🐛 Troubleshooting

### "Identity not in group"
- **Solution**: Add your identity commitment to the Semaphore group using `addMember()`

### "Proof generation fails"
- **Solution**: Make sure group members are fetched correctly in `semaphore-utils.ts`
- Check that the group ID is correct

### "Invalid proof"
- **Solution**: Verify the scope matches between generation and verification
- Check that the Merkle root is current

### "Module not found: @semaphore-protocol/*"
- **Solution**: Run `pnpm install` in apps/web

## 🎯 Next Steps

1. **Implement real group fetching**: Replace mock data in `fetchGroupMembers()`
2. **Add admin panel**: UI for managing group members
3. **Integrate with other pages**: Protect /operator/loans, /operator/repayments, etc.
4. **Add monitoring**: Track proof verification attempts and access logs
5. **Implement proof caching**: Cache valid proofs client-side for better UX
6. **Add recovery mechanism**: Allow users to recover identities if lost

## 📚 Resources

- [Semaphore Documentation](https://docs.semaphore.pse.dev/)
- [ZK-Kit GitHub](https://github.com/privacy-scaling-explorations/zk-kit)
- [Semaphore Contracts](https://github.com/semaphore-protocol/semaphore/tree/main/packages/contracts)

## 💡 Tips

- **Development**: Use mock data and skip actual proof verification for faster iteration
- **Production**: Always verify proofs on-chain for maximum security
- **UX**: Cache proofs client-side (15min TTL) to avoid regenerating too often
- **Privacy**: Never log identity private keys or send them to the backend

---

**Need help?** Open an issue or ask in the team chat!

