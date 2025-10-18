import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { JobOpportunity } from '../../types';

interface DeleteConfirmationDialogProps {
  contact: JobOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contact: JobOpportunity) => Promise<void>;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  contact,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!contact) return;

    setLoading(true);
    try {
      await onConfirm(contact);
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      // Handle error - could show toast notification
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Contact</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to delete this contact? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Company:</span>
                    <span className="text-sm text-gray-600 ml-2">{contact.company}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Job Title:</span>
                    <span className="text-sm text-gray-600 ml-2">{contact.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Location:</span>
                    <span className="text-sm text-gray-600 ml-2">{contact.location}</span>
                  </div>
                  {contact.emails && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">Email:</span>
                      <span className="text-sm text-gray-600 ml-2">{contact.emails}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Warning
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently remove the contact from your database. All associated data will be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Contact</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;