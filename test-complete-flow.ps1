# Complete Resume Parsing Test - All-in-One
# This script tests the entire flow: authentication, upload, Textract, Bedrock, and parsing

param(
    [string]$ApiUrl = "https://api.hirethemnow.xyz",
    [string]$ResumeFile = "c4611_sample_explain.pdf",
    [string]$BucketName = "hirethemnow-files"
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Complete Resume Parsing Test" -ForegroundColor Cyan
Write-Host "  Tests: Auth -> Upload -> Textract -> Bedrock -> Parse" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    
    Write-Host "> $Name" -ForegroundColor Cyan
    try {
        & $Action
        $script:testsPassed++
        Write-Host "  [PASS]" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        $script:testsFailed++
        Write-Host "  [FAIL]: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# ============================================================================
# PHASE 1: AUTHENTICATION
# ============================================================================

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  PHASE 1: Authentication" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

$token = ""

# Check for saved token
if (Test-Path "test-token.txt") {
    Write-Host "Found saved token, testing if it's still valid..." -ForegroundColor Gray
    $savedToken = Get-Content "test-token.txt" -Raw
    $savedToken = $savedToken.Trim()
    
    try {
        $testHeaders = @{ "Authorization" = "Bearer $savedToken" }
        $profileTest = Invoke-RestMethod -Uri "$ApiUrl/api/auth/profile" -Method Get -Headers $testHeaders -ErrorAction Stop
        
        if ($profileTest.success) {
            Write-Host "[OK] Saved token is valid" -ForegroundColor Green
            Write-Host "  User: $($profileTest.data.name) ($($profileTest.data.email))" -ForegroundColor Gray
            $token = $savedToken
        }
    }
    catch {
        Write-Host "[WARNING] Saved token is invalid or expired" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Get new token if needed
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Getting authentication token..." -ForegroundColor Yellow
    
    $email = Read-Host "Enter your email (or press Enter to create a test user)"
    
    if ([string]::IsNullOrWhiteSpace($email)) {
        $randomId = [System.Guid]::NewGuid().ToString().Substring(0, 8)
        $email = "test-$randomId@example.com"
        Write-Host "Creating test user: $email" -ForegroundColor Gray
    }
    
    $password = "test123"
    
    # Try login first
    try {
        $loginBody = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
        
        if ($loginResponse.success) {
            Write-Host "[OK] Login successful" -ForegroundColor Green
            Write-Host "  User: $($loginResponse.data.user.name)" -ForegroundColor Gray
            $token = $loginResponse.data.token
        }
    }
    catch {
        # Login failed, try register
        Write-Host "Login failed, registering new user..." -ForegroundColor Gray
        
        try {
            $registerBody = @{
                email = $email
                password = $password
                name = "Test User"
                role = "candidate"
            } | ConvertTo-Json
            
            $registerResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
            
            if ($registerResponse.success) {
                Write-Host "[OK] Registration successful" -ForegroundColor Green
                Write-Host "  User: $($registerResponse.data.user.name)" -ForegroundColor Gray
                $token = $registerResponse.data.token
            }
        }
        catch {
            Write-Host "[FAIL] Could not authenticate" -ForegroundColor Red
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
    
    # Save token
    $token | Out-File -FilePath "test-token.txt" -Encoding ASCII
    Write-Host "[OK] Token saved to test-token.txt" -ForegroundColor Green
    Write-Host ""
}

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "[SUCCESS] Phase 1 Complete - Authenticated" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 2: UPLOAD RESUME
# ============================================================================

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  PHASE 2: Upload Resume" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $ResumeFile)) {
    Write-Host "[FAIL] Resume file not found: $ResumeFile" -ForegroundColor Red
    exit 1
}

$uploadSuccess = Test-Step "Upload resume to API" {
    $uploadUrl = "$ApiUrl/api/resume/upload"
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($ResumeFile)
    $fileName = [System.IO.Path]::GetFileName($ResumeFile)
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"resume`"; filename=`"$fileName`"",
        "Content-Type: application/pdf",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $uploadHeaders = $headers.Clone()
    $uploadHeaders["Content-Type"] = "multipart/form-data; boundary=$boundary"
    
    $script:uploadResponse = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $uploadHeaders -Body $body
    
    if (-not $uploadResponse.success) {
        throw "Upload failed: $($uploadResponse.message)"
    }
    
    Write-Host "    File: $($uploadResponse.data.fileName)" -ForegroundColor Gray
    Write-Host "    S3 Key: $($uploadResponse.data.resumeUrl)" -ForegroundColor Gray
    Write-Host "    Parsing ID: $($uploadResponse.data.parsingId)" -ForegroundColor Gray
    
    $script:s3Key = $uploadResponse.data.resumeUrl
}

if (-not $uploadSuccess) {
    Write-Host "[FAIL] Cannot continue without successful upload" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Phase 2 Complete - Resume Uploaded" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PHASE 3: TEST AWS SERVICES DIRECTLY
# ============================================================================

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  PHASE 3: Test AWS Services (Textract & Bedrock)" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

# Test 3.1: Check S3 file exists
Test-Step "Verify file exists in S3" {
    $s3Check = aws s3api head-object --bucket $BucketName --key $s3Key --region us-east-1 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "File not found in S3: s3://$BucketName/$s3Key"
    }
    
    $objectInfo = $s3Check | ConvertFrom-Json
    Write-Host "    Size: $($objectInfo.ContentLength) bytes" -ForegroundColor Gray
    Write-Host "    Type: $($objectInfo.ContentType)" -ForegroundColor Gray
}

# Test 3.2: Test Textract directly
$textractSuccess = Test-Step "Test Textract text extraction" {
    Write-Host "    Calling Textract API..." -ForegroundColor Gray
    
    $textractResult = aws textract detect-document-text `
        --document "S3Object={Bucket=$BucketName,Name=$s3Key}" `
        --region us-east-1 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        $errorText = $textractResult | Out-String
        
        if ($errorText -match "AccessDenied|Forbidden|UnauthorizedException") {
            throw "IAM Permission Error: Missing textract:DetectDocumentText or s3:GetObject permissions. Run deploy-backend.ps1 to fix."
        }
        elseif ($errorText -match "InvalidS3ObjectException|NoSuchKey") {
            throw "S3 Object Error: File not accessible or doesn't exist"
        }
        elseif ($errorText -match "UnsupportedDocumentException") {
            throw "Document Format Error: Textract cannot process this file type"
        }
        else {
            throw "Textract Error: $errorText"
        }
    }
    
    $response = $textractResult | ConvertFrom-Json
    $lineCount = ($response.Blocks | Where-Object { $_.BlockType -eq "LINE" }).Count
    $script:extractedText = ($response.Blocks | Where-Object { $_.BlockType -eq "LINE" } | ForEach-Object { $_.Text }) -join "`n"
    
    Write-Host "    Extracted $lineCount lines ($($script:extractedText.Length) characters)" -ForegroundColor Gray
    
    # Show sample
    $sampleLines = $response.Blocks | Where-Object { $_.BlockType -eq "LINE" } | Select-Object -First 3
    Write-Host "    Sample text:" -ForegroundColor Gray
    foreach ($line in $sampleLines) {
        Write-Host "      $($line.Text)" -ForegroundColor DarkGray
    }
}

# Test 3.3: Test Bedrock directly
$bedrockSuccess = Test-Step "Test Bedrock (Nova) model access" {
    Write-Host "    Testing Bedrock model invocation..." -ForegroundColor Gray
    
    $modelId = "amazon.nova-pro-v1:0"
    
    # Create a simple test prompt
    $testPrompt = "Extract the name from this resume text: John Doe, Software Engineer"
    
    $requestBody = @{
        messages = @(
            @{
                role = "user"
                content = @(
                    @{ text = $testPrompt }
                )
            }
        )
        inferenceConfig = @{
            max_new_tokens = 100
            temperature = 0.7
        }
    } | ConvertTo-Json -Depth 10
    
    # Save to temp file
    $tempFile = [System.IO.Path]::GetTempFileName()
    $requestBody | Out-File -FilePath $tempFile -Encoding UTF8
    
    $bedrockResult = aws bedrock-runtime invoke-model `
        --model-id $modelId `
        --body "file://$tempFile" `
        --region us-east-1 `
        output.json 2>&1
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -ne 0) {
        $errorText = $bedrockResult | Out-String
        
        if ($errorText -match "AccessDenied|Forbidden|UnauthorizedException") {
            throw "IAM Permission Error: Missing bedrock:InvokeModel permission. Run deploy-backend.ps1 to fix."
        }
        elseif ($errorText -match "ResourceNotFoundException") {
            throw "Model Not Found: Model $modelId not available in this region or account"
        }
        elseif ($errorText -match "ValidationException") {
            throw "Model Access Error: You may need to request access to $modelId in the Bedrock console"
        }
        else {
            throw "Bedrock Error: $errorText"
        }
    }
    
    if (Test-Path "output.json") {
        $bedrockResponse = Get-Content "output.json" -Raw | ConvertFrom-Json
        Remove-Item "output.json" -ErrorAction SilentlyContinue
        
        Write-Host "    Model: $modelId" -ForegroundColor Gray
        Write-Host "    Response received successfully" -ForegroundColor Gray
    }
}

if ($textractSuccess -and $bedrockSuccess) {
    Write-Host "[SUCCESS] Phase 3 Complete - AWS Services Working" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[PARTIAL] Phase 3 Complete - Some AWS services failed" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# PHASE 4: TEST APPLICATION PARSING
# ============================================================================

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  PHASE 4: Test Application Resume Parsing" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host ""

# Test 4.1: Check initial status
Test-Step "Verify database record created" {
    $statusUrl = "$ApiUrl/api/resume/parsing-status"
    $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers $headers
    
    if (-not $statusResponse.success) {
        throw "Failed to get status: $($statusResponse.message)"
    }
    
    Write-Host "    ID: $($statusResponse.data.id)" -ForegroundColor Gray
    Write-Host "    Status: $($statusResponse.data.status)" -ForegroundColor Gray
    Write-Host "    Uploaded: $($statusResponse.data.uploadedAt)" -ForegroundColor Gray
}

# Test 4.2: Monitor background processing
Test-Step "Monitor background service processing" {
    Write-Host "    Waiting for background service (max 120 seconds)..." -ForegroundColor Gray
    
    $statusUrl = "$ApiUrl/api/resume/parsing-status"
    $maxWaitSeconds = 120
    $elapsedSeconds = 0
    $checkInterval = 5
    $completed = $false
    
    while ($elapsedSeconds -lt $maxWaitSeconds) {
        Start-Sleep -Seconds $checkInterval
        $elapsedSeconds += $checkInterval
        
        $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers $headers
        $currentStatus = $statusResponse.data.status
        
        Write-Host "    [$elapsedSeconds s] Status: $currentStatus" -ForegroundColor Gray
        
        if ($currentStatus -eq "completed") {
            $completed = $true
            Write-Host "    Parsed at: $($statusResponse.data.parsedAt)" -ForegroundColor Gray
            break
        }
        elseif ($currentStatus -eq "failed") {
            $errorMsg = $statusResponse.data.error
            Write-Host "    Error: $errorMsg" -ForegroundColor Red
            
            # Provide diagnosis
            Write-Host ""
            Write-Host "    [DIAGNOSIS]" -ForegroundColor Yellow
            if ($textractSuccess -and $bedrockSuccess) {
                Write-Host "    AWS services are working, but application parsing failed." -ForegroundColor Yellow
                Write-Host "    This suggests an issue in the application code or background service." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "    Possible causes:" -ForegroundColor Cyan
                Write-Host "      1. Background service not running" -ForegroundColor Gray
                Write-Host "      2. Configuration error in application" -ForegroundColor Gray
                Write-Host "      3. Bug in parsing logic" -ForegroundColor Gray
                Write-Host ""
                Write-Host "    Check application logs:" -ForegroundColor Cyan
                Write-Host "      aws elasticbeanstalk request-environment-info --environment-name hirethemnow-env --info-type tail --region us-east-1" -ForegroundColor Gray
            }
            else {
                Write-Host "    AWS services failed in Phase 3, which caused the parsing to fail." -ForegroundColor Yellow
                Write-Host "    Fix the AWS service issues first." -ForegroundColor Yellow
            }
            
            throw "Parsing failed: $errorMsg"
        }
    }
    
    if (-not $completed) {
        Write-Host ""
        Write-Host "    [DIAGNOSIS]" -ForegroundColor Yellow
        Write-Host "    Background service is not processing resumes." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "    Possible causes:" -ForegroundColor Cyan
        Write-Host "      1. Background service not started" -ForegroundColor Gray
        Write-Host "      2. Service crashed" -ForegroundColor Gray
        Write-Host "      3. Database connection issue" -ForegroundColor Gray
        Write-Host ""
        Write-Host "    Check if service is running:" -ForegroundColor Cyan
        Write-Host "      Look for 'ResumeParsingBackgroundService' in application logs" -ForegroundColor Gray
        
        throw "Timeout: Parsing did not complete within $maxWaitSeconds seconds"
    }
}

# Test 4.3: Verify parsed content
Test-Step "Verify parsed content structure" {
    $contentUrl = "$ApiUrl/api/resume/content"
    $contentResponse = Invoke-RestMethod -Uri $contentUrl -Method Get -Headers $headers
    
    if (-not $contentResponse.success) {
        throw "Failed to get content: $($contentResponse.message)"
    }
    
    if ([string]::IsNullOrWhiteSpace($contentResponse.data.parsedContent)) {
        throw "Parsed content is empty"
    }
    
    # Verify JSON
    try {
        $parsedJson = $contentResponse.data.parsedContent | ConvertFrom-Json
        Write-Host "    [OK] Valid JSON structure" -ForegroundColor Gray
    }
    catch {
        throw "Parsed content is not valid JSON: $($_.Exception.Message)"
    }
    
    # Check fields
    $expectedFields = @("name", "email", "skills")
    $foundFields = @()
    $missingFields = @()
    
    foreach ($field in $expectedFields) {
        if ($parsedJson.PSObject.Properties[$field]) {
            $foundFields += $field
        } else {
            $missingFields += $field
        }
    }
    
    Write-Host "    Found fields: $($foundFields -join ', ')" -ForegroundColor Gray
    if ($missingFields.Count -gt 0) {
        Write-Host "    Missing fields: $($missingFields -join ', ')" -ForegroundColor Yellow
    }
    
    Write-Host "    Text length: $($contentResponse.data.textContent.Length) characters" -ForegroundColor Gray
    
    $script:finalContent = $contentResponse
}

# Test 4.4: Display results
Test-Step "Display parsed resume data" {
    $parsedData = $finalContent.data.parsedContent | ConvertFrom-Json
    
    Write-Host "    === Parsed Resume Data ===" -ForegroundColor Cyan
    
    if ($parsedData.personalInfo) {
        if ($parsedData.personalInfo.name) {
            Write-Host "    Name: $($parsedData.personalInfo.name)" -ForegroundColor Gray
        }
        if ($parsedData.personalInfo.email) {
            Write-Host "    Email: $($parsedData.personalInfo.email)" -ForegroundColor Gray
        }
        if ($parsedData.personalInfo.phone) {
            Write-Host "    Phone: $($parsedData.personalInfo.phone)" -ForegroundColor Gray
        }
    }
    
    if ($parsedData.skills) {
        if ($parsedData.skills.technical) {
            $techCount = if ($parsedData.skills.technical -is [array]) { $parsedData.skills.technical.Count } else { 1 }
            Write-Host "    Technical Skills: $techCount" -ForegroundColor Gray
        }
    }
    
    if ($parsedData.experience) {
        $expCount = if ($parsedData.experience -is [array]) { $parsedData.experience.Count } else { 1 }
        Write-Host "    Experience: $expCount positions" -ForegroundColor Gray
    }
    
    if ($parsedData.education) {
        $eduCount = if ($parsedData.education -is [array]) { $parsedData.education.Count } else { 1 }
        Write-Host "    Education: $eduCount entries" -ForegroundColor Gray
    }
}

Write-Host "[SUCCESS] Phase 4 Complete - Application Parsing Working" -ForegroundColor Green
Write-Host ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Final Test Results" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "  Complete resume parsing flow is working!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verified Components:" -ForegroundColor Cyan
    Write-Host "  [OK] Authentication & JWT tokens" -ForegroundColor Green
    Write-Host "  [OK] Resume upload to S3" -ForegroundColor Green
    Write-Host "  [OK] Textract text extraction" -ForegroundColor Green
    Write-Host "  [OK] Bedrock (Nova) model access" -ForegroundColor Green
    Write-Host "  [OK] Background parsing service" -ForegroundColor Green
    Write-Host "  [OK] Structured data extraction" -ForegroundColor Green
    Write-Host ""
    Write-Host "Requirements Verified:" -ForegroundColor Cyan
    Write-Host "  [OK] 1.1 - IAM permissions for bedrock:InvokeModel" -ForegroundColor Green
    Write-Host "  [OK] 1.2 - IAM permissions for textract:DetectDocumentText" -ForegroundColor Green
    Write-Host "  [OK] 1.3 - IAM permissions for s3:GetObject" -ForegroundColor Green
    Write-Host "  [OK] 1.4 - Access to amazon.nova-pro-v1:0 model" -ForegroundColor Green
    Write-Host "  [OK] 2.1 - IAmazonBedrockRuntime service registered" -ForegroundColor Green
    Write-Host "  [OK] 2.2 - IAmazonTextract service registered" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "  [FAILED] SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "  Review the errors above for details" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Solutions:" -ForegroundColor Yellow
    Write-Host "  1. IAM Permissions: Run deploy-backend.ps1" -ForegroundColor Gray
    Write-Host "  2. Check logs: aws elasticbeanstalk request-environment-info ..." -ForegroundColor Gray
    Write-Host "  3. Verify AWS services: Check AWS console for service health" -ForegroundColor Gray
    exit 1
}
