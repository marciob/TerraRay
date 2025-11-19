import hre from "hardhat";

async function main() {
  // Hardhat 3: Connect explicitly via network.connect
  // @ts-ignore - plugin augments the connection object with ethers at runtime
  const connection = await hre.network.connect();
  // @ts-ignore - ethers is injected by @nomicfoundation/hardhat-ethers
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer available – check PRIVATE_KEY / network config");
  }

  console.log("Running on-chain happy-path flow with deployer:", deployer.address);

  // 1. Deploy mock stablecoin (like USDC with 6 decimals)
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const stable = await MockStablecoin.deploy("Mock USD", "mUSD", 6);
  await stable.waitForDeployment();

  const stableAddress = await stable.getAddress();
  const decimals = await stable.decimals();
  const oneUnit = ethers.parseUnits("1", decimals);

  console.log("MockStablecoin deployed to:", stableAddress);

  // 2. Deploy core contracts
  const InvestorWhitelist = await ethers.getContractFactory("InvestorWhitelist");
  const whitelist = await InvestorWhitelist.deploy(deployer.address);
  await whitelist.waitForDeployment();

  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const registry = await FarmerRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  const FarmerNote = await ethers.getContractFactory("FarmerNote");
  const note = await FarmerNote.deploy(deployer.address);
  await note.waitForDeployment();

  const whitelistAddress = await whitelist.getAddress();
  const registryAddress = await registry.getAddress();
  const noteAddress = await note.getAddress();

  console.log("InvestorWhitelist deployed to:", whitelistAddress);
  console.log("FarmerRegistry deployed to:", registryAddress);
  console.log("FarmerNote deployed to:", noteAddress);

  // 3. Deploy AgroVault (risk tiers 1–3, Soy & Corn prime vault)
  const AgroVault = await ethers.getContractFactory("AgroVault");
  const allowedCropTypes = [1, 2]; // SOY, CORN (see AgroTypes.CropType)
  const vault = await AgroVault.deploy(
    stableAddress,
    whitelistAddress,
    registryAddress,
    noteAddress,
    1, // riskTierMin
    3, // riskTierMax
    allowedCropTypes,
    "Soy & Corn Prime Vault",
    "SCPV",
    deployer.address
  );
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("AgroVault deployed to:", vaultAddress);

  // 4. Allow this vault to mint notes
  await note.setVault(vaultAddress, true);
  console.log("Allowed vault to mint FarmerNotes");

  // 5. Use deployer as both investor and farmer for a simple end-to-end check
  const investor = deployer;
  const farmer = deployer;

  // Whitelist investor
  await whitelist.addInvestor(investor.address);
  console.log("Whitelisted investor:", investor.address);

  // Register farmer with soy, riskTier 2
  const farmerRiskTier = 2;
  const cropSoy = 1; // AgroTypes.CropType.SOY
  const regionSouth = 5; // AgroTypes.Region.SOUTH

  await registry.registerOrUpdateFarmer(
    farmer.address,
    true,
    farmerRiskTier,
    cropSoy,
    regionSouth,
    "ipfs://farmer-metadata"
  );
  console.log("Registered farmer:", farmer.address);

  // 6. Investor deposits funds
  const depositAmount = oneUnit * 1_000n;
  await stable.mint(investor.address, depositAmount);
  await stable.connect(investor).approve(vaultAddress, depositAmount);
  await vault.connect(investor).deposit(depositAmount, investor.address);
  console.log("Deposited into vault:", depositAmount.toString());

  // 7. Fund a note for that farmer from Soy & Corn vault
  const principal = oneUnit * 400n;
  const rateBps = 1_200; // 12% APR
  const maturity = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const txFund = await vault.fundNote(
    farmer.address,
    principal,
    rateBps,
    maturity,
    farmer.address
  );

  const receiptFund = await txFund.wait();

  let noteId: bigint | undefined;
  if (receiptFund && receiptFund.logs) {
    for (const log of receiptFund.logs) {
      if ("fragment" in log && log.fragment?.name === "NoteFunded") {
        const decoded = log as unknown as {
          args: { noteId: bigint };
        };
        noteId = decoded.args.noteId;
        break;
      }
    }
  }

  if (!noteId) {
    throw new Error("Failed to decode NoteFunded event / noteId");
  }

  console.log("Funded note with ID:", noteId.toString());

  const totalAssetsBefore = await vault.totalAssets();
  console.log("Vault totalAssets before repayment:", totalAssetsBefore.toString());

  // 8. Farmer repays principal + some interest
  const repaymentAmount = principal + oneUnit * 40n; // 40 units of interest
  await stable.mint(farmer.address, repaymentAmount);
  await stable.connect(farmer).approve(vaultAddress, repaymentAmount);

  await vault.connect(farmer).recordRepayment(noteId, repaymentAmount);
  console.log("Recorded repayment of:", repaymentAmount.toString());

  const totalAssetsAfter = await vault.totalAssets();
  console.log("Vault totalAssets after repayment:", totalAssetsAfter.toString());

  if (totalAssetsAfter <= totalAssetsBefore) {
    throw new Error("Repayment did not increase vault totalAssets as expected");
  }

  const outstanding = await vault.noteOutstandingPrincipal(noteId);
  console.log("Outstanding principal after repayment:", outstanding.toString());

  if (outstanding !== 0n) {
    throw new Error("Outstanding principal is not zero after full repayment");
  }

  console.log("On-chain happy-path flow completed successfully ✅");
  console.table({
    MockStablecoin: stableAddress,
    InvestorWhitelist: whitelistAddress,
    FarmerRegistry: registryAddress,
    FarmerNote: noteAddress,
    AgroVault: vaultAddress,
    NoteId: noteId.toString()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


