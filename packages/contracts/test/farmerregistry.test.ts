import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("FarmerRegistry Enumerable", function () {
  it("should track farmer count correctly", async function () {
    const [deployer, farmer1, farmer2, farmer3] = await ethers.getSigners();

    const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
    const registry = await FarmerRegistry.deploy(deployer.address);
    await registry.waitForDeployment();

    expect(await registry.getFarmerCount()).to.equal(0n);
    expect(await registry.approvedFarmerCount()).to.equal(0n);

    // Register farmer 1 (approved)
    await registry.registerOrUpdateFarmer(
      farmer1.address,
      true, // approved
      2, // riskTier
      1, // SOY
      5, // SOUTH
      "ipfs://farmer1"
    );

    expect(await registry.getFarmerCount()).to.equal(1n);
    expect(await registry.approvedFarmerCount()).to.equal(1n);

    // Register farmer 2 (not approved)
    await registry.registerOrUpdateFarmer(
      farmer2.address,
      false, // not approved
      3,
      2, // CORN
      3, // CENTRAL
      "ipfs://farmer2"
    );

    expect(await registry.getFarmerCount()).to.equal(2n);
    expect(await registry.approvedFarmerCount()).to.equal(1n); // Still 1

    // Register farmer 3 (approved)
    await registry.registerOrUpdateFarmer(
      farmer3.address,
      true,
      1,
      1,
      4,
      "ipfs://farmer3"
    );

    expect(await registry.getFarmerCount()).to.equal(3n);
    expect(await registry.approvedFarmerCount()).to.equal(2n);

    // Update farmer 2 to approved
    await registry.registerOrUpdateFarmer(
      farmer2.address,
      true, // now approved
      3,
      2,
      3,
      "ipfs://farmer2-updated"
    );

    expect(await registry.getFarmerCount()).to.equal(3n); // Count unchanged
    expect(await registry.approvedFarmerCount()).to.equal(3n); // Now all approved
  });

  it("should return paginated farmer lists", async function () {
    const [deployer, farmer1, farmer2, farmer3, farmer4, farmer5] = await ethers.getSigners();

    const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
    const registry = await FarmerRegistry.deploy(deployer.address);
    await registry.waitForDeployment();

    // Register 5 farmers
    const farmers = [farmer1, farmer2, farmer3, farmer4, farmer5];
    for (let i = 0; i < farmers.length; i++) {
      await registry.registerOrUpdateFarmer(
        farmers[i].address,
        true,
        2,
        1,
        3,
        `ipfs://farmer${i}`
      );
    }

    // Get first 3
    const page1 = await registry.getFarmers(0, 3);
    expect(page1.length).to.equal(3);
    expect(page1[0]).to.equal(farmer1.address);
    expect(page1[1]).to.equal(farmer2.address);
    expect(page1[2]).to.equal(farmer3.address);

    // Get next 2
    const page2 = await registry.getFarmers(3, 3);
    expect(page2.length).to.equal(2);
    expect(page2[0]).to.equal(farmer4.address);
    expect(page2[1]).to.equal(farmer5.address);

    // Get all at once
    const all = await registry.getFarmers(0, 10);
    expect(all.length).to.equal(5);
  });

  it("should return empty array for out-of-bounds pagination", async function () {
    const [deployer, farmer1] = await ethers.getSigners();

    const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
    const registry = await FarmerRegistry.deploy(deployer.address);
    await registry.waitForDeployment();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://test");

    const result = await registry.getFarmers(10, 5);
    expect(result.length).to.equal(0);
  });

  it("should get farmer by index", async function () {
    const [deployer, farmer1, farmer2] = await ethers.getSigners();

    const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
    const registry = await FarmerRegistry.deploy(deployer.address);
    await registry.waitForDeployment();

    await registry.registerOrUpdateFarmer(farmer1.address, true, 2, 1, 3, "ipfs://f1");
    await registry.registerOrUpdateFarmer(farmer2.address, true, 3, 2, 4, "ipfs://f2");

    const addr0 = await registry.getFarmerAt(0);
    expect(addr0).to.equal(farmer1.address);

    const addr1 = await registry.getFarmerAt(1);
    expect(addr1).to.equal(farmer2.address);

    // Out of bounds
    try {
      await registry.getFarmerAt(2);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("index out of bounds");
    }
  });
});

