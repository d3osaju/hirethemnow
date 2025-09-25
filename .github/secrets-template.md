# GitHub Secrets Configuration

Copy these secrets to your GitHub repository: **Settings** → **Secrets and variables** → **Actions**

## 🔐 Required Secrets

### AWS Credentials
```
AWS_ACCESS_KEY_ID
Value: [Your AWS Access Key ID]

AWS_SECRET_ACCESS_KEY
Value: [Your AWS Secret Access Key]
```

### Application Configuration
```
DATABASE_PASSWORD
Value: [Your secure database password - min 8 characters]

JWT_SECRET
Value: [Your JWT secret key - min 32 characters]

GOOGLE_CLIENT_ID
Value: [Your Google OAuth Client ID]

GOOGLE_CLIENT_SECRET
Value: [Your Google OAuth Client Secret]
```

## 🛠️ How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter **Name** and **Secret** value
6. Click **Add secret**

Repeat for each secret above.

## 🔑 AWS IAM Setup

Create an IAM user with these permissions for GitHub Actions:

### Policy: `HireThemNowDeploymentPolicy`
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CloudFormationAccess",
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:DeleteStack",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResources",
                "cloudformation:ValidateTemplate"
            ],
            "Resource": [
                "arn:aws:cloudformation:*:*:stack/hirethemnow-*/*"
            ]
        },
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketPolicy",
                "s3:PutBucketPolicy",
                "s3:PutBucketPublicAccessBlock",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:PutBucketWebsite",
                "s3:GetBucketWebsite"
            ],
            "Resource": [
                "arn:aws:s3:::hirethemnow-*",
                "arn:aws:s3:::hirethemnow-*/*"
            ]
        },
        {
            "Sid": "CloudFrontAccess",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateDistribution",
                "cloudfront:UpdateDistribution",
                "cloudfront:DeleteDistribution",
                "cloudfront:GetDistribution",
                "cloudfront:ListDistributions",
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:ListInvalidations"
            ],
            "Resource": "*"
        },
        {
            "Sid": "LambdaAccess",
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:DeleteFunction",
                "lambda:GetFunction",
                "lambda:ListFunctions",
                "lambda:InvokeFunction",
                "lambda:AddPermission",
                "lambda:RemovePermission"
            ],
            "Resource": [
                "arn:aws:lambda:*:*:function:hirethemnow-*"
            ]
        },
        {
            "Sid": "APIGatewayAccess",
            "Effect": "Allow",
            "Action": [
                "apigateway:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "RDSAccess",
            "Effect": "Allow",
            "Action": [
                "rds:CreateDBInstance",
                "rds:DeleteDBInstance",
                "rds:DescribeDBInstances",
                "rds:ModifyDBInstance",
                "rds:CreateDBSubnetGroup",
                "rds:DeleteDBSubnetGroup",
                "rds:DescribeDBSubnetGroups"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VPCAccess",
            "Effect": "Allow",
            "Action": [
                "ec2:CreateVpc",
                "ec2:DeleteVpc",
                "ec2:DescribeVpcs",
                "ec2:CreateSubnet",
                "ec2:DeleteSubnet",
                "ec2:DescribeSubnets",
                "ec2:CreateSecurityGroup",
                "ec2:DeleteSecurityGroup",
                "ec2:DescribeSecurityGroups",
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:AuthorizeSecurityGroupEgress",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:RevokeSecurityGroupEgress",
                "ec2:DescribeAvailabilityZones"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMAccess",
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:PassRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:GetRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::*:role/hirethemnow-*"
            ]
        }
    ]
}
```

## ✅ Verification

After adding secrets, verify by:

1. Go to **Actions** tab
2. Select **Deploy to AWS Production** workflow
3. Click **Run workflow** → **Run workflow**
4. Check if deployment starts without credential errors

## 🚨 Security Notes

- **Never commit secrets to code**
- **Use least-privilege IAM policies**
- **Rotate AWS keys regularly**
- **Monitor AWS usage and costs**
- **Enable AWS CloudTrail for audit logs**

---

**Next Step**: Push to `main` branch to trigger automatic deployment! 🚀