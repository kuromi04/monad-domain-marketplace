import hre from "hardhat";

async function main() {
  console.log("🚀 Desplegando en red Monad (ChainId: 10143)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  // 1. Desplegar Registry
  const RegistryFactory = await hre.ethers.getContractFactory("MonadDomainRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ MonadDomainRegistry desplegado en: ${registryAddress}`);

  // 2. Desplegar Marketplace
  const MarketplaceFactory = await hre.ethers.getContractFactory("MonadDomainMarketplace");
  const marketplace = await MarketplaceFactory.deploy(registryAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(`✅ MonadDomainMarketplace desplegado en: ${marketplaceAddress}`);

  console.log("\n--- Guardar en frontend .env.local ---");
  console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS="${registryAddress}"`);
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS="${marketplaceAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
