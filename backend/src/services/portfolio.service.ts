import { IPortfolio } from '../models/portfolio.model';
import { getTokenPrice } from './price.service';

export const rebalancePortfolio = async (portfolio: IPortfolio) => {
  try {
    // Get current prices for all assets
    const assetsWithPrices = await Promise.all(
      portfolio.assets.map(async (asset) => {
        const price = await getTokenPrice(asset.symbol);
        return {
          ...asset.toObject(),
          currentPrice: price,
        };
      })
    );

    // Calculate total portfolio value
    const totalValue = assetsWithPrices.reduce(
      (sum, asset) => sum + (asset.currentPrice || 0) * (asset.quantity || 0),
      0
    );

    // Calculate target quantities for each asset
    const rebalancedAssets = assetsWithPrices.map((asset) => {
      const targetValue = totalValue * asset.weight;
      const targetQuantity = targetValue / (asset.currentPrice || 1);
      return {
        ...asset,
        quantity: targetQuantity,
      };
    });

    // Update portfolio with new quantities and prices
    portfolio.assets = rebalancedAssets;
    portfolio.totalValue = totalValue;
    portfolio.lastRebalanced = new Date();

    await portfolio.save();
    return portfolio;
  } catch (error) {
    throw error;
  }
}; 