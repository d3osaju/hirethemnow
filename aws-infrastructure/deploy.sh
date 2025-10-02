#!/bin/bash

# HireThemNow AI Agent Deployment Script
# This script deploys the complete AI Resume Analysis infrastructure to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="hirethemnow-ai-agent"
REGION="us-east-1"
S3_BUCKET_LAMBDA="$STACK_NAME-lambda-code"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}HireThemNow AI Agent Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if logged in to AWS
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with AWS${NC}"
    echo "Please configure AWS credentials first:"
    echo "  aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ Authenticated as account: ${ACCOUNT_ID}${NC}"

# Step 1: Create S3 bucket for Lambda code
echo -e "\n${YELLOW}Step 1: Creating S3 bucket for Lambda code...${NC}"
if aws s3 ls "s3://${S3_BUCKET_LAMBDA}" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://${S3_BUCKET_LAMBDA}" --region ${REGION}
    echo -e "${GREEN}✓ S3 bucket created${NC}"
else
    echo -e "${GREEN}✓ S3 bucket already exists${NC}"
fi

# Step 2: Package Lambda function (Resume Processor only)
echo -e "\n${YELLOW}Step 2: Packaging Lambda function...${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Package Resume Processor
echo "  Packaging resume-processor..."
cd "${SCRIPT_DIR}/lambda-functions/resume-processor"
npm install --production
zip -rq resume-processor.zip index.js node_modules package.json package-lock.json
aws s3 cp resume-processor.zip "s3://${S3_BUCKET_LAMBDA}/resume-processor.zip"
rm resume-processor.zip
cd "${SCRIPT_DIR}"
echo -e "${GREEN}  ✓ resume-processor packaged and uploaded${NC}"

# Step 3: Create PDF parsing layer
echo -e "\n${YELLOW}Step 3: Creating Lambda layer for PDF parsing...${NC}"
mkdir -p layers/pdf-parsing/nodejs
cd layers/pdf-parsing/nodejs
npm init -y
npm install pdf-parse mammoth --save
cd ..
zip -rq pdf-parsing-layer.zip nodejs
aws s3 cp pdf-parsing-layer.zip "s3://${S3_BUCKET_LAMBDA}/pdf-parsing-layer.zip"
cd ../..
rm -rf layers
echo -e "${GREEN}✓ Lambda layer created${NC}"

# Step 4: Get user input for parameters
echo -e "\n${YELLOW}Step 4: Gathering deployment parameters...${NC}"

read -p "Enter your database host (e.g., mydb.abc123.us-east-1.rds.amazonaws.com): " DB_HOST
read -sp "Enter your database password: " DB_PASSWORD
echo
read -p "Enter your .NET API base URL (e.g., https://api.hirethemnow.com): " API_BASE_URL

# Step 5: Deploy CloudFormation stack
echo -e "\n${YELLOW}Step 5: Deploying CloudFormation stack...${NC}"

aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
      DatabaseHost=${DB_HOST} \
      DatabasePassword=${DB_PASSWORD} \
      ApiBaseUrl=${API_BASE_URL} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${REGION}

echo -e "${GREEN}✓ CloudFormation stack deployed${NC}"

# Step 6: Get stack outputs
echo -e "\n${YELLOW}Step 6: Retrieving deployment information...${NC}"

AGENT_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`AgentId`].OutputValue' \
  --output text \
  --region ${REGION})

AGENT_ALIAS_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`AgentAliasId`].OutputValue' \
  --output text \
  --region ${REGION})

S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text \
  --region ${REGION})

API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text \
  --region ${REGION})

# Step 7: Update Lambda function code
echo -e "\n${YELLOW}Step 7: Updating Lambda function code...${NC}"

aws lambda update-function-code \
  --function-name "${STACK_NAME}-ResumeProcessor" \
  --s3-bucket ${S3_BUCKET_LAMBDA} \
  --s3-key resume-processor.zip \
  --region ${REGION} \
  > /dev/null

aws lambda update-function-code \
  --function-name "${STACK_NAME}-SkillMatcher" \
  --s3-bucket ${S3_BUCKET_LAMBDA} \
  --s3-key skill-matcher.zip \
  --region ${REGION} \
  > /dev/null

aws lambda update-function-code \
  --function-name "${STACK_NAME}-JobMatcher" \
  --s3-bucket ${S3_BUCKET_LAMBDA} \
  --s3-key job-matcher.zip \
  --region ${REGION} \
  > /dev/null

echo -e "${GREEN}✓ Lambda functions updated${NC}"

# Step 8: Create environment configuration file
echo -e "\n${YELLOW}Step 8: Creating environment configuration...${NC}"

cat > deployment-config.env << EOF
# AWS Bedrock Agent Configuration
# Add these to your .NET appsettings.json

AWS__Region=${REGION}
AWS__Bedrock__AgentId=${AGENT_ID}
AWS__Bedrock__AgentAliasId=${AGENT_ALIAS_ID}
AWS__S3__ResumeBucket=${S3_BUCKET}
AWS__ApiGateway__Endpoint=${API_ENDPOINT}

# Add these environment variables to your application:
export AWS_REGION=${REGION}
export BEDROCK_AGENT_ID=${AGENT_ID}
export BEDROCK_AGENT_ALIAS_ID=${AGENT_ALIAS_ID}
export S3_RESUME_BUCKET=${S3_BUCKET}
EOF

echo -e "${GREEN}✓ Configuration saved to deployment-config.env${NC}"

# Display deployment summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}Bedrock Agent ID:${NC} ${AGENT_ID}"
echo -e "${YELLOW}Agent Alias ID:${NC} ${AGENT_ALIAS_ID}"
echo -e "${YELLOW}S3 Resume Bucket:${NC} ${S3_BUCKET}"
echo -e "${YELLOW}API Gateway Endpoint:${NC} ${API_ENDPOINT}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Add the configuration from deployment-config.env to your .NET appsettings.json"
echo "2. Install AWS SDK NuGet packages:"
echo "   - AWSSDK.BedrockAgentRuntime"
echo "   - AWSSDK.BedrockRuntime"
echo "3. Register BedrockAgentService in your Startup.cs"
echo "4. Deploy your updated .NET application"
echo "5. Test by uploading a resume to the S3 bucket: ${S3_BUCKET}"
echo
echo -e "${GREEN}Deployment configuration saved to: deployment-config.env${NC}"
