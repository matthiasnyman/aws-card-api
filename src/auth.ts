import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Request, Response, NextFunction } from 'express';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (verifier) return verifier;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    return null;
  }
  verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',
  });
  return verifier;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email?: string;
    [key: string]: any;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const v = getVerifier();
  if (!v) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Missing bearer token', details: null },
    });
  }

  const token = auth.slice('Bearer '.length);

  try {
    const payload = await v.verify(token, { clientId: process.env.COGNITO_CLIENT_ID!, tokenUse: 'id' });
    req.user = {
      ...(payload as any),
      sub: payload.sub,
      email: (payload as any).email,
    };
    return next();
  } catch (err) {
    console.error('JWT verify failed', err);
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token', details: null },
    });
  }
}