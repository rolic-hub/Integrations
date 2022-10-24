const { network, getNamedAccounts, deployments } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");

const { ethers } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chain = network.config.chainId;
  let arguments = [networkConfig[chain].PoLido, networkConfig[chain].PoLidoNFT];

  log(
    "----------------------------------------------------------------------------"
  );

  await deploy("LidoFinance", {
    from: deployer,
    args: arguments,
    log: true,
  });

  log(
    "-----------------------------deployed PoLido Protocol ---------------------------"
  );

};
module.exports.tags = ["lidoFinance"];
