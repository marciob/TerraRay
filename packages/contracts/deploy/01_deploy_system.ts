import hre from "hardhat";

async function main() {
  // Hardhat 3: Connect explicitly
  // @ts-ignore
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;

  if (!ethers) throw new Error("Ethers not found on network connection");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockStablecoin
  console.log("Deploying MockStablecoin...");
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const stable = await MockStablecoin.deploy("Mock USD", "mUSD", 6);
  await stable.waitForDeployment();
  const stableAddress = await stable.getAddress();
  console.log("MockStablecoin deployed to:", stableAddress);

  // 2. Deploy InvestorWhitelist
  console.log("Deploying InvestorWhitelist...");
  const InvestorWhitelist = await ethers.getContractFactory("InvestorWhitelist");
  const whitelist = await InvestorWhitelist.deploy(deployer.address);
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  console.log("InvestorWhitelist deployed to:", whitelistAddress);

  // 3. Deploy FarmerRegistry
  console.log("Deploying FarmerRegistry...");
  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const registry = await FarmerRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("FarmerRegistry deployed to:", registryAddress);

  // 4. Deploy FarmerNote
  console.log("Deploying FarmerNote...");
  const FarmerNote = await ethers.getContractFactory("FarmerNote");
  const note = await FarmerNote.deploy(deployer.address);
  await note.waitForDeployment();
  const noteAddress = await note.getAddress();
  console.log("FarmerNote deployed to:", noteAddress);

  // 5. Deploy AgroVault
  console.log("Deploying AgroVault...");
  const AgroVault = await ethers.getContractFactory("AgroVault");
  // Allow Soy (1) and Corn (2)
  const allowedCropTypes = [1, 2]; 
  const vault = await AgroVault.deploy(
    stableAddress,
    whitelistAddress,
    registryAddress,
    noteAddress,
    1, // Min Risk Tier
    3, // Max Risk Tier
    allowedCropTypes,
    "Soy & Corn Prime Vault",
    "SCPV",
    deployer.address
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("AgroVault deployed to:", vaultAddress);

  // 6. Deploy CreditPassport
  console.log("Deploying CreditPassport...");
  const CreditPassport = await ethers.getContractFactory("CreditPassport");
  const passport = await CreditPassport.deploy(deployer.address);
  await passport.waitForDeployment();
  const passportAddress = await passport.getAddress();
  console.log("CreditPassport deployed to:", passportAddress);

  // 7. Configuration
  console.log("Configuring contracts...");
  // Allow vault to mint notes
  await note.setVault(vaultAddress, true);
  console.log("Allowed vault to mint FarmerNotes");

  // Whitelist deployer for testing
  await whitelist.addInvestor(deployer.address);
  console.log("Whitelisted deployer");

  console.log("Deployment complete!");
  console.table({
    MockStablecoin: stableAddress,
    InvestorWhitelist: whitelistAddress,
    FarmerRegistry: registryAddress,
    FarmerNote: noteAddress,
    AgroVault: vaultAddress,
    CreditPassport: passportAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
