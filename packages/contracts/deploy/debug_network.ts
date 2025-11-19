import hre from "hardhat";

async function main() {
  console.log("HRE keys:", Object.keys(hre));
  
  // @ts-ignore
  console.log("hre.network keys:", Object.keys(hre.network));
  // @ts-ignore
  console.log("hre.network:", hre.network);

  // @ts-ignore
  if (hre.network && hre.network.ethers) {
      console.log("Found ethers on hre.network!");
  } else {
      console.log("ethers NOT found on hre.network");
  }

  // Check if there is a provider provider
  // @ts-ignore
  if (hre.network.provider) {
      console.log("Found provider on hre.network");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

