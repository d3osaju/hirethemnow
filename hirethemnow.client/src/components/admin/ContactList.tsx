import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  Calendar,
  Building,
  Mail,
  ExternalLink,
  ArrowUpDown
} from 'lucide-react';
import type { JobOpportunity, PagedResult } from '../../types';
import { adminContactAPI } from '../../services/api';

interface ContactListProps {
  onViewContact: (contact: JobOpportunity) => void;
  onEditContact: (contact: JobOpportunity) => void;
  onDeleteContact: (contact: JobOpportunity) => void;
}

export interface ContactListRef {
  refreshContacts: () => void;
}

const ContactList = forwardRef<ContactListRef, ContactListProps>(({
  onViewContact,
  onEditContact,
  onDeleteContact
}, ref) => {
  const [contacts, setContacts] = useState<PagedResult<JobOpportunity>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);

  useImperativeHandle(ref, () => ({
    refreshContacts: loadContacts
  }));

  useEffect(() => {
    loadContacts();
  }, [currentPage, searchTerm, sortBy]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await adminContactAPI.getContacts(currentPage, 20, searchTerm, sortBy);
      
      if (response.success) {
        setContacts(response.data);
      } else {
        console.error('Failed to load contacts:', response.message);
        // Fallback to empty state
        setContacts({
          items: [],
          totalCount: 0,
          page: currentPage,
          pageSize: 20,
          totalPages: 0
        });
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      // Fallback to empty state on error
      setContacts({
        items: [],
        totalCount: 0,
        page: currentPage,
        pageSize: 20,
        totalPages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const totalPages = contacts.totalPages;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">HR Contacts</h2>
            <p className="text-sm text-gray-600 mt-1">
              {contacts.totalCount} total contacts
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by company or job title..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="company">Sort by Company</option>
              <option value="jobTitle">Sort by Job Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact list */}
      <div className="overflow-x-auto">
        {contacts.items.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No HR contacts have been collected yet.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('company')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Company</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('jobTitle')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Job Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('createdAt')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Date Added</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.items.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contact.company}
                        </div>
                        {contact.link && (
                          <a
                            href={contact.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Job
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.jobTitle}</div>
                    {contact.salary && (
                      <div className="text-xs text-gray-500">{contact.salary}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      {contact.location}
                      {contact.isRemote && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Remote
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400 mr-1" />
                      <div>
                        <div>{contact.emails}</div>
                        <div className="text-xs text-gray-500 capitalize">{contact.emailType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                      {formatDate(contact.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onViewContact(contact)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditContact(contact)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                        title="Edit contact"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(contact)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {contacts.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * contacts.pageSize) + 1} to{' '}
              {Math.min(currentPage * contacts.pageSize, contacts.totalCount)} of{' '}
              {contacts.totalCount} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm rounded ${
                    page === currentPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(contacts.totalPages, currentPage + 1))}
                disabled={currentPage === contacts.totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ContactList.displayName = 'ContactList';

export default ContactList;