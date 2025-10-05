# HireThemNow Backend Deployment Script
# Deploys .NET API to AWS Elastic Beanstalk

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Deployment (Elastic Beanstalk)" -ForegroundColor Cyan
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
    Write-Host "Please create .env.deploy with your credentials" -ForegroundColor Yellow
    exit 1
}

$APP_NAME = "hirethemnow"
$ENV_NAME = "hirethemnow-prod"
$REGION = $env:AWS_REGION

# Step 1: Build
Write-Host "`nStep 1: Building application..." -ForegroundColor Yellow
cd HireThemNoW.Server
dotnet publish -c Release -o ../publish/app

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
cd ..

# Step 2: Create web.config for IIS
Write-Host "`nStep 2: Creating IIS deployment manifest..." -ForegroundColor Yellow
$manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\HireThemNoW.Server.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
  </system.webServer>
</configuration>
"@
$manifest | Out-File -FilePath publish/app/web.config -Encoding utf8

# Step 3: Package
Write-Host "`nStep 3: Creating deployment package..." -ForegroundColor Yellow
cd publish
Compress-Archive -Path app\* -DestinationPath ../deployment.zip -Force
cd ..

# Step 4: Upload to S3
Write-Host "`nStep 4: Uploading to S3..." -ForegroundColor Yellow
$VERSION_LABEL = "v-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$S3_BUCKET = "$APP_NAME-deployments-$REGION"

# Create S3 bucket if it doesn't exist
aws s3 mb "s3://$S3_BUCKET" --region $REGION 2>$null
aws s3 cp deployment.zip "s3://$S3_BUCKET/$VERSION_LABEL.zip"

# Step 5: Create application version
Write-Host "`nStep 5: Creating application version..." -ForegroundColor Yellow
aws elasticbeanstalk create-application-version `
    --application-name $APP_NAME `
    --version-label $VERSION_LABEL `
    --source-bundle S3Bucket="$S3_BUCKET",S3Key="$VERSION_LABEL.zip" `
    --region $REGION

# Step 6: Check if environment exists
Write-Host "`nStep 6: Checking environment status..." -ForegroundColor Yellow
$envExists = aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION --query "Environments[0].Status" --output text 2>$null

if ($envExists -and $envExists -ne "None") {
    # Environment exists - UPDATE
    Write-Host "Environment exists. Deploying update (2-3 minutes)..." -ForegroundColor Yellow
    aws elasticbeanstalk update-environment `
        --environment-name $ENV_NAME `
        --version-label $VERSION_LABEL `
        --region $REGION
} else {
    # Environment doesn't exist - CREATE
    Write-Host "Creating new environment (5-10 minutes)..." -ForegroundColor Yellow

    # Get VPC and subnet info
    $VPC_ID = aws ec2 describe-vpcs --region $REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
    $SUBNETS = aws ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0:2].SubnetId" --output text
    $SUBNET_LIST = $SUBNETS -replace '\s+', ','

    # Create environment options using values from .env.deploy
    $options = @"
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
    "Value": "$env:JWT_SECRET"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "GOOGLE_CLIENT_ID",
    "Value": "$env:GOOGLE_CLIENT_ID"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "GOOGLE_CLIENT_SECRET",
    "Value": "$env:GOOGLE_CLIENT_SECRET"
  }
]
"@
    $options | Out-File -FilePath eb-options.json -Encoding utf8

    aws elasticbeanstalk create-environment `
        --application-name $APP_NAME `
        --environment-name $ENV_NAME `
        --version-label $VERSION_LABEL `
        --solution-stack-name "64bit Windows Server 2022 v2.20.0 running IIS 10.0" `
        --option-settings file://eb-options.json `
        --region $REGION

    Remove-Item eb-options.json
}

# Step 7: Configure Database Connectivity
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Database Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$dbAnswer = Read-Host "`nHave you created the RDS database? (Y/N)"

