#!/bin/bash

# Default values
ENVIRONMENT=${1:-prod}
REGION=${2:-us-east-1}
FUNCTION_NAME="hirethemnow-api-$ENVIRONMENT"

echo "🚀 Deploying HireThemNow .NET API to AWS Lambda"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Function Name: $FUNCTION_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi
echo "✅ AWS CLI is available"

# Check if dotnet lambda tools are installed
if ! dotnet lambda help &> /dev/null; then
    echo "❌ AWS Lambda Tools not found. Installing..."
    dotnet tool install -g Amazon.Lambda.Tools
fi
echo "✅ AWS Lambda Tools for .NET are available"

# Clean and build the project
echo "🔨 Building the project..."
dotnet clean
dotnet build --configuration Release

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Set environment variables for the Lambda function
export JWT_SECRET="ae9d27decc25cb45671ce98206e402e2"
export GOOGLE_CLIENT_ID="419725254966-5i7rgg3h7j984od6mi3ib4tt3rqq8o4j.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="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"

# Package and deploy to Lambda
echo "📦 Packaging and deploying to Lambda..."

# Deploy using dotnet lambda
dotnet lambda deploy-function \
    --function-name "$FUNCTION_NAME" \
    --function-role "" \
    --region "$REGION" \
    --configuration Release \
    --framework net8.0 \
    --function-runtime dotnet8 \
    --function-memory-size 512 \
    --function-timeout 30 \
    --environment-variables "ASPNETCORE_ENVIRONMENT=Production;JWT_SECRET=$JWT_SECRET;GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID;GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"

if [ $? -eq 0 ]; then
    echo "✅ Lambda function deployed successfully!"

    # Get the function URL
    echo "📋 Getting function details..."
    FUNCTION_INFO=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "🔗 Function deployed successfully!"
        echo "⚡ Runtime: dotnet8"
        echo "💾 Memory: 512 MB"
        echo "⏱️ Timeout: 30 seconds"
    fi

    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "📝 Next steps:"
    echo "   1. Update your API Gateway to point to this Lambda function"
    echo "   2. Update your frontend configuration to use the correct API endpoint"
    echo "   3. Test your API endpoints"
else
    echo "❌ Lambda deployment failed"
    exit 1
fi