import React from 'react';
import { PROJECTS } from '../constants';
import { ExternalLink, Github, Layers, ArrowUpRight } from 'lucide-react';

export const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-24 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 reveal">
            <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Featured Projects</h2>
                <p className="text-slate-600 dark:text-slate-400 transition-colors">
                    A selection of projects that demonstrate my ability to solve complex problems with data and code.
                </p>
            </div>
            <a href={PROJECTS[0].links?.github} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-slate-900 dark:hover:text-white transition-colors pb-1 border-b border-transparent hover:border-primary-600 dark:hover:border-primary-400">
                View all on GitHub <ArrowUpRight size={16} />
            </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {PROJECTS.map((project) => (
            <div 
              key={project.id} 
              className="reveal group relative bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 flex flex-col h-full shadow-sm dark:shadow-none"
            >
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="p-8 flex-1 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl text-primary-600 dark:text-primary-400 ring-1 ring-slate-200 dark:ring-slate-700 transition-colors">
                    <Layers size={24} />
                  </div>
                  <div className="flex gap-3">
                    {project.links?.github && (
                      <a 
                        href={project.links.github} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="View Code"
                      >
                        <Github size={20} />
                      </a>
                    )}
                    {project.links?.huggingFace && (
                      <a 
                        href={project.links.huggingFace} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="View Model"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1 transition-colors">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100 dark:border-slate-700/50 mt-auto transition-colors">
                  {project.techStack.map((tech) => (
                    <span 
                      key={tech} 
                      className="text-xs font-semibold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-100 dark:border-primary-500/10 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800/50 flex justify-between items-center text-xs text-slate-500 font-medium transition-colors">
                <span>Completed: {project.date}</span>
                <span className="flex items-center gap-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Details <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
            <a href={PROJECTS[0].links?.github} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                View all on GitHub <ArrowUpRight size={16} />
            </a>
        </div>
      </div>
    </section>
  );
};