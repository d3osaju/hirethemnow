const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });
const bedrockRuntimeClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

/**
 * Lambda Handler for Resume Processing
 * Triggered when a resume is uploaded to S3
 */
exports.handler = async (event) => {
    console.log('Resume processor triggered:', JSON.stringify(event, null, 2));

    try {
        // Extract S3 object details
        const s3Record = event.Records[0].s3;
        const bucketName = s3Record.bucket.name;
        const objectKey = decodeURIComponent(s3Record.object.key.replace(/\+/g, ' '));

        console.log(`Processing resume: ${objectKey} from bucket: ${bucketName}`);

        // Download the file from S3
        const fileBuffer = await downloadFromS3(bucketName, objectKey);

        // Extract text from resume
        const resumeText = await extractTextFromResume(objectKey, fileBuffer);
        console.log('Resume text extracted, length:', resumeText.length);

        // Get userId from database by looking up the resume URL
        const s3Url = `s3://${bucketName}/${objectKey}`;
        const userId = await getUserIdByResumeUrl(objectKey);
        console.log('Found userId for resume:', userId);

        // Parse resume using Bedrock Agent
        const parsedData = await parseResumeWithAgent(resumeText, objectKey);

        // Enhance parsing with direct Nova model for structured extraction
        const structuredData = await extractStructuredData(resumeText);

        // Merge results
        const finalData = {
            ...parsedData,
            ...structuredData,
            userId: userId,
            s3Url: s3Url,
            processedAt: new Date().toISOString()
        };

        // Store in database via .NET API
        await storeResumeData(finalData);

        // Log ATS score
        console.log('Resume analysis complete. ATS Score:', finalData.atsScore?.overall || 'N/A');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Resume processed successfully',
                data: finalData
            })
        };

    } catch (error) {
        console.error('Error processing resume:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing resume',
                error: error.message
            })
        };
    }
};

/**
 * Download file from S3
 */
async function downloadFromS3(bucket, key) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });

    const response = await s3Client.send(command);
    const chunks = [];

    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}

/**
 * Extract text from PDF or DOCX
 */
async function extractTextFromResume(filename, buffer) {
    const extension = filename.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        const data = await pdfParse(buffer);
        return data.text;
    } else if (extension === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else {
        throw new Error(`Unsupported file format: ${extension}`);
    }
}

/**
 * Parse resume using Bedrock Agent
 */
async function parseResumeWithAgent(resumeText, filename) {
    // Check if agent is configured
    if (!process.env.AGENT_ID || process.env.AGENT_ID === 'NONE') {
        console.log('Bedrock Agent not configured, skipping agent parsing');
        return {};
    }

    const sessionId = `resume-${Date.now()}`;

    const command = new InvokeAgentCommand({
        agentId: process.env.AGENT_ID,
        agentAliasId: process.env.AGENT_ALIAS_ID,
        sessionId: sessionId,
        inputText: `Analyze this resume for ATS compatibility:\n\n${resumeText}`
    });

    try {
        const response = await bedrockAgentClient.send(command);

        // Process streaming response
        let agentResponse = '';
        for await (const event of response.completion) {
            if (event.chunk) {
                const chunk = new TextDecoder().decode(event.chunk.bytes);
                agentResponse += chunk;
            }
        }

        console.log('Bedrock Agent response:', agentResponse);

        // Parse agent response
        try {
            const jsonMatch = agentResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { rawResponse: agentResponse };
        } catch {
            // If not JSON, extract key information
            return {
                rawResponse: agentResponse,
                filename: filename
            };
        }
    } catch (error) {
        console.error('Error invoking Bedrock Agent:', error);
        return { error: error.message };
    }
}

/**
 * Extract structured data with ATS scoring using Nova model
 */
async function extractStructuredData(resumeText) {
    const prompt = {
        messages: [
            {
                role: 'user',
                content: [{
                    text: `You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume comprehensively and provide detailed scoring and improvement suggestions.

Resume:
${resumeText}

Provide analysis in this JSON format:

{
  "personalInfo": {
    "name": "candidate name",
    "email": "email address",
    "phone": "phone number",
    "location": "city, country"
  },
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": ["programming or spoken languages"],
    "tools": ["tools and technologies"]
  },
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "dates",
      "description": "brief description",
      "achievements": ["quantified achievements with metrics"]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school name",
      "year": "graduation year",
      "gpa": "if available"
    }
  ],
  "certifications": ["list of certifications"],
  "summary": "professional summary",
  "atsScore": {
    "overall": <0-100 score>,
    "breakdown": {
      "formatting": <0-100>,
      "keywords": <0-100>,
      "experience": <0-100>,
      "education": <0-100>,
      "skills": <0-100>,
      "achievements": <0-100>
    }
  },
  "strengths": [
    "specific strength 1",
    "specific strength 2",
    "specific strength 3"
  ],
  "weaknesses": [
    "specific weakness 1",
    "specific weakness 2",
    "specific weakness 3"
  ],
  "improvements": [
    {
      "category": "Formatting/Content/Keywords/Skills",
      "issue": "specific issue",
      "suggestion": "actionable fix",
      "impact": "low/medium/high",
      "priority": 1-10
    }
  ],
  "keywords": {
    "found": ["relevant keywords in resume"],
    "missing": ["important missing keywords"],
    "density": <0-100>
  },
  "readability": {
    "score": <0-100>,
    "issues": ["any readability problems"]
  },
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2",
    "actionable recommendation 3"
  ]
}

ATS Scoring Criteria:
- Formatting (0-100): Clean structure, no graphics blocking text, consistent formatting
- Keywords (0-100): Industry keywords, action verbs, skill mentions
- Experience (0-100): Clear descriptions, quantified results, relevance
- Education (0-100): Degrees, certifications, relevant training
- Skills (0-100): Technical and soft skills clearly listed
- Achievements (0-100): Measurable results, metrics, impact

Be specific and actionable. Return ONLY valid JSON.`
                }]
            }
        ],
        inferenceConfig: {
            max_new_tokens: 4000,
            temperature: 0.3,
            top_p: 0.9
        }
    };

    const command = new InvokeModelCommand({
        modelId: 'amazon.nova-pro-v1:0',  // Using Pro for better analysis
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(prompt)
    });

    try {
        const response = await bedrockRuntimeClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Extract the content from Nova response
        const content = responseBody.output.message.content[0].text;

        // Parse the JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { rawContent: content };
    } catch (error) {
        console.error('Error extracting structured data:', error);
        return { error: error.message };
    }
}

/**
 * Store resume data in database via .NET API
 */
/**
 * Get userId by looking up the resume URL in the Users table
 */
async function getUserIdByResumeUrl(resumeKey) {
    const { Client } = require('pg');

    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: 5432,
        database: 'hirethemnow',
        user: 'postgres',
        password: process.env.DATABASE_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database to lookup userId');

        const query = 'SELECT "Id" FROM "Users" WHERE "ResumeUrl" = $1 LIMIT 1';
        const result = await client.query(query, [resumeKey]);

        if (result.rows.length === 0) {
            throw new Error(`No user found with resume URL: ${resumeKey}`);
        }

        return result.rows[0].Id;
    } catch (error) {
        console.error('Error querying database:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

async function storeResumeData(data) {
    const apiUrl = `${process.env.API_BASE_URL}/api/AIAgent/webhook/resume-analyzed`;

    try {
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Resume data stored successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error storing resume data:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

