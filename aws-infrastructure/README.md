# HireThemNow AI Resume Analysis Agent

This folder contains the complete AWS infrastructure for the AI-powered resume analysis system using Amazon Bedrock.

## Overview

This AI Agent system meets all AWS requirements for building an AI agent:

✅ **LLM from AWS Bedrock**: Uses Amazon Nova Pro and Nova Lite models
✅ **Amazon Bedrock Agent**: Primary orchestration with action groups
✅ **Autonomous Capabilities**: Auto-processes resumes, matches jobs without human input
✅ **Integrations**: PostgreSQL database, .NET API, S3 storage
✅ **Reasoning LLM**: Nova models for decision-making and semantic understanding
✅ **Human-in-the-loop**: Optional manual analysis and refinement

## Architecture

```
User Upload → S3 → Lambda → Bedrock Agent → Nova LLM
                                    ↓
                            Action Groups (APIs)
                                    ↓
                            Database + Storage
```

### Components

1. **Amazon Bedrock Agent**: Orchestrates resume analysis workflow
2. **Amazon Nova (LLM)**:
   - Nova Lite: Fast parsing and extraction
   - Nova Pro: Complex reasoning for job matching
3. **Lambda Functions**:
   - `resume-processor`: Extracts text from PDF/DOCX, triggers analysis
   - `skill-matcher`: Semantic skill matching using AI
   - `job-matcher`: Matches and ranks candidates to jobs
4. **API Gateway**: Exposes action groups for Bedrock Agent
5. **S3 Bucket**: Stores uploaded resumes
6. **PostgreSQL**: Stores analysis results and job data

## Files

```
aws-infrastructure/
├── cloudformation-template.yaml    # Complete infrastructure as code
├── deploy.sh                       # Automated deployment script
├── lambda-functions/
│   ├── resume-processor/
│   │   ├── index.js
│   │   └── package.json
│   ├── skill-matcher/
│   │   ├── index.js
│   │   └── package.json
│   └── job-matcher/
│       ├── index.js
│       └── package.json
└── README.md                       # This file
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** 20.x or later
4. **Database**: PostgreSQL instance accessible from AWS
5. **.NET API**: Deployed and accessible

## AWS Services Used

### Required Services (Meeting AWS Requirements)
- ✅ Amazon Bedrock Agent (primary orchestration)
- ✅ Amazon Bedrock Nova (LLM for reasoning)
- ✅ AWS Lambda (compute)
- ✅ Amazon S3 (storage)
- ✅ Amazon API Gateway (API exposure)

### Optional Services
- Amazon RDS (PostgreSQL database)
- Amazon CloudWatch (logging and monitoring)
- AWS IAM (permissions management)

## Deployment

### Option 1: Automated Deployment (Recommended)

```bash
cd aws-infrastructure
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Create S3 bucket for Lambda code
2. Package all Lambda functions
3. Create Lambda layer for PDF parsing
4. Deploy CloudFormation stack
5. Update Lambda function code
6. Generate configuration file

### Option 2: Manual Deployment

#### Step 1: Package Lambda Functions

```bash
cd lambda-functions/resume-processor
npm install
zip -r resume-processor.zip index.js node_modules package.json

cd ../skill-matcher
npm install
zip -r skill-matcher.zip index.js node_modules package.json

cd ../job-matcher
npm install
zip -r job-matcher.zip index.js node_modules package.json
```

#### Step 2: Deploy CloudFormation Stack

**IMPORTANT: The Lambda function requires VPC configuration to access your RDS database.**

```bash
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name hirethemnow-ai-agent \
  --parameter-overrides \
      DatabaseHost=your-db-host \
      DatabasePassword=your-db-password \
      ApiBaseUrl=https://your-api.com \
      VpcId=vpc-xxxxxxxx \
      SubnetIds=subnet-xxxxxx,subnet-yyyyyy \
      RdsSecurityGroupId=sg-xxxxxxxx \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Required Parameters:**
- `DatabaseHost`: Your RDS endpoint (e.g., `my-db.xxxx.us-east-1.rds.amazonaws.com`)
- `DatabasePassword`: Your database password
- `ApiBaseUrl`: Your API URL (e.g., `https://api.hirethemnow.xyz`)
- `VpcId`: VPC ID where your RDS and Fargate are deployed (e.g., `vpc-08ab0cef55d004211`)
- `SubnetIds`: Comma-separated list of at least 2 subnets in different AZs (e.g., `subnet-abc123,subnet-def456`)
- `RdsSecurityGroupId`: Security group ID of your RDS instance (e.g., `sg-0c2721db36b221307`)

