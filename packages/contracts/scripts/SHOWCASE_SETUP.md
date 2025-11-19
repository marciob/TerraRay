# Quick Showcase Setup

This guide will get your wallet authorized for the Semaphore ZK demo in **under 5 minutes**.

## Your Address
```
0x247d4ec27d2d6a059e237dcb381d5a62a2767da2
```

## Step 1: Deploy Contracts (if not already deployed)

```bash
cd packages/contracts

# Deploy AccessControl
npx hardhat deploy --tags AccessControl --network rayls-devnet

# Note the deployed address
```

## Step 2: Create Semaphore Group (if not already created)

```bash
# If you have Semaphore already deployed
SEMAPHORE_ADDRESS=0xYourSemaphoreAddress \
npx hardhat run scripts/create-auth-group.ts --network rayls-devnet

# Note the group ID (usually 1)
```

## Step 3: Add Your Wallet to Group (QUICK METHOD)

```bash
# This adds your specific address with a deterministic identity
WALLET_ADDRESS=0x247d4ec27d2d6a059e237dcb381d5a62a2767da2 \
SEMAPHORE_ADDRESS=0xYourSemaphoreAddress \
GROUP_ID=1 \
npx hardhat run scripts/quick-add-showcase-user.ts --network rayls-devnet
```

**This script will:**
1. Generate a Semaphore identity for your wallet
2. Add the commitment to the authorized group
3. Save the identity to `showcase-identity.json`
4. Create a browser script for easy import

## Step 4: Import Identity in Frontend

### Option A: Browser Console (Fastest)
1. Open http://localhost:3000
2. Connect wallet (0x247d4ec27d2d6a059e237dcb381d5a62a2767da2)
3. Open browser console (F12)
4. Copy the script from `frontend-import.js` and paste it
5. Refresh the page

### Option B: Manual Import
1. Open the file `packages/contracts/showcase-identity.json`
2. Copy the `privateKey` value
3. In browser console:
```javascript
localStorage.setItem('rayls_semaphore_identity', 'PASTE_PRIVATE_KEY_HERE');
```
4. Refresh the page

## Step 5: Test Access

1. Visit: http://localhost:3000/operator/farmers-protected
2. You should see "✅ Authorized" status
3. Click "Load Sensitive Data" to test ZK proof generation
4. Data loads successfully! 🎉

## Quick Verification Checklist

- [ ] Contracts deployed
- [ ] Semaphore group created
- [ ] Your address added to group (via script)
- [ ] Identity imported in frontend
- [ ] Can access protected page
- [ ] ZK proof generates successfully
- [ ] Sensitive data loads

## Troubleshooting

### "Not Authorized"
- Check that script completed successfully
- Verify group ID is correct
- Make sure you're connected with the right wallet

### "Invalid Proof"
- Check that Semaphore address is correct in frontend config
- Verify group ID matches in `apps/web/app/lib/contracts.ts`

### "Can't Import Identity"
- Make sure you're using the correct wallet address
- Try clearing localStorage: `localStorage.clear()` then reimport

## For Production

This quick method is for **demo purposes only**. In production:

1. Users generate their own identities
2. Users share only their commitment (not private key)
3. Admin adds commitments to group via proper admin panel
4. Users keep their private keys secure

## Script NPM Command

For convenience, add to `packages/contracts/package.json`:

```json
{
  "scripts": {
    "showcase:add-user": "hardhat run scripts/quick-add-showcase-user.ts --network rayls"
  }
}
```

Then run:
```bash
WALLET_ADDRESS=0x247d4ec27d2d6a059e237dcb381d5a62a2767da2 \
SEMAPHORE_ADDRESS=0x... \
GROUP_ID=1 \
pnpm showcase:add-user
```

---

**Ready to showcase! 🚀**

