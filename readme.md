# Mobile API

## Deployment (step-by-step)

**Prerequisites:** AWS CLI configured, DynamoDB tables from previous attempts deleted.

### Option A: Use the deploy script

```bash
# If dev-mobile-api-artifacts bucket already exists, use -v2 suffix
./scripts/deploy.sh dev -v2

# If starting fresh (no existing bucket)
./scripts/deploy.sh dev
```

### Option B: Manual deployment

1. **Clean up** (if you have a failed stack):
   ```bash
   aws cloudformation delete-stack --stack-name dev-mobile-api-root
   aws cloudformation wait stack-delete-complete --stack-name dev-mobile-api-root
   ```
   Delete DynamoDB tables `dev-users`, `dev-companies`, `dev-cards`, `dev-transactions`, `dev-invoices` in the console if they exist.

2. **Database**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-db --template-file infra/database.yaml --parameter-overrides Environment=dev
   ```

3. **S3** (use `-v2` if `dev-mobile-api-artifacts` already exists)
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-s3 --template-file infra/s3.yaml --parameter-overrides Environment=dev ArtifactsBucketSuffix=-v2
   ```

4. **Build and upload Lambda**
   ```bash
   npm run build && zip -r lambda.zip dist node_modules package.json
   aws s3 cp lambda.zip s3://dev-mobile-api-artifacts-v2/lambda.zip
   ```
   (Use `dev-mobile-api-artifacts` if you didn't use the suffix.)

5. **Lambda**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-lambda --template-file infra/lambda.yaml --parameter-overrides Environment=dev --capabilities CAPABILITY_NAMED_IAM
   ```

6. **API Gateway**
   ```bash
   aws cloudformation deploy --stack-name dev-mobile-api-api --template-file infra/api.yaml --parameter-overrides Environment=dev --capabilities CAPABILITY_NAMED_IAM
   ```

7. **Get your API URL** from API Gateway → HTTP APIs → `dev-mobile-http-api` → default stage URL.

8. **Seed data** (optional):
   ```bash
   ENVIRONMENT=dev AWS_REGION=eu-north-1 npm run seed
   ```
