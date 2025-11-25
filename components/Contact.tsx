import React from 'react';
import { CONTACT_INFO } from '../constants';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Let's Connect</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 transition-colors">
              I'm currently available for full-time opportunities. If you have a question or just want to say hi, I'll try my best to get back to you!
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-500 transition-colors">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Email</h4>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-500 transition-colors">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Phone</h4>
                  <span className="text-slate-600 dark:text-slate-400 transition-colors">
                    {CONTACT_INFO.phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-500 transition-colors">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Location</h4>
                  <span className="text-slate-600 dark:text-slate-400 transition-colors">
                    {CONTACT_INFO.location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors shadow-lg dark:shadow-none">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors">Message</label>
                <textarea 
                  id="message" 
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  placeholder="Hello, I'd like to discuss..."
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                Send Message
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};