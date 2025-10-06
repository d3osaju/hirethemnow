# Implementation Plan

- [x] 1. Update deployment script with AI services IAM configuration



  - Add new section after existing S3 IAM configuration (around line 180)
  - Create comprehensive IAM policy JSON with S3, Bedrock, and Textract permissions
  - Use `aws iam put-role-policy` to force update the policy on aws-elasticbeanstalk-ec2-role
  - Add error handling and success/failure logging
  - Clean up temporary policy JSON file after application
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Create health check controller and endpoint





  - Create new file `HireThemNoW.Server/Controllers/HealthController.cs`
  - Implement `GET /api/health/aws-services` endpoint
  - Create response models for health status (AwsServicesHealthResponse, S3HealthStatus, TextractHealthStatus, BedrockHealthStatus)
  - Inject IAmazonS3, IAmazonTextract, IAmazonBedrockRuntime, and IConfiguration services
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Implement S3 health check logic





  - Create private method `CheckS3HealthAsync()` in HealthController
  - Attempt to list objects in hirethemnow-files bucket using ListObjectsV2Request
  - Catch and handle AccessDeniedException and NoSuchBucketException
  - Return S3HealthStatus with isAccessible flag and error message if applicable
  - _Requirements: 6.1_

- [x] 4. Implement Textract health check logic





  - Create private method `CheckTextractHealthAsync()` in HealthController
  - Create minimal DetectDocumentTextRequest with test data
  - Catch and handle AccessDeniedException and service errors
  - Return TextractHealthStatus with isAccessible flag, region, and error message if applicable
  - _Requirements: 6.2_

- [x] 5. Implement Bedrock health check logic





  - Create private method `CheckBedrockHealthAsync()` in HealthController
  - Read BedrockModelId from configuration
  - Create minimal InvokeModelRequest with test prompt for Nova model
  - Catch and handle AccessDeniedException, ResourceNotFoundException, and model errors
  - Return BedrockHealthStatus with isAccessible flag, modelId, region, and error message if applicable
  - _Requirements: 6.3, 6.4_

- [x] 6. Add enhanced error logging to BedrockAgentService





  - Add specific catch blocks for AmazonBedrockRuntimeException with Forbidden status
  - Add specific catch blocks for AmazonTextractException with Forbidden status
  - Log clear error messages indicating IAM permission issues
  - Include model ID and required permissions in error messages
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

- [x] 7. Add configuration validation to ResumeParsingBackgroundService





  - Add startup validation in ExecuteAsync method before main loop
  - Check ResumeParsing:BedrockModelId configuration value
  - Check AWS:S3:BucketName configuration value
  - Log errors if required configuration is missing
  - Continue service execution even if validation warnings occur
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Verify NuGet packages are included





  - Confirm AWSSDK.BedrockRuntime package is in HireThemNoW.Server.csproj
  - Confirm AWSSDK.Textract package is in HireThemNoW.Server.csproj
  - Confirm AWSSDK.Core package is in HireThemNoW.Server.csproj
  - Verify all AWS SDK packages are compatible versions
  - Build project to ensure no package conflicts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Test deployment script IAM configuration locally





  - Run deploy-backend.ps1 script with test AWS credentials
  - Verify IAM policy is created/updated on aws-elasticbeanstalk-ec2-role
  - Use `aws iam get-role-policy` to confirm policy contains all three statement blocks
  - Verify script logs success message
  - Test force update by running script twice
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10. Deploy and test health check endpoint





  - Deploy updated backend to Elastic Beanstalk
  - Call health check endpoint via curl or browser
  - Verify response includes all three service statuses
  - Verify allServicesHealthy is true when permissions are correct
  - Test error scenario by temporarily removing a permission
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Perform end-to-end resume parsing test





  - Upload a sample PDF resume via the API
  - Check database for resume_content record with status "pending"
  - Monitor logs for Textract and Bedrock invocations
  - Wait for background service to process resume
  - Verify status changes to "completed" and parsed_content contains structured JSON
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
