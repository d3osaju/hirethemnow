import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import ContactList, { type ContactListRef } from '../../components/admin/ContactList';
import ContactDetailModal from '../../components/admin/ContactDetailModal';
import ContactEditForm from '../../components/admin/ContactEditForm';
import DeleteConfirmationDialog from '../../components/admin/DeleteConfirmationDialog';
import { adminContactAPI } from '../../services/api';
import type { JobOpportunity, UpdateContactRequest } from '../../types';

const AdminContacts: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<JobOpportunity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const contactListRef = useRef<ContactListRef>(null);

  const handleViewContact = (contact: JobOpportunity) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleEditContact = (contact: JobOpportunity) => {
    setSelectedContact(contact);
    setShowDetailModal(false);
    setShowEditForm(true);
  };

  const handleDeleteContact = (contact: JobOpportunity) => {
    setSelectedContact(contact);
    setShowDetailModal(false);
    setShowDeleteDialog(true);
  };

  const handleSaveContact = async (id: number, data: UpdateContactRequest) => {
    try {
      const response = await adminContactAPI.updateContact(id, data);
      
      if (response.success) {
        toast.success('Contact updated successfully');
        // Refresh the contact list
        contactListRef.current?.refreshContacts();
      } else {
        toast.error(response.message || 'Failed to update contact');
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
      toast.error('Failed to update contact');
      throw error;
    }
  };

  const handleConfirmDelete = async (contact: JobOpportunity) => {
    try {
      const response = await adminContactAPI.deleteContact(contact.id);
      
      if (response.success) {
        toast.success('Contact deleted successfully');
        // Refresh the contact list
        contactListRef.current?.refreshContacts();
      } else {
        toast.error(response.message || 'Failed to delete contact');
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
      throw error;
    }
  };

  const closeAllModals = () => {
    setSelectedContact(null);
    setShowDetailModal(false);
    setShowEditForm(false);
    setShowDeleteDialog(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
        <p className="text-gray-600 mt-1">
          Manage HR contacts and job opportunities collected from various sources.
        </p>
      </div>

      <ContactList
        ref={contactListRef}
        onViewContact={handleViewContact}
        onEditContact={handleEditContact}
        onDeleteContact={handleDeleteContact}
      />

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact}
        isOpen={showDetailModal}
        onClose={closeAllModals}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
      />

      {/* Contact Edit Form */}
      <ContactEditForm
        contact={selectedContact}
        isOpen={showEditForm}
        onClose={closeAllModals}
        onSave={handleSaveContact}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        contact={selectedContact}
        isOpen={showDeleteDialog}
        onClose={closeAllModals}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminContacts;