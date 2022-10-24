const { expect, assert } = require("chai");
const { deployments, network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");
const ERCabi = require("../constants/ERC20Abi.json");

describe("PoLido contract test", () => {
  let polidoContract, signer;
  const chain = network.config.chainId;
  const impersonate = networkConfig[chain].Impersonate;
  const poLido = networkConfig[chain].PoLido;
  const poLidoNft = networkConfig[chain].PoLidoNFT;
  const maticToken = networkConfig[chain].MaticToken;
  const amountMatic = ethers.utils.parseEther("300");

  const erc20 = async (erc20TokenAddress, signerERC) => {
    const erc20Token = await ethers.getContractAt(
      ERCabi,
      erc20TokenAddress,
      signerERC
    );
    return erc20Token;
  };
  const getBalance = async (erc20TokenAddress, signerERC, user) => {
    const erc20Contract = await erc20(erc20TokenAddress, signerERC);
    const balance = await erc20Contract.balanceOf(user);
    console.log("Current Balance is:", balance.toString());
    return balance;
  };

  beforeEach(async () => {
    await deployments.fixture(["lidoFinance"]);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [impersonate],
    });
    signer = await ethers.getSigner(impersonate);
    polidoContract = await ethers.getContract("LidoFinance", signer);
  });

  describe("View Functions", () => {
    it("check Matic Address", async () => {
      const maticAddress = await polidoContract.maticToken();
      assert.equal(maticAddress, maticToken);
    });
    it("convert Matic Tokens to stMatic Tokens", async () => {
      const amountMatic = ethers.utils.parseEther("100");

      const { totalAmount2WithdrawInMatic, totalShares, totalPooledMATIC } =
        await polidoContract.getNoOfstMatic(amountMatic);
      console.log(totalAmount2WithdrawInMatic.toString());
      console.log(totalPooledMATIC.toString());
      console.log(totalShares.toString());
    });
    it("convert stMatic Tokens to Matic Tokens", async () => {
      const amountMatic = ethers.utils.parseEther("100");

      const { _totalAmount2WithdrawInMatic, _totalShares, _totalPooledMATIC } =
        await polidoContract.getNoOfMatic(amountMatic);
      console.log(_totalAmount2WithdrawInMatic.toString());
      console.log(_totalPooledMATIC.toString());
      console.log(_totalShares.toString());
    });
    it("convert stMatic Tokens to Matic Tokens", async () => {
      const amountMatic = ethers.utils.parseEther("252");
      const { totalAmount2WithdrawInMatic, totalShares, totalPooledMATIC } =
        await polidoContract.getNoOfstMatic(amountMatic);
      const { _totalAmount2WithdrawInMatic, _totalShares, _totalPooledMATIC } =
        await polidoContract.getNoOfMatic(totalAmount2WithdrawInMatic);
      assert.equal(
        amountMatic.toString(),
        _totalAmount2WithdrawInMatic.toString()
      );
    });
  });
  describe("Stake Matic Tokens", () => {
    beforeEach(async () => {
      const Erc20 = await erc20(maticToken, signer);
      await Erc20.transfer(polidoContract.address, amountMatic);
    });
    it("stake matic tokens", async () => {
      const amount = await polidoContract.stakeMatic(amountMatic);
      await amount.wait(1);
      const amountstaked = await polidoContract.amountStaked();
      console.log(amountstaked.toString());
      const ERc20 = await erc20(poLido, signer);
      const balanceStMatic = await ERc20.balanceOf(impersonate);
      assert.equal(balanceStMatic.toString(), amountstaked.toString());
    });
  });
  describe("Unstake and claim rewards", () => {
    beforeEach(async () => {
      const Erc20 = await erc20(maticToken, signer);
      await Erc20.transfer(polidoContract.address, amountMatic);
      const amount = await polidoContract.stakeMatic(amountMatic);
      await amount.wait(1);
      await network.provider.send("evm_increaseTime", [2630000]);
      await network.provider.request({ method: "evm_mine", params: [] });
    });
    it("unstake stMatic Tokens", async () => {
      const amountstaked = await polidoContract.amountStaked();
      const ERc20 = await erc20(poLido, signer);
      await ERc20.transfer(polidoContract.address, amountstaked.toString());
      const unstake = await polidoContract.unStakeToken(
        amountstaked.toString()
      );
      await unstake.wait(1);
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const claimTok = await polidoContract.claimToken();
      await claimTok.wait(1);
    });
  });
});
