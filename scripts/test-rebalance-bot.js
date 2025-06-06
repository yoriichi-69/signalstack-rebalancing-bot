const { ethers } = require("hardhat");

async function main() {
  // For testing, we'll deploy mock contracts
  console.log("Deploying test tokens...");
  
  // Deploy a mock token for testing
  const MockToken = await ethers.getContractFactory("MockERC20");
  const mockWeth = await MockToken.deploy("Mock WETH", "WETH");
  const testToken = await MockToken.deploy("Test Token", "TEST");
  
  console.log("Deploying mock router...");
  // Mock router for testing (just a placeholder)
  const MockRouter = await ethers.getContractFactory("MockUniswapRouter");
  const mockRouter = await MockRouter.deploy(mockWeth.address);
  
  console.log("Deploying RebalanceBot...");
  // Deploy RebalanceBot with mock addresses
  const RebalanceBot = await ethers.getContractFactory("RebalanceBot");
  const bot = await RebalanceBot.deploy(mockRouter.address, mockWeth.address);
  
  console.log("Testing addSupportedToken...");
  // Add token with 50% target weight
  await bot.addSupportedToken(testToken.address, 5000);
  
  // Check if token was added
  const summary = await bot.getPortfolioSummary();
  console.log("Token list:", summary.tokens);
  console.log("Target weights:", summary.targetWeights.map(w => w.toString()));
  
  console.log("Test completed!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });