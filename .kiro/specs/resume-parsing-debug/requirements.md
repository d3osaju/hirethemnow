# Requirements Document

## Introduction

The resume parsing feature requires proper AWS Bedrock (Nova model) and Textract configuration in the backend deployment. Currently, the deployment may be missing necessary IAM permissions, service configurations, or environment variables needed for AWS AI services to function properly. This spec will ensure the backend deployment includes all required AWS service configurations.

## Requirements

### Requirement 1: IAM Role Configuration for AWS Services

**User Story:** As a system administrator, I want the backend deployment to have proper IAM permissions for Bedrock and Textract, so that the application can access AWS AI services.

#### Acceptance Criteria

1. WHEN the application is deployed THEN the IAM role SHALL include permissions for bedrock:InvokeModel
2. WHEN the application is deployed THEN the IAM role SHALL include permissions for textract:DetectDocumentText
3. WHEN the application is deployed THEN the IAM role SHALL include permissions for s3:GetObject on the resume bucket
4. WHEN the application attempts to use Bedrock THEN it SHALL have access to the amazon.nova-pro-v1:0 model
5. IF permissions are missing THEN the deployment documentation SHALL clearly indicate required IAM policies

### Requirement 2: AWS SDK Configuration in Deployment

**User Story:** As a developer, I want the AWS SDK properly configured in the deployment environment, so that Bedrock and Textract clients are initialized correctly.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL register IAmazonBedrockRuntime service
2. WHEN the application starts THEN it SHALL register IAmazonTextract service
3. WHEN running in production THEN the services SHALL use the default AWS credential chain
4. WHEN running in production THEN the services SHALL use the correct AWS region (us-east-1)
5. IF AWS services fail to initialize THEN the application SHALL log clear error messages

### Requirement 3: Environment Variables and Configuration

**User Story:** As a developer, I want all necessary environment variables configured in the deployment, so that resume parsing can access the correct AWS resources.

#### Acceptance Criteria

1. WHEN the application is deployed THEN the AWS:S3:BucketName SHALL be set to "hirethemnow-files"
2. WHEN the application is deployed THEN ResumeParsing:BedrockModelId SHALL be set to "amazon.nova-pro-v1:0"
3. WHEN the application is deployed THEN ResumeParsing:EnableBackgroundProcessing SHALL be set to true
4. WHEN the application is deployed THEN AWS region SHALL be configured (via environment or IAM role)
5. IF configuration is missing THEN the application SHALL fail fast with clear error messages

### Requirement 4: Deployment Script Updates

**User Story:** As a developer, I want the deployment script to include IAM policy configuration, so that deployments automatically have the correct permissions.

#### Acceptance Criteria

1. WHEN deploy-backend.ps1 runs THEN it SHALL verify or create an IAM instance profile with required permissions
2. WHEN the IAM policy is created THEN it SHALL include Bedrock InvokeModel permissions for amazon.nova-pro-v1:0
3. WHEN the IAM policy is created THEN it SHALL include Textract DetectDocumentText permissions
4. WHEN the IAM policy is created THEN it SHALL include S3 GetObject permissions for hirethemnow-files bucket
5. IF the IAM role already exists THEN the script SHALL force update the policy using put-role-policy to overwrite existing permissions
6. WHEN the policy is updated THEN the script SHALL log confirmation that permissions were successfully applied

### Requirement 5: NuGet Package Dependencies

**User Story:** As a developer, I want all required AWS SDK packages included in the deployment, so that Bedrock and Textract functionality is available.

#### Acceptance Criteria

1. WHEN the project is built THEN it SHALL include AWSSDK.BedrockRuntime package
2. WHEN the project is built THEN it SHALL include AWSSDK.Textract package
3. WHEN the project is built THEN it SHALL include AWSSDK.Core package
4. WHEN the project is built THEN all AWS SDK packages SHALL be compatible versions
5. IF packages are missing THEN the build SHALL fail with clear error messages

### Requirement 6: Deployment Verification

**User Story:** As a developer, I want to verify that AWS services are accessible after deployment, so that I can confirm the configuration is correct.

#### Acceptance Criteria

1. WHEN deployment completes THEN a health check endpoint SHALL verify Bedrock access
2. WHEN deployment completes THEN a health check endpoint SHALL verify Textract access
3. WHEN deployment completes THEN a health check endpoint SHALL verify S3 bucket access
4. WHEN health checks fail THEN they SHALL return specific error messages indicating which service is inaccessible
5. IF all services are accessible THEN the health check SHALL return HTTP 200 with service status details
