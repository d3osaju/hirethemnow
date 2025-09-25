import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { jobsAPI } from '../../services/api';
import { MapPin, DollarSign, Clock, Briefcase, Search } from 'lucide-react';

const JobList: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getJobs(1, 20, filters);
      if (response.success) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      setError('Failed to load jobs');
      // Mock data for development
      setJobs([
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          description: 'We are looking for a skilled Frontend Developer with React experience.',
          requirements: ['React', 'TypeScript', 'CSS', '3+ years experience'],
          location: 'San Francisco, CA',
          salary: { min: 100000, max: 150000, currency: 'USD' },
          type: 'full-time',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          employerId: 'emp1',
        },
        {
          id: '2',
          title: 'Backend Engineer',
          company: 'StartupXYZ',
          description: 'Join our growing team as a Backend Engineer working with Node.js and AWS.',
          requirements: ['Node.js', 'AWS', 'MongoDB', '2+ years experience'],
          location: 'Remote',
          salary: { min: 80000, max: 120000, currency: 'USD' },
          type: 'remote',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          employerId: 'emp2',
        },
        {
          id: '3',
          title: 'Product Manager',
          company: 'InnovateLabs',
          description: 'Lead product strategy and work with cross-functional teams.',
          requirements: ['Product Management', 'Agile', 'Analytics', '5+ years experience'],
          location: 'New York, NY',
          salary: { min: 120000, max: 180000, currency: 'USD' },
          type: 'full-time',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-05'),
          employerId: 'emp3',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSalary = (salary: Job['salary']) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const getTypeDisplay = (type: Job['type']) => {
    const typeMap = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'remote': 'Remote',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'employer' ? 'Your Job Postings' : 'Job Opportunities'}
          </h1>
          {user?.role === 'employer' && (
            <Link
              to="/jobs/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="remote">Remote</option>
                <option value="san-francisco">San Francisco</option>
                <option value="new-york">New York</option>
                <option value="london">London</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
            {error}. Showing sample data for demonstration.
          </div>
        )}

        {/* Job List */}
        <div className="space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Try adjusting your search criteria or filters.'
                  : 'There are no jobs available at the moment.'}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                    </h2>
                    <p className="text-lg text-gray-600 font-medium">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getTypeDisplay(job.type)}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.requirements.slice(0, 4).map((req, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {req}
                    </span>
                  ))}
                  {job.requirements.length > 4 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{job.requirements.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatSalary(job.salary)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {user?.role === 'candidate' && (
                      <Link
                        to={`/jobs/${job.id}/apply`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Apply Now
                      </Link>
                    )}
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                1
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;