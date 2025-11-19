import { ethers } from "hardhat";
import { Identity } from "@semaphore-protocol/identity";
import * as fs from "fs";
import * as path from "path";

/**
 * Quick script to add a showcase user for demo purposes
 * This generates a Semaphore identity for a specific wallet address
 * and adds it to the authorized viewers group
 * 
 * Run: WALLET_ADDRESS=0x... GROUP_ID=1 SEMAPHORE_ADDRESS=0x... npx hardhat run scripts/quick-add-showcase-user.ts --network rayls
 */
async function main() {
  console.log("\n🎯 Quick Add Showcase User for Demo\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get configuration
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0x247d4ec27d2d6a059e237dcb381d5a62a2767da2";
  const SEMAPHORE_ADDRESS = process.env.SEMAPHORE_ADDRESS || "";
  const GROUP_ID = process.env.GROUP_ID || "";
  
  if (!SEMAPHORE_ADDRESS || !GROUP_ID) {
    console.error("❌ Missing required environment variables");
    console.log("Required: SEMAPHORE_ADDRESS, GROUP_ID");
    console.log("\nExample:");
    console.log("WALLET_ADDRESS=0x247d4ec27d2d6a059e237dcb381d5a62a2767da2 \\");
    console.log("SEMAPHORE_ADDRESS=0x... \\");
    console.log("GROUP_ID=1 \\");
    console.log("npx hardhat run scripts/quick-add-showcase-user.ts --network rayls");
    process.exit(1);
  }

  const groupId = parseInt(GROUP_ID);

  console.log("Configuration:");
  console.log("  Wallet:", WALLET_ADDRESS);
  console.log("  Semaphore:", SEMAPHORE_ADDRESS);
  console.log("  Group ID:", groupId);

  // Generate deterministic identity from wallet address
  console.log("\n🔑 Generating Semaphore identity...");
  
  // Use wallet address as seed for deterministic identity
  // This allows the user to "recover" their identity by using their address
  const identitySeed = `rayls-showcase-${WALLET_ADDRESS.toLowerCase()}`;
  const identity = new Identity(identitySeed);
  
  console.log("✅ Identity generated:");
  console.log("  Commitment:", identity.commitment.toString());
  console.log("  Private Key:", identity.export());

  // Save identity to file for user to import
  const showcaseIdentity = {
    walletAddress: WALLET_ADDRESS.toLowerCase(),
    commitment: identity.commitment.toString(),
    privateKey: identity.export(),
    generatedAt: new Date().toISOString(),
    note: "Import this identity in the frontend using Identity.import(privateKey)",
  };

  const identityPath = path.join(__dirname, "../showcase-identity.json");
  fs.writeFileSync(identityPath, JSON.stringify(showcaseIdentity, null, 2));
  console.log("\n💾 Identity saved to:", identityPath);

  // Add commitment to Semaphore group
  console.log("\n📝 Adding to Semaphore group...");
  
  const ISemaphore = await ethers.getContractFactory("ISemaphore");
  const semaphore = ISemaphore.attach(SEMAPHORE_ADDRESS);

  try {
    const tx = await semaphore.addMember(groupId, identity.commitment);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ Successfully added to group!");
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log("⚠️  Commitment already in group (that's OK!)");
    } else {
      throw error;
    }
  }

  // Create frontend import instructions
  console.log("\n" + "=".repeat(70));
  console.log("🎉 SHOWCASE USER READY!");
  console.log("=".repeat(70));
  
  console.log("\n📋 Frontend Setup Instructions:");
  console.log("\n1. Copy this private key:");
  console.log("   " + identity.export());
  
  console.log("\n2. In the browser console (after connecting wallet), run:");
  console.log(`   localStorage.setItem('rayls_semaphore_identity', '${identity.export()}')`);
  
  console.log("\n3. Or use the \"Import Identity\" feature (if implemented)");
  
  console.log("\n4. Refresh the page and visit:");
  console.log("   http://localhost:3000/operator/farmers-protected");
  
  console.log("\n5. You should now be authorized!");

  console.log("\n" + "=".repeat(70));
  console.log("📝 IMPORTANT NOTES:");
  console.log("=".repeat(70));
  console.log("• Identity is deterministic (generated from your wallet address)");
  console.log("• Keep the private key secure");
  console.log("• You can regenerate this same identity anytime using this script");
  console.log("• For production, users should generate their own identities");
  console.log("");

  // Create a quick import script for the frontend
  const frontendScript = `
// Quick Import Script for Browser Console
// Paste this into your browser console after connecting wallet ${WALLET_ADDRESS}

localStorage.setItem('rayls_semaphore_identity', '${identity.export()}');
console.log('✅ Semaphore identity imported!');
console.log('Refresh the page to activate.');
`.trim();

  const scriptPath = path.join(__dirname, "../frontend-import.js");
  fs.writeFileSync(scriptPath, frontendScript);
  console.log("📄 Frontend import script saved to:", scriptPath);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

