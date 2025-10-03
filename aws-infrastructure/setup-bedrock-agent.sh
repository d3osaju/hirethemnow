#!/bin/bash

# Setup Bedrock Agent for HireThemNow Resume Analysis
# Note: CloudFormation doesn't support Bedrock Agent resources yet
# This script creates the agent, action group, and alias via AWS CLI

set -e

STACK_NAME="hirethemnow-ai-agent"
REGION="us-east-1"
AGENT_NAME="${STACK_NAME}-ResumeAnalysisAgent"

echo "🤖 Setting up Bedrock Agent for Resume Analysis..."
echo "=================================================="

# Get Lambda ARN from CloudFormation stack
echo "📋 Getting Lambda function ARN..."
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='ATSAnalyzerActionArn'].OutputValue" \
  --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "❌ Error: Could not find Lambda function ARN in stack outputs"
  echo "   Make sure CloudFormation stack is deployed first"
  exit 1
fi

echo "✅ Lambda ARN: $LAMBDA_ARN"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"

# Create IAM Role for Bedrock Agent
echo ""
echo "🔐 Creating IAM Role for Bedrock Agent..."

ROLE_NAME="${STACK_NAME}-BedrockAgentRole"

# Check if role already exists
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
  echo "✅ IAM Role already exists: $ROLE_NAME"
else
  # Create trust policy
  cat > /tmp/bedrock-agent-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  # Create role
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/bedrock-agent-trust-policy.json \
    --region $REGION

  echo "✅ Created IAM Role: $ROLE_NAME"

  # Create and attach policy
  cat > /tmp/bedrock-agent-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0",
        "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "$LAMBDA_ARN"
    }
  ]
}
EOF

  aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name BedrockAgentPolicy \
    --policy-document file:///tmp/bedrock-agent-policy.json \
    --region $REGION

  echo "✅ Attached policy to role"

  # Wait for role to be available
  echo "⏳ Waiting for IAM role to propagate..."
  sleep 10
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Create Bedrock Agent
echo ""
echo "🤖 Creating Bedrock Agent..."

AGENT_INSTRUCTION=$(cat <<'EOF'
You are an expert resume analysis agent. Your role is to help analyze resumes for ATS (Applicant Tracking System) compatibility.

When given a resume, you should:
1. Use the analyzeResume action to get comprehensive ATS analysis
2. Provide detailed insights about strengths and weaknesses
3. Suggest specific, actionable improvements
4. Explain scoring in clear terms

Always be specific, actionable, and helpful in your responses.
EOF
)

