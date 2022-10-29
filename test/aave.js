const { expect, assert } = require("chai");
const { deployments, network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");
const ERCabi = require("../constants/ERC20Abi.json");

describe("Aave Contract Integration", () => {
  let aaveContract, signer;
  const chain = network.config.chainId;
  const impersonate = networkConfig[chain].Impersonate;
  const LINK = networkConfig[chain].LINK;
  const USDC = networkConfig[chain].USDC;
  const approveLINK = ethers.utils.parseEther("100");
  const payLINK = ethers.utils.parseEther("70");
  const approveUSDC = ethers.utils.parseUnits("1000", 6);
  const transferUSDC = ethers.utils.parseUnits("90", 6);
  const Lending = networkConfig[chain].LendingPool;

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
    await deployments.fixture(["aaveProtocol"]);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [impersonate],
    });
    signer = await ethers.getSigner(impersonate);
    aaveContract = await ethers.getContract("AaveProtocol", signer);
  });

  describe("deposit Token into Aave", () => {
    beforeEach(async () => {
      await getBalance(USDC, signer, impersonate);
      const erc20Con = await erc20(USDC, signer);
      await erc20Con.transfer(aaveContract.address, approveUSDC);
    });

    it("deposits Token into Aave", async () => {
      await getBalance(USDC, signer, impersonate);
      const depositFunction = await aaveContract.depositToken(
        USDC,
        approveUSDC
      );
      await depositFunction.wait(1);
      const {
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactor,
      } = await aaveContract.getUserData(impersonate);

      console.log(
        `TotalCollateralBase - ${totalCollateralBase},\n totalDebtBase - ${totalDebtBase},
        \n availableBorrowsBase - ${availableBorrowsBase}, \n currentLiquidationThreshold - ${currentLiquidationThreshold},
        \nltv - ${ltv}, \n healthFactor - ${healthFactor}`
      );
    });
  });

  describe("deposit collateral and borrow", () => {
    beforeEach(async () => {
      await getBalance(USDC, signer, impersonate);
      await getBalance(LINK, signer, impersonate);
      const erc20Con = await erc20(USDC, signer);
      await erc20Con.transfer(aaveContract.address, approveUSDC);
    });
    it("deposit and borrow", async () => {
      const seBo = await aaveContract._supplyCollateralAndBorrow(
        LINK,
        approveLINK,
        USDC,
        approveUSDC
      );
      await seBo.wait(1);
      await getBalance(USDC, signer, aaveContract.address);
      await getBalance(LINK, signer, aaveContract.address);
    });
  });
  describe("repays and withdraws collateral", () => {
    it("should repay and withdraw collateral", async () => {
      const erc20Con = await erc20(USDC, signer);
      await erc20Con.transfer(aaveContract.address, approveUSDC);
      const suBo = await aaveContract._supplyCollateralAndBorrow(
        LINK,
        approveLINK,
        USDC,
        approveUSDC
      );
      await getBalance(USDC, signer, aaveContract.address);
      await getBalance(USDC, signer, impersonate);
      const initialLINK = await getBalance(LINK, signer, aaveContract.address);
      await suBo.wait(1);
      const reWi = await aaveContract.repayBorrowed(LINK, approveLINK, 2);
      await reWi.wait(1);
      const {
        totalCollateralBase,
        totalDebtBase,
        availableBorrowsBase,
        currentLiquidationThreshold,
        ltv,
        healthFactor,
      } = await aaveContract.getUserData(aaveContract.address);

      console.log(
        `TotalCollateralBase - ${totalCollateralBase},\n totalDebtBase - ${totalDebtBase},
        \n availableBorrowsBase - ${availableBorrowsBase}, \n currentLiquidationThreshold - ${currentLiquidationThreshold},
        \nltv - ${ltv}, \n healthFactor - ${healthFactor}`
      );
      const withdraw = await aaveContract.withdrawToken(USDC, transferUSDC);
      await withdraw.wait(1);
      await getBalance(USDC, signer, aaveContract.address);
      const finalLink = await getBalance(LINK, signer, aaveContract.address);
      assert.equal(finalLink.toString(), 0);
      assert.equal(initialLINK.toString(), approveLINK.toString());
    });
  });
  describe("Info about reserve/asset", () => {
    it("should show asset configuration", async () => {
      const configuration = await aaveContract._getConfiguration(LINK);
      console.log(configuration.toString());
    });
    it("should show user configuration", async () => {
      const configuration = await aaveContract._getUserConfiguration();
      console.log(configuration.toString());
    });
    it("should show asset configuration", async () => {
      const reserveData = await aaveContract._getReserveData(LINK);
      console.log(reserveData.toString());
    });
    it("should number of reserves", async () => {
      const reserveList = await aaveContract._reserveList();
      console.log(reserveList);
    });
    it("should get reserves income", async () => {
      const reserveData = await aaveContract._getReserveNormalizedIncome(LINK);
      console.log(reserveData.toString());
    });
    it("should get reserves Debt", async () => {
      const reserveDebt = await aaveContract._getReserveNormalizedDebt(LINK);
      console.log(reserveDebt.toString());
    });
  });
  describe("", () => [
    it("should deposit with deposit encode ", async () => {
      
    }),
  ]);
});
