import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamodbClient';

const ENV = process.env.ENVIRONMENT || 'dev';

const COMPANIES_TABLE = `${ENV}-companies`;
const CARDS_TABLE = `${ENV}-cards`;
const INVOICES_TABLE = `${ENV}-invoices`;
const TRANSACTIONS_TABLE = `${ENV}-transactions`;

async function main() {
  const companyId = 'comp_demo';
  const cardId = 'card_demo';

  // 1) Company
  await docClient.send(
    new PutCommand({
      TableName: COMPANIES_TABLE,
      Item: {
        id: companyId,
        name: 'Company AB',
      },
    })
  );

  // 2) Card
  await docClient.send(
    new PutCommand({
      TableName: CARDS_TABLE,
      Item: {
        id: cardId,
        companyId,
        status: 'ACTIVE',
        maskedNumber: '•••• •••• •••• 1234',
        brand: 'Visa',
        cardImageUrl: null,
        currentSpend: 5400,
        limitAmount: 10000,
        currency: 'SEK',
      },
    })
  );

  // 3) Invoice (latest open)
  await docClient.send(
    new PutCommand({
      TableName: INVOICES_TABLE,
      Item: {
        id: 'inv_demo',
        cardId,
        status: 'OPEN',
        dueDate: '2024-03-31', // matches GSI RANGE attr
        amountDue: 5400,
        currency: 'SEK',
      },
    })
  );

  // 4) A few recent transactions
  const txns = [
    {
      id: 'txn_1',
      cardId,
      createdAt: 1709277600, // unix seconds, matches your GSI NUMBER
      merchant: 'Merchant A',
      description: 'Transaction data',
      amount: 1800,
      currency: 'SEK',
      category: 'GENERAL',
    },
    {
      id: 'txn_2',
      cardId,
      createdAt: 1709364000,
      merchant: 'Merchant B',
      description: 'Transaction data',
      amount: 2000,
      currency: 'SEK',
      category: 'GENERAL',
    },
    {
      id: 'txn_3',
      cardId,
      createdAt: 1709450400,
      merchant: 'Merchant C',
      description: 'Transaction data',
      amount: 1600,
      currency: 'SEK',
      category: 'GENERAL',
    },
  ];

  for (const txn of txns) {
    await docClient.send(
      new PutCommand({
        TableName: TRANSACTIONS_TABLE,
        Item: txn,
      })
    );
  }

  console.log('Seed data written for', { companyId, cardId });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});