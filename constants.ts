import { ContactInfo, SkillCategory, ExperienceItem, ProjectItem, EducationItem, CertificationItem } from './types';
import { Mail, Github, Linkedin, Phone, MapPin } from 'lucide-react';

export const PERSONAL_DETAILS = {
  name: "Vinay Kumar Reddy Molakathala",
  title: "Full Stack Java Enthusiast & Frontend Developer",
  summary: "A passionate Full Stack Java Enthusiast and Frontend Developer currently working at Neosoft Technologies. With a robust background in Data Science Engineering, I blend backend robustness with modern frontend interactivity to build scalable, high-performance web applications."
};

export const CONTACT_INFO: ContactInfo = {
  email: "vinaykumarreddy467@gmail.com",
  phone: "+91 9493699458",
  linkedin: "#", // Placeholder as URL wasn't in OCR
  github: "#",   // Placeholder as URL wasn't in OCR
  location: "India"
};

export const SKILLS: SkillCategory[] = [
  {
    category: "Languages",
    items: ["Java", "HTML5", "CSS3", "JavaScript", "Python", "SQL"]
  },
  {
    category: "Web & Frontend",
    items: ["React", "Angular 18", "Bootstrap", "Tailwind CSS", "Adobe AEM"]
  },
  {
    category: "Backend & API",
    items: ["Spring Boot", "Hibernate", "Rest API", "Flask", "Postman"]
  },
  {
    category: "Data Science & AI",
    items: ["Machine Learning", "NLP", "Pandas", "NumPy", "Matplotlib", "Scikit-learn", "Computer Vision"]
  },
  {
    category: "Database & Tools",
    items: ["MySQL", "MySQL Workbench", "DBeaver", "Git", "VS Code", "IntelliJ IDEA", "Jupyter Notebook"]
  }
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: "exp-1",
    role: "Front-End Developer",
    company: "Neosoft Technologies",
    location: "Infosys Client Location",
    period: "July 2025 – Present",
    type: "Work",
    description: [
      "Updating and maintaining Infosys.com web pages to ensure content accuracy, branding consistency, and responsiveness.",
      "Using Adobe AEM (Adobe Experience Manager) for content updates, component development, and page publishing.",
      "Leveraging Bootstrap, HTML5, CSS3 to enhance the design and responsiveness of web pages.",
      "Collaborating in an Agile/Scrum environment, participating in sprint tasks and client discussions."
    ]
  },
  {
    id: "intern-1",
    role: "Java Full Stack Professional Training",
    company: "Academy By Cap-Gemini",
    location: "Bangalore (Offline)",
    period: "March - June 2025",
    type: "Training",
    description: [
      "Completed a Java Full-Stack Professional Training Digital Academy by Cap-Gemini in association with Edu-Bridge.",
      "Gained hands-on experience and valuable skills and knowledge in Java-based applications during the three-month program."
    ]
  },
  {
    id: "intern-2",
    role: "Data Analysis using Python Intern",
    company: "APSSDC",
    location: "Remote",
    period: "Sep 2024",
    type: "Internship",
    description: [
      "Managed real-life data using Jupyter Notebook, Anaconda, Google Colab.",
      "Used Python libraries like Numpy, Pandas, Matplotlib to identify patterns and relationships among variables.",
      "Performed data preprocessing and correlation analysis, providing insights to support further meteorological studies."
    ]
  },
  {
    id: "intern-3",
    role: "Python Full-Stack Intern",
    company: "Techno-hub Foundation",
    location: "Bangalore (Offline)",
    period: "Aug 2023",
    type: "Internship",
    description: [
      "Managed real-life data using VSCode, MySQL workbench.",
      "Used Python, specifically Flask and SQLAlchemy (Basics), to create the back-end admin page to manage the product in a coffee shop."
    ]
  }
];

export const PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "Zym Management System",
    date: "June 2025",
    techStack: ["Angular", "TypeScript", "Bootstrap", "Spring Boot", "MySQL"],
    description: "Developed a responsive fitness application implementing user authentication, profile management, and dynamic UI components. Integrated with a Spring Boot backend via RESTful APIs for real-time data operations. Added mailing service and application monitoring using Spring Boot Actuators.",
    links: { github: "#" }
  },
  {
    id: "proj-2",
    title: "Disease Prediction & Health Advisory (Sympai)",
    date: "Feb 2025",
    techStack: ["Machine Learning", "Flask", "Python", "Decision Tree"],
    description: "Created a web application for disease prediction using machine learning and Flask. Achieved 85% accuracy with Decision Tree among six classification models. Integrated Overpass API to locate nearby hospitals and implemented medication suggestions.",
    links: { github: "#", huggingFace: "#" }
  },
  {
    id: "proj-3",
    title: "Music Recommendation System",
    date: "Mar 2024",
    techStack: ["Python", "NLP", "Scikit-learn", "NLTK"],
    description: "Built a music recommendation system leveraging NLP and machine learning to suggest songs based on user input. Offers a user-friendly interface, NLP-powered query analysis, and a knowledge graph-based recommendation engine.",
    links: { github: "#" }
  },
  {
    id: "proj-4",
    title: "Weather Analysis",
    date: "Mar 2024",
    techStack: ["Python", "Pandas", "NumPy", "Matplotlib"],
    description: "Analyzed real-time weather data performing data cleaning, correlation analysis, and visualization to identify patterns and trends. Helps in understanding climatic variables to support meteorological insights.",
    links: { github: "#" }
  }
];

export const EDUCATION: EducationItem = {
  degree: "B.Tech – Data Science Engineering",
  institution: "Sri Venkateswara College of Engineering and Technology",
  period: "May 2025",
  gpa: "7.69"
};

export const CERTIFICATIONS: CertificationItem[] = [
  { id: "cert-1", title: "Java Full Stack Certificate", issuer: "Digital Academy By CapGemini", date: "June 2025" },
  { id: "cert-2", title: "Computer Vision 101", issuer: "Infosys Springboard", date: "N/A" },
  { id: "cert-3", title: "Core Java Certificate", issuer: "Asar IT PVT LTD, Bangalore", date: "Sep 2023" },
  { id: "cert-4", title: "Project Management Fundamentals", issuer: "IBM Skills-Build", date: "N/A" }
];