# Check if agent already exists
EXISTING_AGENT=$(aws bedrock-agent list-agents \
  --region $REGION \
  --query "agentSummaries[?agentName=='$AGENT_NAME'].agentId" \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_AGENT" ]; then
  echo "✅ Bedrock Agent already exists: $EXISTING_AGENT"
  AGENT_ID=$EXISTING_AGENT
else
  AGENT_ID=$(aws bedrock-agent create-agent \
    --agent-name $AGENT_NAME \
    --agent-resource-role-arn $ROLE_ARN \
    --foundation-model "amazon.nova-pro-v1:0" \
    --instruction "$AGENT_INSTRUCTION" \
    --idle-session-ttl-in-seconds 600 \
    --region $REGION \
    --query 'agent.agentId' \
    --output text)

  echo "✅ Created Bedrock Agent: $AGENT_ID"
fi

# Create Action Group
echo ""
echo "🛠️ Creating Action Group..."

# Create OpenAPI schema file
cat > /tmp/ats-analyzer-schema.json <<'EOF'
{
  "openapi": "3.0.0",
  "info": {
    "title": "ATS Resume Analyzer API",
    "version": "1.0.0",
    "description": "Action group for analyzing resumes with ATS scoring"
  },
  "paths": {
    "/analyze-resume": {
      "post": {
        "summary": "Analyze a resume for ATS compatibility",
        "description": "Analyzes resume text and provides comprehensive ATS scoring",
        "operationId": "analyzeResume",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["resumeText"],
                "properties": {
                  "resumeText": {
                    "type": "string",
                    "description": "The full text content of the resume"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful analysis",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          }
        }
      }
    }
  }
}
EOF

# Check if action group already exists
EXISTING_ACTION=$(aws bedrock-agent list-agent-action-groups \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --region $REGION \
  --query "actionGroupSummaries[?actionGroupName=='ATSAnalyzer'].actionGroupId" \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ACTION" ]; then
  echo "✅ Action Group already exists: $EXISTING_ACTION"
else
  # Create CLI input JSON file for action group
  cat > /tmp/action-group-input.json <<EOF
{
  "agentId": "$AGENT_ID",
  "agentVersion": "DRAFT",
  "actionGroupName": "ATSAnalyzer",
  "actionGroupExecutor": {
    "lambda": "$LAMBDA_ARN"
  },
  "apiSchema": {
    "payload": $(cat /tmp/ats-analyzer-schema.json)
  }
}
EOF

  ACTION_GROUP_ID=$(aws bedrock-agent create-agent-action-group \
    --cli-input-json file:///tmp/action-group-input.json \
    --region $REGION \
    --query 'agentActionGroup.actionGroupId' \
    --output text)

  echo "✅ Created Action Group: $ACTION_GROUP_ID"
fi

# Prepare the agent
echo ""
echo "🔄 Preparing Bedrock Agent..."
aws bedrock-agent prepare-agent \
  --agent-id $AGENT_ID \
  --region $REGION \
  > /dev/null

echo "✅ Agent prepared"

# Create or update agent alias
echo ""
echo "🏷️ Creating Agent Alias..."

EXISTING_ALIAS=$(aws bedrock-agent list-agent-aliases \
  --agent-id $AGENT_ID \
  --region $REGION \
  --query "agentAliasSummaries[?agentAliasName=='production'].agentAliasId" \
  --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ALIAS" ]; then
  echo "✅ Agent Alias already exists: $EXISTING_ALIAS"
  ALIAS_ID=$EXISTING_ALIAS
else
  ALIAS_ID=$(aws bedrock-agent create-agent-alias \
    --agent-id $AGENT_ID \
    --agent-alias-name production \
    --description "Production alias for Resume Analysis Agent" \
    --region $REGION \
    --query 'agentAlias.agentAliasId' \
    --output text)

  echo "✅ Created Agent Alias: $ALIAS_ID"
fi

# Update Lambda environment variables with Agent ID and Alias ID
echo ""
echo "🔧 Updating Lambda environment variables..."

LAMBDA_NAME="${STACK_NAME}-ResumeProcessor"

aws lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --environment "Variables={DATABASE_HOST=$(aws lambda get-function-configuration --function-name $LAMBDA_NAME --query 'Environment.Variables.DATABASE_HOST' --output text),DATABASE_PASSWORD=$(aws lambda get-function-configuration --function-name $LAMBDA_NAME --query 'Environment.Variables.DATABASE_PASSWORD' --output text),API_BASE_URL=$(aws lambda get-function-configuration --function-name $LAMBDA_NAME --query 'Environment.Variables.API_BASE_URL' --output text),RESUME_BUCKET=$(aws lambda get-function-configuration --function-name $LAMBDA_NAME --query 'Environment.Variables.RESUME_BUCKET' --output text),AGENT_ID=$AGENT_ID,AGENT_ALIAS_ID=$ALIAS_ID}" \
  --region $REGION \
  > /dev/null

echo "✅ Updated Lambda environment variables"

# Summary
echo ""
echo "=========================================="
echo "🎉 Bedrock Agent Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Resources Created:"
echo "   • IAM Role: $ROLE_ARN"
echo "   • Bedrock Agent: $AGENT_ID"
echo "   • Action Group: ATSAnalyzer"
echo "   • Agent Alias: $ALIAS_ID (production)"
echo "   • Lambda Updated: $LAMBDA_NAME"
echo ""
echo "🧪 Test the agent:"
echo "   aws bedrock-agent-runtime invoke-agent \\"
echo "     --agent-id $AGENT_ID \\"
echo "     --agent-alias-id $ALIAS_ID \\"
echo "     --session-id test-$(date +%s) \\"
echo "     --input-text \"Analyze this resume: [paste text]\" \\"
echo "     --region $REGION \\"
echo "     /tmp/agent-response.txt"
echo ""
echo "✅ Ready to process resumes with Bedrock Agent!"
