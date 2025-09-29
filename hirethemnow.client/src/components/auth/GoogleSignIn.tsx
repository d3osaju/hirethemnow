import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config/environment';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTrialExpired?: () => void;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: {
            theme: string;
            size: string;
            type: string;
            shape: string;
            text: string;
            logo_alignment: string;
            width: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError, onTrialExpired }) => {
  const { googleLogin } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async (response) => {
            try {
              // Call the backend with the Google token
              await googleLogin(response.credential);

              // Call onSuccess callback to trigger navigation
              if (onSuccess) {
                onSuccess();
              }
            } catch (error) {
              console.error('Google Sign-In error:', error);

              // Check if error is trial expired
              if (error && typeof error === 'object' && 'response' in error) {
                const err = error as { response?: { data?: { trialExpired?: boolean; message?: string } } };
                if (err.response?.data?.trialExpired) {
                  if (onTrialExpired) {
                    onTrialExpired();
                  }
                  return;
                }

                // Show specific backend error message if available
                if (err.response?.data?.message) {
                  if (onError) {
                    onError(err.response.data.message);
                  }
                  return;
                }
              }

              // Get more specific error message
              let errorMessage = 'Google Sign-In failed. Please try again.';
              if (error instanceof Error) {
                errorMessage = error.message;
              }

              if (onError) {
                onError(errorMessage);
              }
            }
          },
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'left',
          width: '300',
        });
      }
    };

    // Check if Google script is loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load
      const checkGoogle = () => {
        if (window.google) {
          initializeGoogleSignIn();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    }
  }, [googleLogin, onSuccess, onError, onTrialExpired]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="border-t border-gray-300 flex-1"></div>
          <span className="text-gray-500 text-sm font-medium">Or continue with</span>
          <div className="border-t border-gray-300 flex-1"></div>
        </div>
      </div>

      <div ref={googleButtonRef} className="flex justify-center">
        {/* Google Sign-In button will be rendered here */}
      </div>

      {/* Fallback manual button if Google script doesn't load */}
      <noscript>
        <button
          type="button"
          className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </noscript>
    </div>
  );
};

export default GoogleSignIn;