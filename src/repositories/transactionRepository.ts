import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../dynamodbClient';

const ENV = process.env.ENVIRONMENT || 'dev';
const TRANSACTIONS_TABLE = `${ENV}-transactions`;

export async function getLatestTransactionsForCard(cardId: string, limit: number) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'cardId-createdAt-index',
      KeyConditionExpression: 'cardId = :cardId',
      ExpressionAttributeValues: {
        ':cardId': cardId,
      },
      ScanIndexForward: false, // descending by createdAt
      Limit: limit,
    })
  );

  const countResult = await docClient.send(
    new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'cardId-createdAt-index',
      KeyConditionExpression: 'cardId = :cardId',
      ExpressionAttributeValues: {
        ':cardId': cardId,
      },
      Select: 'COUNT',
    })
  );

  return {
    items: result.Items ?? [],
    totalCount: countResult.Count ?? 0,
  };
}

export async function getTransactionsForCard(
  cardId: string,
  limit: number,
  cursor?: string
) {
  let exclusiveStartKey;
  if (cursor) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    } catch {
      exclusiveStartKey = undefined;
    }
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'cardId-createdAt-index',
      KeyConditionExpression: 'cardId = :cardId',
      ExpressionAttributeValues: {
        ':cardId': cardId,
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    })
  );

  const nextCursor = result.LastEvaluatedKey
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey), 'utf8').toString('base64')
    : null;

  return {
    items: result.Items ?? [],
    nextCursor,
  };
}

