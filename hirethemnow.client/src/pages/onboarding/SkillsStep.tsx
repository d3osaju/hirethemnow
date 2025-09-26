import React, { useState } from 'react';
import type { OnboardingData } from '../../types';
import { Code, Plus, X } from 'lucide-react';

interface SkillsStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
}

const popularSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Java',
  'C++', 'HTML/CSS', 'TypeScript', 'Angular', 'Vue.js', 'PHP',
  'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL'
];

const SkillsStep: React.FC<SkillsStepProps> = ({ data, onDataChange }) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = (skill: string) => {
    if (skill && !data.skills.includes(skill)) {
      onDataChange({ skills: [...data.skills, skill] });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onDataChange({
      skills: data.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleAddCustomSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill.trim());
      setNewSkill('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Code className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills & Expertise</h2>
        <p className="text-gray-600">
          Select your skills to help match you with the right opportunities
        </p>
      </div>

      {/* Selected Skills */}
      {data.skills.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Skills ({data.skills.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Skill */}
      <div>
        <label htmlFor="customSkill" className="block text-sm font-medium text-gray-700 mb-2">
          Add a skill
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="customSkill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Machine Learning, Project Management"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddCustomSkill}
            disabled={!newSkill.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Popular Skills */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Skills</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {popularSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => addSkill(skill)}
              disabled={data.skills.includes(skill)}
              className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                data.skills.includes(skill)
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {data.skills.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Please select at least one skill to continue
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillsStep;