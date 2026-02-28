import {
    CardSummaryResponse,
    CardDto,
    CompanyDto,
    InvoiceDto,
    SpendDto,
    TransactionDto,
  } from '../dto/cardSummary';
  import {
    getCardById,
    getCompanyById,
  } from '../repositories/cardRepository';
  import {
    getLatestInvoiceForCard,
  } from '../repositories/invoiceRepository';
  import {
    getLatestTransactionsForCard,
  } from '../repositories/transactionRepository';
  
  const LATEST_TXN_LIMIT = 3;
  
  export async function getCardSummary(
    companyId: string,
    cardId: string
  ): Promise<CardSummaryResponse> {
    const [companyDb, cardDb] = await Promise.all([
      getCompanyById(companyId),
      getCardById(cardId),
    ]);
  
    if (!companyDb || !cardDb || cardDb.companyId !== companyId) {
      throw new Error('NOT_FOUND');
    }
  
    const [invoiceDb, { items: txnDbItems, totalCount }] = await Promise.all([
      getLatestInvoiceForCard(cardId),
      getLatestTransactionsForCard(cardId, LATEST_TXN_LIMIT),
    ]);
  
    const company: CompanyDto = {
      id: companyDb.id,
      name: companyDb.name,
    };
  
    const card: CardDto = {
      id: cardDb.id,
      status: cardDb.status,
      maskedNumber: cardDb.maskedNumber,
      brand: cardDb.brand,
      cardImageUrl: cardDb.cardImageUrl ?? null,
    };
  
    const invoice: InvoiceDto | null = invoiceDb
      ? {
          id: invoiceDb.id,
          status: mapInvoiceStatus(invoiceDb.status),
          dueDate: invoiceDb.dueDate, // store as ISO date string in Dynamo
          amountDue: invoiceDb.amountDue,
          currency: invoiceDb.currency,
        }
      : null;
  
    const usedAmount = cardDb.currentSpend ?? 0;
    const limitAmount = cardDb.limitAmount ?? 0;
  
    const spend: SpendDto = {
      usedAmount,
      limitAmount,
      remainingAmount: limitAmount - usedAmount,
      currency: cardDb.currency ?? 'SEK',
      basedOn: 'CARD_LIMIT',
    };
  
    const latestTransactions: { items: TransactionDto[]; totalCount: number } = {
      items: txnDbItems.map((t: any) => ({
        id: t.id,
        cardId: t.cardId,
        createdAt: t.createdAt, // store as ISO string in Dynamo
        merchant: t.merchant,
        description: t.description,
        amount: t.amount,
        currency: t.currency,
        category: t.category,
      })),
      totalCount,
    };
  
    return { company, card, invoice, spend, latestTransactions };
  }
  
  function mapInvoiceStatus(dbStatus: string): InvoiceDto['status'] {
    switch (dbStatus) {
      case 'OPEN':
        return 'DUE_SOON';
      case 'OVERDUE':
        return 'OVERDUE';
      case 'PAID':
      default:
        return 'PAID';
    }
  }