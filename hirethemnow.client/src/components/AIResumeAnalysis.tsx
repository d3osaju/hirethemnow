import React, { useState } from 'react';
import { Brain, FileText, TrendingUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface AIResumeAnalysisProps {
  applicationId: number;
}

interface ResumeAnalysisResult {
  applicationId: number;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: {
    technical: string[];
    soft: string[];
    languages: string[];
    tools: string[];
  };
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
    achievements: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    gpa?: string;
  }>;
  certifications?: string[];
  summary?: string;
  overallScore: number;
  processedAt: string;
}

export const AIResumeAnalysis: React.FC<AIResumeAnalysisProps> = ({ applicationId }) => {
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeResume = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/aiagent/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.message || 'Failed to analyze resume');
      }
    } catch (err) {
      setError('Error analyzing resume. Please try again.');
      console.error('Error analyzing resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI Resume Analysis</h2>
        </div>
        {!analysis && (
          <button
            onClick={analyzeResume}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Overall Score</h3>
                <p className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}%
                </p>
                <p className="text-sm text-gray-600 mt-1">{getScoreLabel(analysis.overallScore)}</p>
              </div>
              <TrendingUp className={`w-16 h-16 ${getScoreColor(analysis.overallScore)}`} />
            </div>
          </div>

          {/* Personal Info */}
          {analysis.personalInfo && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {analysis.personalInfo.name && (
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-800">{analysis.personalInfo.name}</p>
                  </div>
                )}
                {analysis.personalInfo.email && (
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-800">{analysis.personalInfo.email}</p>
                  </div>
                )}
                {analysis.personalInfo.phone && (
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <p className="text-gray-800">{analysis.personalInfo.phone}</p>
                  </div>
                )}
                {analysis.personalInfo.location && (
                  <div>
                    <span className="font-medium text-gray-600">Location:</span>
                    <p className="text-gray-800">{analysis.personalInfo.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {analysis.skills && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills Breakdown</h3>
              <div className="space-y-4">
                {analysis.skills.technical.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.technical.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.skills.soft.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.soft.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.skills.languages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Programming Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.skills.tools.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Tools & Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.tools.map((tool, index) => (
                        <span
                          key={index}
                          className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {analysis.experience && analysis.experience.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Experience</h3>
              <div className="space-y-4">
                {analysis.experience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-800">{exp.title}</h4>
                    <p className="text-sm text-gray-600">
                      {exp.company} • {exp.duration}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {analysis.education && analysis.education.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Education</h3>
              <div className="space-y-3">
                {analysis.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-800">{edu.degree}</h4>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">
                      {edu.year} {edu.gpa && `• GPA: ${edu.gpa}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {analysis.certifications && analysis.certifications.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Certifications</h3>
              <ul className="space-y-2">
                {analysis.certifications.map((cert, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Summary</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 text-right">
            Analyzed at: {new Date(analysis.processedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResumeAnalysis;
