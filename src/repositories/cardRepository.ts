import { GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../dynamodbClient';

const ENV = process.env.ENVIRONMENT || 'dev';

const CARDS_TABLE = `${ENV}-cards`;
const COMPANIES_TABLE = `${ENV}-companies`;

export async function getCardById(cardId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: CARDS_TABLE,
      Key: { id: cardId },
    })
  );
  return result.Item || null;
}

export async function getCardsByCompanyId(companyId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CARDS_TABLE,
      IndexName: 'companyId-index',
      KeyConditionExpression: 'companyId = :companyId',
      ExpressionAttributeValues: {
        ':companyId': companyId,
      },
    })
  );
  return result.Items ?? [];
}

export async function getCompanyById(companyId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { id: companyId },
    })
  );
  return result.Item || null;
}

export async function listCompanies() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: COMPANIES_TABLE,
      // For the assignment we ignore pagination; Scan is acceptable for small demo data.
      ProjectionExpression: 'id, #name',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
    })
  );
  return result.Items ?? [];
}

export async function activateCard(cardId: string) {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: CARDS_TABLE,
      Key: { id: cardId },
      UpdateExpression: 'SET #status = :active',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':active': 'ACTIVE',
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes || null;
}

