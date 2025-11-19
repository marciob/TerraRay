import hre from "hardhat";

async function main() {
  // Hardhat 3: connect explicitly
  // @ts-ignore
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;

  if (!ethers) throw new Error("Ethers not found on network connection");

  // Hardhat 3's hre.network is a NetworkManager, not a simple object with `.name`.
  // For logging purposes we safely read it via `as any`.
  const networkName: string =
    (hre.network as any)?.name ?? (hre as any)?.networkName ?? "unknown";

  console.log("---- Deploying Semaphore to network:", networkName, "----");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy RaylsSemaphoreVerifier
  console.log("Deploying RaylsSemaphoreVerifier...");
  const SemaphoreVerifier = await ethers.getContractFactory(
    "RaylsSemaphoreVerifier"
  );
  const verifier = await SemaphoreVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("RaylsSemaphoreVerifier deployed at:", verifierAddress);

  // 2) Deploy PoseidonT3 library (required by Semaphore merkle tree)
  console.log("Deploying PoseidonT3 library...");
  const PoseidonFactory = await ethers.getContractFactory(
    "npm/poseidon-solidity@0.0.5/PoseidonT3.sol:PoseidonT3"
  );
  const poseidon = await PoseidonFactory.deploy();
  await poseidon.waitForDeployment();
  const poseidonAddress = await poseidon.getAddress();
  console.log("PoseidonT3 deployed at:", poseidonAddress);

  // 3) Deploy RaylsSemaphore, wired to the verifier and linked with PoseidonT3
  console.log("Deploying RaylsSemaphore...");
  const Semaphore = await ethers.getContractFactory("RaylsSemaphore", {
    libraries: {
      PoseidonT3: poseidonAddress,
    },
  });
  const semaphore = await Semaphore.deploy(verifierAddress);
  await semaphore.waitForDeployment();
  const semaphoreAddress = await semaphore.getAddress();
  console.log("RaylsSemaphore deployed at:", semaphoreAddress);

  // 3) (Optional) Create an initial group with deployer as admin
  console.log("Creating initial authorized-viewers group...");
  // createGroup(address admin)
  const tx = await semaphore["createGroup(address)"](deployer.address);
  const receipt = await tx.wait();

  // groupCounter is incremented after each createGroup call; last group is groupCounter - 1
  const groupCounter = await semaphore.groupCounter();
  const groupId = groupCounter - 1n;

  console.log("Initial group created with ID:", groupId.toString());

  console.log("----- Deployment summary -----");
  console.table({
    RaylsSemaphoreVerifier: verifierAddress,
    RaylsSemaphore: semaphoreAddress,
    GroupId: groupId.toString(),
  });

  console.log(
    "\nNext steps:\n" +
      `  - Add members with: npx hardhat run scripts/add-single-member.ts --network ${networkName}\n` +
      "  - Use the commitment from showcase-identity.json\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
