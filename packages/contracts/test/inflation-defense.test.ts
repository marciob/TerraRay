import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AgroVault Inflation Defense", function () {
  it("should have _decimalsOffset set to 9", async function () {
    const [deployer] = await ethers.getSigners();

    // Deploy mock stablecoin (USDC: 6 decimals)
    const MockStablecoin = await ethers.getContractFactory("MockStablecoin");
    const stable = await MockStablecoin.deploy("Mock USD", "mUSD", 6);
    await stable.waitForDeployment();

    // Deploy dependencies
    const InvestorWhitelist = await ethers.getContractFactory("InvestorWhitelist");
    const whitelist = await InvestorWhitelist.deploy(deployer.address);
    await whitelist.waitForDeployment();

    const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
    const registry = await FarmerRegistry.deploy(deployer.address);
    await registry.waitForDeployment();

    const FarmerNote = await ethers.getContractFactory("FarmerNote");
    const note = await FarmerNote.deploy(deployer.address);
    await note.waitForDeployment();

    // Deploy AgroVault
    const AgroVault = await ethers.getContractFactory("AgroVault");
    const allowedCropTypes = [1]; 
    const vault = await AgroVault.deploy(
      await stable.getAddress(),
      await whitelist.getAddress(),
      await registry.getAddress(),
      await note.getAddress(),
      1,
      5,
      allowedCropTypes,
      "Test Vault",
      "TEST",
      deployer.address
    );
    await vault.waitForDeployment();

    // Whitelist deployer
    await whitelist.addInvestor(deployer.address);

    // Check initial exchange rate (empty vault)
    // With offset 9: 1 asset (1e6) should equal 1e6 * 10^9 = 1e15 shares
    const oneAsset = ethers.parseUnits("1", 6);
    const expectedShares = ethers.parseUnits("1", 15); // 6 + 9 = 15

    const shares = await vault.previewDeposit(oneAsset);
    
    expect(shares).to.equal(expectedShares);
    
    // Also check directly by depositing
    await stable.mint(deployer.address, oneAsset);
    await stable.approve(await vault.getAddress(), oneAsset);
    
    await vault.deposit(oneAsset, deployer.address);
    const balance = await vault.balanceOf(deployer.address);
    
    expect(balance).to.equal(expectedShares);
  });
});

