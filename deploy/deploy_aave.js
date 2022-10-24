const { network, getNamedAccounts, deployments } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");

const { ethers } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chain = network.config.chainId;
  let arguments = [networkConfig[chain].LendingPool, networkConfig[chain].PriceOracle];

  log(
    "----------------------------------------------------------------------------"
  );

    await deploy("AaveProtocol", {
    from: deployer,
    args: arguments,
    log: true,

  });

  log(
    "----------------------------------deployed Aave Protocol ---------------------------"
  );

};
module.exports.tags = ["aaveProtocol"];