if ($dbAnswer -eq "Y" -or $dbAnswer -eq "y") {
    Write-Host "`nConfiguring database connectivity..." -ForegroundColor Yellow

    # Get RDS database endpoint
    $DB_IDENTIFIER = "hirethemnow-db"
    $DB_ENDPOINT = aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION --query "DBInstances[0].Endpoint.Address" --output text 2>$null

    if ($DB_ENDPOINT -and $DB_ENDPOINT -ne "None") {
        Write-Host "Found RDS database: $DB_ENDPOINT" -ForegroundColor Green

        # Get RDS security group
        $RDS_SG = aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text 2>$null

        # Get VPC ID if not already set
        if (-not $VPC_ID) {
            $VPC_ID = aws ec2 describe-vpcs --region $REGION --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text
        }

        # Get Elastic Beanstalk security group
        $EB_SG = aws ec2 describe-security-groups --region $REGION --filters "Name=group-name,Values=awseb-e-*" "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[0].GroupId" --output text 2>$null

        if ($RDS_SG -and $EB_SG) {
            Write-Host "RDS Security Group: $RDS_SG" -ForegroundColor Cyan
            Write-Host "Elastic Beanstalk Security Group: $EB_SG" -ForegroundColor Cyan

            # Check if rule already exists
            $ruleExists = aws ec2 describe-security-group-rules --region $REGION --filters "Name=group-id,Values=$RDS_SG" --query "SecurityGroupRules[?ReferencedGroupInfo.GroupId=='$EB_SG' && IpProtocol=='tcp' && FromPort==``5432``].SecurityGroupRuleId" --output text 2>$null

            if ($ruleExists) {
                Write-Host "Security group rule already exists - skipping" -ForegroundColor Green
            } else {
                Write-Host "Adding security group rule to allow Elastic Beanstalk access to RDS..." -ForegroundColor Yellow
                aws ec2 authorize-security-group-ingress --group-id $RDS_SG --protocol tcp --port 5432 --source-group $EB_SG --region $REGION 2>$null

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Security group configured successfully!" -ForegroundColor Green
                } else {
                    Write-Host "Warning: Security group rule may already exist or there was an error" -ForegroundColor Yellow
                }
            }

            # Check what database name to use (RDS without initial DB uses 'postgres')
            $DB_NAME = aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION --query "DBInstances[0].DBName" --output text 2>$null
            if ($DB_NAME -eq "None" -or [string]::IsNullOrEmpty($DB_NAME)) {
                Write-Host "No initial database found, using default 'postgres' database" -ForegroundColor Yellow
                $DB_NAME = "postgres"
            } else {
                Write-Host "Using database: $DB_NAME" -ForegroundColor Green
            }
            # Update environment variables with database configuration
            Write-Host "`nUpdating environment variables with database configuration..." -ForegroundColor Yellow
            aws elasticbeanstalk update-environment `
                --environment-name $ENV_NAME `
                --region $REGION `
                --option-settings `
                    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_HOST,Value=$DB_ENDPOINT `
                    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_NAME,Value=$DB_NAME `
                    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_USER,Value=postgres `
                    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_PASSWORD,Value=$env:DATABASE_PASSWORD

            Write-Host "Database configuration complete!" -ForegroundColor Green
        } else {
            Write-Host "Warning: Could not find security groups. Please configure manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR: Database '$DB_IDENTIFIER' not found in region $REGION" -ForegroundColor Red
        Write-Host "Please create the RDS database first using AWS Console or run:" -ForegroundColor Yellow
        Write-Host "aws rds create-db-instance --db-instance-identifier hirethemnow-db --db-instance-class db.t3.micro --engine postgres --master-username postgres --master-user-password `$env:DATABASE_PASSWORD --allocated-storage 20 --region `$env:AWS_REGION" -ForegroundColor Gray
    }
} else {
    Write-Host "`nSkipping database configuration." -ForegroundColor Yellow
    Write-Host "To create RDS database, use AWS Console or run:" -ForegroundColor Cyan
    Write-Host "aws rds create-db-instance --db-instance-identifier hirethemnow-db --db-instance-class db.t3.micro --engine postgres --master-username postgres --master-user-password `$env:DATABASE_PASSWORD --allocated-storage 20 --region `$env:AWS_REGION" -ForegroundColor Gray
}

# Step 8: Configure HTTPS Listener
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HTTPS Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$configureHttps = Read-Host "`nDo you want to configure HTTPS with SSL certificate? (Y/N)"

if ($configureHttps -eq "Y" -or $configureHttps -eq "y") {
    # Check for existing SSL certificates
    $certs = aws acm list-certificates --region $REGION --query "CertificateSummaryList[?contains(DomainName, 'hirethemnow.xyz')]" --output json 2>$null | ConvertFrom-Json

    if ($certs -and $certs.Length -gt 0) {
        Write-Host "`nFound existing SSL certificates:" -ForegroundColor Green
        $certIndex = 1
        foreach ($cert in $certs) {
            $certDetails = aws acm describe-certificate --certificate-arn $cert.CertificateArn --region $REGION --query "Certificate.[Status,SubjectAlternativeNames]" --output json | ConvertFrom-Json
            Write-Host "  $certIndex. $($cert.DomainName) - Status: $($certDetails[0])" -ForegroundColor Cyan
            Write-Host "     Covers: $($certDetails[1] -join ', ')" -ForegroundColor Gray
            $certIndex++
        }

        $certChoice = Read-Host "`nEnter certificate number to use (or 'N' to create new)"

        if ($certChoice -ne "N" -and $certChoice -ne "n") {
            $selectedCert = $certs[[int]$certChoice - 1]
            $CERT_ARN = $selectedCert.CertificateArn

            # Check if certificate covers api.hirethemnow.xyz
            $certSANs = aws acm describe-certificate --certificate-arn $CERT_ARN --region $REGION --query "Certificate.SubjectAlternativeNames" --output json | ConvertFrom-Json
            if ($certSANs -notcontains "api.hirethemnow.xyz" -and $certSANs -notcontains "*.hirethemnow.xyz") {
                Write-Host "`nWARNING: This certificate does NOT cover api.hirethemnow.xyz" -ForegroundColor Red
                Write-Host "Certificate covers: $($certSANs -join ', ')" -ForegroundColor Yellow
                Write-Host "You need a certificate that includes 'api.hirethemnow.xyz' or '*.hirethemnow.xyz'" -ForegroundColor Yellow
                $CERT_ARN = $null
            }
        } else {
            $CERT_ARN = $null
        }
    }

    if (-not $CERT_ARN) {
        Write-Host "`nNo suitable certificate found. Please:" -ForegroundColor Yellow
        Write-Host "1. Request a new certificate in AWS Certificate Manager" -ForegroundColor White
        Write-Host "2. Include domains: hirethemnow.xyz, www.hirethemnow.xyz, api.hirethemnow.xyz, *.hirethemnow.xyz" -ForegroundColor White
        Write-Host "3. Validate the certificate using DNS validation" -ForegroundColor White
        Write-Host "4. Run this script again to configure HTTPS" -ForegroundColor White
        Write-Host "`nFor now, the backend will only be accessible via HTTP" -ForegroundColor Yellow
    } else {
        Write-Host "`nConfiguring HTTPS listener on load balancer..." -ForegroundColor Yellow
        aws elasticbeanstalk update-environment `
            --environment-name $ENV_NAME `
            --region $REGION `
            --option-settings `
                Namespace=aws:elb:listener:443,OptionName=ListenerProtocol,Value=HTTPS `
                Namespace=aws:elb:listener:443,OptionName=InstancePort,Value=80 `
                Namespace=aws:elb:listener:443,OptionName=InstanceProtocol,Value=HTTP `
                Namespace=aws:elb:listener:443,OptionName=SSLCertificateId,Value=$CERT_ARN

        Write-Host "HTTPS listener configured! Waiting for update..." -ForegroundColor Green
        Start-Sleep -Seconds 30
    }
} else {
    Write-Host "`nSkipping HTTPS configuration. Backend will be accessible via HTTP only." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nBackend URLs:" -ForegroundColor Cyan
Write-Host "  HTTP:  http://hirethemnow-prod.eba-km2y4gpp.us-east-1.elasticbeanstalk.com" -ForegroundColor White
if ($CERT_ARN) {
    Write-Host "  HTTPS: https://api.hirethemnow.xyz (after DNS is configured)" -ForegroundColor White
} else {
    Write-Host "  HTTPS: Not configured - configure SSL certificate first" -ForegroundColor Yellow
}

Write-Host "`nMonitor status:" -ForegroundColor Cyan
Write-Host "aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION" -ForegroundColor White

Write-Host "`nIMPORTANT: If you encounter issues, check the troubleshooting section in README.md" -ForegroundColor Yellow
