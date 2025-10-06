# Script to check Elastic Beanstalk logs for resume parsing activity
# This helps verify Textract and Bedrock invocations

param(
    [string]$EnvironmentName = "hirethemnow-env",
    [int]$Lines = 100
)

Write-Host "=== Checking Resume Parsing Logs ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Retrieving latest logs from Elastic Beanstalk..." -ForegroundColor Yellow

try {
    # Request logs
    aws elasticbeanstalk request-environment-info `
        --environment-name $EnvironmentName `
        --info-type tail `
        --region us-east-1
    
    Write-Host "Waiting for logs to be prepared (5 seconds)..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Retrieve logs
    $logsJson = aws elasticbeanstalk retrieve-environment-info `
        --environment-name $EnvironmentName `
        --info-type tail `
        --region us-east-1 | ConvertFrom-Json
    
    if ($logsJson.EnvironmentInfo.Count -eq 0) {
        Write-Host "No logs available" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "✓ Logs retrieved successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Download and search logs
    foreach ($logInfo in $logsJson.EnvironmentInfo) {
        Write-Host "Downloading log: $($logInfo.Message)" -ForegroundColor Gray
        
        $logContent = Invoke-WebRequest -Uri $logInfo.Message -UseBasicParsing
        $logText = $logContent.Content
        
        # Search for resume parsing related entries
        Write-Host ""
        Write-Host "=== Resume Parsing Activity ===" -ForegroundColor Cyan
        
        $lines = $logText -split "`n"
        $relevantLines = $lines | Where-Object {
            $_ -match "ResumeParsingBackgroundService" -or
            $_ -match "BedrockAgentService" -or
            $_ -match "Textract" -or
            $_ -match "Bedrock" -or
            $_ -match "resume.*parsing" -or
            $_ -match "InvokeModel" -or
            $_ -match "DetectDocumentText"
        } | Select-Object -Last $Lines
        
        if ($relevantLines.Count -gt 0) {
            Write-Host "Found $($relevantLines.Count) relevant log entries:" -ForegroundColor Green
            Write-Host ""
            foreach ($line in $relevantLines) {
                if ($line -match "error|exception|failed" -and $line -notmatch "OperationCanceledException") {
                    Write-Host $line -ForegroundColor Red
                }
                elseif ($line -match "warning") {
                    Write-Host $line -ForegroundColor Yellow
                }
                elseif ($line -match "completed|success") {
                    Write-Host $line -ForegroundColor Green
                }
                else {
                    Write-Host $line -ForegroundColor Gray
                }
            }
        }
        else {
            Write-Host "No resume parsing activity found in logs" -ForegroundColor Yellow
        }
        
        # Search for AWS service errors
        Write-Host ""
        Write-Host "=== AWS Service Errors ===" -ForegroundColor Cyan
        
        $errorLines = $lines | Where-Object {
            $_ -match "AccessDenied|Forbidden|UnauthorizedException|InvalidAccessKeyId" -or
            $_ -match "AmazonBedrockRuntimeException|AmazonTextractException"
        } | Select-Object -Last 20
        
        if ($errorLines.Count -gt 0) {
            Write-Host "Found $($errorLines.Count) AWS service errors:" -ForegroundColor Red
            Write-Host ""
            foreach ($line in $errorLines) {
                Write-Host $line -ForegroundColor Red
            }
        }
        else {
            Write-Host "✓ No AWS service errors found" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "✗ Failed to retrieve logs" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Log Check Complete ===" -ForegroundColor Cyan
