const { ethers, deployments, network } = require("hardhat");
const ERCabi = require("../constants/ERC20Abi.json");
const { networkConfig } = require("../helper-hardhat");
const {
  impersonateAccount,
} = require("@nomicfoundation/hardhat-network-helpers");
const { networks } = require("../hardhat.config");

const chain = network.config.chainId;
const impersonate = networkConfig[chain].Impersonate;
const LINK = networkConfig[chain].LINK;
const USDC = networkConfig[chain].USDC;

async function main() {
  await deployments.fixture(["all"]);
  const signer = await ethers.getSigner();
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [impersonate],
  });

  const compContract = await ethers.getContract("CompoundIntegration", signer);
}