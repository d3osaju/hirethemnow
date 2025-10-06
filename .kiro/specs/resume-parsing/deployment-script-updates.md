# Deployment Script Updates

## Summary

The `deploy-backend.ps1` script has been updated to automatically configure AWS Bedrock and Textract permissions for resume parsing functionality.

## What Was Added

### Step 9: Resume Parsing (Bedrock & Textract) Setup

This new step runs at the end of the deployment and:

1. **Checks IAM Role Exists**
   - Verifies `aws-elasticbeanstalk-ec2-role` exists
   - Skips if role doesn't exist (with warning)

2. **Creates AI Services Policy** (if it doesn't exist)
   - Policy name: `HireThemNowAIAccess`
   - Grants permissions for:
     - `textract:DetectDocumentText` (for text extraction)
     - `bedrock:InvokeModel` (for Claude 3 Sonnet)
   - Only creates if policy doesn't already exist

3. **Verifies Bedrock Model Access**
   - Checks if Claude 3 Sonnet model is accessible
   - Displays clear instructions if not enabled
   - Shows status in deployment summary

## IAM Policy Created

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    }
  ]
}
```

## Deployment Output

### When Bedrock Access is Enabled

```
========================================
Resume Parsing (Bedrock & Textract) Setup
========================================

Configuring permissions for resume parsing...
AI services policy already exists - skipping

Checking Bedrock model access...
Bedrock model access confirmed!
  Model: anthropic.claude-3-sonnet-20240229-v1:0

========================================
Deployment Complete!
========================================

Resume Parsing Status:
  ✓ Bedrock model access: Enabled
  ✓ Textract permissions: Configured
  ✓ S3 access: Configured
  ✓ Resume parsing: Ready to use!
```

### When Bedrock Access is NOT Enabled

```
========================================
Resume Parsing (Bedrock & Textract) Setup
========================================

Configuring permissions for resume parsing...
Creating AI services policy for Bedrock and Textract...
AI services permissions configured successfully!

Checking Bedrock model access...

WARNING: Bedrock model access not confirmed!
Resume parsing will NOT work until you:
  1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/
  2. Navigate to 'Model access' in the left sidebar
  3. Click 'Manage model access'
  4. Enable 'Anthropic Claude 3 Sonnet'
  5. Click 'Save changes' (approval is usually instant)

Note: This is a one-time setup per AWS account/region

========================================
Deployment Complete!
========================================

Resume Parsing Status:
  ✗ Bedrock model access: NOT ENABLED
  ✓ Textract permissions: Configured
  ✓ S3 access: Configured
  ⚠ Resume parsing: Requires Bedrock model access
```

## Environment Variables

### Required in .env.deploy

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database Password
DATABASE_PASSWORD=your-secure-database-password
```

### Auto-Configured by Script

These are set automatically:
- `DATABASE_HOST` - From RDS endpoint
- `DATABASE_NAME` - Defaults to 'postgres'
- `DATABASE_USER` - Defaults to 'postgres'
- S3 bucket permissions
- Bedrock and Textract IAM permissions

## Manual Steps Required

### 1. Enable Bedrock Model Access (One-Time)

If the script shows "Bedrock model access: NOT ENABLED":

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Click "Model access" in left sidebar
3. Click "Manage model access"
4. Find "Anthropic" section
5. Enable "Claude 3 Sonnet"
6. Click "Save changes"
7. Wait for approval (usually instant)

### 2. Verify Permissions

After deployment, verify permissions are working:

```bash
# Check IAM policy
aws iam get-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-name HireThemNowAIAccess

# Check Bedrock access
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, 'claude-3-sonnet')]"
```

## Troubleshooting

### Issue: "aws-elasticbeanstalk-ec2-role does not exist"

**Solution**: The Elastic Beanstalk environment hasn't been created yet. The role will be created automatically when you create the environment. Run the deployment script again after the environment is created.

### Issue: "Failed to configure AI services permissions"

**Solution**: 
1. Check AWS credentials have IAM permissions
2. Manually add the policy in IAM Console:
   - Go to IAM → Roles → aws-elasticbeanstalk-ec2-role
   - Add inline policy with the JSON above

### Issue: "Bedrock model access not confirmed"

**Solution**: This is expected on first deployment. Follow the manual steps above to enable Bedrock model access in the AWS Console.

### Issue: Resume parsing fails with "AccessDenied"

**Possible Causes**:
1. Bedrock model access not enabled
2. IAM policy not attached correctly
3. Wrong AWS region

**Solution**:
1. Verify Bedrock model access in console
2. Check IAM policy is attached to role
3. Verify `AWS_REGION` matches where Bedrock is enabled

## Testing After Deployment

### 1. Upload a Test Resume

```bash
curl -X POST https://api.hirethemnow.xyz/api/resume/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "resume=@test-resume.pdf"
```

### 2. Check Parsing Status (wait 10-15 seconds)

```bash
curl https://api.hirethemnow.xyz/api/resume/parsing-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify Parsed Content

```bash
curl https://api.hirethemnow.xyz/api/resume/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check CloudWatch Logs

Look for these log messages:
```
[Information] Starting resume parsing for S3 URL: s3://...
[Information] Text extraction completed in 3.45s
[Information] Content structuring completed in 5.23s
[Information] Resume parsing completed successfully in 8.68s
```

## Cost Impact

The deployment script adds permissions for:
- **Textract**: ~$0.003 per resume
- **Bedrock**: ~$0.021 per resume
- **Total**: ~$0.024 per resume parsed

No additional infrastructure costs.

## Security Considerations

### Principle of Least Privilege

The IAM policy grants only the minimum permissions needed:
- Textract: Only `DetectDocumentText` (not `AnalyzeDocument`)
- Bedrock: Only `InvokeModel` for specific Claude 3 Sonnet model
- No write permissions
- No admin permissions

### Resource Restrictions

- Bedrock: Limited to specific model ARN
- Textract: No resource restrictions (required by AWS)
- S3: Already restricted to `hirethemnow-files` bucket

## Rollback

If you need to remove the AI permissions:

```bash
# Remove the policy
aws iam delete-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-name HireThemNowAIAccess

# Disable background processing in appsettings.json
# Set: "EnableBackgroundProcessing": false
```

## Next Steps After Deployment

1. ✅ Run deployment script
2. ✅ Enable Bedrock model access (if needed)
3. ✅ Test resume upload
4. ✅ Verify parsing completes
5. ✅ Check CloudWatch logs
6. ✅ Monitor AWS costs

## Support

If you encounter issues:
1. Check CloudWatch logs for errors
2. Verify IAM permissions in console
3. Confirm Bedrock model access is enabled
4. Review [bedrock-integration-guide.md](./bedrock-integration-guide.md)
