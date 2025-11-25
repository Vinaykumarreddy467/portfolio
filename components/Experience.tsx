import React from 'react';
import { EXPERIENCE, EDUCATION, CERTIFICATIONS } from '../constants';
import { Briefcase, GraduationCap, Calendar, Award, MapPin } from 'lucide-react';

export const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-24 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Work Experience */}
        <div className="mb-24">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">Professional Journey</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary-500 to-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-12 space-y-16 transition-colors duration-300">
            {EXPERIENCE.map((item) => (
              <div key={item.id} className="reveal relative pl-8 md:pl-16 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-primary-500 group-hover:scale-125 group-hover:bg-primary-500 transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.role}</h3>
                    <div className="text-lg text-primary-600 dark:text-primary-500 font-medium mb-1 transition-colors">{item.company}</div>
                    <div className="flex items-center text-slate-500 dark:text-slate-500 text-sm gap-4 transition-colors">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {item.location}
                      </span>
                      {item.type !== 'Work' && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm font-semibold bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors">
                    <Calendar size={14} className="mr-2 text-primary-500" />
                    {item.period}
                  </div>
                </div>
                
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
                    <ul className="space-y-3">
                    {item.description.map((desc, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500/50"></span>
                        {desc}
                        </li>
                    ))}
                    </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Certs - Stacked Layout */}
        <div className="flex flex-col gap-12">
          {/* Education */}
          <div className="reveal">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary-100 dark:bg-primary-500/10 rounded-xl text-primary-600 dark:text-primary-500 transition-colors">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Education</h3>
            </div>
            
            <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-500/30 transition-all group shadow-sm dark:shadow-none">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{EDUCATION.degree}</h4>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-4 transition-colors">{EDUCATION.institution}</p>
              <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800/50 transition-colors">
                <span className="text-slate-500 font-medium transition-colors">{EDUCATION.period}</span>
                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-500/20 transition-colors">
                  CGPA: {EDUCATION.gpa}
                </span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="reveal">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-500 transition-colors">
                <Award size={32} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Certifications</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {CERTIFICATIONS.map((cert) => (
                <div key={cert.id} className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between group shadow-sm dark:shadow-none">
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium block mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cert.title}</span>
                    <span className="text-sm text-slate-500">{cert.issuer}</span>
                  </div>
                  {cert.date !== 'N/A' && (
                     <span className="text-xs text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 transition-colors">{cert.date}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};