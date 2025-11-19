import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AgroVault happy path", function () {
  async function setup() {
    const [deployer, investor, farmer] = await ethers.getSigners();

    // Deploy mock stablecoin (like USDC with 6 decimals)
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    const stable = await MockStablecoin.deploy("Mock USD", "mUSD", 6);
    await stable.waitForDeployment();

    const decimals = await stable.decimals();
    const oneUnit = ethers.parseUnits("1", decimals);

    // Deploy core contracts
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

    // Risk tiers 1–3, Soy & Corn prime vault
    const AgroVault = await ethers.getContractFactory("AgroVault");
    const allowedCropTypes = [1, 2]; // SOY, CORN (see AgroTypes.CropType)
    const vault = await AgroVault.deploy(
      await stable.getAddress(),
      await whitelist.getAddress(),
      await registry.getAddress(),
      await note.getAddress(),
      1, // riskTierMin
      3, // riskTierMax
      allowedCropTypes,
      "Soy & Corn Prime Vault",
      "SCPV",
      deployer.address
    );
    await vault.waitForDeployment();

    // Allow this vault to mint notes
    await note.setVault(await vault.getAddress(), true);

    // Whitelist investor
    await whitelist.addInvestor(investor.address);

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

    return {
        deployer,
        investor,
        farmer,
        stable,
        vault,
        oneUnit,
        note
    };
  }

  it("registers farmer, deposits, funds note and records repayment", async function () {
    const { deployer, investor, farmer, stable, vault, oneUnit } = await setup();

    // Mint stablecoins to investor and approve vault
    const depositAmount = oneUnit * 1_000n;
    await stable.mint(investor.address, depositAmount);
    await stable.connect(investor).approve(await vault.getAddress(), depositAmount);

    // Deposit into vault
    await vault.connect(investor).deposit(depositAmount, investor.address);

    // Fund a note for that farmer from Soy & Corn vault
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
    expect(noteId).to.not.equal(undefined);

    const totalAssetsBefore = await vault.totalAssets();

    // Farmer repays principal + some interest
    const repaymentAmount = principal + oneUnit * 40n; // 40 units of interest
    await stable.mint(farmer.address, repaymentAmount);
    await stable
      .connect(farmer)
      .approve(await vault.getAddress(), repaymentAmount);

    await vault
      .connect(farmer)
      .recordRepayment(noteId!, repaymentAmount);

    const totalAssetsAfter = await vault.totalAssets();
    expect(totalAssetsAfter > totalAssetsBefore).to.equal(true);

    const outstanding = await vault.noteOutstandingPrincipal(noteId!);
    expect(outstanding).to.equal(0n);
  });

  it("handles loan default (write-off) correctly", async function () {
    const { deployer, investor, farmer, stable, vault, oneUnit } = await setup();

    // 2. Investor deposits funds (1000 units)
    const depositAmount = oneUnit * 1_000n;
    await stable.mint(investor.address, depositAmount);
    await stable.connect(investor).approve(await vault.getAddress(), depositAmount);
    await vault.connect(investor).deposit(depositAmount, investor.address);

    // 3. Vault funds a note for the farmer (500 units)
    const principal = oneUnit * 500n;
    const rateBps = 1_200; // 12% APR
    const maturity = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    const txFund = await vault.connect(deployer).fundNote(
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
          const decoded = log as unknown as { args: { noteId: bigint } };
          noteId = decoded.args.noteId;
          break;
        }
      }
    }
    expect(noteId).to.not.equal(undefined);

    // 4. Check vault total assets and share price BEFORE default
    const assetsBeforeDefault = await vault.totalAssets();
    expect(assetsBeforeDefault).to.equal(depositAmount);
    
    // We use 1 * 10^15 shares for testing "1 full share" concept given offset 9 and 6 decimals
    const sharesToConvert = ethers.parseUnits("1", 15);
    const assetsPerShareBefore = await vault.convertToAssets(sharesToConvert);

    // 5. Call defaultNote
    await vault.connect(deployer).defaultNote(noteId!);

    // 6. Check total assets AFTER default
    const assetsAfterDefault = await vault.totalAssets();
    expect(assetsAfterDefault).to.equal(depositAmount - principal);

    // 7. Assert share price dropped
    const assetsPerShareAfter = await vault.convertToAssets(sharesToConvert);
    
    expect(assetsPerShareAfter < assetsPerShareBefore).to.be.true;
    
    // Verify state is cleared
    const outstanding = await vault.noteOutstandingPrincipal(noteId!);
    expect(outstanding).to.equal(0n);
  });
});
