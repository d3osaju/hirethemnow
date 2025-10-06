# Design Document

## Overview

This design outlines the configuration changes needed to enable AWS Bedrock (Nova Pro model) and Textract services in the HireThemNow backend deployment. The solution focuses on updating the deployment script to automatically configure IAM permissions, verify NuGet packages, and add health check endpoints for AWS service validation.

## Architecture

### Current State
- Backend deployed to AWS Elastic Beanstalk (Windows Server 2022 + IIS)
- EC2 instances use `aws-elasticbeanstalk-ec2-role` IAM role
- Current IAM policy only includes S3 permissions
- AWS SDK services (BedrockRuntime, Textract) are registered in Program.cs but lack IAM permissions
- No health check endpoint to verify AWS service connectivity

### Target State
- IAM role includes comprehensive permissions for S3, Bedrock, and Textract
- Deployment script automatically configures/updates IAM policies
- Health check endpoint validates AWS service access
- Clear logging for permission and configuration issues

## Components and Interfaces

### 1. IAM Policy Configuration

**Policy Name:** `HireThemNowAIServicesAccess`

**Policy Document Structure:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ResumeAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hirethemnow-files",
        "arn:aws:s3:::hirethemnow-files/*"
      ]
    },
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"
      ]
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    }
  ]
}
```

**Key Design Decisions:**
- Combine all permissions into a single policy for easier management
- Use specific resource ARNs for Bedrock model to follow least privilege
- Textract requires wildcard resource (AWS limitation)
- Use descriptive Sid values for each permission group

### 2. Deployment Script Updates

**File:** `deploy-backend.ps1`

**New Section: AI Services IAM Configuration**

Location: After S3 IAM configuration (around line 180)

**Flow:**
1. Check if `aws-elasticbeanstalk-ec2-role` exists
2. Create policy JSON file with combined permissions
3. Use `aws iam put-role-policy` to force update the policy
4. Verify policy was applied successfully
5. Clean up temporary policy file
6. Log success/failure messages

**PowerShell Implementation Pattern:**
```powershell
Write-Host "Configuring AI Services permissions..." -ForegroundColor Yellow

# Create comprehensive policy
$policyName = "HireThemNowAIServicesAccess"
$policyDocument = @"
{
  "Version": "2012-10-17",
  "Statement": [...]
}
"@

# Write to file
$policyDocument | Set-Content -Path ai-services-policy.json -Encoding ASCII

# Force update policy (overwrites if exists)
aws iam put-role-policy `
    --role-name aws-elasticbeanstalk-ec2-role `
    --policy-name $policyName `
    --policy-document file://ai-services-policy.json

# Verify and cleanup
if ($LASTEXITCODE -eq 0) {
    Write-Host "AI Services permissions configured successfully!" -ForegroundColor Green
    Remove-Item ai-services-policy.json -ErrorAction SilentlyContinue
} else {
    Write-Host "ERROR: Failed to configure AI Services permissions" -ForegroundColor Red
    exit 1
}
```

**Error Handling:**
- Exit deployment if IAM role doesn't exist
- Exit deployment if policy update fails
- Provide clear error messages with remediation steps

### 3. Health Check Endpoint

**File:** `HireThemNoW.Server/Controllers/HealthController.cs` (new file)

**Endpoint:** `GET /api/health/aws-services`

**Response Model:**
```csharp
public class AwsServicesHealthResponse
{
    public bool AllServicesHealthy { get; set; }
    public S3HealthStatus S3 { get; set; }
    public TextractHealthStatus Textract { get; set; }
    public BedrockHealthStatus Bedrock { get; set; }
    public DateTime CheckedAt { get; set; }
}

public class S3HealthStatus
{
    public bool IsAccessible { get; set; }
    public string BucketName { get; set; }
    public string? ErrorMessage { get; set; }
}

public class TextractHealthStatus
{
    public bool IsAccessible { get; set; }
    public string? Region { get; set; }
    public string? ErrorMessage { get; set; }
}

public class BedrockHealthStatus
{
    public bool IsAccessible { get; set; }
    public string ModelId { get; set; }
    public string? Region { get; set; }
    public string? ErrorMessage { get; set; }
}
```

