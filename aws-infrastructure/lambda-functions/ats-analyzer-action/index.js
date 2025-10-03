const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockRuntimeClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

/**
 * Lambda Action Group for Bedrock Agent
 * Provides ATS analysis as a tool/primitive
 */
exports.handler = async (event) => {
    console.log('ATS Analyzer Action invoked:', JSON.stringify(event, null, 2));

    const agent = event.agent;
    const actionGroup = event.actionGroup;
    const apiPath = event.apiPath;
    const httpMethod = event.httpMethod;
    const parameters = event.parameters || [];

    console.log(`Agent: ${agent}, Action: ${actionGroup}, Path: ${apiPath}, Method: ${httpMethod}`);

    try {
        // Extract resume text from parameters
        const resumeTextParam = parameters.find(p => p.name === 'resumeText');
        const resumeText = resumeTextParam ? resumeTextParam.value : '';

        if (!resumeText) {
            return formatResponse(400, { error: 'Missing resumeText parameter' });
        }

        console.log('Analyzing resume text, length:', resumeText.length);

        // Perform ATS analysis using Amazon Nova Pro
        const analysisResult = await analyzeResumeWithNova(resumeText);

        // Return result in Bedrock Agent format
        return formatResponse(200, analysisResult);

    } catch (error) {
        console.error('Error in ATS Analyzer Action:', error);
        return formatResponse(500, { error: error.message });
    }
};

/**
 * Analyze resume using Amazon Nova Pro
 */
async function analyzeResumeWithNova(resumeText) {
    const prompt = {
        messages: [
            {
                role: 'user',
                content: `You are an expert ATS (Applicant Tracking System) analyzer. Analyze this resume and provide a comprehensive assessment.

Resume Text:
${resumeText}

Provide your analysis in the following JSON format:
{
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
            }
        ],
        inferenceConfig: {
            max_new_tokens: 4000,
            temperature: 0.3,
            top_p: 0.9
        }
    };

    const command = new InvokeModelCommand({
        modelId: 'amazon.nova-pro-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(prompt)
    });

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
}

/**
 * Format response for Bedrock Agent
 */
function formatResponse(statusCode, body) {
    return {
        messageVersion: '1.0',
        response: {
            actionGroup: event.actionGroup,
            apiPath: event.apiPath,
            httpMethod: event.httpMethod,
            httpStatusCode: statusCode,
            responseBody: {
                'application/json': {
                    body: JSON.stringify(body)
                }
            }
        }
    };
}
