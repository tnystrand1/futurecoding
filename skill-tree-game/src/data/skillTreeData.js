export const SKILL_TREE = {
  // TIER 1: FOUNDATIONS
  cultural_mapping: {
    id: 'cultural_mapping',
    name: 'Cultural Asset Mapping',
    tier: 1,
    position: { x: 100, y: 500 },
    competency: 'STEAM Interest',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['reflection'],
      minWords: 100,
      prompt: "How does your cultural background influence your design choices?"
    },
    featuresUnlocked: ['custom-fonts', 'color-themes'],
    description: "Discover how your unique perspective shapes web design"
  },
  
  client_discovery: {
    id: 'client_discovery',
    name: 'Client Discovery',
    tier: 1,
    position: { x: 300, y: 500 },
    competency: 'Communication',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['reflection'],
      prompt: "Document your client interview process and key insights"
    },
    featuresUnlocked: ['contact-form', 'about-section'],
    description: "Master the art of understanding client needs"
  },
  
  descriptive_prompting: {
    id: 'descriptive_prompting',
    name: 'Descriptive Prompting',
    tier: 1,
    position: { x: 500, y: 500 },
    competency: 'Communication',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['ai-chat', 'code'],
      prompt: "Show how you crafted prompts to generate code"
    },
    featuresUnlocked: ['ai-generated-sections'],
    description: "Learn to communicate effectively with AI tools"
  },
  
  code_implementation: {
    id: 'code_implementation',
    name: 'Code Implementation',
    tier: 1,
    position: { x: 700, y: 500 },
    competency: 'Problem Solving',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['code', 'reflection'],
      prompt: "Implement a feature and explain your approach"
    },
    featuresUnlocked: ['basic-layout'],
    description: "Turn ideas into working code"
  },
  
  image_generation: {
    id: 'image_generation',
    name: 'Image Generation',
    tier: 1,
    position: { x: 900, y: 500 },
    competency: 'Communication',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['ai-chat', 'screenshot'],
      prompt: "Submit your AI image prompt and the generated image"
    },
    featuresUnlocked: ['custom-images', 'visual-content'],
    description: "Learn to communicate ideas through AI-generated images"
  },
  
  image_embedding: {
    id: 'image_embedding',
    name: 'Image Embedding',
    tier: 1,
    position: { x: 1100, y: 500 },
    competency: 'STEAM Interest',
    xpReward: 50,
    prerequisites: [],
    unlockCriteria: {
      evidence: ['code', 'reflection'],
      prompt: "Submit a line of HTML code for an embedded image and describe how the image appears on the page (position, size, border, etc.)"
    },
    featuresUnlocked: ['image-embedding', 'visual-layout'],
    description: "Master the art of embedding and positioning images in web pages"
  },
  
  // TIER 2: APPLICATIONS
  project_scoping: {
    id: 'project_scoping',
    name: 'Project Scoping',
    tier: 2,
    position: { x: 200, y: 350 },
    competency: 'Project Management',
    xpReward: 100,
    prerequisites: ['client_discovery'],
    unlockCriteria: {
      evidence: ['project-brief', 'client-feedback'],
      prompt: "Outline the scope of your project and get client approval"
    },
    featuresUnlocked: ['timeline-creator', 'milestone-tracker'],
    description: "Define what to build and what to save for later"
  },
  
  iterative_refinement: {
    id: 'iterative_refinement',
    name: 'Iterative Refinement',
    tier: 2,
    position: { x: 600, y: 350 },
    competency: 'Quality Assurance',
    xpReward: 100,
    prerequisites: ['code_implementation'],
    unlockCriteria: {
      evidence: ['refactored-code', 'test-results'],
      prompt: "Share your before-and-after code snippets with reflections"
    },
    featuresUnlocked: ['code-review', 'automated-testing'],
    description: "Perfect your work through continuous improvement"
  },
  
  output_evaluation: {
    id: 'output_evaluation',
    name: 'Output Evaluation',
    tier: 2,
    position: { x: 700, y: 300 },
    competency: 'Growth Mindset',
    xpReward: 100,
    prerequisites: ['code_implementation'],
    unlockCriteria: {
      evidence: ['reflection', 'screenshot'],
      prompt: "Evaluate your code output and identify areas for improvement"
    },
    featuresUnlocked: ['code-quality-badge'],
    description: "Learn to critically assess your work"
  },
  
  ai_assisted_debugging: {
    id: 'ai_assisted_debugging',
    name: 'AI-Assisted Debugging',
    tier: 2,
    position: { x: 600, y: 250 },
    competency: 'Problem Solving',
    xpReward: 100,
    prerequisites: ['output_evaluation'],
    unlockCriteria: {
      evidence: ['ai-chat', 'code', 'reflection'],
      prompt: "Document how you used AI to debug a problem"
    },
    featuresUnlocked: ['error-handling'],
    description: "Master debugging with AI assistance"
  },
  
  user_testing: {
    id: 'user_testing',
    name: 'User Testing',
    tier: 2,
    position: { x: 400, y: 250 },
    competency: 'Communication',
    xpReward: 100,
    prerequisites: ['output_evaluation'],
    unlockCriteria: {
      evidence: ['reflection'],
      questions: [
        "What did you learn from your PEERS user testing your website?",
        "What change did you make to your website based on user testing?"
      ]
    },
    featuresUnlocked: ['user-feedback-integration'],
    description: "Get real feedback on your designs"
  },
  
  peer_feedback: {
    id: 'peer_feedback',
    name: 'Peer Feedback',
    tier: 2,
    position: { x: 500, y: 300 },
    competency: 'Growth Mindset',
    xpReward: 100,
    prerequisites: ['iterative_refinement'],
    unlockCriteria: {
      evidence: ['reflection'],
      prompt: "Give and receive constructive peer feedback"
    },
    featuresUnlocked: ['collaboration-badge'],
    description: "Learn from and help your peers"
  },
  
  advanced_css: {
    id: 'advanced_css',
    name: 'Advanced CSS',
    tier: 2,
    position: { x: 800, y: 350 },
    competency: 'Continuous Learning',
    xpReward: 100,
    prerequisites: ['code_implementation'],
    unlockCriteria: {
      evidence: ['reflection', 'screenshot'],
      prompt: "Describe an advanced CSS feature you implemented (animation, hero section, hover effects, etc.), explain why you chose it, and provide a screenshot of the actual feature"
    },
    featuresUnlocked: ['advanced-css-features', 'animations', 'responsive-design'],
    description: "Master advanced CSS techniques for stunning visual effects"
  },
  
  // TIER 3: SPECIALIZATIONS
  ai_tool_evaluation: {
    id: 'ai_tool_evaluation',
    name: 'Unlock: AI Tool Evaluation',
    tier: 3,
    position: { x: 600, y: 150 },
    competency: 'Critical AI Literacy',
    xpReward: 150,
    prerequisites: ['ai_assisted_debugging'],
    unlockCriteria: {
      evidence: ['reflection'],
      questions: [
        "Which AI tools did you compare for your web development project and what were the key differences in their outputs?",
        "Based on your testing, which AI tool was most effective for your needs and why?"
      ]
    },
    featuresUnlocked: ['ai-powered-features'],
    description: "Become an expert at choosing the right AI tools"
  },
  
  accessibility: {
    id: 'accessibility',
    name: 'Accessibility (A11y)',
    tier: 3,
    position: { x: 400, y: 150 },
    competency: 'Sense of Belonging',
    xpReward: 150,
    prerequisites: ['user_testing'],
    unlockCriteria: {
      evidence: ['code', 'reflection'],
      prompt: "Make your website accessible to all users"
    },
    featuresUnlocked: ['accessibility-features', 'aria-labels'],
    description: "Build inclusive websites for everyone"
  },
  
  css_variables: {
    id: 'css_variables',
    name: 'CSS Variables',
    tier: 3,
    position: { x: 500, y: 200 },
    competency: 'Creativity',
    xpReward: 150,
    prerequisites: ['iterative_refinement'],
    unlockCriteria: {
      evidence: ['code', 'screenshot'],
      prompt: "Implement a theme system using CSS variables"
    },
    featuresUnlocked: ['theme-switcher', 'dark-mode'],
    description: "Create dynamic, themeable designs"
  },
  
  form_validation: {
    id: 'form_validation',
    name: 'Form Validation',
    tier: 3,
    position: { x: 700, y: 200 },
    competency: 'Problem Solving',
    xpReward: 150,
    prerequisites: ['iterative_refinement'],
    unlockCriteria: {
      evidence: ['code', 'reflection'],
      prompt: "Implement client-side form validation"
    },
    featuresUnlocked: ['validated-forms', 'error-messages'],
    description: "Ensure data quality with smart forms"
  },
  
  deployment: {
    id: 'deployment',
    name: 'Deployment',
    tier: 3,
    position: { x: 200, y: 200 },
    competency: 'Opportunity Recognition',
    xpReward: 150,
    prerequisites: ['project_scoping'],
    unlockCriteria: {
      evidence: ['screenshot', 'reflection'],
      prompt: "Deploy your website to the internet"
    },
    featuresUnlocked: ['live-website', 'custom-domain'],
    description: "Share your work with the world"
  },

  copy_writing: {
    id: 'copy_writing',
    name: 'Copy Writing',
    tier: 3,
    position: { x: 300, y: 150 },
    competency: 'Communication',
    xpReward: 150,
    prerequisites: ['user_testing'],
    unlockCriteria: {
      evidence: ['client-feedback', 'reflection'],
      minWords: 150,
      prompt: "Submit polished copy you wrote for a client project (website headlines, descriptions, call-to-action buttons, etc.) along with client feedback or approval. Reflect on how you tailored the messaging to the target audience."
    },
    featuresUnlocked: ['copy-optimization', 'content-management', 'seo-headlines'],
    description: "Master the art of persuasive writing for web projects"
  }
};

