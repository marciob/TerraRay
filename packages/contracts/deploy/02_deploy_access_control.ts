import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy, execute, get } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("\n📋 Deploying AccessControl contract...");
  console.log("Deployer:", deployer);

  // Deploy AccessControl
  const accessControl = await deploy("AccessControl", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ AccessControl deployed to:", accessControl.address);

  // Note: Semaphore contracts need to be deployed separately
  // You can use the official Semaphore deployment or deploy your own
  // For now, we'll just log instructions

  console.log("\n📝 Next steps:");
  console.log("1. Deploy Semaphore contracts (or use existing deployment)");
  console.log("2. Create a Semaphore group for authorized viewers");
  console.log("3. Call configureSemaphore() with Semaphore address and groupId");
  console.log("4. Add operators and banks to the Semaphore group");
  
  // Optional: Auto-configure if Semaphore is already deployed
  // Uncomment and adjust if you have Semaphore deployed
  /*
  const SEMAPHORE_ADDRESS = "0x..."; // Your Semaphore.sol address
  const GROUP_ID = 1; // Your group ID

  if (SEMAPHORE_ADDRESS && GROUP_ID) {
    console.log("\n⚙️  Configuring Semaphore integration...");
    await execute(
      "AccessControl",
      { from: deployer, log: true },
      "configureSemaphore",
      SEMAPHORE_ADDRESS,
      GROUP_ID
    );
    console.log("✅ Semaphore configured");
  }
  */

  return true;
};

func.tags = ["AccessControl"];
func.dependencies = []; // Add "Semaphore" if you deploy it in this repo

export default func;

