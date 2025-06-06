import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware';
import { auth } from '../middleware/auth.middleware';
import {
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  rebalancePortfolio,
} from '../controllers/portfolio.controller';

const router = Router();

// Get portfolio
router.get('/', auth, getPortfolio);

// Create portfolio
router.post(
  '/',
  auth,
  [
    body('name').notEmpty().withMessage('Portfolio name is required'),
    body('assets').isArray().withMessage('Assets must be an array'),
    body('assets.*.symbol').notEmpty().withMessage('Asset symbol is required'),
    body('assets.*.weight').isFloat({ min: 0, max: 1 }).withMessage('Asset weight must be between 0 and 1'),
  ],
  validateRequest,
  createPortfolio
);

// Update portfolio
router.put(
  '/:id',
  auth,
  [
    body('name').optional().notEmpty().withMessage('Portfolio name cannot be empty'),
    body('assets').optional().isArray().withMessage('Assets must be an array'),
    body('assets.*.symbol').optional().notEmpty().withMessage('Asset symbol is required'),
    body('assets.*.weight').optional().isFloat({ min: 0, max: 1 }).withMessage('Asset weight must be between 0 and 1'),
  ],
  validateRequest,
  updatePortfolio
);

// Delete portfolio
router.delete('/:id', auth, deletePortfolio);

// Rebalance portfolio
router.post('/:id/rebalance', auth, rebalancePortfolio);

export default router; 