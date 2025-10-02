const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const axios = require('axios');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Lambda Handler for Job Matching
 * Matches candidates to job postings and ranks them
 */
exports.handler = async (event) => {
    console.log('Job matcher invoked:', JSON.stringify(event, null, 2));

    try {
        // Parse input
        let requestBody;

        if (event.body) {
            requestBody = JSON.parse(event.body);
        } else if (event.apiPath) {
            requestBody = event.requestBody.content['application/json'].properties;
        } else {
            requestBody = event;
        }

        const { candidateId, jobIds } = requestBody;

        console.log('Matching jobs for candidate:', candidateId);

        // Fetch candidate data from API
        const candidateData = await fetchCandidateData(candidateId);

        // Fetch job postings
        const jobs = await fetchJobs(jobIds);

        // Match and rank jobs using Nova
        const matches = await matchJobsWithNova(candidateData, jobs);

        const response = {
            candidateId,
            matches,
            totalJobs: jobs.length,
            topMatch: matches[0] || null,
            timestamp: new Date().toISOString()
        };

        // Format response
        if (event.apiPath) {
            return {
                messageVersion: '1.0',
                response: {
                    actionGroup: event.actionGroup,
                    apiPath: event.apiPath,
                    httpMethod: event.httpMethod,
                    httpStatusCode: 200,
                    responseBody: {
                        'application/json': {
                            body: JSON.stringify(response)
                        }
                    }
                }
            };
        } else {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(response)
            };
        }

    } catch (error) {
        console.error('Error in job matching:', error);

        if (event.apiPath) {
            return {
                messageVersion: '1.0',
                response: {
                    actionGroup: event.actionGroup,
                    apiPath: event.apiPath,
                    httpMethod: event.httpMethod,
                    httpStatusCode: 500,
                    responseBody: {
                        'application/json': {
                            body: JSON.stringify({ error: error.message })
                        }
                    }
                }
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    }
};

/**
 * Fetch candidate data from .NET API
 */
async function fetchCandidateData(candidateId) {
    const apiUrl = `${process.env.API_BASE_URL}/api/aiagent/candidate/${candidateId}`;

    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching candidate data:', error.message);
        throw new Error(`Failed to fetch candidate ${candidateId}`);
    }
}

/**
 * Fetch job postings from .NET API
 */
async function fetchJobs(jobIds) {
    const apiUrl = `${process.env.API_BASE_URL}/api/aiagent/jobs`;

    try {
        const response = await axios.post(apiUrl, { jobIds }, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching jobs:', error.message);
        throw new Error('Failed to fetch job postings');
    }
}

/**
 * Match and rank jobs using Nova model
 */
async function matchJobsWithNova(candidate, jobs) {
    const jobsText = jobs.map(job =>
        `Job ID: ${job.id}
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.skills?.join(', ') || 'Not specified'}
Experience Level: ${job.experienceLevel || 'Not specified'}
Location: ${job.location || 'Not specified'}
Salary Range: ${job.salaryMin}-${job.salaryMax || 'Not specified'}`
    ).join('\n\n---\n\n');

    const prompt = {
        messages: [
            {
                role: 'user',
                content: `You are an expert job matching AI. Analyze the candidate profile and rank the job postings by compatibility.

CANDIDATE PROFILE:
Name: ${candidate.name || 'Not provided'}
Skills: ${candidate.skills?.join(', ') || 'Not specified'}
Experience: ${candidate.experience || 'Not specified'}
Education: ${candidate.education || 'Not specified'}
Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
Preferred Location: ${candidate.location || 'Any'}
Expected Salary: ${candidate.expectedSalary || 'Not specified'}

JOB POSTINGS:
${jobsText}

Provide a detailed ranking in the following JSON format:
{
  "matches": [
    {
      "jobId": <job ID>,
      "score": <0-100>,
      "reasoning": "why this job is a good/bad fit",
      "skillsMatch": <0-100>,
      "experienceMatch": <0-100>,
      "locationMatch": <0-100>,
      "salaryMatch": <0-100>,
      "strengths": ["what makes this a good match"],
      "concerns": ["potential issues or gaps"],
      "recommendation": "hire/consider/not recommended"
    }
  ]
}

Rank jobs from best to worst match. Consider:
- Skill alignment (exact, semantic, transferable)
- Experience level fit
- Location compatibility
- Salary expectations
- Career growth potential
- Company culture fit (if mentioned)

Return ONLY valid JSON, sorted by score descending.`
            }
        ],
        inferenceConfig: {
            max_new_tokens: 3000,
            temperature: 0.5,
            top_p: 0.9
        }
    };

    const command = new InvokeModelCommand({
        modelId: 'amazon.nova-pro-v1:0', // Using Pro for better reasoning
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(prompt)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the content from Nova response
    const content = responseBody.output.message.content[0].text;

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.matches || [];
    }

    throw new Error('Failed to parse Nova response');
}
