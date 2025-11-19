# Semaphore ZK Integration for Access Control

## Overview

This document outlines the integration of Semaphore protocol for zero-knowledge proof-based access control to sensitive farmer data.

## Problem Statement

Currently, all data (farmer addresses, loan details, credit scores) is publicly visible on the website. This data is sensitive and should only be accessible to:
- **Operators**: Those who originate and manage loans
- **Banks/Investors**: Those who provide capital and need due diligence

## Solution: Semaphore-Based Access Control

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Semaphore Group                            │
│              "Authorized Viewers"                             │
│                                                               │
│  Members:                                                     │
│  • Operator #1 (identity commitment)                          │
│  • Operator #2 (identity commitment)                          │
│  • Bank #1 (identity commitment)                              │
│  • Bank #2 (identity commitment)                              │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│              Access Flow (ZK Proof)                           │
│                                                               │
│  1. User wants to view /operator/farmers                      │
│  2. Frontend generates Semaphore proof:                       │
│     - Proves: "I'm in AuthorizedViewers group"                │
│     - Scope: "view-farmers-2025-01"                           │
│     - Message: hash(wallet_address)                           │
│  3. Backend verifies proof                                    │
│  4. If valid → return sensitive data                          │
│  5. If invalid → return 403 Forbidden                         │
└──────────────────────────────────────────────────────────────┘
```

### Benefits

1. **Privacy**: Farmers' sensitive data is protected
2. **Anonymity**: Operators/banks can prove authorization without revealing identity
3. **Auditability**: On-chain group membership is transparent
4. **Innovation**: ZK proofs add cutting-edge tech to the project
5. **Flexibility**: Easy to add/remove authorized viewers

## Implementation Steps

### Phase 1: Smart Contracts (2-3 hours)

1. **Deploy Semaphore contracts**
   ```bash
   # Use official Semaphore contracts or deploy to Rayls DevNet
   cd packages/contracts
   npm install @semaphore-protocol/contracts
   ```

2. **Create AccessControl contract**
   - Manages the authorized viewers group
   - Records nullifiers to prevent replay attacks
   - Integrates with Semaphore.sol

3. **Deploy and configure**
   ```bash
   npx hardhat run scripts/deploy-access-control.ts --network rayls-devnet
   ```

### Phase 2: Frontend Integration (3-4 hours)

1. **Install Semaphore packages**
   ```bash
   cd apps/web
   pnpm add @semaphore-protocol/identity @semaphore-protocol/proof @semaphore-protocol/group
   ```

2. **Create identity management**
   - Generate Semaphore identity from wallet signature
   - Store identity securely (local storage with encryption)
   - Allow identity export/import

3. **Add proof generation hooks**
   ```typescript
   // hooks/useSemaphoreAccess.ts
   const { generateAccessProof } = useSemaphoreAccess();
   
   const proof = await generateAccessProof({
     scope: "view-farmers",
     message: hash(userAddress)
   });
   ```

4. **Gate sensitive pages**
   - Wrap protected routes with `<ProtectedRoute>`
   - Check proof validity before rendering
   - Show "Access Denied" for unauthorized users

### Phase 3: Backend Integration (2-3 hours)

1. **Add proof verification middleware**
   ```typescript
   // middleware/verifyAccess.ts
   export async function verifyAccess(req, res, next) {
     const proof = req.headers['x-semaphore-proof'];
     if (!proof) return res.status(403).json({ error: 'No proof' });
     
     const isValid = await verifyProof(proof);
     if (!isValid) return res.status(403).json({ error: 'Invalid proof' });
     
     next();
   }
   ```

2. **Protect API endpoints**
   ```typescript
   // /api/farmers/route.ts
   export async function GET(req: Request) {
     await verifyAccess(req); // Throws if invalid
     return farmers; // Return sensitive data
   }
   ```

### Phase 4: Admin Panel (2 hours)

1. **Group management UI**
   - Add new operators/banks to group
   - Remove revoked members
   - View group members (commitments only)

2. **Monitoring dashboard**
   - Track proof verification attempts
   - Monitor nullifier usage
   - Audit access logs

## Technical Details

### Semaphore Identity Generation

```typescript
import { Identity } from '@semaphore-protocol/identity';
import { signMessage } from 'wagmi';

