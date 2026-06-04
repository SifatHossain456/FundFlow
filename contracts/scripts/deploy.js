const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const FundFlow = await hre.ethers.getContractFactory("FundFlow");
  const fundflow = await FundFlow.deploy();
  await fundflow.waitForDeployment();

  const address = await fundflow.getAddress();
  console.log("FundFlow deployed to:", address);
  console.log("\nAdd to frontend/src/lib/contract.ts:");
  console.log(`export const CONTRACT_ADDRESS = "${address}";`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
