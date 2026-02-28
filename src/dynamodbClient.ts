import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'eu-north-1';

export const dynamoClient = new DynamoDBClient({
  region,
  endpoint: process.env.DYNAMODB_ENDPOINT, // optional: for local DynamoDB
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});


