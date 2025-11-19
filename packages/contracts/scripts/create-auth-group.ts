import { ethers } from "hardhat";

/**
 * Script to create a Semaphore group for authorized viewers
 * Run: npx hardhat run scripts/create-auth-group.ts --network rayls-devnet
 */
async function main() {
  console.log("\n🔐 Creating Authorized Viewers Group...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get Semaphore contract address from environment or use deployed address
  const SEMAPHORE_ADDRESS = process.env.SEMAPHORE_ADDRESS || "";
  
  if (!SEMAPHORE_ADDRESS) {
    console.error("❌ SEMAPHORE_ADDRESS not set in environment");
    console.log("Please set SEMAPHORE_ADDRESS in your .env file");
    console.log("or pass it as: SEMAPHORE_ADDRESS=0x... npx hardhat run ...");
    process.exit(1);
  }

  // Get Semaphore contract
  const ISemaphore = await ethers.getContractFactory("ISemaphore");
  const semaphore = ISemaphore.attach(SEMAPHORE_ADDRESS);

  console.log("Semaphore contract:", SEMAPHORE_ADDRESS);

  // Create a new group
  console.log("\n📝 Creating group...");
  const tx = await semaphore.createGroup();
  const receipt = await tx.wait();

  // Parse event to get group ID
  const groupCreatedEvent = receipt.events?.find(
    (e: any) => e.event === "GroupCreated"
  );
  
  if (!groupCreatedEvent) {
    console.error("❌ Failed to find GroupCreated event");
    process.exit(1);
  }

  const groupId = groupCreatedEvent.args?.groupId;
  console.log("✅ Group created with ID:", groupId.toString());

  // Update AccessControl contract with group ID
  const accessControl = await ethers.getContract("AccessControl");
  console.log("\n⚙️  Configuring AccessControl contract...");
  
  const configureTx = await accessControl.configureSemaphore(
    SEMAPHORE_ADDRESS,
    groupId
  );
  await configureTx.wait();
  
  console.log("✅ AccessControl configured");

  console.log("\n📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Semaphore Address:", SEMAPHORE_ADDRESS);
  console.log("Group ID:", groupId.toString());
  console.log("AccessControl:", accessControl.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📝 Next steps:");
  console.log("1. Add members to the group using: npm run add-members");
  console.log("2. Update frontend with Group ID:", groupId.toString());
  console.log("3. Test access control at /operator/farmers-protected");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

