import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Users, Briefcase, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const HeroSection: React.FC = () => {
  const { user } = useAuth();

  return (
    <section className="relative bg-neutral-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-50 via-transparent to-purple-50"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center bg-lime-100 rounded-full px-4 py-2 mb-8">
              <Star className="h-4 w-4 text-lime-600 mr-2" />
              <span className="text-sm font-medium text-lime-800">
                Trusted by 10,000+ professionals
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl tracking-tight font-extrabold text-neutral-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              <span className="block">Connecting talent with</span>
              <span className="block text-lime-600">opportunity</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg text-neutral-600 sm:text-xl md:mt-8 md:max-w-3xl">
              Join thousands of professionals finding their dream jobs and companies discovering amazing talent. Your perfect match is just a click away.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
              <div className="rounded-md shadow">
                {!user ? (
                  <Link
                    to="/register?role=candidate"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-neutral-900 hover:bg-neutral-800 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                  >
                    Find your dream job
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-neutral-900 hover:bg-neutral-800 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                  >
                    Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <button className="w-full flex items-center justify-center px-8 py-3 border border-neutral-300 text-base font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 md:py-4 md:text-lg md:px-10 transition-all duration-200">
                  <Play className="mr-2 h-5 w-5" />
                  Watch demo
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">10K+</div>
                <div className="text-sm text-neutral-600">Active users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">500+</div>
                <div className="text-sm text-neutral-600">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">95%</div>
                <div className="text-sm text-neutral-600">Success rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Mock Dashboard Preview */}
              <div className="px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900">Job Matches</h3>
                  <span className="text-sm text-lime-600 font-medium">5 new</span>
                </div>

                {/* Mock Job Cards */}
                <div className="space-y-4">
                  <div className="p-4 border border-neutral-200 rounded-lg hover:border-lime-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-900">Senior Frontend Developer</h4>
                      <span className="text-sm text-lime-600 font-medium">95% match</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">TechCorp Inc. • Remote • $120k-150k</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-neutral-400 mr-1" />
                      <span className="text-xs text-neutral-500">50+ applicants</span>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 rounded-lg hover:border-lime-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-900">Product Manager</h4>
                      <span className="text-sm text-lime-600 font-medium">88% match</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">StartupXYZ • San Francisco • $140k-180k</p>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 text-neutral-400 mr-1" />
                      <span className="text-xs text-neutral-500">Full-time</span>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 rounded-lg opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-neutral-900">UX Designer</h4>
                      <span className="text-sm text-neutral-600 font-medium">82% match</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">DesignLab • New York • $100k-130k</p>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-neutral-400 mr-1" />
                      <span className="text-xs text-neutral-500">25+ applicants</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;