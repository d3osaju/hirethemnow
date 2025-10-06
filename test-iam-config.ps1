# Test script for IAM configuration
# Tests only the IAM policy setup without full deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing IAM Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Load environment variables from .env.deploy
if (Test-Path .env.deploy) {
    Write-Host "`nLoading environment variables from .env.deploy..." -ForegroundColor Yellow
    Get-Content .env.deploy | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "ERROR: .env.deploy file not found!" -ForegroundColor Red
    Write-Host "Please create .env.deploy with your AWS credentials" -ForegroundColor Yellow
    exit 1
}

$REGION = $env:AWS_REGION
$BUCKET_NAME = "hirethemnow-files"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 1: Verify IAM Role Exists" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if the role exists
Write-Host "`nChecking if aws-elasticbeanstalk-ec2-role exists..." -ForegroundColor Yellow
$roleExists = aws iam get-role --role-name aws-elasticbeanstalk-ec2-role 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: aws-elasticbeanstalk-ec2-role does not exist!" -ForegroundColor Red
    Write-Host "This role is created automatically when you create an Elastic Beanstalk environment." -ForegroundColor Yellow
    Write-Host "For testing purposes, you can create a test role or use an existing environment." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "SUCCESS: Role exists!" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 2: Apply AI Services Policy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nConfiguring AI Services (Bedrock + Textract) permissions..." -ForegroundColor Yellow

$aiPolicyName = "HireThemNowAIServicesAccess"

# Create policy JSON file
$policyJson = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "S3ResumeAccess"
            Effect = "Allow"
            Action = @(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            )
            Resource = @(
                "arn:aws:s3:::$BUCKET_NAME",
                "arn:aws:s3:::$BUCKET_NAME/*"
            )
        },
        @{
            Sid = "BedrockAccess"
            Effect = "Allow"
            Action = @(
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            )
            Resource = @(
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"
            )
        },
        @{
            Sid = "TextractAccess"
            Effect = "Allow"
            Action = @(
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument"
            )
            Resource = "*"
        }
    )
}

$policyJson | ConvertTo-Json -Depth 10 | Set-Content -Path ai-services-policy.json -Encoding ASCII

Write-Host "Policy file created: ai-services-policy.json" -ForegroundColor Gray

# Force update policy (overwrites if exists)
Write-Host "`nApplying AI Services policy (force update)..." -ForegroundColor Yellow
aws iam put-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-name $aiPolicyName --policy-document file://ai-services-policy.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: AI Services permissions configured successfully!" -ForegroundColor Green
    Write-Host "  - Bedrock (Nova Pro): bedrock:InvokeModel" -ForegroundColor Gray
    Write-Host "  - Textract: textract:DetectDocumentText" -ForegroundColor Gray
    Write-Host "  - S3: s3:GetObject, s3:PutObject" -ForegroundColor Gray
    Remove-Item ai-services-policy.json -ErrorAction SilentlyContinue
} else {
    Write-Host "ERROR: Failed to configure AI Services permissions" -ForegroundColor Red
    Remove-Item ai-services-policy.json -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 3: Verify Policy Was Applied" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nRetrieving policy from AWS..." -ForegroundColor Yellow
$policyJson = aws iam get-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-name $aiPolicyName --query "PolicyDocument" --output json 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Policy retrieved successfully!" -ForegroundColor Green
    Write-Host "`nPolicy content:" -ForegroundColor Cyan
    $policyJson | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
    # Parse and verify statements
    $policy = $policyJson | ConvertFrom-Json
    $statements = $policy.Statement
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Step 4: Verify Policy Contains All Statements" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $hasS3 = $false
    $hasBedrock = $false
    $hasTextract = $false
    
    foreach ($stmt in $statements) {
        if ($stmt.Sid -eq "S3ResumeAccess") {
            $hasS3 = $true
            Write-Host "SUCCESS: S3ResumeAccess statement found" -ForegroundColor Green
        }
        if ($stmt.Sid -eq "BedrockAccess") {
            $hasBedrock = $true
            Write-Host "SUCCESS: BedrockAccess statement found" -ForegroundColor Green
        }
        if ($stmt.Sid -eq "TextractAccess") {
            $hasTextract = $true
            Write-Host "SUCCESS: TextractAccess statement found" -ForegroundColor Green
        }
    }
    
    Write-Host "`nVerification Summary:" -ForegroundColor Cyan
    if ($hasS3 -and $hasBedrock -and $hasTextract) {
        Write-Host "SUCCESS: All three statement blocks present!" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Missing statement blocks:" -ForegroundColor Red
        if (-not $hasS3) { Write-Host "  - S3ResumeAccess" -ForegroundColor Red }
        if (-not $hasBedrock) { Write-Host "  - BedrockAccess" -ForegroundColor Red }
        if (-not $hasTextract) { Write-Host "  - TextractAccess" -ForegroundColor Red }
        exit 1
    }
} else {
    Write-Host "ERROR: Failed to retrieve policy" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Step 5: Test Force Update (Run Twice)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nRunning policy update again to test force update..." -ForegroundColor Yellow

# Create policy file again
$policyJson2 = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "S3ResumeAccess"
            Effect = "Allow"
            Action = @(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            )
            Resource = @(
                "arn:aws:s3:::$BUCKET_NAME",
                "arn:aws:s3:::$BUCKET_NAME/*"
            )
        },
        @{
            Sid = "BedrockAccess"
            Effect = "Allow"
            Action = @(
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            )
            Resource = @(
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"
            )
        },
        @{
            Sid = "TextractAccess"
            Effect = "Allow"
            Action = @(
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument"
            )
            Resource = "*"
        }
    )
}

$policyJson2 | ConvertTo-Json -Depth 10 | Set-Content -Path ai-services-policy.json -Encoding ASCII

aws iam put-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-name $aiPolicyName --policy-document file://ai-services-policy.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Force update successful (policy can be updated multiple times)" -ForegroundColor Green
    Remove-Item ai-services-policy.json -ErrorAction SilentlyContinue
} else {
    Write-Host "ERROR: Force update failed" -ForegroundColor Red
    Remove-Item ai-services-policy.json -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "IAM Configuration Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nAll tests passed:" -ForegroundColor Green
Write-Host "  SUCCESS: IAM role exists" -ForegroundColor Green
Write-Host "  SUCCESS: Policy created/updated successfully" -ForegroundColor Green
Write-Host "  SUCCESS: Policy contains all three statement blocks (S3, Bedrock, Textract)" -ForegroundColor Green
Write-Host "  SUCCESS: Force update works (can run multiple times)" -ForegroundColor Green
Write-Host "  SUCCESS: Script logs success messages" -ForegroundColor Green

Write-Host "`nThe IAM configuration is ready for production deployment!" -ForegroundColor Cyan
