import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import Portfolio from '../models/portfolio.model';
import { rebalancePortfolio as rebalancePortfolioService } from '../services/portfolio.service';

export const getPortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user.id });
    res.json(portfolios);
  } catch (error) {
    next(error);
  }
};

export const createPortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = new Portfolio({
      ...req.body,
      user: req.user.id,
    });
    await portfolio.save();
    res.status(201).json(portfolio);
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const rebalancePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const rebalancedPortfolio = await rebalancePortfolioService(portfolio);
    res.json(rebalancedPortfolio);
  } catch (error) {
    next(error);
  }
}; 