// Generate deterministic identity from wallet
const message = "Sign this message to create your Rayls access identity";
const signature = await signMessage({ message });
const identity = new Identity(signature);

// Store identity commitment on-chain
await addMemberToGroup(identity.commitment);
```

### Proof Generation

```typescript
import { generateProof } from '@semaphore-protocol/proof';
import { Group } from '@semaphore-protocol/group';

// Fetch group members from contract
const members = await fetchGroupMembers(groupId);
const group = new Group(members);

// Generate proof
const scope = "view-farmers"; // Unique per resource
const message = hash(userAddress);
const proof = await generateProof(identity, group, message, scope);

// Send to backend for verification
await fetch('/api/verify-access', {
  method: 'POST',
  body: JSON.stringify({ proof })
});
```

### Proof Verification (Backend)

```typescript
import { verifyProof } from '@semaphore-protocol/proof';

export async function verifyAccessProof(proof: SemaphoreProof) {
  // 1. Verify the proof cryptographically
  const isValid = await verifyProof(proof);
  if (!isValid) return false;
  
  // 2. Check nullifier hasn't been used
  const hasBeenUsed = await checkNullifier(proof.nullifier);
  if (hasBeenUsed) return false;
  
  // 3. Verify merkle root is current or recent
  const isCurrentRoot = await checkMerkleRoot(proof.merkleTreeRoot);
  if (!isCurrentRoot) return false;
  
  // 4. Record nullifier usage
  await recordNullifier(proof.nullifier);
  
  return true;
}
```

## Security Considerations

1. **Nullifier Management**
   - Store nullifiers per scope to prevent replay
   - Clean up old nullifiers periodically
   - Rate-limit proof verification attempts

2. **Merkle Root Validation**
   - Accept proofs with roots from last N blocks
   - Handle group membership changes gracefully
   - Provide clear error messages for outdated proofs

3. **Identity Security**
   - Store identities encrypted in local storage
   - Never expose private keys to backend
   - Implement identity recovery mechanism

4. **DoS Prevention**
   - Rate-limit proof generation
   - Cache verified proofs (short TTL)
   - Monitor for abuse patterns

## Alternative Approaches

### Option 1: Simpler Wallet-Based Auth
```typescript
// Simpler but less private
const signature = await signMessage({ message: nonce });
if (verify(signature, authorizedAddresses)) {
  return sensitiveData;
}
```
**Pros**: Simpler, faster to implement
**Cons**: No anonymity, no ZK innovation

### Option 2: Hybrid Approach
```typescript
// Use Semaphore for high-value operations
// Use simple signature for low-value reads
if (operation === 'view-credit-score') {
  await verifySemaphoreProof(); // ZK proof required
} else if (operation === 'view-public-stats') {
  // No auth required
}
```

## Roadmap

### MVP (Week 1)
- [ ] Deploy Semaphore contracts
- [ ] Create AccessControl contract
- [ ] Basic identity generation
- [ ] Protect /operator/* routes
- [ ] Simple proof verification

### Enhancement (Week 2)
- [ ] Admin panel for group management
- [ ] Proof caching for better UX
- [ ] Monitoring dashboard
- [ ] Null ifier cleanup automation

### Advanced (Week 3+)
- [ ] Per-resource scopes (farmers, loans, repayments)
- [ ] Time-limited access tokens
- [ ] Integration with Credit Passport NFT
- [ ] ZK proofs for farmer privacy too

## Resources

- Semaphore Docs: https://docs.semaphore.pse.dev/
- Semaphore GitHub: https://github.com/semaphore-protocol/semaphore
- ZK-Kit Libraries: https://github.com/privacy-scaling-explorations/zk-kit
- Rayls DevNet: https://devnet-explorer.rayls.com/

## Questions?

Contact the team or open an issue in the repo.

