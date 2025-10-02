#!/bin/bash

echo "Waiting for LocalStack to be ready..."
sleep 5

echo "Creating S3 bucket..."
awslocal s3 mb s3://hirethemnow-resumes

echo "LocalStack S3 initialization complete!"