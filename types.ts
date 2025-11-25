export interface ContactInfo {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  location: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  type: 'Work' | 'Internship' | 'Training';
  description: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  date: string;
  techStack: string[];
  description: string;
  links?: {
    github?: string;
    demo?: string;
    huggingFace?: string;
  };
}

export interface EducationItem {
  degree: string;
  institution: string;
  period: string;
  gpa: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
}