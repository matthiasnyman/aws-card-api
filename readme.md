# Mobile API

## Deployment (step-by-step)

**Prerequisites:** AWS CLI configured.

1. **Database**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-db --template-file infra/database.yaml --parameter-overrides Environment=dev
   ```

2. **S3** (use `-v2` if `dev-mobile-api-artifacts` already exists)
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-s3 --template-file infra/s3.yaml --parameter-overrides Environment=dev ArtifactsBucketSuffix=-v2
   ```

3. **Build and upload Lambda**
   ```bash
   npm run build && zip -r lambda.zip dist node_modules package.json
   aws s3 cp lambda.zip s3://dev-mobile-api-artifacts-v2/lambda.zip
   ```
   (Use `dev-mobile-api-artifacts` if you didn't use the suffix.)

4. **Lambda**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-lambda --template-file infra/lambda.yaml --parameter-overrides Environment=dev --capabilities CAPABILITY_NAMED_IAM
   ```

5. **API Gateway**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-api --template-file infra/api.yaml --parameter-overrides Environment=dev --capabilities CAPABILITY_NAMED_IAM
   ```

6. **Get your API URL** from API Gateway → HTTP APIs → `dev-mobile-http-api` → default stage URL.

7. **Seed data** (optional):
   ```bash
   ENVIRONMENT=dev AWS_REGION=eu-north-1 npm run seed
   ```

### Next steps

- Configure authentication (for example using AWS Cognito) and set `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` for the Lambda/API. Until this is done, the `/api` endpoints run without enforced authentication.

### Resetting the environment

If you need to tear down and redeploy (e.g. after changing stack names or resources), delete the root stack and any leftover DynamoDB tables:

```bash
aws cloudformation delete-stack --stack-name dev-mobile-api-root
aws cloudformation wait stack-delete-complete --stack-name dev-mobile-api-root
```

Then delete the DynamoDB tables `dev-users`, `dev-companies`, `dev-cards`, `dev-transactions`, `dev-invoices` in the AWS console if they still exist.
