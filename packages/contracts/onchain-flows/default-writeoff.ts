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

  console.log(
    "Running on-chain default/write-off flow with deployer:",
    deployer.address
  );

  // 1. Deploy mock stablecoin
  const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
  const stable = await MockStablecoin.deploy("Mock USD", "mUSD", 6);
  await stable.waitForDeployment();

  const stableAddress = await stable.getAddress();
  const decimals = await stable.decimals();
  const oneUnit = ethers.parseUnits("1", decimals);

  console.log("MockStablecoin deployed to:", stableAddress);

  // 2. Deploy core contracts
  const InvestorWhitelist = await ethers.getContractFactory(
    "InvestorWhitelist"
  );
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

  // 3. Deploy AgroVault
  const AgroVault = await ethers.getContractFactory("AgroVault");
  const allowedCropTypes = [1, 2];
  const vault = await AgroVault.deploy(
    stableAddress,
    whitelistAddress,
    registryAddress,
    noteAddress,
    1,
    3,
    allowedCropTypes,
    "Soy & Corn Prime Vault",
    "SCPV",
    deployer.address
  );
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("AgroVault deployed to:", vaultAddress);

  // 4. Allow vault to mint notes
  await note.setVault(vaultAddress, true);
  console.log("Allowed vault to mint FarmerNotes");

  const investor = deployer;
  const farmer = deployer;

  await whitelist.addInvestor(investor.address);
  console.log("Whitelisted investor:", investor.address);

  const farmerRiskTier = 2;
  const cropSoy = 1;
  const regionSouth = 5;

  await registry.registerOrUpdateFarmer(
    farmer.address,
    true,
    farmerRiskTier,
    cropSoy,
    regionSouth,
    "ipfs://farmer-metadata"
  );
  console.log("Registered farmer:", farmer.address);

  // 5. Investor deposits funds (1000 units)
  const depositAmount = oneUnit * 1_000n;
  await stable.mint(investor.address, depositAmount);
  await stable.connect(investor).approve(vaultAddress, depositAmount);
  await vault.connect(investor).deposit(depositAmount, investor.address);
  console.log("Deposited into vault:", depositAmount.toString());

  // 6. Vault funds a note for the farmer (500 units)
  const principal = oneUnit * 500n;
  const rateBps = 1_200;
  const maturity = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  const txFund = await vault
    .connect(deployer)
    .fundNote(farmer.address, principal, rateBps, maturity, farmer.address);
  const receiptFund = await txFund.wait();

  let noteId: bigint | undefined;
  if (receiptFund && receiptFund.logs) {
    for (const log of receiptFund.logs) {
      if ("fragment" in log && log.fragment?.name === "NoteFunded") {
        const decoded = log as unknown as { args: { noteId: bigint } };
        noteId = decoded.args.noteId;
        break;
      }
    }
  }

  if (!noteId) {
    throw new Error("Failed to decode NoteFunded event / noteId");
  }

  console.log("Funded note with ID:", noteId.toString());

  const assetsBeforeDefault = await vault.totalAssets();
  console.log(
    "Vault totalAssets before default:",
    assetsBeforeDefault.toString()
  );

  // 7. Compute a share price sample before default
  const sharesToConvert = ethers.parseUnits("1", 15);
  const assetsPerShareBefore = await vault.convertToAssets(sharesToConvert);
  console.log(
    "Assets per 1e15 shares before default:",
    assetsPerShareBefore.toString()
  );

  // 8. Call defaultNote
  await vault.connect(deployer).defaultNote(noteId);
  console.log("Defaulted note:", noteId.toString());

  const assetsAfterDefault = await vault.totalAssets();
  console.log(
    "Vault totalAssets after default:",
    assetsAfterDefault.toString()
  );

  if (assetsAfterDefault !== depositAmount - principal) {
    throw new Error("totalAssets after default does not match expected value");
  }

  const assetsPerShareAfter = await vault.convertToAssets(sharesToConvert);
  console.log(
    "Assets per 1e15 shares after default:",
    assetsPerShareAfter.toString()
  );

  if (!(assetsPerShareAfter < assetsPerShareBefore)) {
    throw new Error("Share price did not drop after default as expected");
  }

  const outstanding = await vault.noteOutstandingPrincipal(noteId);
  console.log("Outstanding principal after default:", outstanding.toString());

  if (outstanding !== 0n) {
    throw new Error("Outstanding principal is not zero after default");
  }

  console.log("On-chain default/write-off flow completed successfully ✅");
  console.table({
    MockStablecoin: stableAddress,
    InvestorWhitelist: whitelistAddress,
    FarmerRegistry: registryAddress,
    FarmerNote: noteAddress,
    AgroVault: vaultAddress,
    NoteId: noteId.toString(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