export const DEVELOPER_PROFILES = {
  community: {
    id: 'community',
    name: 'The Community-Centered Designer',
    requiredSkills: ['client_discovery', 'user_testing', 'accessibility', 'copy_writing'],
    bonusCompetency: 'Sense of Belonging',
    perks: {
      xpMultiplier: 1.2,
      specialFeatures: ['community-feedback-widget', 'multilingual-support', 'persuasive-messaging']
    },
    description: "You build with empathy and inclusion at the forefront"
  },
  creative: {
    id: 'creative',
    name: 'The Creative Technologist',
    requiredSkills: ['cultural_mapping', 'css_variables', 'descriptive_prompting', 'copy_writing'],
    bonusCompetency: 'STEAM Interest',
    perks: {
      xpMultiplier: 1.2,
      specialFeatures: ['advanced-animations', 'generative-backgrounds', 'content-storytelling']
    },
    description: "You blend art and code to create unique experiences"
  },
  resilient: {
    id: 'resilient',
    name: 'The Resilient Problem-Solver',
    requiredSkills: ['ai_assisted_debugging', 'iterative_refinement', 'deployment'],
    bonusCompetency: 'Problem Solving',
    perks: {
      xpMultiplier: 1.2,
      specialFeatures: ['error-handling', 'performance-monitoring']
    },
    description: "You thrive on challenges and never give up"
  }
};
