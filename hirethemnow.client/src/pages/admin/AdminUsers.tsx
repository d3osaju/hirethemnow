import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAdminErrorHandler } from '../../utils/adminErrorHandler';
import { useAdminNotifications } from '../../utils/adminNotifications';
import { LoadingButton } from '../../components/admin/AdminLoadingStates';
import { DeleteConfirmationDialog } from '../../components/admin/AdminConfirmationDialog';
import { 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  UserCheck, 
  UserX,
  Calendar,
  Mail,
  Shield,
  User
} from 'lucide-react';
import AdminTable, { type TableColumn, type TableAction } from '../../components/admin/AdminTable';
import AdminModal, { AdminModalBody, AdminModalFooter } from '../../components/admin/AdminModal';
import { adminUserAPI } from '../../services/api';
import type { AdminUser } from '../../types';

interface UserFilters {
  search: string;
  role: string;
  trialStatus: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleAuthError, withErrorHandling } = useAdminErrorHandler();
  const { operations } = useAdminNotifications();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    totalCount: 0
  });

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    trialStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [editingUser, setEditingUser] = useState<Partial<AdminUser>>({});
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'candidate' as 'candidate' | 'admin',
    password: ''
  });

  const fetchUsers = useCallback(async () => {
    const operation = async () => {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        search: filters.search || undefined,
        role: filters.role || undefined,
        trialStatus: filters.trialStatus || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await adminUserAPI.getUsers(params);
      
      if (response.success) {
        setUsers(response.data.items);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount
        }));
      } else {
        const errorMessage = response.message || 'Failed to fetch users';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    };

    try {
      await operation();
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        handleAuthError(err, { context: 'Fetching users' });
      } else {
        const apiError = handleError(err, { 
          context: 'Fetching users',
          showToast: false // Don't show toast since we're setting error state
        });
        setError(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, filters, handleError, handleAuthError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateUser = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'candidate',
      password: ''
    });
    setShowCreateModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !editingUser) return;

    const operation = async () => {
      setModalLoading(true);
      const response = await adminUserAPI.updateUser(selectedUser.id, editingUser);
      
      if (response.success) {
        operations.user.updated(selectedUser.name);
        setShowUserModal(false);
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    };

    await withErrorHandling(operation, {
      context: 'Updating user',
      fallbackMessage: 'Failed to update user'
    });

    setModalLoading(false);
  };

  const handleCreateUserSubmit = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Name and email are required');
      return;
    }

    const operation = async () => {
      setModalLoading(true);
      const response = await adminUserAPI.createUser(newUser);
      
      if (response.success) {
        operations.user.created(newUser.name);
        setShowCreateModal(false);
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    };

    await withErrorHandling(operation, {
      context: 'Creating user',
      fallbackMessage: 'Failed to create user'
    });

    setModalLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    const operation = async () => {
      setModalLoading(true);
      const response = await adminUserAPI.deleteUser(selectedUser.id);
      
      if (response.success) {
        operations.user.deleted(selectedUser.name);
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    };

    await withErrorHandling(operation, {
      context: 'Deleting user',
      fallbackMessage: 'Failed to delete user'
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

  const getTrialStatusBadge = (user: AdminUser) => {
    if (user.hasActiveSubscription) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Subscribed</span>;
    }
    if (user.isTrialActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Trial Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Trial Expired</span>;
  };

  const getRoleBadge = (role: string) => {
    const isAdmin = role === 'admin';
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
        {role}
      </span>
    );
  };

  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'picture',
      label: '',
      render: (user) => (
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => getRoleBadge(user.role)
    },
    {
      key: 'trialStatus',
      label: 'Status',
      render: (user) => getTrialStatusBadge(user)
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => formatDate(user.createdAt.toString())
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      render: (user) => user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'
    },
    {
      key: 'isCompleted',
      label: 'Profile',
      render: (user) => (
        <div className="flex items-center">
          {user.isCompleted ? (
            <UserCheck className="w-4 h-4 text-green-600" />
          ) : (
            <UserX className="w-4 h-4 text-red-600" />
          )}
          <span className="ml-1 text-sm text-gray-600">
            {user.profileCompleteness}%
          </span>
        </div>
      )
    }
  ];

  const actions: TableAction<AdminUser>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: handleViewUser,
      variant: 'secondary'
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: handleEditUser,
      variant: 'primary'
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDeleteUser,
      variant: 'danger'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="candidate">Candidate</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trial Status</label>
            <select
              value={filters.trialStatus}
              onChange={(e) => handleFilterChange('trialStatus', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="active">Trial Active</option>
              <option value="expired">Trial Expired</option>
              <option value="subscribed">Subscribed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }));
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="lastLoginAt-desc">Last Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <AdminTable
        data={users}
        columns={columns}
        actions={actions}
        loading={loading}
        error={error}
        searchable={true}
        searchPlaceholder="Search users by name or email..."
        onSearch={handleSearch}
        onSort={handleSort}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount,
          onPageChange: handlePageChange
        }}
        emptyState={{
          icon: Users,
          title: 'No users found',
          description: 'No users match your current filters.'
        }}
      />

      {/* User Detail/Edit Modal */}
      <AdminModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={selectedUser ? `User: ${selectedUser.name}` : 'User Details'}
        size="lg"
      >
        <AdminModalBody>
          {selectedUser && editingUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {selectedUser.picture ? (
                    <img
                      src={selectedUser.picture}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{selectedUser.name}</h3>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {selectedUser.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatDate(selectedUser.createdAt.toString())}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value as 'candidate' | 'admin' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="candidate">Candidate</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editingUser.location || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editingUser.bio || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedUser.profileCompleteness}%</div>
                  <div className="text-sm text-gray-600">Profile Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{getTrialStatusBadge(selectedUser)}</div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedUser.resumeStatus}</div>
                  <div className="text-sm text-gray-600">Resume Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedUser.registrationSource}</div>
                  <div className="text-sm text-gray-600">Registration</div>
                </div>
              </div>
            </div>
          )}
        </AdminModalBody>
        <AdminModalFooter>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowUserModal(false)}
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <LoadingButton
              loading={modalLoading}
              onClick={handleSaveUser}
              variant="primary"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Save Changes
            </LoadingButton>
          </div>
        </AdminModalFooter>
      </AdminModal>

      {/* Create User Modal */}
      <AdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
      >
        <AdminModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter user's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter user's email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'candidate' | 'admin' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="candidate">Candidate</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Leave empty to send invitation email"
              />
              <p className="text-xs text-gray-500 mt-1">
                If password is not provided, user will receive an invitation email to set their password.
              </p>
            </div>
          </div>
        </AdminModalBody>
        <AdminModalFooter>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowCreateModal(false)}
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <LoadingButton
              loading={modalLoading}
              onClick={handleCreateUserSubmit}
              disabled={!newUser.name || !newUser.email}
              variant="primary"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Create User
            </LoadingButton>
          </div>
        </AdminModalFooter>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedUser?.name || ''}
        itemType="user"
        additionalWarning="This will permanently remove all user data including profile information, resume data, and application history."
      />
    </div>
  );
};

export default AdminUsers;