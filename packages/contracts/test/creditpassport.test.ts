import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CreditPassport SBT", function () {
  it("should deploy successfully", async function () {
    const [deployer] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const address = await passport.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
  });

  it("should mint a passport with metadata URI", async function () {
    const [deployer, farmer] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const metadata = JSON.stringify({
      name: "Fazenda Primavera",
      creditScore: 850,
      riskTier: "A",
      riskBand: "A–BBB",
      maxCreditLimit: 750000,
      region: "Mato Grosso",
      cropType: "Soy",
    });

    const metadataURI = `data:application/json;base64,${Buffer.from(metadata).toString("base64")}`;

    const tx = await passport.mintPassport(farmer.address, metadataURI);
    const receipt = await tx.wait();

    // Verify event
    expect(receipt?.logs.length).to.be.greaterThan(0);

    // Verify farmer owns the token
    const tokenId = await passport.getTokenIdByFarmer(farmer.address);
    expect(tokenId).to.equal(1n);

    const owner = await passport.ownerOf(tokenId);
    expect(owner).to.equal(farmer.address);

    // Verify metadata
    const uri = await passport.tokenURI(tokenId);
    expect(uri).to.equal(metadataURI);
  });

  it("should prevent duplicate passports for the same farmer", async function () {
    const [deployer, farmer] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const metadataURI = "ipfs://QmTest123";

    // Mint first passport
    await passport.mintPassport(farmer.address, metadataURI);

    // Try to mint second passport for same farmer - should revert
    try {
      await passport.mintPassport(farmer.address, metadataURI);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("farmer already has passport");
    }
  });

  it("should allow metadata updates by owner", async function () {
    const [deployer, farmer] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const originalMetadata = "ipfs://QmOriginal";
    const updatedMetadata = "ipfs://QmUpdated";

    await passport.mintPassport(farmer.address, originalMetadata);
    const tokenId = await passport.getTokenIdByFarmer(farmer.address);

    // Update metadata
    await passport.updateMetadata(tokenId, updatedMetadata);

    const uri = await passport.tokenURI(tokenId);
    expect(uri).to.equal(updatedMetadata);
  });

  it("should block all transfers (soulbound)", async function () {
    const [deployer, farmer, attacker] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const metadataURI = "ipfs://QmTest";
    await passport.mintPassport(farmer.address, metadataURI);

    const tokenId = await passport.getTokenIdByFarmer(farmer.address);

    // Try to transfer as farmer (owner)
    try {
      await passport.connect(farmer).transferFrom(farmer.address, attacker.address, tokenId);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("token is soulbound");
    }

    // Try to transfer with approval
    await passport.connect(farmer).approve(attacker.address, tokenId);
    try {
      await passport.connect(attacker).transferFrom(farmer.address, attacker.address, tokenId);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("token is soulbound");
    }
  });

  it("should allow burning by owner", async function () {
    const [deployer, farmer] = await ethers.getSigners();

    const CreditPassport = await ethers.getContractFactory("CreditPassport");
    const passport = await CreditPassport.deploy(deployer.address);
    await passport.waitForDeployment();

    const metadataURI = "ipfs://QmTest";
    await passport.mintPassport(farmer.address, metadataURI);

    const tokenId = await passport.getTokenIdByFarmer(farmer.address);

    // Burn the token as owner
    await passport.burn(tokenId);

    // Verify token no longer exists
    try {
      await passport.ownerOf(tokenId);
      expect.fail("Should have reverted for nonexistent token");
    } catch (error: any) {
      expect(error.message).to.include("ERC721NonexistentToken");
    }
    
    // Verify mapping is still intact (but token is burned)
    const storedTokenId = await passport.getTokenIdByFarmer(farmer.address);
    expect(storedTokenId).to.equal(tokenId);
  });
});

