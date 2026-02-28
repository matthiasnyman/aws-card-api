import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../dynamodbClient';

const ENV = process.env.ENVIRONMENT || 'dev';
const INVOICES_TABLE = `${ENV}-invoices`;

export async function getLatestInvoiceForCard(cardId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: INVOICES_TABLE,
      IndexName: 'cardId-dueDate-index',
      KeyConditionExpression: 'cardId = :cardId',
      ExpressionAttributeValues: {
        ':cardId': cardId,
      },
      ScanIndexForward: false, // descending by dueDate
      Limit: 1,
    })
  );

  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}
