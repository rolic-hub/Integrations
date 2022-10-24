const { ethers, deployments, network } = require("hardhat");
const ERCabi = require("../constants/ERC20Abi.json");
const { networkConfig } = require("../helper-hardhat");

async function main() {
  await deployments.fixture(["compoundContract"]);

  const chain = network.config.chainId;
  const impersonate = networkConfig[chain].Impersonate;
  const LINK = networkConfig[chain].LINK;
  const USDC = networkConfig[chain].USDC;
  const approveLINK = ethers.utils.parseEther("20");
  const approveUSDC = ethers.utils.parseUnits("100", 6);
  const transferUSDC = ethers.utils.parseUnits("90", 6);

  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [impersonate],
  });
  const signer = await ethers.getSigner(impersonate);

  const compContract = await ethers.getContract("CompoundIntegration", signer);
  await getBalance(impersonate, USDC, signer);

  await transferToken(USDC, signer, compContract.address, approveUSDC);
  const supplyUSDC = await compContract.supply(USDC, transferUSDC);
  await supplyUSDC.wait(1);
  console.log("sucessfully supplied", approveUSDC.toString());

  await getBalance(impersonate, USDC, signer);
}

async function getBalance(address, erc20TokenAddress, signer) {
  const erc20Token = await ethers.getContractAt(
    ERCabi,
    erc20TokenAddress,
    signer
  );
  const balance = await erc20Token.balanceOf(address);
  console.log("Balance is :", balance.toString());
}

async function approveErc20(
  erc20TokenAddress,
  signer,
  spenderAddress,
  approvedAmount
) {
  const erc20Token = await ethers.getContractAt(
    ERCabi,
    erc20TokenAddress,
    signer
  );
  const approval = await erc20Token.approve(spenderAddress, approvedAmount);
  await approval.wait(1);
  console.log("approved contract");
}

async function transferToken(
  erc20TokenAddress,
  signer,
  address,
  approvedAmount
) {
  const erc20Token = await ethers.getContractAt(
    ERCabi,
    erc20TokenAddress,
    signer
  );

  const transfer = await erc20Token.transfer(address, approvedAmount);
  await transfer.wait(1);
  console.log(`transferrred ${approvedAmount} to ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
