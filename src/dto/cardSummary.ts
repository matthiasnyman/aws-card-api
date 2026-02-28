// DTOs returned to the frontend

export interface CompanyDto {
    id: string;
    name: string;
  }
  
  export interface CardDto {
    id: string;
    status: 'ACTIVE' | 'INACTIVE';
    maskedNumber: string;
    brand: string;
    cardImageUrl: string | null;
  }
  
  export interface InvoiceDto {
    id: string;
    status: 'DUE_SOON' | 'PAID' | 'OVERDUE';
    dueDate: string; // ISO date
    amountDue: number;
    currency: string;
  }
  
  export interface SpendDto {
    usedAmount: number;
    limitAmount: number;
    remainingAmount: number;
    currency: string;
    basedOn: 'CARD_LIMIT' | 'COMPANY_LIMIT';
  }
  
  export interface TransactionDto {
    id: string;
    cardId: string;
    createdAt: string;
    merchant: string;
    description: string;
    amount: number;
    currency: string;
    category: string;
  }
  
  export interface CardSummaryResponse {
    company: CompanyDto;
    card: CardDto;
    invoice: InvoiceDto | null;
    spend: SpendDto;
    latestTransactions: {
      items: TransactionDto[];
      totalCount: number;
    };
  }