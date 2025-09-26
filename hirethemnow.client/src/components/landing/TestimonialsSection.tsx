import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    content: "HireThemNow transformed our hiring process. We found amazing talent faster than ever before.",
    author: "Sarah Johnson",
    role: "HR Director",
    company: "TechCorp Inc.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5c6?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
  {
    content: "The platform's AI matching is incredible. I got interviews with companies that were perfect fits for my skills.",
    author: "Michael Chen",
    role: "Software Engineer",
    company: "Recently hired",
    avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
  {
    content: "Finally, a job platform that understands what both employers and candidates actually need.",
    author: "Emily Rodriguez",
    role: "Talent Acquisition",
    company: "StartupXYZ",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-lime-600 tracking-wide uppercase mb-4">
            Testimonials
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-6">
            Loved by teams worldwide
          </h3>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what real users say about their experience
            with HireThemNow.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-8 w-8 text-neutral-900" />
              </div>

              {/* Stars */}
              <div className="flex items-center mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-neutral-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center">
                <img
                  className="h-12 w-12 rounded-full object-cover"
                  src={testimonial.avatar}
                  alt={testimonial.author}
                />
                <div className="ml-4">
                  <div className="font-semibold text-neutral-900">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-600 mb-8">
            Join thousands of satisfied users who found success with HireThemNow
          </p>
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {testimonials.map((testimonial, index) => (
                  <img
                    key={index}
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                    src={testimonial.avatar}
                    alt=""
                  />
                ))}
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-neutral-900">
                  10,000+ happy users
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-neutral-600">4.9/5 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;