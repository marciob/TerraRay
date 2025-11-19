import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Placeholder", function () {
  it("deploys successfully", async function () {
    const Placeholder = await ethers.getContractFactory("Placeholder");
    const placeholder = await Placeholder.deploy();
    await placeholder.waitForDeployment();

    const address = await placeholder.getAddress();
    expect(address).to.not.equal(ethers.ZeroAddress);
  });
});


