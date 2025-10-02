#!/bin/bash

# HireThemNow API Endpoint Tests
BASE_URL="http://localhost:8080/api"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#"
TOKEN=""

echo ""
echo "========================================"
echo "   HireThemNow API Endpoint Tests"
echo "========================================"
echo ""

# Test 1: Health Check
echo "[1/12] Testing Health Endpoint..."
response=$(curl -s $BASE_URL/health)
if echo "$response" | grep -q "healthy"; then
    echo "  ✓ Health check passed"
    echo "    $(echo $response | jq -r '.message')"
else
    echo "  ✗ Health check failed"
fi

# Test 2: Register
echo ""
echo "[2/12] Testing Register Endpoint..."
response=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"role\":\"candidate\"}")

TOKEN=$(echo $response | jq -r '.data.token')
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "  ✓ Registration successful"
    echo "    User: $(echo $response | jq -r '.data.user.name')"
    echo "    Token: ${TOKEN:0:20}..."
else
    echo "  ✗ Registration failed"
    echo "    $response"
    exit 1
fi

# Test 3: Login
echo ""
echo "[3/12] Testing Login Endpoint..."
response=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Login successful"
else
    echo "  ✗ Login failed"
fi

# Test 4: Get Profile
echo ""
echo "[4/12] Testing Get Profile Endpoint..."
response=$(curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Get profile successful"
    echo "    Name: $(echo $response | jq -r '.data.name')"
    echo "    Email: $(echo $response | jq -r '.data.email')"
else
    echo "  ✗ Get profile failed"
fi

# Test 5: Update Profile
echo ""
echo "[5/12] Testing Update Profile Endpoint..."
response=$(curl -s -X PUT $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test User","phone":"+1234567890","location":"Test City","bio":"Test bio"}')

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Update profile successful"
    echo "    Name: $(echo $response | jq -r '.data.name')"
else
    echo "  ✗ Update profile failed"
fi

# Test 6: Get Industries
echo ""
echo "[6/12] Testing Get Industries Endpoint..."
response=$(curl -s $BASE_URL/industries)

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Get industries successful"
    count=$(echo $response | jq '.data | length')
    echo "    Industries count: $count"
else
    echo "  ✗ Get industries failed"
fi

# Test 7: Get Email Preferences
echo ""
echo "[7/12] Testing Get Email Preferences Endpoint..."
response=$(curl -s -X GET $BASE_URL/emailpreferences \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Get email preferences successful"
    echo "    Weekly Report: $(echo $response | jq -r '.data.weeklyPerformanceReport')"
    echo "    Marketing: $(echo $response | jq -r '.data.marketingEmails')"
else
    echo "  ✗ Get email preferences failed"
fi

# Test 8: Update Email Preferences
echo ""
echo "[8/12] Testing Update Email Preferences Endpoint..."
response=$(curl -s -X PUT $BASE_URL/emailpreferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weeklyPerformanceReport":true,"marketingEmails":false}')

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Update email preferences successful"
    echo "    Weekly Report: $(echo $response | jq -r '.data.weeklyPerformanceReport')"
    echo "    Marketing: $(echo $response | jq -r '.data.marketingEmails')"
else
    echo "  ✗ Update email preferences failed"
fi

# Test 9: Get Privacy Settings
echo ""
echo "[9/12] Testing Get Privacy Settings Endpoint..."
response=$(curl -s -X GET $BASE_URL/privacy \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Get privacy settings successful"
    echo "    Profile Visibility: $(echo $response | jq -r '.data.profileVisibility')"
    echo "    Analytics: $(echo $response | jq -r '.data.allowAnalyticsDataSharing')"
else
    echo "  ✗ Get privacy settings failed"
fi

# Test 10: Update Privacy Settings
echo ""
echo "[10/12] Testing Update Privacy Settings Endpoint..."
response=$(curl -s -X PUT $BASE_URL/privacy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileVisibility":"private","allowAnalyticsDataSharing":false}')

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Update privacy settings successful"
    echo "    Profile Visibility: $(echo $response | jq -r '.data.profileVisibility')"
    echo "    Analytics: $(echo $response | jq -r '.data.allowAnalyticsDataSharing')"
else
    echo "  ✗ Update privacy settings failed"
fi

# Test 11: Get Current User
echo ""
echo "[11/12] Testing Get Current User Endpoint..."
response=$(curl -s -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Get current user successful"
    echo "    Name: $(echo $response | jq -r '.data.name')"
    echo "    Email: $(echo $response | jq -r '.data.email')"
else
    echo "  ✗ Get current user failed"
fi

# Test 12: Trial Acknowledgement
echo ""
echo "[12/12] Testing Trial Acknowledgement Endpoint..."
response=$(curl -s -X POST $BASE_URL/auth/trial/acknowledge \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo "  ✓ Trial acknowledgement successful"
else
    echo "  ✗ Trial acknowledgement failed"
fi

echo ""
echo "========================================"
echo "        All Tests Completed!"
echo "========================================"
echo ""
