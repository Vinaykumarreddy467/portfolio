import React from 'react';
import { SKILLS } from '../constants';
import { Code2, Database, Layout, Server, Brain } from 'lucide-react';

const getIcon = (category: string) => {
  if (category.includes('Languages')) return <Code2 className="text-blue-500 dark:text-blue-400" size={24} />;
  if (category.includes('Frontend')) return <Layout className="text-pink-500 dark:text-pink-400" size={24} />;
  if (category.includes('Backend')) return <Server className="text-green-500 dark:text-green-400" size={24} />;
  if (category.includes('Data')) return <Brain className="text-purple-500 dark:text-purple-400" size={24} />;
  return <Database className="text-orange-500 dark:text-orange-400" size={24} />;
};

export const Skills: React.FC = () => {
  return (
    <section id="skills" className="py-24 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 reveal">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Technical Arsenal</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
            My expertise spans across the entire full-stack spectrum, with a specialized focus on Data Science and Modern Frontend Architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS.map((category, index) => (
            <div 
              key={index} 
              className="reveal bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-primary-500/30 transition-colors">
                  {getIcon(category.category)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.category}
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill) => (
                  <span 
                    key={skill} 
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 hover:text-primary-700 dark:hover:text-white hover:border-primary-500/30 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};