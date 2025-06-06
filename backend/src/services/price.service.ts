import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const getTokenPrice = async (symbol: string): Promise<number> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: symbol.toLowerCase(),
        vs_currencies: 'usd',
      },
    });

    const price = response.data[symbol.toLowerCase()]?.usd;
    if (!price) {
      throw new Error(`Price not found for ${symbol}`);
    }

    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}; 