import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAdminErrorHandler } from '../../utils/adminErrorHandler';
import { useAdminNotifications } from '../../utils/adminNotifications';
import { LoadingButton } from '../../components/admin/AdminLoadingStates';
import { DeleteConfirmationDialog } from '../../components/admin/AdminConfirmationDialog';
import { 
  Briefcase, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';
import AdminTable, { type TableColumn, type TableAction } from '../../components/admin/AdminTable';
import AdminModal, { AdminModalBody, AdminModalFooter } from '../../components/admin/AdminModal';
import { adminJobAPI } from '../../services/api';
import type { AdminJobOpportunity, JobApplication } from '../../types';

interface JobFilters {
  search: string;
  status: string;
  locationType: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<AdminJobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleAuthError, withErrorHandling } = useAdminErrorHandler();
  const { operations } = useAdminNotifications();
  
  // Use ref to track request in progress to prevent race conditions
  const requestInProgress = React.useRef(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    totalCount: 0
  });

  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    status: '',
    locationType: '',
    sortBy: 'postedAt',
    sortOrder: 'desc'
  });

  // Modal states
  const [selectedJob, setSelectedJob] = useState<AdminJobOpportunity | null>(null);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [editingJob, setEditingJob] = useState<Partial<AdminJobOpportunity>>({});
  const [newJob, setNewJob] = useState<Omit<AdminJobOpportunity, 'id' | 'createdBy' | 'postedAt' | 'updatedAt' | 'applicationCount' | 'viewCount'>>({
    title: '',
    company: '',
    location: '',
    locationType: 'remote',
    description: '',
    requirements: [],
    benefits: [],
    status: 'active'
  });

  // Memoized request parameters for stable references
  const requestParams = React.useMemo(() => ({
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    search: filters.search || undefined,
    status: filters.status || undefined,
    locationType: filters.locationType || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  }), [pagination.currentPage, pagination.pageSize, filters.search, filters.status, filters.locationType, filters.sortBy, filters.sortOrder]);

  const fetchJobs = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await adminJobAPI.getJobs(requestParams);
      
      if (response.success) {
        setJobs(response.data.items);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount
        }));
        setError(null);
      } else {
        const errorMessage = response.message || 'Failed to fetch jobs';
        setError(errorMessage);
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError(err, { context: 'Fetching jobs' });
      } else {
        const apiError = handleError(err, { 
          context: 'Fetching jobs',
          showToast: false
        });
        setError(apiError.message);
      }
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [requestParams, handleError, handleAuthError]);

  // Error recovery function that doesn't trigger infinite loops
  const handleRetry = useCallback(() => {
    setError(null);
    fetchJobs();
  }, [fetchJobs]);

  // Clear error function for manual error dismissal
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handlePageChange = useCallback((page: number) => {
    // Prevent page changes during loading to avoid multiple requests
    if (requestInProgress.current) {
      return;
    }
    
    // Only update if page actually changed
    if (page !== pagination.currentPage) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  }, [pagination.currentPage]);

  const handleSearch = useCallback((searchTerm: string) => {
    // Prevent filter changes during loading to avoid multiple requests
    if (requestInProgress.current) {
      return;
    }
    
    // Only update if search term actually changed
    if (searchTerm !== filters.search) {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters.search]);

  const handleSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    // Prevent sort changes during loading to avoid multiple requests
    if (requestInProgress.current) {
      return;
    }
    
    // Only update if sort parameters actually changed
    if (sortBy !== filters.sortBy || sortOrder !== filters.sortOrder) {
      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters.sortBy, filters.sortOrder]);

  const handleFilterChange = useCallback((key: keyof JobFilters, value: string) => {
    // Prevent filter changes during loading to avoid multiple requests
    if (requestInProgress.current) {
      return;
    }
    
    // Only update if filter value actually changed
    if (value !== filters[key]) {
      setFilters(prev => ({ ...prev, [key]: value }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters]);

  const handleViewJob = async (job: AdminJobOpportunity) => {
    try {
      setModalLoading(true);
      const response = await adminJobAPI.getJob(job.id);
      
      if (response.success) {
        setSelectedJob(response.data);
        setJobApplications(response.data.applications || []);
        setEditingJob(response.data);
        setShowJobModal(true);
      } else {
        toast.error(response.message || 'Failed to fetch job details');
      }
    } catch (err) {
      toast.error('Failed to fetch job details');
      console.error('Error fetching job details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditJob = async (job: AdminJobOpportunity) => {
    try {
      setModalLoading(true);
      const response = await adminJobAPI.getJob(job.id);
      
      if (response.success) {
        setSelectedJob(response.data);
        setJobApplications(response.data.applications || []);
        setEditingJob(response.data);
        setShowJobModal(true);
      } else {
        toast.error(response.message || 'Failed to fetch job details');
      }
    } catch (err) {
      toast.error('Failed to fetch job details');
      console.error('Error fetching job details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteJob = (job: AdminJobOpportunity) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const handleCreateJob = () => {
    setNewJob({
      title: '',
      company: '',
      location: '',
      locationType: 'remote',
      description: '',
      requirements: [],
      benefits: [],
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleSaveJob = async () => {
    if (!selectedJob || !editingJob) return;

    const operation = async () => {
      setModalLoading(true);
      const response = await adminJobAPI.updateJob(selectedJob.id, editingJob);
      
      if (response.success) {
        operations.job.updated(selectedJob.title);
        setShowJobModal(false);
        fetchJobs();
      } else {
        throw new Error(response.message || 'Failed to update job');
      }
    };

    await withErrorHandling(operation, {
      context: 'Updating job',
      fallbackMessage: 'Failed to update job'
    });

    setModalLoading(false);
  };

  const handleCreateJobSubmit = async () => {
    if (!newJob.title || !newJob.company || !newJob.description) {
      toast.error('Title, company, and description are required');
      return;
    }

    const operation = async () => {
      setModalLoading(true);
      const response = await adminJobAPI.createJob(newJob);
      
      if (response.success) {
        operations.job.created(newJob.title);
        setShowCreateModal(false);
        fetchJobs();
      } else {
        throw new Error(response.message || 'Failed to create job');
      }
    };

    await withErrorHandling(operation, {
      context: 'Creating job',
      fallbackMessage: 'Failed to create job'
    });

    setModalLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedJob) return;

    const operation = async () => {
      setModalLoading(true);
      const response = await adminJobAPI.deleteJob(selectedJob.id);
      
      if (response.success) {
        operations.job.deleted(selectedJob.title);
        setShowDeleteModal(false);
        fetchJobs();
      } else {
        throw new Error(response.message || 'Failed to delete job');
      }
    };

    await withErrorHandling(operation, {
      context: 'Deleting job',
      fallbackMessage: 'Failed to delete job'
    });

    setModalLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return 'Not specified';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      closed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getLocationTypeBadge = (locationType: string) => {
    const typeConfig = {
      remote: { color: 'bg-blue-100 text-blue-800', label: 'Remote' },
      hybrid: { color: 'bg-purple-100 text-purple-800', label: 'Hybrid' },
      onsite: { color: 'bg-gray-100 text-gray-800', label: 'On-site' }
    };

    const config = typeConfig[locationType as keyof typeof typeConfig] || typeConfig.remote;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <MapPin className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const columns: TableColumn<AdminJobOpportunity>[] = [
    {
      key: 'title',
      label: 'Job',
      sortable: true,
      render: (job) => (
        <div>
          <div className="font-medium text-gray-900">{job.title}</div>
          <div className="flex items-center text-sm text-gray-500">
            <Building className="w-3 h-3 mr-1" />
            {job.company}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (job) => (
        <div>
          <div className="text-sm text-gray-900">{job.location}</div>
          <div className="mt-1">{getLocationTypeBadge(job.locationType)}</div>
        </div>
      )
    },
    {
      key: 'salary',
      label: 'Salary',
      render: (job) => (
        <div className="flex items-center text-sm text-gray-900">
          <DollarSign className="w-3 h-3 mr-1 text-gray-400" />
          {formatSalary(job.salaryMin, job.salaryMax)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (job) => getStatusBadge(job.status)
    },
    {
      key: 'applicationCount',
      label: 'Applications',
      sortable: true,
      render: (job) => (
        <div className="flex items-center text-sm text-gray-900">
          <Users className="w-3 h-3 mr-1 text-gray-400" />
          {job.applicationCount}
        </div>
      )
    },
    {
      key: 'postedAt',
      label: 'Posted',
      sortable: true,
      render: (job) => (
        <div className="flex items-center text-sm text-gray-900">
          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
          {formatDate(job.postedAt)}
        </div>
      )
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (job) => (
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {formatDate(job.updatedAt)}
        </div>
      )
    }
  ];

  const actions: TableAction<AdminJobOpportunity>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: handleViewJob,
      variant: 'secondary'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEditJob,
      variant: 'primary'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDeleteJob,
      variant: 'danger'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600">Manage job opportunities and applications</p>
        </div>
        <button
          onClick={handleCreateJob}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
            <select
              value={filters.locationType}
              onChange={(e) => handleFilterChange('locationType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleSort(sortBy, sortOrder as 'asc' | 'desc');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="postedAt-desc">Newest First</option>
              <option value="postedAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="applicationCount-desc">Most Applications</option>
              <option value="updatedAt-desc">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <AdminTable
        data={jobs}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        searchable={true}
        searchPlaceholder="Search jobs by title, company, or location..."
        onSearch={handleSearch}
        onSort={handleSort}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount,
          onPageChange: handlePageChange
        }}
        errorActions={{
          onRetry: handleRetry,
          onDismiss: clearError
        }}
        emptyState={{
          icon: Briefcase,
          title: 'No jobs found',
          description: 'No job opportunities match your current filters.'
        }}
      />
 
      {/* Job Detail/Edit Modal */}
      <AdminModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        title={selectedJob ? `Job: ${selectedJob.title}` : 'Job Details'}
        size="xl"
      >
        <AdminModalBody>
          {selectedJob && editingJob && (
            <div className="space-y-6">
              {/* Job Header */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {selectedJob.company}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedJob.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Posted {formatDate(selectedJob.postedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedJob.status)}
                    {getLocationTypeBadge(selectedJob.locationType)}
                  </div>
                </div>
              </div>

              {/* Job Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{selectedJob.applicationCount}</div>
                      <div className="text-sm text-blue-600">Applications</div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{selectedJob.viewCount}</div>
                      <div className="text-sm text-green-600">Views</div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <div className="text-lg font-bold text-purple-900">{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}</div>
                      <div className="text-sm text-purple-600">Salary Range</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Job Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={editingJob.title || ''}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={editingJob.company || ''}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingJob.location || ''}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                    <select
                      value={editingJob.locationType || 'remote'}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, locationType: e.target.value as 'remote' | 'hybrid' | 'onsite' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingJob.status || 'active'}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'closed' }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
                    <input
                      type="number"
                      value={editingJob.salaryMin || ''}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, salaryMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
                    <input
                      type="number"
                      value={editingJob.salaryMax || ''}
                      onChange={(e) => setEditingJob(prev => ({ ...prev, salaryMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., 80000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                  <textarea
                    value={editingJob.description || ''}
                    onChange={(e) => setEditingJob(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Describe the job role, responsibilities, and requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                  <textarea
                    value={editingJob.requirements?.join('\n') || ''}
                    onChange={(e) => setEditingJob(prev => ({ ...prev, requirements: e.target.value.split('\n').filter(req => req.trim()) }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Proficiency in React and TypeScript"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                  <textarea
                    value={editingJob.benefits?.join('\n') || ''}
                    onChange={(e) => setEditingJob(prev => ({ ...prev, benefits: e.target.value.split('\n').filter(benefit => benefit.trim()) }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Health insurance&#10;401k matching&#10;Flexible work hours&#10;Remote work options"
                  />
                </div>
              </div>

              {/* Applications Section */}
              {jobApplications.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Recent Applications</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {jobApplications.slice(0, 5).map((application) => (
                        <div key={application.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {application.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{application.user.name}</div>
                              <div className="text-sm text-gray-500">{application.user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {application.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(application.appliedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {jobApplications.length > 5 && (
                      <div className="text-center mt-3">
                        <span className="text-sm text-gray-500">
                          And {jobApplications.length - 5} more applications...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminModalBody>
        <AdminModalFooter>
          <button
            onClick={() => setShowJobModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={modalLoading}
          >
            Cancel
          </button>
          <LoadingButton
            loading={modalLoading}
            onClick={handleSaveJob}
            variant="primary"
          >
            Save Changes
          </LoadingButton>
        </AdminModalFooter>
      </AdminModal>

      {/* Create Job Modal */}
      <AdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Job"
        size="lg"
      >
        <AdminModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Senior Frontend Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Tech Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                <select
                  value={newJob.locationType}
                  onChange={(e) => setNewJob(prev => ({ ...prev, locationType: e.target.value as 'remote' | 'hybrid' | 'onsite' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newJob.status}
                  onChange={(e) => setNewJob(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'closed' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
                <input
                  type="number"
                  value={newJob.salaryMin || ''}
                  onChange={(e) => setNewJob(prev => ({ ...prev, salaryMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
                <input
                  type="number"
                  value={newJob.salaryMax || ''}
                  onChange={(e) => setNewJob(prev => ({ ...prev, salaryMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., 80000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe the job role, responsibilities, and requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
              <textarea
                value={newJob.requirements.join('\n')}
                onChange={(e) => setNewJob(prev => ({ ...prev, requirements: e.target.value.split('\n').filter(req => req.trim()) }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience&#10;Proficiency in React and TypeScript"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
              <textarea
                value={newJob.benefits.join('\n')}
                onChange={(e) => setNewJob(prev => ({ ...prev, benefits: e.target.value.split('\n').filter(benefit => benefit.trim()) }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Health insurance&#10;401k matching&#10;Flexible work hours&#10;Remote work options"
              />
            </div>
          </div>
        </AdminModalBody>
        <AdminModalFooter>
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={modalLoading}
          >
            Cancel
          </button>
          <LoadingButton
            loading={modalLoading}
            onClick={handleCreateJobSubmit}
            disabled={!newJob.title || !newJob.company || !newJob.description}
            variant="primary"
          >
            Create Job
          </LoadingButton>
        </AdminModalFooter>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedJob?.title || ''}
        itemType="job"
        additionalWarning={`This will affect ${selectedJob?.applicationCount || 0} applications and cannot be undone.`}
      />
    </div>
  );
};

export default AdminJobs;