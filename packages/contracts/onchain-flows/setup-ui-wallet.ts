import hre from "hardhat";

async function main() {
  // Connect explicitly
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();

  // Addresses from your current .env.local
  const MOCK_STABLE_ADDR = "0x2e8CeC1AbDE7114F4748966eCbdB4262609d92b4";
  const VAULT_ADDR = "0x2f719F2589339Bc2DCAb7BE9B18B7943c9470A58";
  const WHITELIST_ADDR = "0x4539F7BDE985A8c7585D45e6F831d2fAFAE092A4";

  // Target wallet from your screenshot (PARTIAL - need full address)
  // PLEASE REPLACE WITH FULL ADDRESS
  const TARGET_WALLET = process.env.TARGET_WALLET;

  if (!TARGET_WALLET) {
    throw new Error("Please set TARGET_WALLET env var to your browser wallet address");
  }

  console.log("Using deployer:", deployer.address);
  console.log("Target wallet:", TARGET_WALLET);

  // 1. Mint 10,000 USDC to target wallet
  const stable = await ethers.getContractAt("MockStablecoin", MOCK_STABLE_ADDR);
  const decimals = await stable.decimals();
  const amount = ethers.parseUnits("10000", decimals);

  console.log("Minting 10,000 MockUSD to target...");
  const txMint = await stable.mint(TARGET_WALLET, amount);
  await txMint.wait();
  console.log("Minted!");

  // 2. Whitelist target wallet so they can deposit
  const whitelist = await ethers.getContractAt("InvestorWhitelist", WHITELIST_ADDR);
  console.log("Whitelisting target wallet...");
  const txWhitelist = await whitelist.addInvestor(TARGET_WALLET);
  await txWhitelist.wait();
  console.log("Whitelisted!");

  // 3. Ensure Vault has some TVL (Deposit 100 USDC from deployer if needed)
  const vault = await ethers.getContractAt("AgroVault", VAULT_ADDR);
  const totalAssets = await vault.totalAssets();
  console.log("Current Vault TVL:", totalAssets.toString());

  if (totalAssets == 0n) {
    console.log("Vault empty, depositing 100 USDC from deployer to seed TVL...");
    const seedAmount = ethers.parseUnits("100", decimals);
    
    // Mint to deployer first
    await (await stable.mint(deployer.address, seedAmount)).wait();
    // Approve
    await (await stable.approve(VAULT_ADDR, seedAmount)).wait();
    // Deposit
    await (await vault.deposit(seedAmount, deployer.address)).wait();
    console.log("Seeded vault TVL!");
  }

  console.log("Done! Refresh your frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


