import hre from "hardhat";

async function main() {
  // @ts-ignore
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;

  if (!ethers) throw new Error("Ethers not found on network connection");

  const [deployer] = await ethers.getSigners();
  console.log("Seeding contracts with demo data...");
  console.log("Using account:", deployer.address);

  const ADDRESSES = {
    MockStablecoin: "0x6720aa306D0fcd49B42956c63528D0eAC11aFcce",
    InvestorWhitelist: "0x18D209301f7C2b395bC8839D64994949062e9660",
    FarmerRegistry: "0x0322df29357B648404EdccE3F95bE95F572F8bC5",
    FarmerNote: "0x432EF09492A0EA7514A9a62c9f22aDfA2905E318",
    AgroVault: "0xABcf44111f7c8974b5ad2Cecd5602417693dED2d",
    CreditPassport: "0x70023088BbF693287b70e73bCaFf932c72543418",
  };

  // Attach to contracts
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const stable = MockStablecoin.attach(ADDRESSES.MockStablecoin);

  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const registry = FarmerRegistry.attach(ADDRESSES.FarmerRegistry);

  const InvestorWhitelist = await ethers.getContractFactory("InvestorWhitelist");
  const whitelist = InvestorWhitelist.attach(ADDRESSES.InvestorWhitelist);

  const AgroVault = await ethers.getContractFactory("AgroVault");
  const vault = AgroVault.attach(ADDRESSES.AgroVault);

  // Create fake farmer accounts (using deterministic private keys for demo)
  const farmers = [];
  for (let i = 1; i <= 15; i++) {
    const wallet = ethers.Wallet.createRandom();
    farmers.push(wallet.address);
  }

  console.log(`\n📝 Registering ${farmers.length} farmers...`);
  
  const farmerProfiles = [
    { name: "Fazenda Primavera", riskTier: 1, cropType: 1, region: 4 }, // SOY, SOUTHEAST
    { name: "Agrícola São Jorge", riskTier: 2, cropType: 1, region: 5 }, // SOY, SOUTH
    { name: "Sítio Bela Vista", riskTier: 2, cropType: 2, region: 3 }, // CORN, CENTRAL
    { name: "Fazenda Esperança", riskTier: 1, cropType: 1, region: 3 }, // SOY, CENTRAL
    { name: "Cooperativa Sul", riskTier: 2, cropType: 2, region: 5 }, // CORN, SOUTH
    { name: "Fazenda Aurora", riskTier: 3, cropType: 1, region: 4 }, // SOY, SOUTHEAST
    { name: "Sítio Verde", riskTier: 3, cropType: 2, region: 2 }, // CORN, NORTHEAST
    { name: "Agro Terra", riskTier: 2, cropType: 1, region: 3 }, // SOY, CENTRAL
    { name: "Fazenda Horizonte", riskTier: 1, cropType: 1, region: 4 }, // SOY, SOUTHEAST
    { name: "Cooperativa Norte", riskTier: 2, cropType: 2, region: 1 }, // CORN, NORTH (was COFFEE)
    { name: "Fazenda Progresso", riskTier: 2, cropType: 1, region: 5 }, // SOY, SOUTH
    { name: "Sítio Harmonia", riskTier: 2, cropType: 2, region: 3 }, // CORN, CENTRAL
    { name: "Agro Cerrado", riskTier: 1, cropType: 1, region: 3 }, // SOY, CENTRAL
    { name: "Fazenda União", riskTier: 3, cropType: 2, region: 2 }, // CORN, NORTHEAST
    { name: "Cooperativa Centro", riskTier: 2, cropType: 1, region: 3 }, // SOY, CENTRAL
  ];

  for (let i = 0; i < farmers.length; i++) {
    const profile = farmerProfiles[i];
    await registry.registerOrUpdateFarmer(
      farmers[i],
      true, // approved
      profile.riskTier,
      profile.cropType,
      profile.region,
      `ipfs://farmer-${i + 1}`
    );
    console.log(`   ✓ Registered ${profile.name} (${farmers[i].slice(0, 6)}...)`);
  }

  const farmerCount = await registry.getFarmerCount();
  const approvedCount = await registry.approvedFarmerCount();
  console.log(`\n✅ Total: ${farmerCount} farmers, Approved: ${approvedCount}`);

  // Whitelist deployer as investor
  console.log("\n🔐 Whitelisting deployer...");
  const isWhitelisted = await whitelist.isWhitelisted(deployer.address);
  if (!isWhitelisted) {
    await whitelist.addInvestor(deployer.address);
    console.log("   ✓ Deployer whitelisted");
  } else {
    console.log("   ✓ Deployer already whitelisted");
  }

  // Check current vault state
  const currentTotalAssets = await vault.totalAssets();
  const currentOutstanding = await vault.totalOutstandingPrincipal();
  const currentLiquid = currentTotalAssets - currentOutstanding;
  console.log(`\n📊 Current vault state:`);
  console.log(`   Total Assets: ${ethers.formatUnits(currentTotalAssets, 6)} USDC`);
  console.log(`   Outstanding: ${ethers.formatUnits(currentOutstanding, 6)} USDC`);
  console.log(`   Liquid Cash: ${ethers.formatUnits(currentLiquid, 6)} USDC`);

  // Calculate total loan amount needed
  const loanSizes = [
    ethers.parseUnits("450000", 6),
    ethers.parseUnits("320000", 6),
    ethers.parseUnits("280000", 6),
    ethers.parseUnits("500000", 6),
    ethers.parseUnits("380000", 6),
    ethers.parseUnits("250000", 6),
    ethers.parseUnits("420000", 6),
    ethers.parseUnits("360000", 6),
    ethers.parseUnits("310000", 6),
    ethers.parseUnits("290000", 6),
  ];
  
  let totalLoansNeeded = 0n;
  for (const loan of loanSizes) {
    totalLoansNeeded += loan;
  }
  console.log(`   Loans to fund: ${ethers.formatUnits(totalLoansNeeded, 6)} USDC`);

  // Only deposit if we need more liquidity
  if (currentLiquid < totalLoansNeeded) {
    console.log("\n💰 Adding more liquidity...");
    const additionalLiquidity = totalLoansNeeded - currentLiquid + ethers.parseUnits("500000", 6); // +500k buffer
    await stable.mint(deployer.address, additionalLiquidity);
    console.log(`   ✓ Minted ${ethers.formatUnits(additionalLiquidity, 6)} USDC`);

    await stable.approve(ADDRESSES.AgroVault, additionalLiquidity);
    console.log("   ✓ Approved vault");

    await vault.deposit(additionalLiquidity, deployer.address);
    console.log(`   ✓ Deposited ${ethers.formatUnits(additionalLiquidity, 6)} USDC`);
  } else {
    console.log("\n✓ Vault has sufficient liquidity");
  }

  // Create loan notes for farmers
  console.log("\n📋 Creating loan notes...");

  const rates = [1200, 1400, 1600, 1300, 1500, 1700, 1400, 1500, 1600, 1800]; // 12%-18% APR

  for (let i = 0; i < 10; i++) {
    const farmer = farmers[i];
    const principal = loanSizes[i];
    const rate = rates[i];
    const maturity = Math.floor(Date.now() / 1000) + (180 + i * 30) * 24 * 60 * 60; // 6-9 months

    await vault.fundNote(farmer, principal, rate, maturity, farmer);
    console.log(`   ✓ Funded ${ethers.formatUnits(principal, 6)} USDC to ${farmerProfiles[i].name} @ ${rate / 100}% APR`);
  }

  // Summary stats
  console.log("\n📊 Final On-Chain Stats:");
  const totalAssets = await vault.totalAssets();
  const totalOutstanding = await vault.totalOutstandingPrincipal();
  const noteCount = await vault.getNoteCount();
  const liquidCash = totalAssets - totalOutstanding;

  console.log(`   TVL: ${ethers.formatUnits(totalAssets, 6)} USDC`);
  console.log(`   Capital Deployed: ${ethers.formatUnits(totalOutstanding, 6)} USDC`);
  console.log(`   Available Liquidity: ${ethers.formatUnits(liquidCash, 6)} USDC`);
  console.log(`   Utilization: ${((Number(totalOutstanding) / Number(totalAssets)) * 100).toFixed(1)}%`);
  console.log(`   Active Loans: ${noteCount}`);
  console.log(`   Active Farmers: ${approvedCount}`);

  console.log("\n✅ Demo data seeding complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

