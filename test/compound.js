
const { expect, assert } = require("chai");
const { deployments, network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat");
const ERCabi = require("../constants/ERC20Abi.json");

describe("Compound Protocol", () => {
  let compContract, signer;
  const chain = network.config.chainId;
  const impersonate = networkConfig[chain].Impersonate;
  const LINK = networkConfig[chain].LINK;
  const USDC = networkConfig[chain].USDC;
  const approveLINK = ethers.utils.parseEther("20");
  const approveUSDC = ethers.utils.parseUnits("100", 6);
  const transferUSDC = ethers.utils.parseUnits("90", 6);

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
    await deployments.fixture(["all"]);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [impersonate],
    });
    signer = await ethers.getSigner(impersonate);
    compContract = await ethers.getContract("CompoundIntegration", signer);
  });

  describe("Supply function", () => {
    it("should supply USDC to the compound protocol", async () => {
      const initialBalance = await getBalance(USDC, signer, impersonate);
      const Erc20 = await erc20(USDC, signer);
      await Erc20.transfer(compContract.address, approveUSDC);
      const supplyUSDC = await compContract.supply(USDC, approveUSDC);
      await supplyUSDC.wait(1);
      const FinalBalance = await getBalance(USDC, signer, impersonate);
      const calculateFinal = parseInt(initialBalance) - parseInt(approveUSDC);
      assert.equal(FinalBalance.toString(), calculateFinal.toString());
    });
    it("should supply LINK to Compound to use as collateral", async () => {
      const initialBalance = await getBalance(LINK, signer, impersonate);
      const Erc20 = await erc20(LINK, signer);
      await Erc20.transfer(compContract.address, approveLINK);
      const supplyUSDC = await compContract.supply(LINK, approveLINK);
      await supplyUSDC.wait(1);
      const FinalBalance = await getBalance(LINK, signer, impersonate);
      const supplyAPR = await compContract.getSupplyApr();
      console.log(supplyAPR.toString());
      const borrowAPR = await compContract.getBorrowApr();
      console.log(borrowAPR.toString());
      const calculateFinal = initialBalance - parseInt(approveLINK);
      assert.equal(
        (FinalBalance / ethers.utils.parseEther("1")).toFixed(7),
        (calculateFinal / ethers.utils.parseEther("1")).toFixed(7)
      );
    });
  });

  describe("Withdraw function", () => {
    it("should borrow some USDC while providing LINK as collateral", async () => {
      const initialBalance = await getBalance(USDC, signer, impersonate);
      const Erc20 = await erc20(LINK, signer);
      await Erc20.transfer(compContract.address, approveLINK);
      const supplyUSDC = await compContract.supply(LINK, approveLINK);
      await supplyUSDC.wait(1);
      await getBalance(LINK, signer, impersonate);
      const withdrawUSDC = await compContract.withdraw(USDC, approveUSDC);
      await withdrawUSDC.wait(1);
      const finalBalance = await getBalance(USDC, signer, impersonate);
      assert.equal(
        parseInt(initialBalance) + parseInt(approveUSDC),
        finalBalance.toString()
      );
    });
    it("it repays an open borrow of USDC", async () => {
      const initialBalance = await getBalance(USDC, signer, impersonate);
      const Erc20 = await erc20(LINK, signer);
      await Erc20.transfer(compContract.address, approveLINK);
      const supplyUSDC = await compContract.supply(LINK, approveLINK);
      await supplyUSDC.wait(1);
      await getBalance(LINK, signer, impersonate);
      const withdrawUSDC = await compContract.withdraw(USDC, approveUSDC);
      await withdrawUSDC.wait(1);
      await getBalance(USDC, signer, impersonate);
      const eRc20 = await erc20(USDC, signer);
      await eRc20.transfer(compContract.address, approveUSDC);
      const repay = await compContract.supply(USDC, approveUSDC);
      await repay.wait(1);
      const finalBalance = await getBalance(USDC, signer, impersonate);
      assert.equal(finalBalance.toString(), initialBalance.toString());
    });
  });

  describe("view functions", () => {
    it("Assest Info", async () => {
      const {
        priceFeed,
        scale,
        borrowCollateralFactor,
        liquidateCollateralFactor,
        liquidationFactor,
        supplyCap,
      } = await compContract.getInfo(LINK);

      console.log(priceFeed);
      console.log(scale.toString());
      console.log(borrowCollateralFactor.toString());
      console.log(liquidateCollateralFactor.toString());
      console.log(liquidationFactor.toString());
      console.log(supplyCap.toString());
    });
    it("should return the collateral factor", async () => {
      const collateralFactor = await compContract.getBorrowCollateralFactor(
        LINK
      );
      console.log(collateralFactor.toString());
    });
    // it("should return all the assests supported", async () => {
    //   const numOFassests = await compContract.numOfAssests();
    //   const result = await numOFassests.toString();
    //   console.log(result)
    //   const collateralFactor = await compContract.getAllAssetInfos();
    //   const txReceipt = await collateralFactor.wait(1);
    //   for (i = 0; i < result; i++) {
    //     console.log(txReceipt.events[i].args);
    //   }
    // });
    it("", async () => {
      const collateralFactor = await compContract.getLiquidateCollateralFactor(
        LINK
      );
      console.log(collateralFactor.toString());
    });
  });
});
