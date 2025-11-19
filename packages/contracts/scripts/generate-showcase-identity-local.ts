import { Identity } from "@semaphore-protocol/identity";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate Semaphore identity locally for showcase (no blockchain needed)
 * This creates an identity that can be imported in the frontend for demo
 * 
 * Run: WALLET_ADDRESS=0x247d4ec27d2d6a059e237dcb381d5a62a2767da2 npx ts-node scripts/generate-showcase-identity-local.ts
 */
async function main() {
  console.log("\n🎯 Generate Showcase Identity (Local - No Blockchain)\n");

  // Your wallet address
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0x247d4ec27d2d6a059e237dcb381d5a62a2767da2";
  
  console.log("Wallet Address:", WALLET_ADDRESS);

  // Generate deterministic identity from wallet address
  console.log("\n🔑 Generating Semaphore identity...");
  
  const identitySeed = `rayls-showcase-${WALLET_ADDRESS.toLowerCase()}`;
  const identity = new Identity(identitySeed);
  
  console.log("\n✅ Identity Generated:");
  console.log("━".repeat(70));
  console.log("Commitment:", identity.commitment.toString());
  console.log("Private Key:", identity.export());
  console.log("━".repeat(70));

  // Save identity to file
  const showcaseIdentity = {
    walletAddress: WALLET_ADDRESS.toLowerCase(),
    commitment: identity.commitment.toString(),
    privateKey: identity.export(),
    generatedAt: new Date().toISOString(),
    note: "Import this in frontend using: localStorage.setItem('rayls_semaphore_identity', privateKey)",
  };

  const identityPath = path.join(__dirname, "../showcase-identity.json");
  fs.writeFileSync(identityPath, JSON.stringify(showcaseIdentity, null, 2));
  console.log("\n💾 Identity saved to:", identityPath);

  // Create browser import script
  const frontendScript = `
// 🔐 Semaphore Identity Import Script
// Paste this in your browser console after connecting wallet ${WALLET_ADDRESS}

localStorage.setItem('rayls_semaphore_identity', '${identity.export()}');
console.log('✅ Semaphore identity imported!');
console.log('Identity Commitment:', '${identity.commitment.toString()}');
console.log('Refresh the page to activate.');
`.trim();

  const scriptPath = path.join(__dirname, "../frontend-import.js");
  fs.writeFileSync(scriptPath, frontendScript);
  
  console.log("\n📄 Browser import script saved to:", scriptPath);
  console.log("\n" + "=".repeat(70));
  console.log("🎉 IDENTITY READY FOR SHOWCASE!");
  console.log("=".repeat(70));
  
  console.log("\n📋 NEXT STEPS:");
  console.log("\n1. Start your frontend:");
  console.log("   cd apps/web && pnpm dev");
  
  console.log("\n2. Open http://localhost:3000");
  
  console.log("\n3. Connect wallet:", WALLET_ADDRESS);
  
  console.log("\n4. Open browser console (F12) and paste:");
  console.log("   ───────────────────────────────────────────────────────");
  console.log(`   localStorage.setItem('rayls_semaphore_identity', '${identity.export()}');`);
  console.log("   ───────────────────────────────────────────────────────");
  
  console.log("\n5. Refresh the page");
  
  console.log("\n6. Visit: http://localhost:3000/operator/farmers-protected");
  
  console.log("\n7. You should see authorized status!");
  
  console.log("\n" + "=".repeat(70));
  console.log("⚠️  NOTE: For full demo, you'll need to:");
  console.log("   • Deploy Semaphore contracts");
  console.log("   • Create a group and add this commitment:", identity.commitment.toString());
  console.log("   • Update frontend config with contract addresses");
  console.log("=".repeat(70));
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