**Health Check Logic:**

1. **S3 Check:**
   - Attempt to list objects in `hirethemnow-files` bucket
   - Catch `AccessDeniedException` or `NoSuchBucketException`

2. **Textract Check:**
   - Create minimal `DetectDocumentTextRequest` with dummy data
   - Catch `AccessDeniedException` or service unavailable errors

3. **Bedrock Check:**
   - Attempt to invoke model with minimal prompt
   - Catch `AccessDeniedException`, `ResourceNotFoundException`, or model not found errors

**Implementation Pattern:**
```csharp
private async Task<BedrockHealthStatus> CheckBedrockHealthAsync()
{
    try
    {
        var modelId = _configuration["ResumeParsing:BedrockModelId"] ?? "amazon.nova-pro-v1:0";
        
        // Minimal test request
        var testPrompt = "test";
        var requestBody = new { messages = new[] { new { role = "user", content = new[] { new { text = testPrompt } } } } };
        var requestBodyJson = JsonSerializer.Serialize(requestBody);
        var requestBodyStream = new MemoryStream(Encoding.UTF8.GetBytes(requestBodyJson));
        
        var invokeRequest = new InvokeModelRequest
        {
            ModelId = modelId,
            Body = requestBodyStream,
            ContentType = "application/json"
        };
        
        await _bedrockClient.InvokeModelAsync(invokeRequest);
        
        return new BedrockHealthStatus
        {
            IsAccessible = true,
            ModelId = modelId,
            Region = _bedrockClient.Config.RegionEndpoint?.SystemName
        };
    }
    catch (Exception ex)
    {
        return new BedrockHealthStatus
        {
            IsAccessible = false,
            ModelId = modelId,
            ErrorMessage = ex.Message
        };
    }
}
```

### 4. Enhanced Logging

**Updates to BedrockAgentService.cs:**

Add detailed logging for permission errors:

```csharp
catch (AmazonBedrockRuntimeException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
{
    _logger.LogError(ex,
        "Access denied to Bedrock model {ModelId}. Check IAM permissions for bedrock:InvokeModel",
        modelId);
    throw;
}
catch (AmazonTextractException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
{
    _logger.LogError(ex,
        "Access denied to Textract. Check IAM permissions for textract:DetectDocumentText");
    throw;
}
```

**Updates to ResumeParsingBackgroundService.cs:**

Add startup validation:

```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    _logger.LogInformation("Resume parsing background service starting");
    
    // Validate configuration
    var modelId = _configuration["ResumeParsing:BedrockModelId"];
    var bucketName = _configuration["AWS:S3:BucketName"];
    
    if (string.IsNullOrEmpty(modelId))
    {
        _logger.LogError("ResumeParsing:BedrockModelId is not configured");
    }
    
    if (string.IsNullOrEmpty(bucketName))
    {
        _logger.LogError("AWS:S3:BucketName is not configured");
    }
    
    // Continue with existing logic...
}
```

## Data Models

### Configuration Settings

**appsettings.json additions:**
```json
{
  "AWS": {
    "Region": "us-east-1",
    "S3": {
      "BucketName": "hirethemnow-files"
    }
  },
  "ResumeParsing": {
    "BedrockModelId": "amazon.nova-pro-v1:0",
    "EnableBackgroundProcessing": true,
    "PollingIntervalSeconds": 10,
    "MaxConcurrentProcessing": 3
  }
}
```

**Environment Variables (Elastic Beanstalk):**
- `AWS_REGION`: us-east-1 (set by EB automatically)
- All other settings come from appsettings.json

## Error Handling

### IAM Permission Errors

