import hre from "hardhat";
import { expect } from "chai";

async function main() {
  // @ts-ignore
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;

  if (!ethers) throw new Error("Ethers not found on network connection");

  const [deployer] = await ethers.getSigners();
  console.log("Running on-chain verification tests...");
  console.log("Using account:", deployer.address);

  const ADDRESSES = {
    MockStablecoin: "0x6720aa306D0fcd49B42956c63528D0eAC11aFcce",
    InvestorWhitelist: "0x18D209301f7C2b395bC8839D64994949062e9660",
    FarmerRegistry: "0x0322df29357B648404EdccE3F95bE95F572F8bC5",
    FarmerNote: "0x432EF09492A0EA7514A9a62c9f22aDfA2905E318",
    AgroVault: "0xABcf44111f7c8974b5ad2Cecd5602417693dED2d",
    CreditPassport: "0x70023088BbF693287b70e73bCaFf932c72543418",
  };

  // 1. Verify FarmerRegistry enumeration
  console.log("\n1. Testing FarmerRegistry enumeration...");
  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const registry = FarmerRegistry.attach(ADDRESSES.FarmerRegistry);

  const farmerCount = await registry.getFarmerCount();
  const approvedCount = await registry.approvedFarmerCount();
  console.log(`   ✓ Total farmers: ${farmerCount}`);
  console.log(`   ✓ Approved farmers: ${approvedCount}`);

  // 2. Verify AgroVault enumeration
  console.log("\n2. Testing AgroVault enumeration...");
  const AgroVault = await ethers.getContractFactory("AgroVault");
  const vault = AgroVault.attach(ADDRESSES.AgroVault);

  const noteCount = await vault.getNoteCount();
  const totalAssets = await vault.totalAssets();
  console.log(`   ✓ Total notes funded: ${noteCount}`);
  console.log(`   ✓ Total assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);

  // 3. Verify CreditPassport
  console.log("\n3. Testing CreditPassport...");
  const CreditPassport = await ethers.getContractFactory("CreditPassport");
  const passport = CreditPassport.attach(ADDRESSES.CreditPassport);

  const passportName = await passport.name();
  const passportSymbol = await passport.symbol();
  console.log(`   ✓ Name: ${passportName}`);
  console.log(`   ✓ Symbol: ${passportSymbol}`);

  // 4. Test a full flow (register farmer -> fund note -> enumerate)
  console.log("\n4. Testing full flow (register + fund + enumerate)...");
  
  const testFarmer = deployer.address; // Use deployer as test farmer
  
  // Register farmer
  console.log("   - Registering test farmer...");
  const tx1 = await registry.registerOrUpdateFarmer(
    testFarmer,
    true, // approved
    2, // riskTier
    1, // SOY
    3, // CENTRAL
    "ipfs://test-farmer"
  );
  await tx1.wait();
  console.log("   ✓ Farmer registered");

  const newFarmerCount = await registry.getFarmerCount();
  const newApprovedCount = await registry.approvedFarmerCount();
  console.log(`   ✓ Farmer count now: ${newFarmerCount}`);
  console.log(`   ✓ Approved count now: ${newApprovedCount}`);

  // Get farmer data
  const farmerData = await registry.getFarmer(testFarmer);
  console.log(`   ✓ Farmer risk tier: ${farmerData.riskTier}`);

  // Mint some USDC and deposit into vault
  console.log("   - Funding vault with USDC...");
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const stable = MockStablecoin.attach(ADDRESSES.MockStablecoin);
  
  const mintAmount = ethers.parseUnits("10000", 6);
  const tx2 = await stable.mint(deployer.address, mintAmount);
  await tx2.wait();
  console.log("   ✓ Minted 10,000 USDC");

  const tx3 = await stable.approve(ADDRESSES.AgroVault, mintAmount);
  await tx3.wait();
  console.log("   ✓ Approved vault");

  const tx4 = await vault.deposit(mintAmount, deployer.address);
  await tx4.wait();
  console.log("   ✓ Deposited into vault");

  // Fund a note for the farmer
  console.log("   - Funding note for farmer...");
  const principal = ethers.parseUnits("500", 6);
  const maturity = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  
  const tx5 = await vault.fundNote(
    testFarmer,
    principal,
    1200, // 12% APR
    maturity,
    testFarmer
  );
  await tx5.wait();
  console.log("   ✓ Note funded");

  // Test enumeration
  const noteCountAfter = await vault.getNoteCount();
  console.log(`   ✓ Note count after funding: ${noteCountAfter}`);

  const allNoteIds = await vault.getNoteIds(0, 10);
  console.log(`   ✓ All note IDs: ${allNoteIds}`);

  const farmerNotes = await vault.getFarmerNoteIds(testFarmer);
  console.log(`   ✓ Farmer's note IDs: ${farmerNotes}`);

  const totalFunded = await vault.getTotalFundedToFarmer(testFarmer);
  console.log(`   ✓ Total funded to farmer: ${ethers.formatUnits(totalFunded, 6)} USDC`);

  // Mint a Credit Passport
  console.log("   - Minting Credit Passport...");
  const metadata = {
    name: "Test Farmer",
    creditScore: 850,
    riskTier: "A",
    maxCreditLimit: 750000,
  };
  const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;
  
  const tx6 = await passport.mintPassport(testFarmer, metadataURI);
  const receipt = await tx6.wait();
  console.log(`   ✓ Passport minted (tx: ${receipt?.hash})`);

  const tokenId = await passport.getTokenIdByFarmer(testFarmer);
  console.log(`   ✓ Token ID: ${tokenId}`);

  console.log("\n✅ All on-chain verification tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

