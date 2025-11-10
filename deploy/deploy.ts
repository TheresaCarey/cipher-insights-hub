import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedProductSatisfactionSurvey = await deploy("ProductSatisfactionSurvey", {
    from: deployer,
    log: true,
    args: [],
  });

  console.log(`ProductSatisfactionSurvey contract deployed at: ${deployedProductSatisfactionSurvey.address}`);
  
  if (hre.network.name !== "hardhat") {
    console.log(`Verify contract on Etherscan:`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedProductSatisfactionSurvey.address}`);
  }
};
export default func;
func.id = "deploy_productSatisfactionSurvey"; // id required to prevent reexecution
func.tags = ["ProductSatisfactionSurvey"];
