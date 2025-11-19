import { ethers } from "hardhat";
import { Identity } from "@semaphore-protocol/identity";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to add members to the Authorized Viewers group
 * Run: npx hardhat run scripts/add-members.ts --network rayls-devnet
 */
async function main() {
  console.log("\n👥 Adding Members to Authorized Viewers Group...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get configuration from environment
  const SEMAPHORE_ADDRESS = process.env.SEMAPHORE_ADDRESS || "";
  const GROUP_ID = process.env.GROUP_ID || "";
  
  if (!SEMAPHORE_ADDRESS || !GROUP_ID) {
    console.error("❌ Missing required environment variables");
    console.log("Required: SEMAPHORE_ADDRESS, GROUP_ID");
    console.log("Example: GROUP_ID=1 SEMAPHORE_ADDRESS=0x... npx hardhat run ...");
    process.exit(1);
  }

  const groupId = parseInt(GROUP_ID);

  // Get Semaphore contract
  const ISemaphore = await ethers.getContractFactory("ISemaphore");
  const semaphore = ISemaphore.attach(SEMAPHORE_ADDRESS);

  console.log("Semaphore contract:", SEMAPHORE_ADDRESS);
  console.log("Group ID:", groupId);

  // Option 1: Create new identities for operators/banks
  console.log("\n🔑 Generating identities for authorized users...");
  
  const operator1 = new Identity();
  const operator2 = new Identity();
  const bank1 = new Identity();

  const identities = [
    { role: "Operator #1", identity: operator1 },
    { role: "Operator #2", identity: operator2 },
    { role: "Bank #1", identity: bank1 },
  ];

  console.log("\n📋 Generated Identities:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const identityData: any[] = [];
  
  for (const { role, identity } of identities) {
    console.log(`\n${role}:`);
    console.log("  Commitment:", identity.commitment.toString());
    console.log("  Private Key:", identity.export());
    
    identityData.push({
      role,
      commitment: identity.commitment.toString(),
      privateKey: identity.export(),
    });
  }
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Save identities to file
  const identitiesPath = path.join(__dirname, "../identities.json");
  fs.writeFileSync(identitiesPath, JSON.stringify(identityData, null, 2));
  console.log("\n💾 Identities saved to:", identitiesPath);
  console.log("⚠️  IMPORTANT: Keep this file secure! Contains private keys.");

  // Add commitments to group
  console.log("\n📝 Adding members to group...");
  
  const commitments = identities.map(({ identity }) => identity.commitment);
  
  const tx = await semaphore.addMembers(groupId, commitments);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Members added successfully");

  // Verify members were added
  console.log("\n🔍 Verifying group members...");
  // Note: Semaphore doesn't have a direct getter for members
  // You'll need to use events or subgraph in production
  console.log("✅ Members should now be in the group");

  console.log("\n📝 Next steps:");
  console.log("1. Distribute private keys to operators/banks securely");
  console.log("2. Users can import identities using Identity.import(privateKey)");
  console.log("3. Test access at /operator/farmers-protected");
  console.log("\n⚠️  For production:");
  console.log("   - Users should generate their own identities");
  console.log("   - Admin adds user commitments to group");
  console.log("   - Never share private keys");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

