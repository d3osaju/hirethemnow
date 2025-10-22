import React from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Wrench,
  MessageSquare,
  Languages,
  FolderGit2
} from 'lucide-react';
import { ensureArray, ensureArrayOfAny } from '../utils/dataHelpers';
import type { ParsedResumeContent } from '../types';

interface ParsedResumeViewerProps {
  content: ParsedResumeContent;
  fileName: string;
  parsedAt: string;
}

export const ParsedResumeViewer: React.FC<ParsedResumeViewerProps> = ({ content, fileName, parsedAt }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Parsed Resume Content</h2>
          <span className="text-sm text-gray-600">
            Parsed: {new Date(parsedAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-gray-600">File: {fileName}</p>
      </div>

      {/* Personal Information */}
      {content.personalInfo && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.personalInfo.name && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">{content.personalInfo.name}</span>
              </div>
            )}
            {content.personalInfo.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">{content.personalInfo.email}</span>
              </div>
            )}
            {content.personalInfo.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm font-medium text-gray-900">{content.personalInfo.phone}</span>
              </div>
            )}
            {content.personalInfo.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Location:</span>
                <span className="text-sm font-medium text-gray-900">{content.personalInfo.location}</span>
              </div>
            )}
            {content.personalInfo.linkedin && (
              <div className="flex items-center space-x-2">
                <Linkedin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">LinkedIn:</span>
                <a href={content.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                  Profile
                </a>
              </div>
            )}
            {content.personalInfo.website && (
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Website:</span>
                <a href={content.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                  Visit
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {content.summary && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h3>
          <p className="text-gray-700 leading-relaxed">{content.summary}</p>
        </div>
      )}

      {/* Experience */}
      {content.experience && ensureArrayOfAny(content.experience).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
            Work Experience
          </h3>
          <div className="space-y-6">
            {ensureArrayOfAny(content.experience).map((exp, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {exp.company} {exp.location && `• ${exp.location}`}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {exp.startDate} - {exp.endDate || 'Present'}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                )}
                {exp.achievements && ensureArray(exp.achievements).length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {ensureArray(exp.achievements).map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {content.education && ensureArrayOfAny(content.education).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
            Education
          </h3>
          <div className="space-y-4">
            {ensureArrayOfAny(content.education).map((edu, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                <p className="text-xs text-gray-500">
                  {edu.field && `${edu.field} • `}
                  {edu.graduationDate}
                  {edu.gpa && ` • GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {content.skills && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
          <div className="space-y-4">
            {content.skills.technical && ensureArray(content.skills.technical).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Code className="w-4 h-4 mr-2 text-blue-600" />
                  Technical Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ensureArray(content.skills.technical).map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {content.skills.soft && ensureArray(content.skills.soft).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                  Soft Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ensureArray(content.skills.soft).map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {content.skills.languages && ensureArray(content.skills.languages).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Languages className="w-4 h-4 mr-2 text-purple-600" />
                  Programming Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ensureArray(content.skills.languages).map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {content.skills.tools && ensureArray(content.skills.tools).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Wrench className="w-4 h-4 mr-2 text-orange-600" />
                  Tools & Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ensureArray(content.skills.tools).map((tool, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      {content.certifications && ensureArrayOfAny(content.certifications).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-blue-600" />
            Certifications
          </h3>
          <div className="space-y-4">
            {ensureArrayOfAny(content.certifications).map((cert, index) => (
              <div key={index} className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                {cert.issuer && (
                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {cert.date && <span>Issued: {cert.date}</span>}
                  {cert.expirationDate && <span> • Expires: {cert.expirationDate}</span>}
                </div>
                {cert.credentialId && (
                  <p className="text-xs text-gray-500 mt-1">Credential ID: {cert.credentialId}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {content.projects && ensureArrayOfAny(content.projects).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FolderGit2 className="w-5 h-5 mr-2 text-blue-600" />
            Projects
          </h3>
          <div className="space-y-4">
            {ensureArrayOfAny(content.projects).map((project, index) => (
              <div key={index} className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Project
                    </a>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                )}
                {project.technologies && ensureArray(project.technologies).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ensureArray(project.technologies).map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsedResumeViewer;
