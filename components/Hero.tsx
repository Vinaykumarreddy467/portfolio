import React, { useState, useEffect } from 'react';
import { Download, Github, Linkedin, Mail, ChevronDown, ArrowRight } from 'lucide-react';
import { PERSONAL_DETAILS, CONTACT_INFO } from '../constants';

export const Hero: React.FC = () => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const roles = [
    "Full Stack Java Enthusiast",
    "Frontend Developer",
    "Data Science Engineer"
  ];

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % roles.length;
      const fullText = roles[i];

      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 30 : 100);

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, roles]);

  return (
    <section id="about" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden transition-colors duration-300">
      {/* Background is now handled in App.tsx */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-white/50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-medium backdrop-blur-sm shadow-sm dark:shadow-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Available for opportunities
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
            Hi, I'm <span className="text-gradient">{PERSONAL_DETAILS.name.split(' ')[0]}</span>
          </h1>
          
          <div className="h-12 md:h-16 flex items-center justify-center">
            <p className="text-2xl md:text-4xl text-slate-600 dark:text-slate-300 font-light transition-colors">
              I am a <span className="text-primary-600 dark:text-primary-400 font-semibold border-r-2 border-primary-600 dark:border-primary-400 pr-1 animate-pulse">{text}</span>
            </p>
          </div>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
            {PERSONAL_DETAILS.summary}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a 
              href="#projects" 
              className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              View My Work
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
               href="#contact"
               className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-all flex items-center justify-center gap-2 backdrop-blur-sm shadow-sm dark:shadow-none"
            >
              <Download size={18} />
              Download Resume
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8">
            <a href={`mailto:${CONTACT_INFO.email}`} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors transform hover:scale-110 duration-200">
              <Mail size={24} />
            </a>
            <a href={CONTACT_INFO.github} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors transform hover:scale-110 duration-200">
              <Github size={24} />
            </a>
            <a href={CONTACT_INFO.linkedin} className="text-slate-500 dark:text-slate-400 hover:text-[#0077b5] transition-colors transform hover:scale-110 duration-200">
              <Linkedin size={24} />
            </a>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-slate-400 dark:text-slate-500">
        <ChevronDown size={32} />
      </div>
    </section>
  );
};