import React, { useState } from 'react';
import { Briefcase, Star, AlertTriangle, CheckCircle, Loader, Target } from 'lucide-react';

interface AIJobMatcherProps {
  candidateId: number;
  jobIds?: number[];
}

interface JobMatch {
  jobId: number;
  jobTitle?: string;
  score: number;
  reasoning?: string;
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  strengths: string[];
  concerns: string[];
  recommendation?: string;
}

export const AIJobMatcher: React.FC<AIJobMatcherProps> = ({ candidateId, jobIds }) => {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findJobMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = jobIds && jobIds.length > 0
        ? `/api/aiagent/match-jobs/${candidateId}?${jobIds.map(id => `jobIds=${id}`).join('&')}`
        : `/api/aiagent/match-jobs/${candidateId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setMatches(result.data);
      } else {
        setError(result.message || 'Failed to find job matches');
      }
    } catch (err) {
      setError('Error finding job matches. Please try again.');
      console.error('Error finding job matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRecommendationColor = (recommendation?: string) => {
    if (recommendation?.toLowerCase().includes('hire')) return 'text-green-700 bg-green-100';
    if (recommendation?.toLowerCase().includes('consider')) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: '🥇', color: 'bg-yellow-100 text-yellow-800' };
    if (index === 1) return { icon: '🥈', color: 'bg-gray-100 text-gray-800' };
    if (index === 2) return { icon: '🥉', color: 'bg-orange-100 text-orange-800' };
    return { icon: `#${index + 1}`, color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">AI Job Matching</h2>
        </div>
        <button
          onClick={findJobMatches}
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
              <Briefcase className="w-5 h-5" />
              Find Matches
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 font-medium">
              Found {matches.length} job {matches.length === 1 ? 'match' : 'matches'}
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Ranked by compatibility score using AI analysis
            </p>
          </div>

          {matches.map((match, index) => {
            const rank = getRankBadge(index);

            return (
              <div
                key={match.jobId}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${rank.color}`}>
                      {rank.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {match.jobTitle || `Job #${match.jobId}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">
                          {match.score}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  {match.recommendation && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecommendationColor(match.recommendation)}`}>
                      {match.recommendation}
                    </span>
                  )}
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Skills Match</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(match.skillsMatch)}`}
                          style={{ width: `${match.skillsMatch}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(match.skillsMatch)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Experience</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(match.experienceMatch)}`}
                          style={{ width: `${match.experienceMatch}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(match.experienceMatch)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(match.locationMatch)}`}
                          style={{ width: `${match.locationMatch}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(match.locationMatch)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Salary</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getScoreColor(match.salaryMatch)}`}
                          style={{ width: `${match.salaryMatch}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(match.salaryMatch)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                {match.reasoning && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{match.reasoning}</p>
                  </div>
                )}

                {/* Strengths and Concerns */}
                <div className="grid md:grid-cols-2 gap-4">
                  {match.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {match.strengths.map((strength, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {match.concerns.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Concerns
                      </h4>
                      <ul className="space-y-1">
                        {match.concerns.map((concern, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-orange-600 mt-0.5">⚠</span>
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && matches.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Click "Find Matches" to discover compatible jobs</p>
        </div>
      )}
    </div>
  );
};

export default AIJobMatcher;
