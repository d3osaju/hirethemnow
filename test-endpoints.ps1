# HireThemNow API Endpoint Tests
# Tests all endpoints against local Docker deployment

$baseUrl = "http://localhost:8080/api"
$testEmail = "test_$(Get-Random)@example.com"
$testPassword = "Test123!@#"
$token = ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   HireThemNow API Endpoint Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1/12] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "  ✓ Health check passed" -ForegroundColor Green
    Write-Host "    Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Register
Write-Host "`n[2/12] Testing Register Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Test User"
        email = $testEmail
        password = $testPassword
        role = "candidate"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    $token = $response.data.token
    Write-Host "  ✓ Registration successful" -ForegroundColor Green
    Write-Host "    User: $($response.data.user.name)" -ForegroundColor Gray
    Write-Host "    Token received: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Login
Write-Host "`n[3/12] Testing Login Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host "    Token received" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Profile
Write-Host "`n[4/12] Testing Get Profile Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method Get -Headers $headers
    Write-Host "  ✓ Get profile successful" -ForegroundColor Green
    Write-Host "    Name: $($response.data.name)" -ForegroundColor Gray
    Write-Host "    Email: $($response.data.email)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Update Profile
Write-Host "`n[5/12] Testing Update Profile Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $body = @{
        name = "Updated Test User"
        phone = "+1234567890"
        location = "Test City"
        bio = "Test bio"
        title = "Software Engineer"
        industry = "Technology"
        experience = "Mid Level (3-5 years)"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method Put -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "  ✓ Update profile successful" -ForegroundColor Green
    Write-Host "    Name: $($response.data.name)" -ForegroundColor Gray
    Write-Host "    Phone: $($response.data.phone)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Update profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Industries
Write-Host "`n[6/12] Testing Get Industries Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/industries" -Method Get
    Write-Host "  ✓ Get industries successful" -ForegroundColor Green
    Write-Host "    Industries count: $($response.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Get industries failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Email Preferences
Write-Host "`n[7/12] Testing Get Email Preferences Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $response = Invoke-RestMethod -Uri "$baseUrl/emailpreferences" -Method Get -Headers $headers
    Write-Host "  ✓ Get email preferences successful" -ForegroundColor Green
    Write-Host "    Weekly Report: $($response.data.weeklyPerformanceReport)" -ForegroundColor Gray
    Write-Host "    Marketing: $($response.data.marketingEmails)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Get email preferences failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Update Email Preferences
Write-Host "`n[8/12] Testing Update Email Preferences Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $body = @{
        weeklyPerformanceReport = $true
        marketingEmails = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/emailpreferences" -Method Put -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "  ✓ Update email preferences successful" -ForegroundColor Green
    Write-Host "    Weekly Report: $($response.data.weeklyPerformanceReport)" -ForegroundColor Gray
    Write-Host "    Marketing: $($response.data.marketingEmails)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Update email preferences failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Get Privacy Settings
Write-Host "`n[9/12] Testing Get Privacy Settings Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $response = Invoke-RestMethod -Uri "$baseUrl/privacy" -Method Get -Headers $headers
    Write-Host "  ✓ Get privacy settings successful" -ForegroundColor Green
    Write-Host "    Profile Visibility: $($response.data.profileVisibility)" -ForegroundColor Gray
    Write-Host "    Analytics: $($response.data.allowAnalyticsDataSharing)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Get privacy settings failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Update Privacy Settings
Write-Host "`n[10/12] Testing Update Privacy Settings Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $body = @{
        profileVisibility = "private"
        allowAnalyticsDataSharing = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/privacy" -Method Put -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "  ✓ Update privacy settings successful" -ForegroundColor Green
    Write-Host "    Profile Visibility: $($response.data.profileVisibility)" -ForegroundColor Gray
    Write-Host "    Analytics: $($response.data.allowAnalyticsDataSharing)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Update privacy settings failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: Get Current User
Write-Host "`n[11/12] Testing Get Current User Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $response = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $headers
    Write-Host "  ✓ Get current user successful" -ForegroundColor Green
    Write-Host "    Name: $($response.data.name)" -ForegroundColor Gray
    Write-Host "    Email: $($response.data.email)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Get current user failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Acknowledge Trial End
Write-Host "`n[12/12] Testing Trial Acknowledgement Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{Authorization = "Bearer $token"}
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/trial/acknowledge" -Method Post -Headers $headers
    Write-Host "  ✓ Trial acknowledgement successful" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Trial acknowledgement failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "        All Tests Completed!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
