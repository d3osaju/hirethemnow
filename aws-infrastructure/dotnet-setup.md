# .NET Backend Setup for AI Agent

## 1. Install Required NuGet Packages

```bash
cd HireThemNoW.Server

# AWS SDK packages
dotnet add package AWSSDK.BedrockAgentRuntime --version 3.7.400
dotnet add package AWSSDK.BedrockRuntime --version 3.7.400
dotnet add package AWSSDK.S3 --version 3.7.400
dotnet add package AWSSDK.Core --version 3.7.400
```

## 2. Update appsettings.json

Add this configuration section:

```json
{
  "AWS": {
    "Region": "us-east-1",
    "Bedrock": {
      "AgentId": "YOUR_AGENT_ID",
      "AgentAliasId": "YOUR_AGENT_ALIAS_ID"
    },
    "S3": {
      "ResumeBucket": "hirethemnow-ai-agent-resumes"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-db-host;Database=hirethemnow;Username=postgres;Password=your-password"
  }
}
```

Replace placeholders after running `deploy.sh`:
- `YOUR_AGENT_ID`: From deployment output
- `YOUR_AGENT_ALIAS_ID`: From deployment output
- Database connection string with your actual values

## 3. Register Service in Program.cs

Add this to your `Program.cs`:

```csharp
using HireThemNoW.Server.Services;

// ... existing code ...

// Register AI Agent service
builder.Services.AddScoped<IBedrockAgentService, BedrockAgentService>();

// ... rest of your code ...
```

## 4. Create Database Migration

```bash
# Create migration
dotnet ef migrations add AddAIAgentTables

# Apply migration
dotnet ef database update
```

This creates the following tables:
- `resume_analyses` - Stores AI-parsed resume data
- `job_match_results` - Stores job matching results
- `applications` - Job applications
- `job_postings` - Job listings

## 5. Configure AWS Credentials

### Option A: Environment Variables (Local Development)

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### Option B: AWS Credentials File

Create `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = your-access-key
aws_secret_access_key = your-secret-key
region = us-east-1
```

### Option C: IAM Role (Production - Recommended)

When deploying to EC2/ECS/Lambda, attach an IAM role with these permissions:
- `bedrock:InvokeAgent`
- `bedrock:InvokeModel`
- `s3:GetObject` (for resume bucket)
- `s3:PutObject` (for resume bucket)

## 6. Update CORS Settings

In `Program.cs`, ensure your CORS policy allows frontend access:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "https://your-frontend.com")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Later in the file:
app.UseCors("AllowFrontend");
```

## 7. Test the API

### Test Resume Analysis

```bash
curl -X POST http://localhost:5000/api/aiagent/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"applicationId": 1}'
```

### Test Job Matching

```bash
curl http://localhost:5000/api/aiagent/match-jobs/1
```

### Test Skill Gap Analysis

```bash
curl -X POST http://localhost:5000/api/aiagent/skill-gap-analysis \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 1, "jobId": 1}'
```

## 8. Seed Test Data (Optional)

Create some test data:

```sql
-- Insert test job posting
INSERT INTO job_postings (id, company_id, title, description, required_skills, experience_level, location, salary_min, salary_max, status)
VALUES (1, 1, 'Senior Software Engineer', 'We are looking for a talented developer...',
        '["JavaScript", "React", "Node.js", "AWS"]', 'Senior', 'Remote', 100000, 150000, 'Open');

-- Insert test application
INSERT INTO applications (id, user_id, job_id, status)
VALUES (1, 1, 1, 'Pending');
```

## 9. Environment Variables for Production

When deploying to production, set these environment variables:

```bash
ASPNETCORE_ENVIRONMENT=Production
AWS_REGION=us-east-1
BEDROCK_AGENT_ID=your-agent-id
BEDROCK_AGENT_ALIAS_ID=your-alias-id
S3_RESUME_BUCKET=hirethemnow-ai-agent-resumes
DATABASE_PASSWORD=your-secure-password
```

## 10. Monitoring and Logging

Add structured logging for AI operations:

```csharp
// In BedrockAgentService methods
_logger.LogInformation("Analyzing resume for application {ApplicationId}", applicationId);
_logger.LogError(ex, "Error analyzing resume for application {ApplicationId}", applicationId);
```

View logs:

```bash
# Local development
dotnet run

# Production (CloudWatch)
aws logs tail /aws/your-app-logs --follow
```

## Common Issues

### Issue: "Bedrock Agent not found"

**Solution**: Verify Agent ID in appsettings.json matches deployment output

### Issue: "Access Denied to Bedrock"

**Solution**: Check AWS credentials and IAM permissions

### Issue: "Database connection failed"

**Solution**:
1. Check connection string in appsettings.json
2. Ensure database is accessible from your network
3. Verify PostgreSQL is running

### Issue: "Lambda not triggering on S3 upload"

**Solution**:
1. Check S3 event configuration
2. Verify Lambda has permissions to be invoked by S3
3. Check Lambda logs in CloudWatch

## Performance Optimization

1. **Cache Analysis Results**: Already implemented in `AnalyzeResumeAsync`
2. **Use Async/Await**: All methods use async pattern
3. **Connection Pooling**: EF Core handles this automatically
4. **Batch Processing**: Process multiple resumes in parallel

```csharp
var tasks = applicationIds.Select(id => _bedrockService.AnalyzeResumeAsync(id));
var results = await Task.WhenAll(tasks);
```

## Next Steps

1. ✅ Install NuGet packages
2. ✅ Update appsettings.json
3. ✅ Register service in Program.cs
4. ✅ Run database migrations
5. ✅ Configure AWS credentials
6. ✅ Test API endpoints
7. Deploy to production
8. Monitor performance and costs

## Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Nova Models](https://aws.amazon.com/bedrock/nova/)
- [AWS SDK for .NET](https://aws.amazon.com/sdk-for-net/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
