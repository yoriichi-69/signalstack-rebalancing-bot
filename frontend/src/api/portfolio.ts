import axios from 'axios';
import { Portfolio } from '../types/portfolio';

export const fetchPortfolios = async (): Promise<Portfolio[]> => {
  const { data } = await axios.get('/api/portfolio');
  return data;
};

export const rebalancePortfolio = async (id: string): Promise<Portfolio> => {
  const { data } = await axios.post(`/api/portfolio/${id}/rebalance`);
  return data;
}; 