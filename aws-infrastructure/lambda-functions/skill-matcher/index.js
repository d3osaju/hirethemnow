const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Lambda Handler for Skill Matching
 * Used by Bedrock Agent to match candidate skills with job requirements
 */
exports.handler = async (event) => {
    console.log('Skill matcher invoked:', JSON.stringify(event, null, 2));

    try {
        // Parse input from Bedrock Agent or API Gateway
        let requestBody;

        if (event.body) {
            // Called via API Gateway
            requestBody = JSON.parse(event.body);
        } else if (event.apiPath) {
            // Called by Bedrock Agent
            requestBody = event.requestBody.content['application/json'].properties;
        } else {
            // Direct invocation
            requestBody = event;
        }

        const { candidateSkills, requiredSkills, experienceLevel } = requestBody;

        console.log('Matching skills:', {
            candidateSkills,
            requiredSkills,
            experienceLevel
        });

        // Use Nova model for semantic skill matching
        const matchResult = await matchSkillsWithNova(
            candidateSkills,
            requiredSkills,
            experienceLevel
        );

        // Calculate additional metrics
        const enhancedResult = enhanceMatchResult(matchResult, candidateSkills, requiredSkills);

        const response = {
            matchScore: enhancedResult.matchScore,
            matchedSkills: enhancedResult.matchedSkills,
            missingSkills: enhancedResult.missingSkills,
            partialMatches: enhancedResult.partialMatches,
            recommendations: enhancedResult.recommendations,
            experienceAlignment: enhancedResult.experienceAlignment
        };

        // Format response based on caller
        if (event.apiPath) {
            // Bedrock Agent format
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
            // API Gateway format
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
        console.error('Error in skill matching:', error);

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
 * Match skills using Nova model with semantic understanding
 */
async function matchSkillsWithNova(candidateSkills, requiredSkills, experienceLevel) {
    const prompt = {
        messages: [
            {
                role: 'user',
                content: `You are an expert skill matcher for technical recruiting. Analyze the candidate's skills against job requirements.

Candidate Skills: ${Array.isArray(candidateSkills) ? candidateSkills.join(', ') : candidateSkills}
Required Skills: ${Array.isArray(requiredSkills) ? requiredSkills.join(', ') : requiredSkills}
Experience Level: ${experienceLevel || 'Not specified'}

Provide a detailed analysis in the following JSON format:
{
  "matchScore": <0-100>,
  "matchedSkills": ["exact and semantic matches"],
  "missingSkills": ["skills candidate lacks"],
  "partialMatches": [
    {
      "candidateSkill": "skill name",
      "requiredSkill": "skill name",
      "similarity": <0-100>
    }
  ],
  "recommendations": "detailed recommendations for the candidate",
  "experienceAlignment": "how well experience level aligns with requirements"
}

Consider:
- Exact matches (e.g., "JavaScript" = "JavaScript")
- Semantic matches (e.g., "React" relates to "Frontend Development")
- Similar technologies (e.g., "PostgreSQL" similar to "MySQL")
- Skill categories (e.g., "Python" for "Backend Development")

Return ONLY valid JSON.`
            }
        ],
        inferenceConfig: {
            max_new_tokens: 1500,
            temperature: 0.4,
            top_p: 0.9
        }
    };

    const command = new InvokeModelCommand({
        modelId: 'amazon.nova-lite-v1:0',
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
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse Nova response');
}

/**
 * Enhance match result with additional metrics
 */
function enhanceMatchResult(matchResult, candidateSkills, requiredSkills) {
    const candidateArray = Array.isArray(candidateSkills) ? candidateSkills : candidateSkills.split(',').map(s => s.trim());
    const requiredArray = Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim());

    // Calculate coverage percentage
    const matchedCount = matchResult.matchedSkills?.length || 0;
    const totalRequired = requiredArray.length;
    const coveragePercentage = totalRequired > 0 ? (matchedCount / totalRequired) * 100 : 0;

    // Adjust match score based on coverage
    const adjustedScore = Math.min(
        matchResult.matchScore || 0,
        coveragePercentage
    );

    return {
        ...matchResult,
        matchScore: Math.round(adjustedScore),
        coveragePercentage: Math.round(coveragePercentage),
        totalCandidateSkills: candidateArray.length,
        totalRequiredSkills: requiredArray.length
    };
}
