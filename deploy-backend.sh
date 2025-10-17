#!/bin/bash

# HireThemNow Backend Deployment Script (Bash Version)
# Deploys .NET API to AWS Elastic Beanstalk

echo "========================================"
echo "Backend Deployment (Elastic Beanstalk)"
echo "========================================"

# Load environment variables from .env.deploy
if [ -f .env.deploy ]; then
    echo ""
    echo "Loading environment variables from .env.deploy..."
    export $(grep -v '^#' .env.deploy | xargs)
else
    echo "ERROR: .env.deploy file not found!"
    echo "Please create .env.deploy with your credentials"
    exit 1
fi

APP_NAME="hirethemnow"
ENV_NAME="hirethemnow-prod"
REGION=${AWS_REGION}
BUCKET_NAME="hirethemnow-files"

# Check required environment variables
echo ""
echo "Checking required environment variables..."
REQUIRED_VARS=("JWT_SECRET" "WEBHOOK_SECRET" "DATABASE_PASSWORD" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: $var is not set in .env.deploy"
        exit 1
    else
        echo "$var: SET"
    fi
done

# Step 1: Build
echo ""
echo "Step 1: Building application..."
cd HireThemNoW.Server
dotnet publish -c Release -o ../publish/app

if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi
cd ..

# Step 2: Create web.config for IIS
echo ""
echo "Step 2: Creating IIS deployment manifest..."
cat > publish/app/web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\HireThemNoW.Server.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
  </system.webServer>
</configuration>
EOF

# Step 3: Package
echo ""
echo "Step 3: Creating deployment package..."

# Copy .ebextensions to publish folder if it exists
if [ -d .ebextensions ]; then
    echo "Including .ebextensions configuration..."
    cp -r .ebextensions publish/
fi

cd publish
# Package both app and .ebextensions
if [ -d .ebextensions ]; then
    zip -r ../deployment.zip app .ebextensions
else
    zip -r ../deployment.zip app
fi
cd ..

# Step 4: Upload to S3
echo ""
echo "Step 4: Uploading to S3..."
VERSION_LABEL="v-$(date +%Y%m%d-%H%M%S)"
S3_BUCKET="$APP_NAME-deployments-$REGION"

# Create S3 bucket if it doesn't exist
aws s3 mb "s3://$S3_BUCKET" --region $REGION 2>/dev/null || true
aws s3 cp deployment.zip "s3://$S3_BUCKET/$VERSION_LABEL.zip"

# Step 5: Create application version
echo ""
echo "Step 5: Creating application version..."
aws elasticbeanstalk create-application-version \
    --application-name $APP_NAME \
    --version-label $VERSION_LABEL \
    --source-bundle S3Bucket="$S3_BUCKET",S3Key="$VERSION_LABEL.zip" \
    --region $REGION

# Step 6: Check if environment exists
echo ""
echo "Step 6: Checking environment status..."
ENV_EXISTS=$(aws elasticbeanstalk describe-environments \
    --environment-names $ENV_NAME \
    --region $REGION \
    --query "Environments[0].Status" \
    --output text 2>/dev/null)

if [ "$ENV_EXISTS" != "None" ] && [ -n "$ENV_EXISTS" ]; then
    # Environment exists - UPDATE
    echo "Environment exists. Deploying update (2-3 minutes)..."
    aws elasticbeanstalk update-environment \
        --environment-name $ENV_NAME \
        --version-label $VERSION_LABEL \
        --region $REGION
else
    # Environment doesn't exist - CREATE
    echo "Creating new environment (5-10 minutes)..."

    # Get VPC and subnet info
    VPC_ID=$(aws ec2 describe-vpcs \
        --region $REGION \
        --filters "Name=isDefault,Values=true" \
        --query "Vpcs[0].VpcId" \
        --output text)
    
    SUBNETS=$(aws ec2 describe-subnets \
        --region $REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query "Subnets[0:2].SubnetId" \
        --output text)
    
    SUBNET_LIST=$(echo $SUBNETS | tr ' ' ',')

    # Create environment options using values from .env.deploy
    cat > eb-options.json << EOF
[
  {
    "Namespace": "aws:autoscaling:launchconfiguration",
    "OptionName": "InstanceType",
    "Value": "t3.micro"
  },
  {
    "Namespace": "aws:autoscaling:launchconfiguration",
    "OptionName": "IamInstanceProfile",
    "Value": "aws-elasticbeanstalk-ec2-role"
  },
  {
    "Namespace": "aws:ec2:vpc",
    "OptionName": "VPCId",
    "Value": "$VPC_ID"
  },
  {
    "Namespace": "aws:ec2:vpc",
    "OptionName": "Subnets",
    "Value": "$SUBNET_LIST"
  },
  {
    "Namespace": "aws:ec2:vpc",
    "OptionName": "AssociatePublicIpAddress",
    "Value": "true"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "JWT_SECRET",
    "Value": "$JWT_SECRET"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "WEBHOOK_SECRET",
    "Value": "$WEBHOOK_SECRET"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "ADMIN_CREATION_SECRET",
    "Value": "$ADMIN_CREATION_SECRET"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "GOOGLE_CLIENT_ID",
    "Value": "$GOOGLE_CLIENT_ID"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "GOOGLE_CLIENT_SECRET",
    "Value": "$GOOGLE_CLIENT_SECRET"
  }
]
EOF

    aws elasticbeanstalk create-environment \
        --application-name $APP_NAME \
        --environment-name $ENV_NAME \
        --version-label $VERSION_LABEL \
        --solution-stack-name "64bit Windows Server 2022 v2.20.0 running IIS 10.0" \
        --option-settings file://eb-options.json \
        --region $REGION

    rm eb-options.json
fi

# Step 7: Update environment with database configuration if RDS exists
echo ""
echo "Step 7: Configuring database connectivity..."
DB_IDENTIFIER="hirethemnow-db"
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_IDENTIFIER \
    --region $REGION \
    --query "DBInstances[0].Endpoint.Address" \
    --output text 2>/dev/null)

