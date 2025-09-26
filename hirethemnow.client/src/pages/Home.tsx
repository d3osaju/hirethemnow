import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Search, Briefcase, Users, Zap, Star, ArrowRight, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-8 lg:px-8 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-300/60 to-secondary-400/60 opacity-70 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary-300/60 to-primary-400/60 opacity-70 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50">
                <Star className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Trusted by 10,000+ professionals</span>
                <Sparkles className="h-4 w-4 text-secondary-600 animate-pulse" />
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent animate-float">
              Find Your Dream Job or Perfect Candidate
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-700 max-w-3xl mx-auto">
              Connect talented professionals with amazing opportunities. Whether you're looking for your next career move or seeking the perfect team member, we've got you covered.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              {!user ? (
                <>
                  <Link
                    to="/register?role=candidate"
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-primary rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                  >
                    <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Find Jobs
                    <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link
                    to="/register?role=employer"
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-700 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-primary-200/50 min-w-[200px]"
                  >
                    <Briefcase className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Post Jobs
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </>
              ) : (
                <Link
                  to="/jobs"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-primary rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                >
                  <Zap className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  {user.role === 'candidate' ? 'Browse Jobs' : 'Manage Jobs'}
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600 uppercase tracking-wide">Everything you need</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Streamlined hiring process
            </p>
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Our platform makes it easy for employers to find qualified candidates and for job seekers to discover their next opportunity.
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-32 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4 lg:gap-y-20">
              <div className="group relative bg-gradient-to-br from-primary-50 to-primary-100/50 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-105 border border-primary-200/20">
                <dt className="text-xl font-bold leading-7 text-gray-900 mb-4">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                  Smart Job Matching
                </dt>
                <dd className="text-base leading-7 text-gray-600">
                  Our intelligent algorithm matches candidates with relevant job opportunities based on skills, experience, and preferences.
                </dd>
              </div>

              <div className="group relative bg-gradient-to-br from-secondary-50 to-secondary-100/50 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-105 border border-secondary-200/20">
                <dt className="text-xl font-bold leading-7 text-gray-900 mb-4">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-secondary shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  Easy Job Posting
                </dt>
                <dd className="text-base leading-7 text-gray-600">
                  Employers can quickly post job openings with detailed descriptions and requirements to attract the right candidates.
                </dd>
              </div>

              <div className="group relative bg-gradient-to-br from-accent-50 to-accent-100/50 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-105 border border-accent-200/20">
                <dt className="text-xl font-bold leading-7 text-gray-900 mb-4">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  Application Management
                </dt>
                <dd className="text-base leading-7 text-gray-600">
                  Track applications, manage candidates, and streamline your hiring process with our comprehensive dashboard.
                </dd>
              </div>

              <div className="group relative bg-gradient-to-br from-primary-50 to-secondary-50/50 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-105 border border-primary-200/20">
                <dt className="text-xl font-bold leading-7 text-gray-900 mb-4">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-dark shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  Fast & Efficient
                </dt>
                <dd className="text-base leading-7 text-gray-600">
                  Reduce time-to-hire with our streamlined process that connects the right people quickly and efficiently.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-900/90"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.4
        }}></div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-primary-100">
              Join thousands of companies and job seekers who trust HireThemNow for their hiring needs.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-900 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                  >
                    <Sparkles className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Get Started
                    <div className="absolute inset-0 rounded-2xl bg-primary-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  <Link
                    to="/jobs"
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/20 min-w-[200px]"
                  >
                    Browse Jobs
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </>
              ) : (
                <Link
                  to="/jobs"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary-900 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                >
                  <Zap className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  View Dashboard
                  <div className="absolute inset-0 rounded-2xl bg-primary-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;