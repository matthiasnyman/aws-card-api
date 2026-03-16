import serverlessExpress from '@vendia/serverless-express';
import app from './index';

const proxy = serverlessExpress({ app });

export const handler = async (event: any, context: any) => {
  return await proxy(event, context, undefined as any);
};


