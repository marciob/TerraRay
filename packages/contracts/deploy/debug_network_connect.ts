import hre from "hardhat";

async function main() {
  console.log("Connecting...");
  // @ts-ignore
  const connection = await hre.network.connect();
  console.log("Connection keys:", Object.keys(connection));
  
  // @ts-ignore
  if (connection.ethers) {
      console.log("Found ethers on connection!");
      // @ts-ignore
      const [deployer] = await connection.ethers.getSigners();
      console.log("Deployer:", deployer.address);
  } else {
      console.log("ethers NOT found on connection");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

