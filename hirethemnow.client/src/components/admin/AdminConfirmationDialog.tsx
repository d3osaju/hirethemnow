import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, Trash2, Save } from 'lucide-react';
import AdminModal, { AdminModalBody, AdminModalFooter } from './AdminModal';
import { LoadingButton } from './AdminLoadingStates';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ComponentType<{ className?: string }>;
  details?: string[];
  requireConfirmation?: boolean;
  confirmationText?: string;
  showImpactWarning?: boolean;
  impactMessage?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  details = [],
  requireConfirmation = false,
  confirmationText = '',
  showImpactWarning = false,
  impactMessage = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');

  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: icon || Trash2,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: icon || AlertTriangle,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          icon: icon || Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
      case 'success':
        return {
          icon: icon || CheckCircle,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        };
      default:
        return {
          icon: icon || AlertTriangle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    if (requireConfirmation && confirmationInput !== confirmationText) {
      return;
    }

    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmationInput('');
      onClose();
    }
  };

  const isConfirmDisabled = loading || (requireConfirmation && confirmationInput !== confirmationText);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={!loading}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <AdminModalBody>
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>

            {/* Additional details */}
            {details.length > 0 && (
              <div className="mb-4">
                <ul className="text-sm text-gray-600 space-y-1">
                  {details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Impact warning */}
            {showImpactWarning && impactMessage && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{impactMessage}</p>
                </div>
              </div>
            )}

            {/* Confirmation input */}
            {requireConfirmation && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono bg-gray-100 px-1 rounded">{confirmationText}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={confirmationText}
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </div>
      </AdminModalBody>
      
      <AdminModalFooter>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          
          <LoadingButton
            loading={loading}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonClass}`}
          >
            {confirmText}
          </LoadingButton>
        </div>
      </AdminModalFooter>
    </AdminModal>
  );
};

export default ConfirmationDialog;

// Predefined confirmation dialogs for common actions
export const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemName: string;
  itemType?: string;
  additionalWarning?: string;
  requireConfirmation?: boolean;
}> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  itemType = 'item',
  additionalWarning,
  requireConfirmation = false
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`Delete ${itemType}`}
    message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
    confirmText="Delete"
    variant="danger"
    icon={Trash2}
    showImpactWarning={!!additionalWarning}
    impactMessage={additionalWarning}
    requireConfirmation={requireConfirmation}
    confirmationText={requireConfirmation ? itemName : ''}
  />
);

export const SaveConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  changes?: string[];
}> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Save Changes',
  message = 'Are you sure you want to save these changes?',
  changes = []
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    message={message}
    confirmText="Save Changes"
    variant="success"
    icon={Save}
    details={changes}
  />
);

export const BulkActionConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  action: string;
  itemCount: number;
  itemType?: string;
}> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  itemCount, 
  itemType = 'items'
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={`${action} ${itemCount} ${itemType}`}
    message={`Are you sure you want to ${action.toLowerCase()} ${itemCount} ${itemType}? This action will affect multiple records.`}
    confirmText={`${action} All`}
    variant="warning"
    showImpactWarning={true}
    impactMessage={`This will ${action.toLowerCase()} ${itemCount} ${itemType} at once. Make sure you have selected the correct items.`}
  />
);

// Enhanced confirmation dialog with progress tracking
export const ProgressConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  showProgress?: boolean;
  progressMessage?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  showProgress = false,
  progressMessage = 'Processing...',
  variant = 'danger'
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConfirm = async () => {
    setLoading(true);
    setProgress(0);

    if (showProgress) {
      // Simulate progress for demo purposes
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
    }

    try {
      await onConfirm();
      setProgress(100);
      setTimeout(() => {
        onClose();
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      setLoading(false);
      setProgress(0);
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      size="sm"
      showCloseButton={!loading}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <AdminModalBody>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-100' :
            variant === 'warning' ? 'bg-yellow-100' :
            variant === 'info' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === 'danger' ? 'text-red-600' :
              variant === 'warning' ? 'text-yellow-600' :
              variant === 'info' ? 'text-blue-600' : 'text-green-600'
            }`} />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            {loading ? progressMessage : message}
          </p>

          {loading && showProgress && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}% complete</p>
            </div>
          )}
        </div>
      </AdminModalBody>
      
      <AdminModalFooter>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <LoadingButton
            loading={loading}
            onClick={handleConfirm}
            className={`text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
              variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' :
              variant === 'info' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
              'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {confirmText}
          </LoadingButton>
        </div>
      </AdminModalFooter>
    </AdminModal>
  );
};