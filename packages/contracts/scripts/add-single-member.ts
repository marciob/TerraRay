import { ethers } from "hardhat";

/**
 * Script to add a single member (identity commitment) to the group
 * Useful when a new user generates their identity and needs to be authorized
 * 
 * Run: COMMITMENT=0x... GROUP_ID=1 npx hardhat run scripts/add-single-member.ts --network rayls-devnet
 */
async function main() {
  console.log("\n➕ Adding Single Member to Group...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get configuration
  const SEMAPHORE_ADDRESS = process.env.SEMAPHORE_ADDRESS || "";
  const GROUP_ID = process.env.GROUP_ID || "";
  const COMMITMENT = process.env.COMMITMENT || "";
  
  if (!SEMAPHORE_ADDRESS || !GROUP_ID || !COMMITMENT) {
    console.error("❌ Missing required environment variables");
    console.log("Required: SEMAPHORE_ADDRESS, GROUP_ID, COMMITMENT");
    console.log("\nExample:");
    console.log("SEMAPHORE_ADDRESS=0xabc... \\");
    console.log("GROUP_ID=1 \\");
    console.log("COMMITMENT=0x123... \\");
    console.log("npx hardhat run scripts/add-single-member.ts --network rayls-devnet");
    process.exit(1);
  }

  const groupId = parseInt(GROUP_ID);

  // Get Semaphore contract
  const ISemaphore = await ethers.getContractFactory("ISemaphore");
  const semaphore = ISemaphore.attach(SEMAPHORE_ADDRESS);

  console.log("Semaphore Address:", SEMAPHORE_ADDRESS);
  console.log("Group ID:", groupId);
  console.log("Commitment:", COMMITMENT);

  // Add member to group
  console.log("\n📝 Adding member to group...");
  
  const tx = await semaphore.addMember(groupId, COMMITMENT);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Member added successfully");

  console.log("\n📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Group ID:", groupId);
  console.log("New Member Commitment:", COMMITMENT);
  console.log("Transaction:", tx.hash);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n✅ User can now access protected resources!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