**Finding Your VPC Configuration:**

```bash
# Find your VPC ID
aws rds describe-db-instances --db-instance-identifier your-db-name \
  --query "DBInstances[0].DBSubnetGroup.VpcId" --output text

# Find your RDS Security Group
aws rds describe-db-instances --db-instance-identifier your-db-name \
  --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text

# Find your Subnets
aws rds describe-db-instances --db-instance-identifier your-db-name \
  --query "DBInstances[0].DBSubnetGroup.Subnets[*].SubnetIdentifier" --output text
```

#### Step 3: Upload Lambda Code

```bash
# Upload to S3
aws s3 cp resume-processor.zip s3://your-lambda-bucket/
aws s3 cp skill-matcher.zip s3://your-lambda-bucket/
aws s3 cp job-matcher.zip s3://your-lambda-bucket/

# Update Lambda functions
aws lambda update-function-code \
  --function-name hirethemnow-ai-agent-ResumeProcessor \
  --s3-bucket your-lambda-bucket \
  --s3-key resume-processor.zip
```

## Configuration

### Backend (.NET)

Add to `appsettings.json`:

```json
{
  "AWS": {
    "Region": "us-east-1",
    "Bedrock": {
      "AgentId": "XXXXXXXXXX",
      "AgentAliasId": "XXXXXXXXXX"
    },
    "S3": {
      "ResumeBucket": "hirethemnow-ai-agent-resumes"
    }
  }
}
```

### Install NuGet Packages

```bash
dotnet add package AWSSDK.BedrockAgentRuntime
dotnet add package AWSSDK.BedrockRuntime
dotnet add package AWSSDK.S3
```

### Register Service

In `Program.cs`:

```csharp
builder.Services.AddScoped<IBedrockAgentService, BedrockAgentService>();
```

### Create Database Tables

Run the migration to create the required tables:

```bash
dotnet ef migrations add AddAIAgentTables
dotnet ef database update
```

The migration will create:
- `resume_analyses`: Stores parsed resume data
- `job_match_results`: Stores job matching results

## Usage

### 1. Resume Upload & Analysis

When a user uploads a resume:

```typescript
// Frontend uploads to S3
const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/resumes/upload', {
    method: 'POST',
    body: formData
  });
};
```

**What happens:**
1. File uploaded to S3
2. Lambda triggered automatically
3. PDF/DOCX text extracted
4. Bedrock Agent invoked
5. Nova model parses resume
6. Structured data stored in database
7. Job matching triggered automatically

### 2. Manual Analysis

```typescript
import { AIResumeAnalysis } from '@/components/AIResumeAnalysis';

<AIResumeAnalysis applicationId={123} />
```

### 3. Job Matching

```typescript
import { AIJobMatcher } from '@/components/AIJobMatcher';

<AIJobMatcher candidateId={456} />
```

### 4. Skill Gap Analysis

```typescript
const analyzeSkillGap = async () => {
  const response = await fetch('/api/aiagent/skill-gap-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateId: 456,
      jobId: 789
    })
  });

  const result = await response.json();
  console.log(result.data);
};
```

## Agent Capabilities

### Autonomous Features (No Human Input)
- ✅ Automatic resume parsing on upload
- ✅ Extract skills, experience, education
- ✅ Calculate compatibility scores
- ✅ Auto-match candidates to open jobs
- ✅ Rank candidates by fit

### Human-in-the-Loop Features
- ✅ Custom job requirement analysis
- ✅ Interactive skill gap assessment
- ✅ Manual job matching with specific criteria
- ✅ Interview question generation
- ✅ Candidate comparison

## Bedrock Agent Details

### Foundation Model
- **Primary**: `amazon.nova-pro-v1:0` (complex reasoning)
- **Secondary**: `amazon.nova-lite-v1:0` (fast parsing)

### Action Groups

1. **ResumeParser**
   - Extracts structured data from resumes
   - Identifies skills, experience, education
   - Calculates years of experience

2. **SkillMatcher**
   - Semantic skill matching
   - Considers exact, partial, and related skills
   - Provides match scores and recommendations

