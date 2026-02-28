import express from 'express';
import cors from 'cors';
import { getCardSummary } from './services/cardSummaryService';
import {
  listCompanies,
  getCardsByCompanyId,
  activateCard,
  getCardById,
} from './repositories/cardRepository';
import { getTransactionsForCard } from './repositories/transactionRepository';
import { authMiddleware } from './auth';

const app = express();
app.use(cors());
app.use(express.json());

// protect everything under /api
app.use('/api', authMiddleware);

// all your existing /api/... routes follow unchanged
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 1) Companies list
app.get('/api/companies', async (_req, res) => {
  try {
    const items = await listCompanies();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    });
  }
});

// 2) Cards for a company
app.get('/api/companies/:companyId/cards', async (req, res) => {
  try {
    const items = await getCardsByCompanyId(req.params.companyId);
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    });
  }
});

// 3) Dashboard summary
app.get('/api/companies/:companyId/cards/:cardId/summary', async (req, res) => {
  try {
    const data = await getCardSummary(req.params.companyId, req.params.cardId);
    res.json(data);
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Company or card not found', details: null },
      });
    }
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    });
  }
});

// 4) Transactions for a card (paginated)
app.get('/api/cards/:cardId/transactions', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const cursor = (req.query.cursor as string) || undefined;
    const { items, nextCursor } = await getTransactionsForCard(
      req.params.cardId,
      limit,
      cursor
    );
    res.json({ items, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    });
  }
});

// 5) Activate card
app.post('/api/cards/:cardId/activate', async (req, res) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) {
      return res.status(404).json({
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Card not found', details: null },
      });
    }

    if (card.status === 'ACTIVE') {
      return res.status(400).json({
        error: { code: 'CARD_ALREADY_ACTIVE', message: 'Card is already active', details: null },
      });
    }

    const updated = await activateCard(req.params.cardId);
    if (!updated) {
      return res.status(500).json({
        error: { code: 'CARD_UPDATE_FAILED', message: 'Failed to activate card', details: null },
      });
    }

    res.json({ card: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: null },
    });
  }
});

// 6) Support contact (static for now)
app.get('/api/support/contact', (_req, res) => {
  res.json({
    phone: '+46-8-123-456',
    email: 'support@example.com',
    chatUrl: 'https://example.com/support/chat',
    openingHours: 'Mon–Fri 09:00–17:00 CET',
  });
});

// Only start HTTP server when not running inside Lambda
if (!process.env.LAMBDA_TASK_ROOT) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
