import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const CTASection: React.FC = () => {
  const { user } = useAuth();

  return (
    <section className="relative py-20 bg-neutral-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center bg-lime-500/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-lime-400 mr-2" />
              <span className="text-sm font-medium text-lime-400">
                Ready to get started?
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Your dream job is waiting
            </h2>

            <p className="text-xl text-neutral-300 max-w-3xl mx-auto">
              Join thousands of professionals who have already found success with HireThemNow.
              Start your journey today.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {!user ? (
              <>
                <Link
                  to="/register?role=candidate"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-neutral-900 bg-lime-400 rounded-lg hover:bg-lime-300 transition-all duration-200 min-w-[200px]"
                >
                  Find Jobs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>

                <Link
                  to="/register?role=employer"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-transparent border-2 border-white rounded-lg hover:bg-white hover:text-neutral-900 transition-all duration-200 min-w-[200px]"
                >
                  Post Jobs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </>
            ) : (
              <Link
                to="/jobs"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-neutral-900 bg-lime-400 rounded-lg hover:bg-lime-300 transition-all duration-200 min-w-[200px]"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-neutral-800 pt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">10K+</div>
              <div className="text-sm text-neutral-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-sm text-neutral-400">Partner Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-sm text-neutral-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-neutral-400">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;