3. **JobMatcher**
   - Matches candidates to jobs
   - Multi-dimensional scoring (skills, experience, location, salary)
   - Provides reasoning for each match

## Monitoring

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/hirethemnow-ai-agent-ResumeProcessor --follow

# View Agent invocations
aws logs tail /aws/bedrock/agent/AGENT_ID --follow
```

### Metrics

Key metrics to monitor:
- Lambda invocations
- Agent API calls
- Average processing time
- Error rates
- S3 upload count

## Cost Estimation

### Monthly Costs (Approximate)

- **Amazon Bedrock**: ~$0.50 per 1000 tokens
  - 100 resumes/month: ~$20
- **Lambda**: First 1M requests free
  - ~$5/month for typical usage
- **S3**: $0.023/GB
  - ~$2/month for resume storage
- **API Gateway**: $3.50 per million requests
  - ~$5/month

**Total**: ~$30-50/month for moderate usage

### Cost Optimization Tips

1. Use Nova Lite for simple parsing (cheaper)
2. Cache analysis results in database
3. Use S3 lifecycle policies for old resumes
4. Set Lambda timeout limits
5. Enable API Gateway caching

## Troubleshooting

### Resume Not Processing

Check Lambda logs:
```bash
aws logs tail /aws/lambda/hirethemnow-ai-agent-ResumeProcessor --follow
```

Common issues:
- **PDF parsing failure** → Check file format
- **Bedrock timeout** → Reduce resume size
- **Database connection timeout** → Check VPC/security groups (see below)

### Database Connection Errors

If you see `ETIMEDOUT` or connection errors:

**Problem**: Lambda can't connect to RDS database

**Solution**: Ensure Lambda is in the same VPC as your RDS:

1. Check Lambda VPC configuration:
```bash
aws lambda get-function-configuration \
  --function-name hirethemnow-ai-agent-ResumeProcessor \
  --query "VpcConfig"
```

2. If `VpcConfig` is null or empty, update the Lambda:
```bash
aws lambda update-function-configuration \
  --function-name hirethemnow-ai-agent-ResumeProcessor \
  --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxx
```

3. Add VPC execution permissions to Lambda role:
```bash
aws iam attach-role-policy \
  --role-name hirethemnow-ai-agent-LambdaExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

4. Update RDS security group to allow Lambda access:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <RDS-SECURITY-GROUP-ID> \
  --protocol tcp \
  --port 5432 \
  --source-group <LAMBDA-SECURITY-GROUP-ID>
```

### Bedrock Agent Not Responding

1. Check agent status:
```bash
aws bedrock-agent get-agent --agent-id AGENT_ID
```

2. Verify action group configurations
3. Check Lambda permissions
4. Review CloudWatch logs

### Skill Matching Inaccurate

- Fine-tune prompts in Lambda functions
- Adjust temperature/top_p parameters
- Add more context to skill descriptions
- Consider using Nova Pro instead of Lite

## Security

### Best Practices

1. **IAM Roles**: Use least-privilege permissions
2. **S3 Encryption**: Enable server-side encryption
3. **API Authentication**: Use API keys or OAuth
4. **Database**: Use SSL connections
5. **Secrets**: Store in AWS Secrets Manager

### Data Privacy

- Resumes stored in private S3 bucket
- Data encrypted at rest and in transit
- Compliance with GDPR/CCPA considerations
- Retention policies for PII

## Updating

### Update Lambda Functions

```bash
cd lambda-functions/resume-processor
npm install
zip -r resume-processor.zip .
aws lambda update-function-code \
  --function-name hirethemnow-ai-agent-ResumeProcessor \
  --zip-file fileb://resume-processor.zip
```

### Update Bedrock Agent

```bash
aws bedrock-agent update-agent \
  --agent-id AGENT_ID \
  --agent-name ResumeAnalysisAgent \
  --instruction "Updated instructions..."
```

## Cleanup

To remove all resources:

```bash
aws cloudformation delete-stack --stack-name hirethemnow-ai-agent

# Empty and delete S3 buckets
aws s3 rm s3://hirethemnow-ai-agent-resumes --recursive
aws s3 rb s3://hirethemnow-ai-agent-resumes
```

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS Bedrock documentation
3. Consult AWS Support
4. File issue in GitHub repository

## License

MIT License - See LICENSE file for details

---

**Built with AWS Bedrock Agent, Amazon Nova, and ❤️**
