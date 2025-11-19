import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // @ts-ignore
  const connection = await hre.network.connect();
  // @ts-ignore
  const { ethers } = connection;

  if (!ethers) throw new Error("Ethers not found on network connection");

  const [deployer] = await ethers.getSigners();
  console.log("Generating and uploading IPFS metadata...");
  console.log("Using account:", deployer.address);

  const ADDRESSES = {
    FarmerRegistry: "0x0322df29357B648404EdccE3F95bE95F572F8bC5",
    CreditPassport: "0x70023088BbF693287b70e73bCaFf932c72543418",
    AgroVault: "0xABcf44111f7c8974b5ad2Cecd5602417693dED2d",
  };

  // Attach to contracts
  const FarmerRegistry = await ethers.getContractFactory("FarmerRegistry");
  const registry = FarmerRegistry.attach(ADDRESSES.FarmerRegistry);

  const CreditPassport = await ethers.getContractFactory("CreditPassport");
  const passport = CreditPassport.attach(ADDRESSES.CreditPassport);

  const AgroVault = await ethers.getContractFactory("AgroVault");
  const vault = AgroVault.attach(ADDRESSES.AgroVault);

  // Helper: Map risk tier to credit score (same logic as frontend)
  function getCreditScore(riskTier: number): number {
    switch (riskTier) {
      case 1: return 850; // Prime
      case 2: return 750; // Low risk
      case 3: return 650; // Medium risk
      case 4: return 550; // Higher risk
      case 5: return 450; // Frontier
      default: return 500;
    }
  }

  function getRiskBand(riskTier: number): string {
    switch (riskTier) {
      case 1: return "A–BBB";
      case 2: return "BB–B";
      case 3: return "B–CCC";
      case 4: return "CCC–C";
      case 5: return "C–D";
      default: return "Unrated";
    }
  }

  const CROP_TYPES = ["Unknown", "Soy", "Corn", "Coffee", "Fruits", "Specialty", "Other"];
  const REGIONS = ["Unknown", "North", "Northeast", "Central", "Southeast", "South"];

  const farmerNames = [
    "Fazenda Primavera", "Agrícola São Jorge", "Sítio Bela Vista", "Fazenda Esperança",
    "Cooperativa Sul", "Fazenda Aurora", "Sítio Verde", "Agro Terra",
    "Fazenda Horizonte", "Cooperativa Norte", "Fazenda Progresso", "Sítio Harmonia",
    "Agro Cerrado", "Fazenda União", "Cooperativa Centro",
  ];

  // Get all farmers from registry
  const farmerCount = await registry.getFarmerCount();
  console.log(`\nFound ${farmerCount} farmers in registry`);

  // Create metadata directory
  const metadataDir = path.join(process.cwd(), "metadata", "farmers");
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  console.log("\n📝 Generating metadata for each farmer...");

  for (let i = 0; i < Number(farmerCount); i++) {
    const farmerAddress = await registry.getFarmerAt(i);
    const farmerData = await registry.getFarmer(farmerAddress);
    const totalFunded = await vault.getTotalFundedToFarmer(farmerAddress);

    const riskTier = Number(farmerData.riskTier);
    const cropType = Number(farmerData.cropType);
    const region = Number(farmerData.region);
    const fundedAmount = Number(ethers.formatUnits(totalFunded, 6));

    const creditScore = getCreditScore(riskTier);
    const riskBand = getRiskBand(riskTier);
    const name = farmerNames[i % farmerNames.length];

    // Generate metadata JSON matching frontend display
    const metadata = {
      name,
      description: `Verified agricultural producer in ${REGIONS[region]} with focus on ${CROP_TYPES[cropType]} production.`,
      creditScore,
      riskTier,
      riskBand,
      maxCreditLimit: fundedAmount > 0 ? Math.round(fundedAmount * 1.5) : 500000,
      region: REGIONS[region],
      cropType: CROP_TYPES[cropType],
      totalFunded: fundedAmount,
      farmerAddress,
      attributes: [
        {
          trait_type: "Risk Tier",
          value: `Tier ${riskTier}`,
        },
        {
          trait_type: "Risk Band",
          value: riskBand,
        },
        {
          trait_type: "Credit Score",
          display_type: "number",
          value: creditScore,
        },
        {
          trait_type: "Crop Type",
          value: CROP_TYPES[cropType],
        },
        {
          trait_type: "Region",
          value: REGIONS[region],
        },
        {
          trait_type: "Total Funded",
          display_type: "number",
          value: fundedAmount,
        },
      ],
    };

    // Save to local JSON file (simulating IPFS)
    const filename = `farmer-${farmerAddress}.json`;
    const filepath = path.join(metadataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(metadata, null, 2));

    // For demo purposes, use data URI instead of real IPFS
    const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;

    // Update FarmerRegistry with metadata URI
    console.log(`   ${i + 1}. Updating ${name} (${farmerAddress.slice(0, 6)}...)`);
    await registry.registerOrUpdateFarmer(
      farmerAddress,
      true, // keep approved
      riskTier,
      cropType,
      region,
      metadataURI
    );

    // Update CreditPassport if minted
    try {
      const tokenId = await passport.getTokenIdByFarmer(farmerAddress);
      if (tokenId > 0n) {
        await passport.updateMetadata(tokenId, metadataURI);
        console.log(`      ✓ Updated Credit Passport #${tokenId}`);
      }
    } catch (e) {
      // Passport not minted for this farmer, skip
    }
  }

  console.log(`\n✅ Metadata generated and saved to ${metadataDir}`);
  console.log("✅ All on-chain metadata URIs updated!");
  console.log("\n💡 For production, upload the JSON files to IPFS and replace data URIs with ipfs:// URIs");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

