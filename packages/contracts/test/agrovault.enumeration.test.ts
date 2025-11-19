import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AgroVault Enumeration", function () {
  async function setupVault() {
    const [deployer, investor, farmer1, farmer2] = await ethers.getSigners();

    // Deploy mock stablecoin
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

    // Deploy vault
    const AgroVault = await ethers.getContractFactory("AgroVault");
    const vault = await AgroVault.deploy(
      await stable.getAddress(),
      await whitelist.getAddress(),
      await registry.getAddress(),
      await note.getAddress(),
      1,
      5,
      [],
      "Test Vault",
      "TEST",
      deployer.address
    );
    await vault.waitForDeployment();

    await note.setVault(await vault.getAddress(), true);
    await whitelist.addInvestor(investor.address);

    return { deployer, investor, farmer1, farmer2, stable, vault, registry, note };
  }

  it("should track note count correctly", async function () {
    const { deployer, investor, farmer1, farmer2, stable, vault, registry } = await setupVault();

    expect(await vault.getNoteCount()).to.equal(0n);

    // Register farmers
    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");
    await registry.registerOrUpdateFarmer(farmer2.address, true, 3, 2, 4, "ipfs://f2");

    // Fund investor
    const amount = ethers.parseUnits("1000", 6);
    await stable.mint(investor.address, amount);
    await stable.connect(investor).approve(await vault.getAddress(), amount);
    await vault.connect(investor).deposit(amount, investor.address);

    // Fund first note
    const principal1 = ethers.parseUnits("400", 6);
    await vault.fundNote(farmer1.address, principal1, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);

    expect(await vault.getNoteCount()).to.equal(1n);

    // Fund second note
    const principal2 = ethers.parseUnits("300", 6);
    await vault.fundNote(farmer2.address, principal2, 1500, Math.floor(Date.now() / 1000) + 86400, farmer2.address);

    expect(await vault.getNoteCount()).to.equal(2n);
  });

  it("should return paginated note IDs", async function () {
    const { deployer, investor, farmer1, farmer2, stable, vault, registry } = await setupVault();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");
    await registry.registerOrUpdateFarmer(farmer2.address, true, 3, 2, 4, "ipfs://f2");

    const amount = ethers.parseUnits("1000", 6);
    await stable.mint(investor.address, amount);
    await stable.connect(investor).approve(await vault.getAddress(), amount);
    await vault.connect(investor).deposit(amount, investor.address);

    // Fund 3 notes
    const principal = ethers.parseUnits("200", 6);
    await vault.fundNote(farmer1.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);
    await vault.fundNote(farmer2.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer2.address);
    await vault.fundNote(farmer1.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);

    // Get all note IDs
    const allNotes = await vault.getNoteIds(0, 10);
    expect(allNotes.length).to.equal(3);

    // Get first 2
    const page1 = await vault.getNoteIds(0, 2);
    expect(page1.length).to.equal(2);
    expect(page1[0]).to.equal(1n);
    expect(page1[1]).to.equal(2n);

    // Get last 1
    const page2 = await vault.getNoteIds(2, 10);
    expect(page2.length).to.equal(1);
    expect(page2[0]).to.equal(3n);
  });

  it("should track farmer note IDs correctly", async function () {
    const { deployer, investor, farmer1, farmer2, stable, vault, registry } = await setupVault();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");
    await registry.registerOrUpdateFarmer(farmer2.address, true, 3, 2, 4, "ipfs://f2");

    const amount = ethers.parseUnits("1000", 6);
    await stable.mint(investor.address, amount);
    await stable.connect(investor).approve(await vault.getAddress(), amount);
    await vault.connect(investor).deposit(amount, investor.address);

    // Fund 2 notes for farmer1, 1 for farmer2
    const principal = ethers.parseUnits("200", 6);
    await vault.fundNote(farmer1.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);
    await vault.fundNote(farmer2.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer2.address);
    await vault.fundNote(farmer1.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);

    const farmer1Notes = await vault.getFarmerNoteIds(farmer1.address);
    expect(farmer1Notes.length).to.equal(2);
    expect(farmer1Notes[0]).to.equal(1n);
    expect(farmer1Notes[1]).to.equal(3n);

    const farmer2Notes = await vault.getFarmerNoteIds(farmer2.address);
    expect(farmer2Notes.length).to.equal(1);
    expect(farmer2Notes[0]).to.equal(2n);
  });

  it("should calculate total funded to farmer correctly", async function () {
    const { deployer, investor, farmer1, stable, vault, registry } = await setupVault();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");

    const amount = ethers.parseUnits("1000", 6);
    await stable.mint(investor.address, amount);
    await stable.connect(investor).approve(await vault.getAddress(), amount);
    await vault.connect(investor).deposit(amount, investor.address);

    // Fund 2 notes with different principals
    const principal1 = ethers.parseUnits("200", 6);
    const principal2 = ethers.parseUnits("300", 6);
    await vault.fundNote(farmer1.address, principal1, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);
    await vault.fundNote(farmer1.address, principal2, 1500, Math.floor(Date.now() / 1000) + 86400, farmer1.address);

    const totalFunded = await vault.getTotalFundedToFarmer(farmer1.address);
    expect(totalFunded).to.equal(principal1 + principal2);
  });

  it("should get note by index", async function () {
    const { deployer, investor, farmer1, stable, vault, registry } = await setupVault();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");

    const amount = ethers.parseUnits("1000", 6);
    await stable.mint(investor.address, amount);
    await stable.connect(investor).approve(await vault.getAddress(), amount);
    await vault.connect(investor).deposit(amount, investor.address);

    const principal = ethers.parseUnits("200", 6);
    await vault.fundNote(farmer1.address, principal, 1200, Math.floor(Date.now() / 1000) + 86400, farmer1.address);

    const noteId = await vault.getNoteIdAt(0);
    expect(noteId).to.equal(1n);

    // Out of bounds
    try {
      await vault.getNoteIdAt(1);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("index out of bounds");
    }
  });
});