**Bedrock Access Denied:**
```
Error: User: arn:aws:sts::ACCOUNT:assumed-role/aws-elasticbeanstalk-ec2-role/INSTANCE is not authorized to perform: bedrock:InvokeModel on resource: arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0
```

**Resolution:** Run deployment script to update IAM policy

**Textract Access Denied:**
```
Error: User: arn:aws:sts::ACCOUNT:assumed-role/aws-elasticbeanstalk-ec2-role/INSTANCE is not authorized to perform: textract:DetectDocumentText
```

**Resolution:** Run deployment script to update IAM policy

### Configuration Errors

**Missing Model ID:**
```
Error: ResumeParsing:BedrockModelId configuration is missing
```

**Resolution:** Verify appsettings.json includes BedrockModelId

**Invalid Model ID:**
```
Error: ResourceNotFoundException: Could not resolve the foundation model from the model identifier
```

**Resolution:** Verify model ID is correct and available in region

## Testing Strategy

### 1. IAM Policy Verification

**Test:** Verify policy is created/updated
```powershell
aws iam get-role-policy `
    --role-name aws-elasticbeanstalk-ec2-role `
    --policy-name HireThemNowAIServicesAccess
```

**Expected:** Policy JSON with all three statement blocks (S3, Bedrock, Textract)

### 2. Health Check Endpoint Testing

**Test:** Call health check endpoint
```bash
curl https://api.hirethemnow.xyz/api/health/aws-services
```

**Expected Response:**
```json
{
  "allServicesHealthy": true,
  "s3": {
    "isAccessible": true,
    "bucketName": "hirethemnow-files",
    "errorMessage": null
  },
  "textract": {
    "isAccessible": true,
    "region": "us-east-1",
    "errorMessage": null
  },
  "bedrock": {
    "isAccessible": true,
    "modelId": "amazon.nova-pro-v1:0",
    "region": "us-east-1",
    "errorMessage": null
  },
  "checkedAt": "2025-10-06T12:00:00Z"
}
```

### 3. End-to-End Resume Parsing Test

**Test:** Upload a sample resume and verify parsing completes

**Steps:**
1. Upload resume via API
2. Check database for resume_content record with status "pending"
3. Wait for background service to process (10-30 seconds)
4. Verify status changes to "completed"
5. Verify parsed_content field contains structured JSON

**Expected:** Resume successfully parsed with structured content

### 4. Error Scenario Testing

**Test:** Remove Bedrock permission and verify error handling

**Steps:**
1. Remove bedrock:InvokeModel from IAM policy
2. Upload resume
3. Check logs for access denied error
4. Verify resume status is "failed" with user-friendly error message

**Expected:** Clear error message in logs indicating permission issue

## Deployment Steps

1. **Update deployment script** with AI services IAM configuration
2. **Run deployment script** to apply IAM policy changes
3. **Deploy updated backend** with health check endpoint
4. **Verify health check** returns all services healthy
5. **Test resume upload** to confirm end-to-end functionality

## Rollback Plan

If deployment fails:

1. **Revert IAM policy:**
   ```powershell
   aws iam delete-role-policy `
       --role-name aws-elasticbeanstalk-ec2-role `
       --policy-name HireThemNowAIServicesAccess
   ```

2. **Restore previous S3-only policy** if needed

3. **Redeploy previous version** of backend

## Security Considerations

1. **Least Privilege:** Bedrock permission scoped to specific model ARN
2. **Resource Restrictions:** S3 permissions limited to hirethemnow-files bucket
3. **No Credential Exposure:** Uses IAM role, no access keys in code
4. **Audit Trail:** All IAM changes logged in CloudTrail
5. **Health Check Security:** Consider adding authentication to health endpoint in production

## Performance Considerations

1. **Health Check Caching:** Consider caching health check results for 5 minutes to avoid excessive AWS API calls
2. **Async Operations:** All health checks run asynchronously
3. **Timeout Handling:** Set reasonable timeouts for AWS service calls (5-10 seconds)
4. **Background Service:** No changes to existing polling/processing logic
