import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  
  console.log("Deploying ProductSatisfactionSurvey with account:", deployer);
  const balance = await ethers.provider.getBalance(deployer);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const deployedProductSatisfactionSurvey = await deploy("ProductSatisfactionSurvey", {
    from: deployer,
    log: true,
    args: [],
    waitConfirmations: hre.network.name === "hardhat" ? 0 : 2,
  });

  console.log(`ProductSatisfactionSurvey contract deployed at: ${deployedProductSatisfactionSurvey.address}`);
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log(`Verify contract on Etherscan:`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedProductSatisfactionSurvey.address}`);
  }
};
export default func;
func.id = "deploy_productSatisfactionSurvey"; // id required to prevent reexecution
func.tags = ["ProductSatisfactionSurvey"];
