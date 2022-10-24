const { network, getNamedAccounts, deployments } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");

const { ethers } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let arguments = [networkConfig[chainId].Comet];
  
  log(
    "----------------------------------------------------------------------------"
  );

  const compoundContract = await deploy("CompoundIntegration", {
    from: deployer,
    args: arguments,
    log: true,
  });

  log(
    "----------------------------------deployed Compound Factory ---------------------------"
  );


};
module.exports.tags = ["compoundContract"];