if [ "$DB_ENDPOINT" != "None" ] && [ -n "$DB_ENDPOINT" ]; then
    echo "Found RDS database: $DB_ENDPOINT"
    
    # Get database name
    DB_NAME=$(aws rds describe-db-instances \
        --db-instance-identifier $DB_IDENTIFIER \
        --region $REGION \
        --query "DBInstances[0].DBName" \
        --output text 2>/dev/null)
    
    if [ "$DB_NAME" == "None" ] || [ -z "$DB_NAME" ]; then
        echo "No initial database found, using default 'postgres' database"
        DB_NAME="postgres"
    else
        echo "Using database: $DB_NAME"
    fi
    
    # Update environment variables with database configuration
    echo "Updating environment variables with database configuration..."
    aws elasticbeanstalk update-environment \
        --environment-name $ENV_NAME \
        --region $REGION \
        --option-settings \
            Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_HOST,Value=$DB_ENDPOINT \
            Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_NAME,Value=$DB_NAME \
            Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_USER,Value=postgres \
            Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_PASSWORD,Value=$DATABASE_PASSWORD

    echo "Database configuration complete!"
else
    echo "WARNING: Database '$DB_IDENTIFIER' not found in region $REGION"
    echo "Please create the RDS database first"
fi

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"

echo ""
echo "Backend URLs:"
echo "  HTTP:  http://hirethemnow-prod.eba-km2y4gpp.us-east-1.elasticbeanstalk.com"
echo "  HTTPS: https://api.hirethemnow.xyz (after DNS is configured)"

echo ""
echo "Monitor status:"
echo "aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION"

echo ""
echo "To create an admin user, use:"
echo "curl -X POST https://api.hirethemnow.xyz/api/auth/create-admin \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"admin@hirethemnow.xyz\",\"name\":\"Admin User\",\"secret\":\"'$ADMIN_CREATION_SECRET'\"}'"