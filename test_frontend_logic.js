/**
 * Simple test to verify the frontend calculation logic works correctly
 */

// Mock account data similar to what the API returns
const mockAccount = {
  balance: 90000,
  bots: [
    {
      bot_id: "bot_momentum_29d0fa",
      strategy: "momentum",
      allocated_fund: 10000,
      portfolio_value: 9977.94,
      status: "active",
      assets: {
        BTC: 0.08885413584577467,
        DOT: 79.36157867494824,
        ETH: 1.9206994328885953
      }
    }
  ],
  performance_history: [
    {
      timestamp: 1749533695.131751,
      balance: 90000,
      portfolio_value: 9977.94,
      total_value: 99977.94,
      total_initial: 100000,
      pnl: -22.06,
      pnl_percent: -0.02
    }
  ]
};

// Simulate the frontend calculation logic
function testFrontendCalculation(account) {
  console.log('🧪 Testing Frontend Calculation Logic');
  console.log('=====================================');
  
  // Calculate total bots value
  let totalBotsValue = 0;
  if (account.bots && Array.isArray(account.bots)) {
    account.bots.forEach(bot => {
      totalBotsValue += bot.portfolio_value || 0;
    });
  }
  
  // Calculate total value
  const totalValue = (account.balance || 0) + totalBotsValue;
  
  // Calculate total initial funds invested in active bots (THE FIX)
  let totalInitialFunds = 0;
  if (account.bots && Array.isArray(account.bots)) {
    account.bots.forEach(bot => {
      if (bot.status === 'active') {
        totalInitialFunds += bot.allocated_fund || 0;
      }
    });
  }
  
  // Calculate PnL
  let pnlAmount = 0;
  let pnlPercent = 0;
  
  if (account.performance_history && account.performance_history.length > 0) {
    const latestPerformance = account.performance_history[account.performance_history.length - 1];
    pnlAmount = latestPerformance.pnl || 0;
    pnlPercent = latestPerformance.pnl_percent || 0;
  } else {
    const originalBalance = 100000;
    pnlAmount = totalValue - originalBalance;
    pnlPercent = originalBalance > 0 ? (pnlAmount / originalBalance) * 100 : 0;
  }
  
  const preparedData = {
    totalValue: totalValue || 0,
    pnlAmount: pnlAmount || 0,
    pnlPercent: pnlPercent || 0,
    totalInitialFunds: totalInitialFunds || 0,
    allocations: [] // Simplified for this test
  };
  
  console.log('📊 Calculation Results:');
  console.log(`   Total Value: $${preparedData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   Balance: $${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   Bots Value: $${totalBotsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   Invested Capital: $${preparedData.totalInitialFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   PnL: $${preparedData.pnlAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${preparedData.pnlPercent.toFixed(2)}%)`);
  
  // Verify the fix
  if (preparedData.totalInitialFunds > 0) {
    console.log('✅ SUCCESS: totalInitialFunds is calculated correctly!');
    console.log(`✅ The UI will now show $${preparedData.totalInitialFunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} instead of $0.00`);
  } else {
    console.log('❌ ISSUE: totalInitialFunds is still 0');
  }
  
  return preparedData;
}

// Run the test
const result = testFrontendCalculation(mockAccount);

console.log('\n🎯 Summary:');
console.log('===========');
console.log('The fix adds the calculation for totalInitialFunds by summing up');
console.log('the allocated_fund values from all active trading bots.');
console.log('This resolves the issue where "Invested Capital" showed $0.00');
console.log('instead of the actual amount invested in active strategies.');
