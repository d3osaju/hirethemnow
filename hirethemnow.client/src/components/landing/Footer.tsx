import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl font-bold text-white">HireThemNow</h3>
            </div>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              Connecting talent with opportunity. The future of hiring starts here.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/jobs" className="hover:text-lime-400 transition-colors duration-200">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/register?role=candidate" className="hover:text-lime-400 transition-colors duration-200">
                  For Job Seekers
                </Link>
              </li>
              <li>
                <Link to="/register?role=employer" className="hover:text-lime-400 transition-colors duration-200">
                  For Employers
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-lime-400 transition-colors duration-200">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="hover:text-lime-400 transition-colors duration-200">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-lime-400 transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-lime-400 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-lime-400 transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-neutral-400" />
                <a href="mailto:support@hirethemnow.xyz" className="hover:text-lime-400 transition-colors duration-200">
                  support@hirethemnow.xyz
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;