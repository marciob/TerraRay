// app/lib/contracts.ts
import AgroVaultABI from "./abis/AgroVault.json";
import MockStablecoinABI from "./abis/MockStablecoin.json";
import CreditPassportABI from "./abis/CreditPassport.json";
import FarmerRegistryABI from "./abis/FarmerRegistry.json";

type Address = `0x${string}`;

export const CONTRACT_ADDRESSES = {
  MockStablecoin: "0x6720aa306D0fcd49B42956c63528D0eAC11aFcce" as Address,
  InvestorWhitelist: "0x18D209301f7C2b395bC8839D64994949062e9660" as Address,
  FarmerRegistry: "0x0322df29357B648404EdccE3F95bE95F572F8bC5" as Address,
  FarmerNote: "0x432EF09492A0EA7514A9a62c9f22aDfA2905E318" as Address,
  AgroVault: "0xABcf44111f7c8974b5ad2Cecd5602417693dED2d" as Address,
  CreditPassport: "0x70023088BbF693287b70e73bCaFf932c72543418" as Address,
} as const;

export const AGRO_VAULT_ABI = AgroVaultABI;
export const MOCK_STABLECOIN_ABI = MockStablecoinABI;
export const CREDIT_PASSPORT_ABI = CreditPassportABI;
export const FARMER_REGISTRY_ABI = FarmerRegistryABI;
