// d:\intel\cryptorizz\main\signalstack-rebalancing-bot\test\RebalanceRouterV2.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RebalanceRouterV2", function () {
  let rebalanceRouter;
  let mockRouter;
  let weth;
  let token1;
  let token2;
  let token3;
  let strategy;
  let owner;
  let oracle;
  let user;
  
  beforeEach(async function () {
    [owner, oracle, user] = await ethers.getSigners();
    
    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockERC20");
    weth = await MockToken.deploy("Wrapped ETH", "WETH");
    token1 = await MockToken.deploy("Token 1", "TK1");
    token2 = await MockToken.deploy("Token 2", "TK2");
    token3 = await MockToken.deploy("Token 3", "TK3");
    
    // Deploy mock router
    const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockRouter = await MockRouter.deploy(weth.address);
    
    // Deploy rebalance router
    const RebalanceRouter = await ethers.getContractFactory("RebalanceRouterV2");
    rebalanceRouter = await RebalanceRouter.deploy(mockRouter.address, weth.address);
    
    // Deploy strategy
    const Strategy = await ethers.getContractFactory("SignalStackStrategy");
    strategy = await Strategy.deploy(rebalanceRouter.address, oracle.address);
    
    // Set strategy in router
    await rebalanceRouter.setStrategy(strategy.address, true);
    
    // Add supported tokens
    await rebalanceRouter.addSupportedToken(weth.address, 5000); // 50%
    await rebalanceRouter.addSupportedToken(token1.address, 3000); // 30%
    await rebalanceRouter.addSupportedToken(token2.address, 2000); // 20%
    
    // Fund the rebalance router with tokens
    await weth.transfer(rebalanceRouter.address, ethers.utils.parseEther("10"));
    await token1.transfer(rebalanceRouter.address, ethers.utils.parseEther("100"));
    await token2.transfer(rebalanceRouter.address, ethers.utils.parseEther("200"));
  });
  
  it("should initialize correctly", async function () {
    expect(await rebalanceRouter.uniswapRouter()).to.equal(mockRouter.address);
    expect(await rebalanceRouter.wethAddress()).to.equal(weth.address);
    expect(await rebalanceRouter.owner()).to.equal(owner.address);
  });
  
  it("should add and remove supported tokens", async function () {
    // Check initial setup
    expect(await rebalanceRouter.supportedTokens(weth.address)).to.be.true;
    expect(await rebalanceRouter.supportedTokens(token1.address)).to.be.true;
    expect(await rebalanceRouter.supportedTokens(token3.address)).to.be.false;
    
    // Add token3
    await rebalanceRouter.updateTargetWeights(
      [weth.address, token1.address, token2.address],
      [4000, 3000, 3000]
    );
    await rebalanceRouter.addSupportedToken(token3.address, 1000); // 10%
    
    expect(await rebalanceRouter.supportedTokens(token3.address)).to.be.true;
    
    // Check weights
    const summary = await rebalanceRouter.getPortfolioSummary();
    expect(summary.targetWeightsResult[3]).to.equal(1000); // token3 weight
    
    // Remove token1
    await rebalanceRouter.updateTargetWeights(
      [weth.address, token2.address, token3.address],
      [5000, 3000, 2000]
    );
    await rebalanceRouter.removeSupportedToken(token1.address);
    
    expect(await rebalanceRouter.supportedTokens(token1.address)).to.be.false;
  });
  
  it("should update target weights", async function () {
    // Update weights
    await rebalanceRouter.updateTargetWeights(
      [weth.address, token1.address, token2.address],
      [6000, 3000, 1000]
    );
    
    // Check weights
    const summary = await rebalanceRouter.getPortfolioSummary();
    expect(summary.targetWeightsResult[0]).to.equal(6000);
    expect(summary.targetWeightsResult[1]).to.equal(3000);
    expect(summary.targetWeightsResult[2]).to.equal(1000);
  });
  
  it("should execute strategy-based rebalance", async function () {
    // Set weights from oracle
    await strategy.connect(oracle).updateTargetWeights(
      [weth.address, token1.address, token2.address],
      [7000, 2000, 1000]
    );
    
    // Execute strategy rebalance
    await rebalanceRouter.executeStrategyRebalance();
    
    // Check that weights were updated
    const summary = await rebalanceRouter.getPortfolioSummary();
    expect(summary.targetWeightsResult[0]).to.equal(7000);
    expect(summary.targetWeightsResult[1]).to.equal(2000);
    expect(summary.targetWeightsResult[2]).to.equal(1000);
  });
});