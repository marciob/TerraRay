import { ethers } from "hardhat";

async function main() {
  const Placeholder = await ethers.getContractFactory("Placeholder");
  const placeholder = await Placeholder.deploy();
  await placeholder.waitForDeployment();

  console.log("Placeholder deployed to:", await placeholder.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


