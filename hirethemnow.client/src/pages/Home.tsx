import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Briefcase, Users, Zap } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Find Your Dream Job or Perfect Candidate
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect talented professionals with amazing opportunities. Whether you're looking for your next career move or seeking the perfect team member, we've got you covered.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              {!user ? (
                <>
                  <Link
                    to="/register?role=candidate"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Find Jobs
                  </Link>
                  <Link
                    to="/register?role=employer"
                    className="text-sm font-semibold leading-6 text-gray-900"
                  >
                    Post Jobs <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/jobs"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {user.role === 'candidate' ? 'Browse Jobs' : 'Manage Jobs'}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Streamlined hiring process
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform makes it easy for employers to find qualified candidates and for job seekers to discover their next opportunity.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  Smart Job Matching
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Our intelligent algorithm matches candidates with relevant job opportunities based on skills, experience, and preferences.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  Easy Job Posting
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Employers can quickly post job openings with detailed descriptions and requirements to attract the right candidates.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Application Management
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Track applications, manage candidates, and streamline your hiring process with our comprehensive dashboard.
                </dd>
              </div>

              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  Fast & Efficient
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Reduce time-to-hire with our streamlined process that connects the right people quickly and efficiently.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join thousands of companies and job seekers who trust HireThemNow for their hiring needs.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Get started
                  </Link>
                  <Link to="/jobs" className="text-sm font-semibold leading-6 text-gray-900">
                    Browse jobs <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/jobs"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  View Dashboard
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