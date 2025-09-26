import React from 'react';
import { Search, Users, Briefcase, BarChart3, Shield, Zap } from 'lucide-react';

const services = [
  {
    name: 'Job Matching',
    description: 'Smart AI-powered matching system that connects the right talent with the right opportunities.',
    icon: Search,
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
  },
  {
    name: 'Talent Pool',
    description: 'Access to a diverse pool of pre-screened professionals across various industries.',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    name: 'Easy Posting',
    description: 'Simple and intuitive job posting process with customizable requirements and descriptions.',
    icon: Briefcase,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    name: 'Analytics',
    description: 'Comprehensive insights and analytics to optimize your hiring process and outcomes.',
    icon: BarChart3,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    name: 'Secure Platform',
    description: 'Enterprise-grade security ensuring your data and communications are always protected.',
    icon: Shield,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    name: 'Fast Hiring',
    description: 'Streamlined process that reduces time-to-hire and gets you results faster.',
    icon: Zap,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
];

const ServicesSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-lime-600 tracking-wide uppercase mb-4">
            Our Services
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-6">
            Everything you need to hire or get hired
          </h3>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            From AI-powered matching to comprehensive analytics, we provide all the tools
            you need for successful recruitment and job searching.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.name}
                className="group relative bg-white border border-neutral-200 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lime-400 to-lime-600 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${service.iconBg} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-6 w-6 ${service.iconColor}`} />
                </div>

                {/* Content */}
                <h4 className="text-xl font-semibold text-neutral-900 mb-4">
                  {service.name}
                </h4>
                <p className="text-neutral-600 leading-relaxed">
                  {service.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;