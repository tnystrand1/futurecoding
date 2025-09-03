// Three Competency Analytics Service - STEAM Interest, Sense of Belonging, Communication
// Dual LLM Analysis with Text File Outputs
import { db } from '../utils/firebase-config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';

class ThreeCompetencyAnalyticsService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.claudeModel = 'openai/gpt-4.1-mini';
    this.geminiModel = 'google/gemini-2.5-flash';
    this.llamaModel = 'meta-llama/llama-4-scout:free';
    this.initializeCompetencies();
  }

  initializeCompetencies() {
    this.competencyDefinitions = {
      'steam_interest': {
        name: 'STEAM Interest',
        definition: 'Exploration of one\'s identity and self-expression through Science, Technology, Engineering, Arts, and Mathematics both within and outside of the structured class environment.',
        dimensions: [
          {
            name: 'Actively seeks opportunities to learn about STEAM subjects',
            indicators: [
              'Shows interest in visiting and engaging with STEAM zones',
              'Asks questions about how different technologies work'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for one or none of the following: Shows interest in visiting and engaging with STEAM zones; Asks questions about how different technologies work',
              developing: 'Student demonstrates both of the following, but not consistently: Shows interest in visiting and engaging with STEAM zones; Asks questions about how different technologies work',
              proficient: 'Student demonstrates both of the following consistently and/or across different contexts: Shows interest in visiting and engaging with STEAM zones; Asks questions about how different technologies work'
            }
          },
          {
            name: 'Engages in STEAM activities as a means of exploring personal interests, values, and identity',
            indicators: [
              'Uses art and design to connect with interests, express personal stories or perspectives',
              'Explores personal interests and/or connects to one\'s cultural heritage through technology or engineering projects',
              'Chooses STEAM projects that reflect individual interests and passions'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for one or none of the following: Uses art and design to connect with interests; Explores personal interests through technology; Chooses projects that reflect individual interests',
              developing: 'Student demonstrates some of the following, but not consistently: Uses art and design to connect with interests; Explores personal interests through technology; Chooses projects that reflect individual interests',
              proficient: 'Student demonstrates all of the following consistently and/or across different contexts: Uses art and design to connect with interests; Explores personal interests through technology; Chooses projects that reflect individual interests'
            }
          },
          {
            name: 'Willing to experiment and tinker with various STEAM tools and materials',
            indicators: [
              'Experiments with sewing techniques and fabrics',
              'Creates designs and prototypes using Adobe Illustrator',
              'Builds circuits and explores electronics with Little Bits',
              'Designs and prints objects using 3D printers'
            ],
            rubric: {
              emerging: 'Student shows limited willingness to experiment with STEAM tools',
              developing: 'Student occasionally experiments with STEAM tools but needs encouragement',
              proficient: 'Student actively experiments and tinkers with various STEAM tools and materials'
            }
          },
          {
            name: 'Curious and motivated to learn and use STEAM tools outside of the structured class environment',
            indicators: [
              'Signs up for STEAM elective opportunities (e.g., Open Studio, Deep Dives, community workshops, site visits)',
              'Signs up for STEAM-oriented Pathways bootcamps and campus/site visits',
              'Inquires about STEAM-oriented internship opportunities'
            ],
            rubric: {
              emerging: 'Student shows limited interest in STEAM opportunities outside class',
              developing: 'Student occasionally participates in STEAM opportunities outside class',
              proficient: 'Student actively seeks and participates in STEAM opportunities outside class'
            }
          }
        ]
      },
      'sense_of_belonging': {
        name: 'Sense of Belonging',
        definition: 'Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it.',
        dimensions: [
          {
            name: 'Feel interpersonal connection with others in a learning community or professional setting',
            indicators: [
              'Regularly participate in conversations with others in the community',
              'Offer help and support to others in the community',
              'Regularly spend time with others in the community outside of learning/professional activities'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for none or some, but not all, of the following: Regularly participate in conversations with others in the community; Offer help and support to others in the community; Regularly spend time with others in the community outside of learning/professional activities',
              developing: 'Student demonstrates ALL of the following, but NOT consistently: Regularly participate in conversations with others in the community; Offer help and support to others in the community; Regularly spend time with others in the community outside of learning/professional activities',
              proficient: 'Student demonstrates ALL of the following consistently: Regularly participate in conversations with others in the community; Offer help and support to others in the community; Regularly spend time with others in the community outside of learning/professional activities'
            }
          },
          {
            name: 'Recognize positive messages and representations at TPZ and elsewhere that reflect their own potential and capacity for success',
            indicators: [
              'Identify with successful learners or professionals at TPZ (e.g., alumni, entrepreneurs, college graduates) and elsewhere',
              'Recognize positive messages (e.g., verbal, written, visual) about their progress and future success'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for one or both of the following: Identify with successful learners or professionals at TPZ and elsewhere; Recognize positive messages about their progress and future success',
              developing: 'Student demonstrates both of the following, but not consistently: Identify with successful learners or professionals at TPZ and elsewhere; Recognize positive messages about their progress and future success',
              proficient: 'Student demonstrates both of the following consistently: Identify with successful learners or professionals at TPZ and elsewhere; Recognize positive messages about their progress and future success'
            }
          },
          {
            name: 'Feel that they have a rightful place in the TPZ community as a contributor and learner',
            indicators: [
              'Actively participate in conversations and learning/professional activities',
              'Show comfort in sharing their perspectives with others',
              'Contribute to the community beyond learning/professional requirements'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for none or some, but not all, of the following: Actively participate in conversations and learning/professional activities; Show comfort in sharing their perspectives with others; Contribute to the community beyond learning/professional requirements',
              developing: 'Student demonstrates ALL of the following, but NOT consistently: Actively participate in conversations and learning/professional activities; Show comfort in sharing their perspectives with others; Contribute to the community beyond learning/professional requirements',
              proficient: 'Student demonstrates ALL of the following consistently: Actively participate in conversations and learning/professional activities; Show comfort in sharing their perspectives with others; Contribute to the community beyond learning/professional requirements'
            }
          }
        ]
      },
      'communication': {
        name: 'Communication',
        definition: 'Ability to clearly exchange information and common understanding with others in a variety of settings and for a variety of purposes (e.g., inform, instruct, motivate, and persuade).',
        dimensions: [
          {
            name: 'Demonstrates attentiveness and understanding to others with whom they are interacting',
            indicators: [
              'Effectively use non-verbal cues (e.g., eye contact and facial expression) to indicate attentiveness to others',
              'Demonstrate understanding to others by using repeat-backs or paraphrasing',
              'Demonstrate understanding to others by asking relevant clarifying or follow-up questions and/or appropriately responding with action'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for none or some, but not all, of the following: Effectively use non-verbal cues to indicate attentiveness; Demonstrate understanding by using repeat-backs or paraphrasing; Demonstrate understanding by asking relevant clarifying questions and/or responding with action',
              developing: 'Student demonstrates ALL of the following, but NOT consistently: Effectively use non-verbal cues to indicate attentiveness; Demonstrate understanding by using repeat-backs or paraphrasing; Demonstrate understanding by asking relevant clarifying questions and/or responding with action',
              proficient: 'Student demonstrates ALL of the following consistently: Effectively use non-verbal cues to indicate attentiveness; Demonstrate understanding by using repeat-backs or paraphrasing; Demonstrate understanding by asking relevant clarifying questions and/or responding with action'
            }
          },
          {
            name: 'Clearly share ideas and information, choose appropriate methods for circumstances, and effectively adapt style and message to audience',
            indicators: [
              'Able to clearly convey ideas and information',
              'Use appropriate methods (e.g., written, oral, visual) for circumstances and purpose',
              'Use appropriate communication style and tone for context and audience'
            ],
            rubric: {
              emerging: 'Student demonstrates ability for none or some, but not all, of the following: Able to clearly convey ideas and information; Use appropriate methods for circumstances and purpose; Use appropriate communication style and tone for context and audience',
              developing: 'Student demonstrates ALL of the following, but NOT consistently and/or across purposes (e.g., inform, instruct, motivate, and persuade): Able to clearly convey ideas and information; Use appropriate methods for circumstances and purpose; Use appropriate communication style and tone for context and audience',
              proficient: 'Student demonstrates ALL of the following consistently AND across purposes (e.g., inform, instruct, motivate, and persuade): Able to clearly convey ideas and information; Use appropriate methods for circumstances and purpose; Use appropriate communication style and tone for context and audience'
            }
          }
        ]
      }
    };
  }

  // Helper function to map student ID to team ID (copied from existing service)
  getStudentTeamId(studentId) {
    const studentTeamMap = {
      // Jeremy Client Teams
      'Charles': 'jeremy_client_team_1',
      'Julius': 'jeremy_client_team_1', 
      'Robert': 'jeremy_client_team_1',
      'Matthew': 'jeremy_client_team_2',
      'Ocasio': 'jeremy_client_team_2',
      'Taii': 'jeremy_client_team_2',
      
      // Fiona Client Teams  
      'Aaron': 'fiona_client_team_1',
      'Luis': 'fiona_client_team_1',
      'Sapphire': 'fiona_client_team_1',
      'Anthony': 'fiona_client_team_2',
      'Jephte': 'fiona_client_team_2',
      'Keyler': 'fiona_client_team_2',
      
      // Jonathan Client Teams
      'Miguel T': 'jonathan_client_team_1',
      'Mikayla': 'jonathan_client_team_1',
      'Seyvon': 'jonathan_client_team_1',
      'Yousha': 'jonathan_client_team_1',
      'Aiden': 'jonathan_client_team_2',
      'Fradauryn': 'jonathan_client_team_2',
      'Romain': 'jonathan_client_team_2'
    };
    
    const studentName = studentId.replace(/_/g, ' ');
    return studentTeamMap[studentName] || 'unassigned_team';
  }

  // Get questions for a specific day (needed to identify Day 8 self-ratings)
  getQuestionsForDay(dayNumber) {
    if (dayNumber === 2) {
      return [
        { key: 'learned', label: 'What have you learned so far in this class?' },
        { key: 'wantToLearn', label: 'What would you like to learn or make next in this class?' },
        { key: 'feeling', label: 'How have you been feeling in this class?' }
      ];
    } else if (dayNumber === 3) {
      return [
        { key: 'favoriteMoment', label: 'What was your favorite moment of class today? Why?' },
        { key: 'leastFavorite', label: 'Were there any least favorite moments of class?' },
        { key: 'partnerExperience', label: 'How was your experience coding with a partner today?' }
      ];
    } else if (dayNumber === 4) {
      return [
        { key: 'careerTakeaway', label: 'What is your biggest takeaway from our career panel today?' },
        { key: 'careerInterests', label: 'What kind of careers are you most interested in? Why?' },
        { key: 'clientTeamFeeling', label: 'How are you feeling about your client project team?' }
      ];
    } else if (dayNumber === 5) {
      return [
        { key: 'sprintBoardPhoto', label: 'Photo of sprint board', type: 'image' },
        { key: 'clientWebsiteScreenshot', label: 'Screenshot of client website RIGHT NOW', type: 'image' },
        { key: 'roleAndSuccess', label: 'What was your role today and how successful were you at it?' }
      ];
    } else if (dayNumber === 6) {
      return [
        { key: 'clientFeedback', label: 'What feedback did you receive from your client today? Was it helpful? What are your next steps?' },
        { key: 'clientWebsiteProgress', label: 'Upload a screenshot of your client website right now', type: 'image', optional: true },
        { key: 'aiToolsUsage', label: 'Have you been using other AI tools other than the built in chat bot? If so, tell us why and how.' }
      ];
    } else if (dayNumber === 7) {
      return [
        { key: 'clientProcess', label: 'Reflect on the process of building a website for a client? Was it challenging to understand their needs? Are you proud of your work?' },
        { key: 'teamwork', label: 'Tell us about your teamwork with your client team. Did you use your scrum roles? Did everyone contribute?' }
      ];
    } else if (dayNumber === 8) {
      return [
        { 
          key: 'steamInterestRatingExplanation', 
          label: 'STEAM Interest: Exploration of one\'s identity through STEAM, both in and out of class. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'steam_interest',
          definition: 'Exploration of one\'s identity through STEAM, both in and out of class'
        },
        { 
          key: 'belongingRatingExplanation', 
          label: 'Sense of Belonging: Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'sense_of_belonging',
          definition: 'Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it'
        },
        { 
          key: 'communicationRatingExplanation', 
          label: 'Communication: Ability to clearly exchange information with others in various settings and for various purposes. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'communication',
          definition: 'Ability to clearly exchange information with others in various settings and for various purposes'
        }
      ];
    } else {
      return [
        { key: 'learned', label: 'What did you learn in class today?' },
        { key: 'challenges', label: 'What challenges did you face today?' },
        { key: 'feeling', label: 'How are you feeling about your progress?' }
      ];
    }
  }

  // Collect all evidence for a student (excluding Day 8 self-ratings)
  async getStudentEvidence(studentId) {
    try {
      const evidence = {
        artifacts: [],
        reflections: [],
        chatInteractions: [],
        skillsUnlocked: [],
        galleryProjects: [],
        galleryInteractions: [],
        achievements: [],
        progressMetrics: {}
      };

      // Get student's approved skills and evidence
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const skills = studentData.skills || {};
        
        evidence.progressMetrics = {
          totalXP: studentData.totalXP || 0,
          currentLevel: studentData.currentLevel || 1,
          websitePower: studentData.websitePower || 0,
          developerProfile: studentData.developerProfile || null,
          joinedAt: studentData.joinedAt
        };
        
        // Extract achievements
        if (studentData.achievements && Array.isArray(studentData.achievements)) {
          evidence.achievements = studentData.achievements.map(achievement => ({
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            earnedAt: achievement.earnedAt,
            xpReward: achievement.xpReward
          }));
        }
        
        Object.entries(skills).forEach(([skillId, skillData]) => {
          if (skillData.unlocked && skillData.evidence?.status === 'approved') {
            evidence.skillsUnlocked.push({
              skillId,
              evidence: skillData.evidence,
              unlockedAt: skillData.unlockedAt || skillData.evidence.submittedAt,
              xpEarned: skillData.xpEarned || 0
            });
            
            // Extract artifacts and reflections
            if (skillData.evidence.reflection) {
              evidence.reflections.push({
                skillId,
                content: skillData.evidence.reflection,
                timestamp: skillData.evidence.submittedAt
              });
            }
            
            // Handle multiple questions format
            if (skillData.evidence.questionAnswers && Array.isArray(skillData.evidence.questionAnswers)) {
              const combinedContent = skillData.evidence.questionAnswers
                .map((answer, index) => `Question ${index + 1}: ${answer}`)
                .join('\n\n');
              
              evidence.reflections.push({
                skillId,
                content: combinedContent,
                timestamp: skillData.evidence.submittedAt,
                type: 'multi_question'
              });
            }

            // Extract different types of evidence
            const evidenceData = skillData.evidence;
            ['code', 'projectBrief', 'clientFeedback', 'refactoredCode', 'testResults'].forEach(type => {
              if (evidenceData[type]) {
                evidence.artifacts.push({
                  skillId,
                  type,
                  content: evidenceData[type],
                  timestamp: evidenceData.submittedAt
                });
              }
            });
          }
        });
      }

      // Get AI chat interactions
      let conversationsSnapshot;
      try {
        const conversationsQuery = query(
          collection(db, 'ai_conversations'),
          where('studentId', '==', studentId),
          orderBy('createdAt', 'desc')
        );
        conversationsSnapshot = await getDocs(conversationsQuery);
      } catch (error) {
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.warn('Firestore index still building, using fallback query without ordering');
          const fallbackQuery = query(
            collection(db, 'ai_conversations'),
            where('studentId', '==', studentId)
          );
          conversationsSnapshot = await getDocs(fallbackQuery);
        } else {
          throw error;
        }
      }
      
      const sortedConversations = conversationsSnapshot.docs.sort((a, b) => {
        const aCreated = a.data().createdAt;
        const bCreated = b.data().createdAt;
        if (!aCreated && !bCreated) return 0;
        if (!aCreated) return 1;
        if (!bCreated) return -1;
        return bCreated.toMillis() - aCreated.toMillis();
      });

      for (const conversationDoc of sortedConversations) {
        const conversationData = conversationDoc.data();
        
        const messagesQuery = query(
          collection(db, 'ai_conversations', conversationDoc.id, 'messages'),
          orderBy('timestamp', 'asc')
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (messages.length > 0) {
          evidence.chatInteractions.push({
            conversationId: conversationDoc.id,
            persona: conversationData.persona,
            messages: messages,
            createdAt: conversationData.createdAt
          });
        }
      }

      // Get daily reflections (EXCLUDING Day 8 self-ratings)
      try {
        const reflectionDoc = await getDoc(doc(db, 'reflections', studentId));
        if (reflectionDoc.exists()) {
          const reflectionData = reflectionDoc.data();
          const dailyReflections = reflectionData.dailyReflections || {};
          
          console.log(`📅 Processing daily reflections for ${studentId} (excluding Day 8 self-ratings):`, {
            totalReflectionDays: Object.keys(dailyReflections).length,
            dayNumbers: Object.values(dailyReflections).map(r => r.dayNumber).sort((a, b) => a - b)
          });
          
          Object.values(dailyReflections).forEach(reflection => {
            const questions = this.getQuestionsForDay(reflection.dayNumber);
            
            // For Day 8, EXCLUDE self-rating questions but include any other content
            if (reflection.dayNumber === 8) {
              console.log(`🚫 Excluding Day 8 self-rating reflection for ${studentId} as requested`);
              return; // Skip all Day 8 reflections to be safe
            }
            
            const hasRequiredAnswers = questions.every(q => {
              if (q.optional) return true;
              const value = reflection[q.key];
              if (!value) return false;
              if (typeof value === 'string') {
                return value.trim().length > 0;
              }
              return true;
            });
            
            if (hasRequiredAnswers) {
              const reflectionData = {
                type: 'daily_reflection',
                dayNumber: reflection.dayNumber,
                timestamp: reflection.submittedAt,
                responses: {}
              };
              
              questions.forEach(q => {
                reflectionData.responses[q.key] = {
                  question: q.label,
                  answer: reflection[q.key]
                };
              });
              
              evidence.reflections.push(reflectionData);
            }
          });
        }
      } catch (error) {
        console.warn('Could not fetch daily reflections:', error);
      }

      // Get gallery projects and interactions
      try {
        const studentTeamId = this.getStudentTeamId(studentId);
        
        let galleryQuery;
        if (studentTeamId) {
          galleryQuery = query(
            collection(db, 'galleries'),
            where('teamId', '==', studentTeamId),
            orderBy('createdAt', 'desc')
          );
        } else {
          galleryQuery = query(
            collection(db, 'galleries'),
            orderBy('createdAt', 'desc')
          );
        }
        
        const gallerySnapshot = await getDocs(galleryQuery);
        gallerySnapshot.docs.forEach(projectDoc => {
          const projectData = projectDoc.data();
          
          if (!studentTeamId || projectData.teamId === studentTeamId) {
            evidence.galleryProjects.push({
              id: projectDoc.id,
              title: projectData.title,
              description: projectData.description,
              websiteUrl: projectData.websiteUrl,
              technologies: projectData.technologies || [],
              teamId: projectData.teamId,
              teamName: projectData.teamName,
              createdAt: projectData.createdAt,
              metrics: projectData.metrics || {}
            });
          }
        });

        // Get gallery interactions
        try {
          const interactionsQuery = query(
            collection(db, 'gallery_interactions'),
            where('studentId', '==', studentId),
            orderBy('createdAt', 'desc')
          );
          
          const interactionsSnapshot = await getDocs(interactionsQuery);
          interactionsSnapshot.docs.forEach(interactionDoc => {
            const interactionData = interactionDoc.data();
            evidence.galleryInteractions.push({
              type: interactionData.type,
              galleryId: interactionData.galleryId,
              content: interactionData.content,
              reaction: interactionData.reaction,
              createdAt: interactionData.createdAt
            });
          });
        } catch (indexError) {
          console.warn('Gallery interactions index not ready, using fallback');
          const fallbackQuery = query(
            collection(db, 'gallery_interactions'),
            where('studentId', '==', studentId)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const interactions = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          interactions.sort((a, b) => {
            const aCreated = a.createdAt;
            const bCreated = b.createdAt;
            if (!aCreated && !bCreated) return 0;
            if (!aCreated) return 1;
            if (!bCreated) return -1;
            return bCreated.toMillis() - aCreated.toMillis();
          });
          
          interactions.forEach(interactionData => {
            evidence.galleryInteractions.push({
              type: interactionData.type,
              galleryId: interactionData.galleryId,
              content: interactionData.content,
              reaction: interactionData.reaction,
              createdAt: interactionData.createdAt
            });
          });
        }
      } catch (error) {
        console.warn('Could not fetch gallery data:', error);
      }

      return evidence;
    } catch (error) {
      console.error('Error getting student evidence:', error);
      throw error;
    }
  }

  // Anonymize text for privacy
  anonymizeText(text, studentId) {
    if (!text) return text;
    
    const tempId = `STUDENT_${studentId.slice(-6).toUpperCase()}`;
    let anonymized = text;
    
    // Remove email addresses
    anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    
    // Replace personal references
    anonymized = anonymized.replace(/\b(my name is|i am|i'm called)\s+[a-zA-Z]+/gi, `I am ${tempId}`);
    anonymized = anonymized.replace(/\bmy name\b/gi, `my identifier`);
    
    // Remove phone numbers
    anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
    
    return anonymized;
  }

  // Create complete evidence summary for LLM analysis (all content included)
  // Remove PII and apply bias mitigation to evidence
  sanitizeEvidenceForLLM(evidence, studentId) {
    // Create anonymized student ID
    const anonymizedId = `Student_${this.hashString(studentId).substring(0, 8)}`;
    
    // Deep clone evidence to avoid modifying original
    const sanitizedEvidence = JSON.parse(JSON.stringify(evidence));
    
    // Remove/anonymize PII from all text fields
    const piiRegex = /\b[A-Za-z][a-z]*\s+[A-Z][a-z]*\b/g; // Basic name pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return text;
      return text
        .replace(piiRegex, '[NAME_REDACTED]')
        .replace(emailRegex, '[EMAIL_REDACTED]')
        .replace(phoneRegex, '[PHONE_REDACTED]')
        .replace(new RegExp(studentId, 'gi'), anonymizedId);
    };
    
    // Recursively sanitize all text in the evidence object
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return sanitizeText(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      } else if (obj && typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitizedObj[key] = sanitizeObject(value);
        }
        return sanitizedObj;
      }
      return obj;
    };
    
    return {
      evidence: sanitizeObject(sanitizedEvidence),
      anonymizedId
    };
  }
  
  // Hash function for creating consistent anonymized IDs
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  // Randomize evidence order to reduce position bias
  randomizeEvidenceOrder(evidence) {
    const randomized = { ...evidence };
    
    // Shuffle chat interactions
    if (randomized.chatInteractions && Array.isArray(randomized.chatInteractions)) {
      randomized.chatInteractions = this.shuffleArray([...randomized.chatInteractions]);
    }
    
    // Shuffle daily reflections
    if (randomized.dailyReflections && Array.isArray(randomized.dailyReflections)) {
      randomized.dailyReflections = this.shuffleArray([...randomized.dailyReflections]);
    }
    
    // Shuffle artifacts
    if (randomized.artifacts && Array.isArray(randomized.artifacts)) {
      randomized.artifacts = this.shuffleArray([...randomized.artifacts]);
    }
    
    // Shuffle gallery projects
    if (randomized.galleryProjects && Array.isArray(randomized.galleryProjects)) {
      randomized.galleryProjects = this.shuffleArray([...randomized.galleryProjects]);
    }
    
    return randomized;
  }
  
  // Fisher-Yates shuffle algorithm
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  createEvidenceSummary(evidence, studentId) {
    // Apply bias mitigation: PII removal and evidence randomization
    const { evidence: sanitizedEvidence, anonymizedId } = this.sanitizeEvidenceForLLM(evidence, studentId);
    const randomizedEvidence = this.randomizeEvidenceOrder(sanitizedEvidence);
    
    let summary = `\n=== EVIDENCE SUMMARY: ${anonymizedId} ===\n`;
    
    // Progress overview (using original evidence for non-PII metrics)
    summary += `Progress: Level ${evidence.progressMetrics.currentLevel} | ${evidence.progressMetrics.totalXP} XP | Skills: ${evidence.skillsUnlocked.length}\n\n`;
    
    // Skills - only key reflections and answers (using randomized evidence)
    if (randomizedEvidence.skillsUnlocked && randomizedEvidence.skillsUnlocked.length > 0) {
      summary += `=== SKILLS & REFLECTIONS ===\n`;
      randomizedEvidence.skillsUnlocked.forEach(skill => {
        if (skill.evidence.reflection && skill.evidence.reflection.trim()) {
          summary += `${skill.skillId}: ${skill.evidence.reflection}\n`; // Already sanitized
        }
        if (skill.evidence.questionAnswers && Array.isArray(skill.evidence.questionAnswers)) {
          skill.evidence.questionAnswers.forEach((answer, i) => {
            summary += `${skill.skillId} Q${i + 1}: ${answer}\n`; // Already sanitized
          });
        }
      });
      summary += '\n';
    }

    // Daily reflections - condensed format (using randomized evidence)
    const dailyReflections = randomizedEvidence.reflections ? randomizedEvidence.reflections.filter(r => r.type === 'daily_reflection') : [];
    if (dailyReflections.length > 0) {
      summary += `=== DAILY REFLECTIONS (${dailyReflections.length}) ===\n`;
      dailyReflections.forEach(reflection => {
        summary += `Day ${reflection.dayNumber}: `;
        const responses = Object.values(reflection.responses).map(r => {
          return r.answer; // Already sanitized, full answer for complete LLM analysis
        });
        summary += responses.join(' | ') + '\n';
      });
      summary += '\n';
    }

    // Artifacts - complete content (using randomized evidence)
    if (randomizedEvidence.artifacts && randomizedEvidence.artifacts.length > 0) {
      summary += `=== ARTIFACTS (${randomizedEvidence.artifacts.length}) ===\n`;
      randomizedEvidence.artifacts.forEach(artifact => {
        summary += `${artifact.type}: ${artifact.content}\n`; // Already sanitized, full content for complete LLM analysis
      });
      summary += '\n';
    }

    // Chat interactions - ALL messages for complete LLM analysis (using randomized evidence)
    if (randomizedEvidence.chatInteractions && randomizedEvidence.chatInteractions.length > 0) {
      summary += `=== CHAT INTERACTIONS (${randomizedEvidence.chatInteractions.length} conversations) ===\n`;
      randomizedEvidence.chatInteractions.forEach(chat => {
        summary += `\nConversation with ${chat.persona} (${new Date(chat.createdAt?.toDate?.() || chat.createdAt).toLocaleDateString()}):\n`;
        const studentMessages = chat.messages.filter(msg => msg.isUser);
        studentMessages.forEach((msg, index) => {
          summary += `Message ${index + 1}: ${msg.content}\n`; // Already sanitized
        });
        summary += `Total student messages: ${studentMessages.length}\n`;
      });
      summary += '\n';
    }

    // Gallery projects - complete info (using randomized evidence)
    if (randomizedEvidence.galleryProjects && randomizedEvidence.galleryProjects.length > 0) {
      summary += `=== GALLERY PROJECTS (${randomizedEvidence.galleryProjects.length}) ===\n`;
      randomizedEvidence.galleryProjects.forEach(project => {
        summary += `${project.title}: ${project.description || 'No description'} | Tech: ${project.technologies.join(', ')}\n`; // Already sanitized, full description and all technologies
      });
      summary += '\n';
    }

    // Achievements - titles only (using randomized evidence)
    if (randomizedEvidence.achievements && randomizedEvidence.achievements.length > 0) {
      summary += `=== ACHIEVEMENTS (${randomizedEvidence.achievements.length}) ===\n`;
      const titles = randomizedEvidence.achievements.map(a => a.title).join(', ');
      summary += `${titles}\n\n`;
    }

    return summary;
  }

  // Format competency definitions and rubrics for LLM prompt
  formatCompetencyRubrics() {
    let text = '\n=== THREE COMPETENCY RUBRICS ===\n';
    
    Object.entries(this.competencyDefinitions).forEach(([id, comp]) => {
      text += `\n${comp.name.toUpperCase()}:\n`;
      text += `Definition: ${comp.definition}\n`;
      text += `\nReporting Dimensions:\n`;
      
      comp.dimensions.forEach((dimension, dimIndex) => {
        text += `\n${dimIndex + 1}. ${dimension.name}\n`;
        text += `Indicators:\n`;
        dimension.indicators.forEach(indicator => {
          text += `- ${indicator}\n`;
        });
        text += `\nRubric:\n`;
        text += `Emerging (1): ${dimension.rubric.emerging}\n`;
        text += `Developing (2): ${dimension.rubric.developing}\n`;
        text += `Proficient (3): ${dimension.rubric.proficient}\n\n`;
      });
      
      text += '\n' + '='.repeat(50) + '\n';
    });
    
    return text;
  }

  // Analyze competencies with a specific model
  async analyzeWithModel(modelName, studentId, evidence) {
    try {
      console.log(`🤖 Analyzing ${studentId} with ${modelName}...`);
      
      const evidenceSummary = this.createEvidenceSummary(evidence, studentId);
      const competencyRubrics = this.formatCompetencyRubrics();
      
      const fullPrompt = `You are an expert educational assessor analyzing student competency development.

IMPORTANT INSTRUCTIONS - LLM AS JUDGE PROTOCOL:
- Analyze ONLY the three competencies: STEAM Interest, Sense of Belonging, and Communication
- Use ONLY the provided evidence (Day 8 student self-ratings have been excluded as requested)
- Rate each competency dimension on a 0-3 scale: 0=Insufficient Evidence, 1=Emerging, 2=Developing, 3=Proficient
- You MUST rate each individual dimension separately - do not skip any dimensions
- CHAIN-OF-THOUGHT REQUIRED: For each dimension, think through your analysis step-by-step before rating
- CONFIDENCE SCORING: Rate your confidence in each judgment on a 1-5 scale (1=Very Uncertain, 5=Very Confident)
- If evidence is insufficient to assess a dimension, use rating 0 and explain what evidence would be needed
- Provide specific evidence citations and reasoning for each rating
- Return response as structured JSON

CHAIN-OF-THOUGHT PROCESS FOR EACH DIMENSION:
1. Evidence Review: What evidence from the student data relates to this specific dimension?
2. Rubric Alignment: How does the evidence align with the 0-3 rubric criteria for this dimension?
3. Score Determination: Based on evidence quality and quantity, what score best fits?
4. Confidence Assessment: How certain are you in this judgment given the available evidence?

${competencyRubrics}

STUDENT EVIDENCE TO ANALYZE:
${evidenceSummary}

REQUIRED JSON RESPONSE FORMAT:
{
  "student_id": "${studentId}",
  "analysis_model": "${modelName}",
  "competencies": [
    {
      "competency_id": "steam_interest",
      "competency_name": "STEAM Interest",
      "dimensions": [
        {
          "dimension_name": "Actively seeks opportunities to learn about STEAM subjects",
          "chain_of_thought": "Step 1: Evidence Review - [list relevant evidence]. Step 2: Rubric Alignment - [how evidence maps to criteria]. Step 3: Score Determination - [why this score]. Step 4: Confidence Assessment - [certainty level explanation]",
          "rating": 0, 1, 2, or 3,
          "confidence": 1, 2, 3, 4, or 5,
          "evidence_citations": ["specific quote or reference from evidence", "another citation"],
          "reasoning": "final justification for rating and confidence level",
          "evidence_gaps": "what additional evidence would strengthen this assessment (if applicable)"
        },
        {
          "dimension_name": "Engages in STEAM activities as a means of exploring personal interests, values, and identity",
          "chain_of_thought": "Step 1: Evidence Review - [list relevant evidence]. Step 2: Rubric Alignment - [how evidence maps to criteria]. Step 3: Score Determination - [why this score]. Step 4: Confidence Assessment - [certainty level explanation]",
          "rating": 0, 1, 2, or 3,
          "confidence": 1, 2, 3, 4, or 5,
          "evidence_citations": ["specific evidence", "more evidence"],
          "reasoning": "final justification for rating and confidence level",
          "evidence_gaps": "what additional evidence would strengthen this assessment (if applicable)"
        }
        // Continue for all dimensions of STEAM Interest
      ]
    },
    {
      "competency_id": "sense_of_belonging",
      "competency_name": "Sense of Belonging",
      "dimensions": [
        // Same structure for all Sense of Belonging dimensions
      ]
    },
    {
      "competency_id": "communication", 
      "competency_name": "Communication",
      "dimensions": [
        // Same structure for all Communication dimensions
      ]
    }
  ],
  "overall_assessment": "Brief summary of student's competency development across all three areas",
  "evidence_quality_notes": "Notes about the strength and completeness of available evidence",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON.`;

      // Log the full prompt that will be sent to the LLM
      console.log(`📋 FULL PROMPT FOR ${modelName}:`);
      console.log('='.repeat(80));
      console.log(fullPrompt);
      console.log('='.repeat(80));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FUTURE CODING ACADEMY - Three Competency Analysis'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assessor specializing in competency-based evaluation. Always provide complete, valid JSON responses based on detailed rubric analysis.'
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          temperature: 0.1,
          top_p: 0.9,
          frequency_penalty: 0.1,
          max_tokens: 75000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} for model ${modelName}`);
      }

      const data = await response.json();
      console.log(`📊 ${modelName} response metadata:`, {
        usage: data.usage,
        responseLength: data.choices[0].message.content.length
      });

      let analysisText = data.choices[0].message.content;
      
      // Clean JSON response
      analysisText = analysisText.replace(/^```(?:json)?\s*\n?/, '');
      analysisText = analysisText.replace(/\n?\s*```\s*$/, '');
      analysisText = analysisText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

      const analysis = JSON.parse(analysisText);
      
      // Add metadata
      analysis.analysis_timestamp = new Date().toISOString();
      analysis.api_usage = data.usage;
      analysis.full_prompt_sent = fullPrompt;

      return analysis;
    } catch (error) {
      console.error(`Error analyzing with ${modelName}:`, error);
      throw error;
    }
  }

  // Run triple LLM analysis
  async analyzeTripleModels(studentId, evidence) {
    try {
      console.log(`🔄 Running triple model analysis for ${studentId}...`);
      
      const [claudeAnalysis, geminiAnalysis, llamaAnalysis] = await Promise.all([
        this.analyzeWithModel(this.claudeModel, studentId, evidence),
        this.analyzeWithModel(this.geminiModel, studentId, evidence),
        this.analyzeWithModel(this.llamaModel, studentId, evidence)
      ]);

      return {
        claude_analysis: claudeAnalysis,
        gemini_analysis: geminiAnalysis,
        llama_analysis: llamaAnalysis,
        analysis_timestamp: new Date().toISOString(),
        student_id: studentId,
        evidence_summary: {
          artifacts: evidence.artifacts.length,
          reflections: evidence.reflections.length,
          chatInteractions: evidence.chatInteractions.length,
          skillsUnlocked: evidence.skillsUnlocked.length,
          galleryProjects: evidence.galleryProjects.length,
          galleryInteractions: evidence.galleryInteractions.length,
          achievements: evidence.achievements.length
        }
      };
    } catch (error) {
      console.error('Error in triple model analysis:', error);
      throw error;
    }
  }

  // Generate analysis text files for a student
  async generateStudentAnalysisFiles(studentId) {
    try {
      console.log(`📊 Generating three-competency analysis files for ${studentId}...`);
      
      // Collect evidence (excluding Day 8 self-ratings)
      const evidence = await this.getStudentEvidence(studentId);
      console.log(`📋 Evidence collected for ${studentId}:`, {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      });

      // Run triple model analysis
      const analyses = await this.analyzeTripleModels(studentId, evidence);

      // Generate prompt file (includes all evidence and prompts sent to both LLMs)
      const promptFile = this.generatePromptFile(studentId, evidence, analyses);
      
      // Generate analysis results file (includes both LLM outputs and comparison)
      const resultsFile = this.generateResultsFile(studentId, analyses);

      console.log(`✅ Generated analysis files for ${studentId}`);
      
      return {
        student_id: studentId,
        prompt_file: promptFile,
        results_file: resultsFile,
        analyses: analyses,
        generation_timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error generating analysis files for ${studentId}:`, error);
      throw error;
    }
  }

  // Generate the prompt file content
  generatePromptFile(studentId, evidence, analyses) {
    const timestamp = new Date().toISOString();
    
    let content = `THREE COMPETENCY ANALYTICS - PROMPT FILE
Student: ${studentId} | Generated: ${timestamp}
Models: GPT-4.1 Mini, Gemini 2.5 Flash, Llama-4 Scout

=== COMPETENCY RUBRICS ===
${this.formatCompetencyRubrics()}

=== STUDENT EVIDENCE ===
${this.createEvidenceSummary(evidence, studentId)}

Note: Full prompts sent to both LLMs contained the above rubrics and evidence.
See results file for detailed analysis outputs.`;

    return content;
  }

  // Generate the results file content
  generateResultsFile(studentId, analyses) {
    const timestamp = new Date().toISOString();
    
    let content = `THREE COMPETENCY ANALYTICS - RESULTS
Student: ${studentId} | Generated: ${timestamp}

=== CLAUDE SONNET-4 ANALYSIS ===
${this.formatAnalysisResults(analyses.claude_analysis)}

=== GEMINI 2.5 FLASH ANALYSIS ===
${this.formatAnalysisResults(analyses.gemini_analysis)}

=== LLAMA-4 MAVERICK ANALYSIS ===
${this.formatAnalysisResults(analyses.llama_analysis)}

=== TRIPLE INTER-RATER RELIABILITY ===
${this.generateIRRComparison(analyses)}

=== SUMMARY STATISTICS ===
${this.generateSummaryStats(analyses)}`;

    return content;
  }

  // Format analysis results in a concise way
  formatAnalysisResults(analysis) {
    if (!analysis.competencies) return 'No analysis results available';
    
    let formatted = `Overall Assessment: ${analysis.overall_assessment}\n\n`;
    
    analysis.competencies.forEach(comp => {
      formatted += `${comp.competency_name}:\n`;
      
      // Display all dimensions clearly
      comp.dimensions.forEach((dim, index) => {
        const ratingLabel = dim.rating === 0 ? 'Insufficient Evidence' : `${dim.rating}/3`;
        formatted += `  ${index + 1}. ${dim.dimension_name}: ${ratingLabel}\n`;
        formatted += `     Reasoning: ${dim.reasoning}\n`;
        if (dim.evidence_citations && dim.evidence_citations.length > 0) {
          formatted += `     Evidence: ${dim.evidence_citations.slice(0, 2).join('; ')}\n`;
        }
        formatted += '\n';
      });
      formatted += '\n';
    });
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      formatted += `Recommendations:\n`;
      analysis.recommendations.forEach((rec, index) => {
        formatted += `${index + 1}. ${rec}\n`;
      });
    }
    
    return formatted;
  }

  // Generate triple inter-rater reliability comparison (dimension-level only)
  generateIRRComparison(analyses) {
    let comparison = `Dimension-Level Inter-Rater Reliability:\n\n`;
    
    const claudeComps = analyses.claude_analysis.competencies;
    const geminiComps = analyses.gemini_analysis.competencies;
    const llamaComps = analyses.llama_analysis.competencies;
    
    let totalDimensions = 0;
    let fullAgreements = 0; // All three agree
    let partialAgreements = 0; // At least two agree
    
    claudeComps.forEach(claudeComp => {
      const geminiComp = geminiComps.find(g => g.competency_id === claudeComp.competency_id);
      const llamaComp = llamaComps.find(l => l.competency_id === claudeComp.competency_id);
      
      comparison += `${claudeComp.competency_name}:\n`;
      
      claudeComp.dimensions?.forEach((claudeDim, index) => {
        const geminiDim = geminiComp?.dimensions?.[index];
        const llamaDim = llamaComp?.dimensions?.[index];
        totalDimensions++;
        
        const claudeLabel = claudeDim.rating === 0 ? 'Insufficient' : `${claudeDim.rating}/3`;
        const geminiLabel = geminiDim?.rating === 0 ? 'Insufficient' : `${geminiDim?.rating || 'N/A'}/3`;
        const llamaLabel = llamaDim?.rating === 0 ? 'Insufficient' : `${llamaDim?.rating || 'N/A'}/3`;
        
        const claudeGeminiMatch = claudeDim.rating === geminiDim?.rating;
        const claudeLlamaMatch = claudeDim.rating === llamaDim?.rating;
        const geminiLlamaMatch = geminiDim?.rating === llamaDim?.rating;
        const allThreeMatch = claudeGeminiMatch && claudeLlamaMatch;
        
        let agreementIcon = '✗✗✗';
        if (allThreeMatch) {
          agreementIcon = '✓✓✓';
          fullAgreements++;
          partialAgreements++;
        } else if (claudeGeminiMatch || claudeLlamaMatch || geminiLlamaMatch) {
          agreementIcon = '✓✓✗';
          partialAgreements++;
        }
        
        comparison += `  ${claudeDim.dimension_name}: Claude ${claudeLabel}, Gemini ${geminiLabel}, Llama ${llamaLabel} ${agreementIcon}\n`;
      });
      comparison += '\n';
    });
    
    const fullAgreementRate = totalDimensions > 0 ? (fullAgreements / totalDimensions * 100).toFixed(1) : '0.0';
    const partialAgreementRate = totalDimensions > 0 ? (partialAgreements / totalDimensions * 100).toFixed(1) : '0.0';
    
    comparison += `Summary:\n`;
    comparison += `Full Agreement (all 3): ${fullAgreements}/${totalDimensions} (${fullAgreementRate}%)\n`;
    comparison += `Partial Agreement (2+ agree): ${partialAgreements}/${totalDimensions} (${partialAgreementRate}%)\n`;
    
    return comparison;
  }

  // Generate summary statistics
  generateSummaryStats(analyses) {
    const claudeComps = analyses.claude_analysis.competencies;
    const geminiComps = analyses.gemini_analysis.competencies;
    const llamaComps = analyses.llama_analysis.competencies;
    
    let totalDimensions = 0;
    let claudeAvg = 0;
    let geminiAvg = 0;
    let llamaAvg = 0;
    
    claudeComps.forEach(claudeComp => {
      const geminiComp = geminiComps.find(g => g.competency_id === claudeComp.competency_id);
      const llamaComp = llamaComps.find(l => l.competency_id === claudeComp.competency_id);
      
      claudeComp.dimensions.forEach((claudeDim, index) => {
        const geminiDim = geminiComp?.dimensions[index];
        const llamaDim = llamaComp?.dimensions[index];
        totalDimensions++;
        
        claudeAvg += claudeDim.rating;
        geminiAvg += geminiDim?.rating || 0;
        llamaAvg += llamaDim?.rating || 0;
      });
    });
    
    claudeAvg = (claudeAvg / totalDimensions).toFixed(2);
    geminiAvg = (geminiAvg / totalDimensions).toFixed(2);
    llamaAvg = (llamaAvg / totalDimensions).toFixed(2);
    
    return `Avg Dimension Ratings: Claude ${claudeAvg}, Gemini ${geminiAvg}, Llama ${llamaAvg}
Evidence: ${analyses.evidence_summary.skillsUnlocked} skills, ${analyses.evidence_summary.reflections} reflections, ${analyses.evidence_summary.chatInteractions} chats
Tokens: Claude ${analyses.claude_analysis.api_usage?.total_tokens || 'N/A'}, Gemini ${analyses.gemini_analysis.api_usage?.total_tokens || 'N/A'}, Llama ${analyses.llama_analysis.api_usage?.total_tokens || 'N/A'}`;
  }

  // Run consistency test - same prompt 3 times with one model
  async runConsistencyTest(studentId, modelName) {
    try {
      console.log(`🧪 Running consistency test for ${studentId} with ${modelName}...`);
      
      // Get student evidence once
      const evidence = await this.getStudentEvidence(studentId);
      
      // Run the same analysis 3 times
      const runs = await Promise.all([
        this.analyzeWithModel(modelName, studentId, evidence),
        this.analyzeWithModel(modelName, studentId, evidence),
        this.analyzeWithModel(modelName, studentId, evidence)
      ]);

      // Analyze consistency across the 3 runs
      const consistencyAnalysis = this.analyzeConsistency(runs, studentId, modelName);
      
      console.log('✅ Consistency test completed:', consistencyAnalysis);
      return consistencyAnalysis;
      
    } catch (error) {
      console.error('Error in consistency test:', error);
      throw error;
    }
  }

  // Analyze consistency across multiple runs
  analyzeConsistency(runs, studentId, modelName) {
    const competencies = [];
    
    // Get competency structure from first run
    const firstRun = runs[0];
    if (!firstRun.competencies) {
      throw new Error('Invalid analysis results structure');
    }

    firstRun.competencies.forEach(comp => {
      const competencyAnalysis = {
        competency_id: comp.competency_id,
        competency_name: comp.competency_name,
        dimensions: []
      };

      comp.dimensions.forEach((dim, dimIndex) => {
        // Collect scores and confidence from all 3 runs for this dimension
        const runsData = runs.map(run => {
          const runComp = run.competencies.find(c => c.competency_id === comp.competency_id);
          const dimension = runComp?.dimensions[dimIndex];
          return {
            rating: dimension?.rating || 0,
            confidence: dimension?.confidence || 3, // Default confidence if missing
            chain_of_thought: dimension?.chain_of_thought || '',
            evidence_gaps: dimension?.evidence_gaps || ''
          };
        });

        const scores = runsData.map(r => r.rating);
        const confidences = runsData.map(r => r.confidence);

        // Calculate variance (0 = all same, higher = more variable)
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const roundedVariance = Math.round(variance * 100) / 100;

        // Calculate confidence-weighted mean
        const totalConfidence = confidences.reduce((a, b) => a + b, 0);
        const weightedSum = runsData.reduce((sum, run) => sum + (run.rating * run.confidence), 0);
        const confidenceWeightedMean = totalConfidence > 0 ? weightedSum / totalConfidence : mean;

        // Calculate average confidence
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

        competencyAnalysis.dimensions.push({
          dimension_name: dim.dimension_name,
          scores: scores,
          confidences: confidences,
          variance: roundedVariance,
          mean: Math.round(mean * 100) / 100,
          confidence_weighted_mean: Math.round(confidenceWeightedMean * 100) / 100,
          average_confidence: Math.round(avgConfidence * 100) / 100,
          chain_of_thought_samples: runsData.map(r => r.chain_of_thought).filter(c => c),
          evidence_gaps_noted: runsData.map(r => r.evidence_gaps).filter(g => g).length > 0
        });
      });

      competencies.push(competencyAnalysis);
    });

    // Calculate summary statistics including confidence metrics
    const allDimensions = competencies.flatMap(c => c.dimensions);
    const totalDimensions = allDimensions.length;
    const consistentDimensions = allDimensions.filter(d => d.variance === 0).length;
    const variableDimensions = totalDimensions - consistentDimensions;
    const averageVariance = allDimensions.reduce((sum, d) => sum + d.variance, 0) / totalDimensions;
    const consistencyRate = Math.round((consistentDimensions / totalDimensions) * 100);
    
    // Confidence-based metrics
    const averageConfidence = allDimensions.reduce((sum, d) => sum + d.average_confidence, 0) / totalDimensions;
    const highConfidenceDimensions = allDimensions.filter(d => d.average_confidence >= 4).length;
    const lowConfidenceDimensions = allDimensions.filter(d => d.average_confidence <= 2).length;
    const dimensionsWithEvidenceGaps = allDimensions.filter(d => d.evidence_gaps_noted).length;

    return {
      studentId,
      modelName,
      timestamp: new Date().toISOString(),
      competencies,
      summary: {
        totalDimensions,
        consistentDimensions,
        variableDimensions,
        consistencyRate,
        averageVariance: Math.round(averageVariance * 100) / 100,
        // Confidence-based metrics for LLM-as-Judge analysis
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        highConfidenceDimensions,
        lowConfidenceDimensions,
        dimensionsWithEvidenceGaps,
        confidenceDistribution: {
          high: Math.round((highConfidenceDimensions / totalDimensions) * 100),
          medium: Math.round(((totalDimensions - highConfidenceDimensions - lowConfidenceDimensions) / totalDimensions) * 100),
          low: Math.round((lowConfidenceDimensions / totalDimensions) * 100)
        }
      },
      runs: runs.map((run, index) => ({
        runNumber: index + 1,
        timestamp: run.analysis_timestamp,
        tokenUsage: run.api_usage
      }))
    };
  }

  // Run comprehensive batch consistency analysis across all models
  async runBatchConsistencyAnalysis(studentIds, options = {}) {
    try {
      console.log(`🔬 Starting comprehensive batch consistency analysis for ${studentIds.length} students...`);
      
      const {
        onProgress = null,
        includeRecommendations = true
      } = options;

      const models = [
        { id: this.claudeModel, name: 'GPT-4.1 Mini' },
        { id: this.geminiModel, name: 'Gemini 2.5 Flash' },
        { id: this.llamaModel, name: 'Llama-4 Scout' }
      ];

      const totalOperations = studentIds.length * models.length * 3; // 3 runs per model per student
      let completedOperations = 0;
      
      const results = {
        timestamp: new Date().toISOString(),
        students: studentIds,
        models: models.map(m => m.name),
        totalStudents: studentIds.length,
        totalOperations,
        studentResults: [],
        overallStatistics: {},
        modelComparisons: {},
        recommendations: {}
      };

      // Process each student
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        console.log(`📊 Processing student ${i + 1}/${studentIds.length}: ${studentId}`);
        
        if (onProgress) {
          onProgress({
            phase: 'student_processing',
            currentStudent: i + 1,
            totalStudents: studentIds.length,
            studentId,
            completedOperations,
            totalOperations
          });
        }

        const studentResult = {
          studentId,
          models: [],
          crossModelConsistency: {}
        };

        // Get student evidence once
        const evidence = await this.getStudentEvidence(studentId);

        // Test each model 3 times with error handling
        for (const model of models) {
          console.log(`🤖 Testing ${model.name} for ${studentId}...`);
          
          try {
            // Run 3 consistency tests with individual error handling
            const runs = await this.runModelTestsWithRetry(model, studentId, evidence);

            completedOperations += 3;

            if (onProgress) {
              onProgress({
                phase: 'model_testing',
                currentStudent: i + 1,
                totalStudents: studentIds.length,
                studentId,
                currentModel: model.name,
                completedOperations,
                totalOperations,
                progress: (completedOperations / totalOperations * 100).toFixed(1)
              });
            }

            if (runs.length > 0) {
              // Analyze consistency for this model (if we have at least some successful runs)
              const modelConsistency = this.analyzeConsistency(runs, studentId, model.id);
              studentResult.models.push({
                modelName: model.name,
                modelId: model.id,
                consistency: modelConsistency,
                averageVariance: modelConsistency.summary.averageVariance,
                consistencyRate: modelConsistency.summary.consistencyRate,
                successfulRuns: runs.length,
                status: runs.length === 3 ? 'complete' : 'partial'
              });
            } else {
              // No successful runs for this model
              console.warn(`⚠️ ${model.name} failed all attempts for ${studentId}`);
              studentResult.models.push({
                modelName: model.name,
                modelId: model.id,
                consistency: null,
                averageVariance: null,
                consistencyRate: null,
                successfulRuns: 0,
                status: 'failed',
                error: 'All analysis attempts failed'
              });
            }

          } catch (error) {
            console.error(`❌ ${model.name} failed for ${studentId}:`, error.message);
            studentResult.models.push({
              modelName: model.name,
              modelId: model.id,
              consistency: null,
              averageVariance: null,
              consistencyRate: null,
              successfulRuns: 0,
              status: 'failed',
              error: error.message
            });
          }

          // Longer delay for free tier models
          const delayTime = model.id.includes(':free') ? 3000 : 1000;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        // Calculate cross-model consistency for this student
        studentResult.crossModelConsistency = this.calculateCrossModelConsistency(studentResult.models);
        results.studentResults.push(studentResult);
      }

      // Calculate overall statistics and recommendations
      if (onProgress) {
        onProgress({
          phase: 'analysis',
          message: 'Calculating overall statistics and generating recommendations...'
        });
      }

      results.overallStatistics = this.calculateOverallStatistics(results.studentResults);
      results.modelComparisons = this.generateModelComparisons(results.studentResults);
      
      if (includeRecommendations) {
        results.recommendations = this.generateLLMTuningRecommendations(results);
      }

      console.log('✅ Batch consistency analysis completed');
      
      // Store results in global scope for debugging
      window.lastBatchResults = results;
      
      return results;

    } catch (error) {
      console.error('Error in batch consistency analysis:', error);
      
      // Store partial results even on error for debugging
      if (results && results.studentResults) {
        window.lastBatchResults = results;
        console.log('💾 Partial results stored for debugging');
      }
      
      throw error;
    }
  }

  // Run model tests with retry logic and error handling
  async runModelTestsWithRetry(model, studentId, evidence, maxAttempts = 3) {
    const successfulRuns = [];
    const failedAttempts = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`  📊 Run ${attempt}/3 for ${model.name}...`);
        
        // Add longer delay for free tier models on retry attempts
        if (attempt > 1) {
          const retryDelay = model.id.includes(':free') ? 5000 : 2000;
          console.log(`  ⏳ Waiting ${retryDelay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        const result = await this.analyzeWithModel(model.id, studentId, evidence);
        successfulRuns.push(result);
        console.log(`  ✅ Run ${attempt} successful for ${model.name}`);

        // Small delay between successful runs
        if (attempt < maxAttempts) {
          const delayTime = model.id.includes(':free') ? 2000 : 500;
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }

      } catch (error) {
        console.warn(`  ❌ Run ${attempt} failed for ${model.name}:`, error.message);
        failedAttempts.push({
          attempt,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // If this is a 400 error (likely rate limit or model issue), wait longer
        if (error.message.includes('400')) {
          console.log(`  ⚠️ 400 error detected, extending delay for ${model.name}...`);
          const errorDelay = model.id.includes(':free') ? 10000 : 5000;
          await new Promise(resolve => setTimeout(resolve, errorDelay));
        }
      }
    }

    if (failedAttempts.length > 0) {
      console.warn(`⚠️ ${model.name} had ${failedAttempts.length}/${maxAttempts} failed attempts for ${studentId}`);
    }

    return successfulRuns;
  }

  // Calculate cross-model consistency for a single student
  calculateCrossModelConsistency(modelResults) {
    const dimensions = [];
    const competencyNames = ['STEAM Interest', 'Sense of Belonging', 'Communication'];
    
    // Filter out failed models
    const successfulModels = modelResults.filter(model => model.status === 'complete' || model.status === 'partial');
    
    if (successfulModels.length === 0) {
      return {
        dimensions: [],
        summary: {
          totalDimensions: 0,
          consistentDimensions: 0,
          inconsistentDimensions: 0,
          crossModelAgreementRate: 0,
          averageCrossModelVariance: 0,
          note: 'No successful model runs available for comparison'
        }
      };
    }

    // Use the first successful model as the reference for dimension structure
    if (!successfulModels[0].consistency || !successfulModels[0].consistency.competencies) {
      return {
        dimensions: [],
        summary: {
          totalDimensions: 0,
          consistentDimensions: 0,
          inconsistentDimensions: 0,
          crossModelAgreementRate: 0,
          averageCrossModelVariance: 0,
          note: 'Invalid consistency data structure'
        }
      };
    }
    
    // For each competency and dimension, compare across successful models
    successfulModels[0].consistency.competencies.forEach((comp, compIndex) => {
      comp.dimensions.forEach((dim, dimIndex) => {
        const crossModelScores = [];
        const modelNames = [];

        successfulModels.forEach(model => {
          if (model.consistency && 
              model.consistency.competencies[compIndex] && 
              model.consistency.competencies[compIndex].dimensions[dimIndex]) {
            const modelDim = model.consistency.competencies[compIndex].dimensions[dimIndex];
            crossModelScores.push(modelDim.mean);
            modelNames.push(model.modelName);
          }
        });

        if (crossModelScores.length > 1) {
          // Calculate variance across models (only if we have multiple models)
          const mean = crossModelScores.reduce((a, b) => a + b, 0) / crossModelScores.length;
          const variance = crossModelScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / crossModelScores.length;

                  dimensions.push({
          competency: competencyNames[compIndex],
          dimension: dim.dimension_name,
          scores: crossModelScores,
          mean: Math.round(mean * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          modelNames: modelNames,
          modelsAvailable: crossModelScores.length,
          agreementLevel: variance < 0.05 ? 'excellent' : variance < 0.1 ? 'good' : variance < 0.25 ? 'moderate' : 'poor',
          isProblematic: variance > 0.25
        });
        } else if (crossModelScores.length === 1) {
          // Single model case
          dimensions.push({
            competency: competencyNames[compIndex],
            dimension: dim.dimension_name,
            scores: crossModelScores,
            mean: Math.round(crossModelScores[0] * 100) / 100,
            variance: 0, // No variance with single model
            modelNames: modelNames,
            modelsAvailable: 1
          });
        }
      });
    });

    const totalDimensions = dimensions.length;
    const consistentDimensions = dimensions.filter(d => d.variance < 0.1 || d.modelsAvailable === 1).length;
    const inconsistentDimensions = totalDimensions - consistentDimensions;
    const averageVariance = totalDimensions > 0 ? 
      dimensions.reduce((sum, d) => sum + d.variance, 0) / totalDimensions : 0;

    return {
      dimensions,
      summary: {
        totalDimensions,
        consistentDimensions,
        inconsistentDimensions,
        crossModelAgreementRate: totalDimensions > 0 ? Math.round((consistentDimensions / totalDimensions) * 100) : 0,
        averageCrossModelVariance: Math.round(averageVariance * 100) / 100,
        successfulModels: successfulModels.length,
        failedModels: modelResults.length - successfulModels.length
      }
    };
  }

  // Calculate overall statistics across all students and models
  calculateOverallStatistics(studentResults) {
    const stats = {
      totalTests: studentResults.length * 3, // 3 models per student
      modelStats: {},
      dimensionStats: {},
      overallConsistency: {}
    };

    // Model-level statistics
    const modelNames = ['GPT-4.1 Mini', 'Gemini 2.5 Flash', 'Llama-4 Scout'];
    modelNames.forEach(modelName => {
      const modelData = studentResults.flatMap(student => 
        student.models.filter(m => m.modelName === modelName)
      );

      // Filter out failed models for statistics calculation
      const successfulModelData = modelData.filter(m => m.status === 'complete' || m.status === 'partial');
      const failedModelData = modelData.filter(m => m.status === 'failed');

      if (successfulModelData.length > 0) {
        const avgVariance = successfulModelData.reduce((sum, m) => sum + (m.averageVariance || 0), 0) / successfulModelData.length;
        const avgConsistency = successfulModelData.reduce((sum, m) => sum + (m.consistencyRate || 0), 0) / successfulModelData.length;

        stats.modelStats[modelName] = {
          averageVariance: Math.round(avgVariance * 100) / 100,
          averageConsistencyRate: Math.round(avgConsistency * 100) / 100,
          testCount: successfulModelData.length,
          failedCount: failedModelData.length,
          totalAttempts: modelData.length,
          successRate: Math.round((successfulModelData.length / modelData.length) * 100)
        };
      } else {
        // All tests failed for this model
        stats.modelStats[modelName] = {
          averageVariance: 0,
          averageConsistencyRate: 0,
          testCount: 0,
          failedCount: failedModelData.length,
          totalAttempts: modelData.length,
          successRate: 0,
          note: 'All tests failed'
        };
      }
    });

    // Cross-model agreement statistics
    const crossModelData = studentResults.map(s => s.crossModelConsistency.summary);
    stats.overallConsistency = {
      averageCrossModelAgreement: Math.round(
        crossModelData.reduce((sum, d) => sum + d.crossModelAgreementRate, 0) / crossModelData.length
      ),
      averageCrossModelVariance: Math.round(
        (crossModelData.reduce((sum, d) => sum + d.averageCrossModelVariance, 0) / crossModelData.length) * 100
      ) / 100
    };

    return stats;
  }

  // Generate model comparison analysis
  generateModelComparisons(studentResults) {
    const modelNames = ['GPT-4.1 Mini', 'Gemini 2.5 Flash', 'Llama-4 Scout'];
    const comparisons = {};

    // Compare each pair of models
    for (let i = 0; i < modelNames.length; i++) {
      for (let j = i + 1; j < modelNames.length; j++) {
        const model1 = modelNames[i];
        const model2 = modelNames[j];
        const comparisonKey = `${model1} vs ${model2}`;

        const agreements = [];
        studentResults.forEach(student => {
          const model1Data = student.models.find(m => m.modelName === model1);
          const model2Data = student.models.find(m => m.modelName === model2);

          // Only compare if both models have valid consistency data
          if (model1Data && model2Data && 
              model1Data.consistency && model2Data.consistency &&
              model1Data.consistency.competencies && model2Data.consistency.competencies) {
            // Compare dimension means between models
            const model1Dims = model1Data.consistency.competencies.flatMap(c => c.dimensions);
            const model2Dims = model2Data.consistency.competencies.flatMap(c => c.dimensions);

            model1Dims.forEach((dim1, index) => {
              const dim2 = model2Dims[index];
              if (dim1 && dim2) {
                const agreement = Math.abs(dim1.mean - dim2.mean) < 0.5; // Within 0.5 points
                agreements.push(agreement);
              }
            });
          }
        });

        const agreementRate = agreements.length > 0 ? 
          Math.round((agreements.filter(a => a).length / agreements.length) * 100) : 0;

        comparisons[comparisonKey] = {
          agreementRate,
          totalComparisons: agreements.length,
          agreements: agreements.filter(a => a).length
        };
      }
    }

    return comparisons;
  }

  // Generate LLM tuning recommendations
  generateLLMTuningRecommendations(analysisResults) {
    const recommendations = {
      general: [],
      modelSpecific: {},
      parameterSuggestions: {},
      summary: ''
    };

    const stats = analysisResults.overallStatistics;
    const modelStats = stats.modelStats;

    // Check for model failures
    const failedModels = Object.entries(modelStats).filter(([name, data]) => data.successRate < 100);
    if (failedModels.length > 0) {
      recommendations.general.push({
        priority: 'HIGH',
        issue: 'Model reliability issues',
        recommendation: 'Some models experienced failures. Consider upgrading to paid tiers or adjusting rate limits',
        explanation: `${failedModels.map(([name, data]) => `${name}: ${data.successRate}% success rate`).join(', ')}`
      });
    }

    // Focus on individual model consistency (for human comparison validation)
    const lowConsistencyModels = Object.entries(modelStats).filter(([name, data]) => data.averageConsistencyRate < 80);
    if (lowConsistencyModels.length > 0) {
      recommendations.general.push({
        priority: 'HIGH',
        issue: 'Low individual model consistency',
        recommendation: 'Focus on improving each model\'s self-consistency for reliable human comparison',
        explanation: `AI scores will be compared with human experts. Models must be consistent with themselves: ${lowConsistencyModels.map(([name, data]) => `${name}: ${data.averageConsistencyRate}%`).join(', ')}`
      });
    }

    // Cross-model agreement is secondary to individual consistency
    if (stats.overallConsistency.averageCrossModelAgreement < 50) {
      recommendations.general.push({
        priority: 'MEDIUM',
        issue: 'Low cross-model agreement',
        recommendation: 'Cross-model differences are acceptable when comparing against human scores',
        explanation: 'Different AI models may have different perspectives, similar to human raters. Focus on individual consistency first.'
      });
    }

    if (stats.overallConsistency.averageCrossModelVariance > 0.5) {
      recommendations.general.push({
        priority: 'MEDIUM',
        issue: 'High variance across models',
        recommendation: 'Review and refine competency rubrics for clearer scoring criteria',
        explanation: 'High variance suggests ambiguity in assessment criteria'
      });
    }

    // Model-specific recommendations
    Object.entries(modelStats).forEach(([modelName, modelData]) => {
      recommendations.modelSpecific[modelName] = [];

      if (modelData.averageVariance > 0.2) {
        recommendations.modelSpecific[modelName].push({
          priority: 'HIGH',
          issue: 'High internal variance - Critical for human comparison',
          recommendation: 'Reduce temperature to 0.05 and add frequency_penalty=0.2',
          explanation: `${modelName} must be self-consistent for reliable comparison with human raters (current variance: ${modelData.averageVariance})`
        });
      }

      if (modelData.averageConsistencyRate < 75) {
        recommendations.modelSpecific[modelName].push({
          priority: 'HIGH',
          issue: 'Low self-consistency - Unreliable for human comparison',
          recommendation: 'Optimize for deterministic outputs: temperature=0.05, top_p=0.8, frequency_penalty=0.2',
          explanation: `${modelName} needs ${75 - modelData.averageConsistencyRate}% improvement in consistency for valid human comparison`
        });
      }

      if (modelData.averageConsistencyRate > 90) {
        recommendations.modelSpecific[modelName].push({
          priority: 'LOW',
          issue: 'Excellent self-consistency',
          recommendation: 'Model ready for human comparison validation',
          explanation: `${modelName} demonstrates excellent reliability (${modelData.averageConsistencyRate}% consistent) - suitable for inter-rater reliability studies with humans`
        });
      } else if (modelData.averageConsistencyRate > 80) {
        recommendations.modelSpecific[modelName].push({
          priority: 'MEDIUM',
          issue: 'Good consistency, room for improvement',
          recommendation: 'Consider minor parameter tuning for optimal human comparison',
          explanation: `${modelName} shows good consistency but could improve by ${90 - modelData.averageConsistencyRate}% for ideal human comparison reliability`
        });
      }
    });

    // Parameter suggestions optimized for individual consistency (human comparison)
    const avgConsistency = Object.values(modelStats).reduce((sum, model) => sum + model.averageConsistencyRate, 0) / Object.keys(modelStats).length;
    
    recommendations.parameterSuggestions = {
      temperature: {
        current: 0.1,
        recommended: avgConsistency < 80 ? 0.05 : avgConsistency < 90 ? 0.07 : 0.1,
        explanation: 'Ultra-low temperature for maximum self-consistency in human comparison studies'
      },
      top_p: {
        current: 0.9,
        recommended: avgConsistency < 80 ? 0.8 : 0.9,
        explanation: 'Restrictive nucleus sampling for consistent token selection across identical prompts'
      },
      frequency_penalty: {
        current: 0.1,
        recommended: avgConsistency < 85 ? 0.2 : 0.1,
        explanation: 'Reduce repetitive patterns that may cause scoring inconsistencies'
      },
      presence_penalty: {
        current: 0.0,
        recommended: avgConsistency < 80 ? 0.1 : 0.0,
        explanation: 'Encourage consistent vocabulary usage for reliable scoring patterns'
      },
      max_tokens: {
        current: 75000,
        recommended: 75000,
        explanation: 'Sufficient tokens for detailed, consistent analysis matching human expert depth'
      }
    };

    // Generate summary
    const bestModel = Object.entries(modelStats).reduce((best, [name, data]) => 
      data.averageConsistencyRate > best.rate ? { name, rate: data.averageConsistencyRate } : best,
      { name: '', rate: 0 }
    );

    const totalRecommendations = recommendations.general.length + Object.values(recommendations.modelSpecific).flat().length;
    const avgIndividualConsistency = Object.values(modelStats).reduce((sum, model) => sum + model.averageConsistencyRate, 0) / Object.keys(modelStats).length;
    
    recommendations.summary = `Human Comparison Readiness Analysis: ${analysisResults.totalStudents} students across 3 AI models. ` +
      `Average individual consistency: ${Math.round(avgIndividualConsistency)}% (target: 90%+ for human comparison). ` +
      `${bestModel.name} most consistent (${bestModel.rate}%). ` +
      `Cross-model agreement: ${stats.overallConsistency.averageCrossModelAgreement}% (acceptable variation for human studies). ` +
      `${totalRecommendations} optimization recommendations for human expert comparison validation.`;

    return recommendations;
  }

  // Generate comprehensive consistency report
  // Extract partial results from crashed analysis 
  extractPartialResults(studentResults) {
    const partialReport = [];
    
    studentResults.forEach(student => {
      const studentReport = {
        studentId: student.studentId,
        models: []
      };
      
      student.models.forEach(model => {
        if (model.consistency && model.consistency.competencies) {
          const modelData = {
            modelName: model.modelName,
            status: model.status,
            successfulRuns: model.successfulRuns,
            consistencyRate: model.consistencyRate,
            averageVariance: model.averageVariance,
            summary: model.consistency.summary
          };
          studentReport.models.push(modelData);
        } else {
          studentReport.models.push({
            modelName: model.modelName,
            status: 'failed',
            successfulRuns: 0,
            error: 'Analysis failed'
          });
        }
      });
      
      partialReport.push(studentReport);
    });
    
    return partialReport;
  }

  generateConsistencyReport(analysisResults) {
    const timestamp = new Date().toISOString();
    
    let report = `HUMAN EXPERT COMPARISON READINESS REPORT
Generated: ${timestamp}
Purpose: Validate AI consistency for inter-rater reliability with 5 human experts
Students Analyzed: ${analysisResults.totalStudents}
Total Operations: ${analysisResults.totalOperations} (${analysisResults.totalStudents} students × 3 models × 3 runs each)

${'='.repeat(80)}
EXECUTIVE SUMMARY - HUMAN COMPARISON READINESS
${'='.repeat(80)}

${analysisResults.recommendations.summary}

KEY METRICS FOR HUMAN COMPARISON:
Individual Model Consistency (Primary): ${Object.entries(analysisResults.overallStatistics.modelStats).map(([name, stats]) => `${name}: ${stats.averageConsistencyRate}%`).join(', ')}
Cross-Model Agreement (Secondary): ${analysisResults.overallStatistics.overallConsistency.averageCrossModelAgreement}%
Target: 90%+ individual consistency for reliable human expert comparison

${'='.repeat(80)}
MODEL PERFORMANCE SUMMARY
${'='.repeat(80)}

`;

    // Human comparison readiness assessment
    const avgConsistency = Object.values(analysisResults.overallStatistics.modelStats).reduce((sum, model) => sum + model.averageConsistencyRate, 0) / Object.keys(analysisResults.overallStatistics.modelStats).length;
    
    report += `${'='.repeat(80)}
HUMAN COMPARISON READINESS ASSESSMENT
${'='.repeat(80)}

Overall Assessment: ${avgConsistency >= 90 ? 'READY for human comparison' : avgConsistency >= 80 ? 'GOOD - Minor optimization needed' : avgConsistency >= 70 ? 'MODERATE - Significant optimization needed' : 'NOT READY - Major consistency issues'}

Individual Model Readiness:
`;

    Object.entries(analysisResults.overallStatistics.modelStats).forEach(([modelName, stats]) => {
      const readiness = stats.averageConsistencyRate >= 90 ? 'READY ✅' : 
                      stats.averageConsistencyRate >= 80 ? 'GOOD ⚠️' :
                      stats.averageConsistencyRate >= 70 ? 'NEEDS WORK ❌' : 'NOT READY ❌';
      
      report += `  ${modelName}: ${readiness} (${stats.averageConsistencyRate}% consistent)
`;
    });

    report += `
Inter-Rater Reliability Context:
• Human experts typically show 70-85% agreement on subjective assessments
• AI models should achieve 90%+ self-consistency for reliable comparison
• Cross-model disagreement is acceptable (models as different expert perspectives)
• Focus: Each AI must be internally consistent, not necessarily agree with other AIs

Recommended Next Steps:
1. Optimize models with <90% consistency before human comparison study
2. Collect human expert ratings using identical rubrics
3. Calculate AI-human correlation coefficients for each model
4. Measure inter-rater reliability between humans and each AI model

`;

    // Model performance table
    Object.entries(analysisResults.overallStatistics.modelStats).forEach(([modelName, stats]) => {
      report += `${modelName}:
  Consistency Rate: ${stats.averageConsistencyRate}%
  Average Variance: ${stats.averageVariance}
  Tests Completed: ${stats.testCount}
  Success Rate: ${stats.successRate}% (${stats.testCount}/${stats.totalAttempts})`;
      
      if (stats.failedCount > 0) {
        report += `
  ⚠️ Failed Tests: ${stats.failedCount}`;
        if (stats.note) {
          report += ` - ${stats.note}`;
        }
      }
      
      report += `

`;
    });

    report += `${'='.repeat(80)}
MODEL COMPARISONS
${'='.repeat(80)}

`;

    // Model comparison results
    Object.entries(analysisResults.modelComparisons).forEach(([comparison, data]) => {
      report += `${comparison}:
  Agreement Rate: ${data.agreementRate}%
  Agreements: ${data.agreements}/${data.totalComparisons} comparisons

`;
    });

    report += `${'='.repeat(80)}
TUNING RECOMMENDATIONS
${'='.repeat(80)}

GENERAL RECOMMENDATIONS:
`;

    // General recommendations
    if (analysisResults.recommendations.general.length === 0) {
      report += `✅ No critical issues identified. Current configuration appears stable.

`;
    } else {
      analysisResults.recommendations.general.forEach(rec => {
        report += `
[${rec.priority}] ${rec.issue}
Recommendation: ${rec.recommendation}
Explanation: ${rec.explanation}
`;
      });
    }

    report += `
MODEL-SPECIFIC RECOMMENDATIONS:
`;

    // Model-specific recommendations
    Object.entries(analysisResults.recommendations.modelSpecific).forEach(([modelName, recs]) => {
      report += `
${modelName}:
`;
      if (recs.length === 0) {
        report += `  ✅ No specific issues identified for this model.
`;
      } else {
        recs.forEach(rec => {
          report += `  [${rec.priority}] ${rec.issue}
  Recommendation: ${rec.recommendation}
  Explanation: ${rec.explanation}

`;
        });
      }
    });

    report += `${'='.repeat(80)}
PARAMETER OPTIMIZATION SUGGESTIONS
${'='.repeat(80)}

`;

    // Parameter suggestions
    Object.entries(analysisResults.recommendations.parameterSuggestions).forEach(([param, suggestion]) => {
      report += `${param.toUpperCase()}:
  Current: ${suggestion.current}
  Recommended: ${suggestion.recommended}
  Reason: ${suggestion.explanation}

`;
    });

    report += `${'='.repeat(80)}
DETAILED STUDENT ANALYSIS
${'='.repeat(80)}

`;

    // Student-by-student breakdown
    analysisResults.studentResults.forEach(student => {
      report += `Student: ${student.studentId}
Cross-Model Agreement: ${student.crossModelConsistency.summary.crossModelAgreementRate}%
Cross-Model Variance: ${student.crossModelConsistency.summary.averageCrossModelVariance}

Model Performance:
`;
      student.models.forEach(model => {
        report += `  ${model.modelName}: ${model.consistencyRate}% consistent (variance: ${model.averageVariance})
`;
      });

      // Highlight problematic dimensions
      const problematicDimensions = student.crossModelConsistency.dimensions.filter(d => d.variance > 0.5);
      if (problematicDimensions.length > 0) {
        report += `
  ⚠️  High-Variance Dimensions:
`;
        problematicDimensions.forEach(dim => {
          report += `    ${dim.competency} - ${dim.dimension}: Variance ${dim.variance}
`;
        });
      }
      report += `
`;
    });

    report += `${'='.repeat(80)}
METHODOLOGY NOTES
${'='.repeat(80)}

This analysis used identical prompts across all models to test consistency.
Each student was analyzed by each model 3 times with identical inputs.
Variance measures inconsistency: 0 = perfectly consistent, higher = more variable.
Cross-model agreement measured at dimension level with 0.5-point tolerance.

Recommended next steps:
1. Implement suggested parameter changes
2. Re-run analysis on subset to validate improvements
3. Monitor consistency in production deployments
4. Consider rubric refinements for high-variance dimensions

${'='.repeat(80)}
END OF REPORT
${'='.repeat(80)}`;

    return report;
  }

  // Generate detailed dimension analysis report
  generateDimensionAnalysisReport(analysisResults) {
    let report = `DETAILED DIMENSION ANALYSIS REPORT
Generated: ${new Date().toISOString()}
Students Analyzed: ${analysisResults.totalStudents}

${'='.repeat(80)}
DIMENSION-LEVEL BREAKDOWN
${'='.repeat(80)}

`;

    // Aggregate all dimensions across all students
    const allDimensions = [];
    analysisResults.studentResults.forEach(student => {
      student.crossModelConsistency.dimensions.forEach(dim => {
        allDimensions.push({
          ...dim,
          studentId: student.studentId
        });
      });
    });

    // Group by competency and dimension
    const dimensionGroups = {};
    allDimensions.forEach(dim => {
      const key = `${dim.competency} - ${dim.dimension}`;
      if (!dimensionGroups[key]) {
        dimensionGroups[key] = [];
      }
      dimensionGroups[key].push(dim);
    });

    // Analyze each dimension
    Object.entries(dimensionGroups).forEach(([dimensionKey, dimensions]) => {
      const variances = dimensions.map(d => d.variance);
      const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
      const problematicCount = dimensions.filter(d => d.isProblematic).length;
      
      report += `${dimensionKey}:
  Average Variance: ${Math.round(avgVariance * 100) / 100}
  Problematic Students: ${problematicCount}/${dimensions.length}
  Agreement Level: ${avgVariance < 0.05 ? 'EXCELLENT' : avgVariance < 0.1 ? 'GOOD' : avgVariance < 0.25 ? 'MODERATE' : 'POOR'}
`;

      if (problematicCount > 0) {
        report += `  🚨 Problem Students: ${dimensions.filter(d => d.isProblematic).map(d => d.studentId).join(', ')}
`;
      }
      report += `

`;
    });

    // Identify most problematic dimensions
    const dimensionStats = Object.entries(dimensionGroups).map(([key, dims]) => ({
      dimension: key,
      avgVariance: dims.reduce((sum, d) => sum + d.variance, 0) / dims.length,
      problematicRate: dims.filter(d => d.isProblematic).length / dims.length
    }));

    const mostProblematic = dimensionStats
      .sort((a, b) => b.avgVariance - a.avgVariance)
      .slice(0, 5);

    report += `${'='.repeat(80)}
TOP 5 MOST PROBLEMATIC DIMENSIONS
${'='.repeat(80)}

`;

    mostProblematic.forEach((dim, index) => {
      report += `${index + 1}. ${dim.dimension}
   Average Variance: ${Math.round(dim.avgVariance * 100) / 100}
   Problematic Rate: ${Math.round(dim.problematicRate * 100)}%

`;
    });

    return report;
  }

  // Generate problem student investigation report
  generateProblemStudentReport(analysisResults, threshold = 0.4) {
    const problemStudents = analysisResults.studentResults.filter(student => 
      student.crossModelConsistency.summary.crossModelAgreementRate < threshold * 100
    );

    let report = `PROBLEM STUDENT INVESTIGATION REPORT
Generated: ${new Date().toISOString()}
Threshold: Students with <${threshold * 100}% cross-model agreement

${'='.repeat(80)}
IDENTIFIED PROBLEM STUDENTS: ${problemStudents.length}
${'='.repeat(80)}

`;

    problemStudents.forEach(student => {
      report += `STUDENT: ${student.studentId}
Cross-Model Agreement: ${student.crossModelConsistency.summary.crossModelAgreementRate}%
Average Cross-Model Variance: ${student.crossModelConsistency.summary.averageCrossModelVariance}

Model Performance Breakdown:
`;
      
      student.models.forEach(model => {
        if (model.status === 'complete' || model.status === 'partial') {
          report += `  ${model.modelName}: ${model.consistencyRate}% consistent (variance: ${model.averageVariance})
`;
        } else {
          report += `  ${model.modelName}: FAILED - ${model.error}
`;
        }
      });

      // Identify most problematic dimensions for this student
      const problematicDims = student.crossModelConsistency.dimensions
        .filter(d => d.isProblematic)
        .sort((a, b) => b.variance - a.variance);

      if (problematicDims.length > 0) {
        report += `
🚨 Most Problematic Dimensions:
`;
        problematicDims.slice(0, 3).forEach(dim => {
          report += `  - ${dim.competency} - ${dim.dimension}: variance ${dim.variance}
    Scores: [${dim.scores.join(', ')}] from [${dim.modelNames.join(', ')}]
`;
        });
      }

      report += `
INVESTIGATION RECOMMENDATIONS:
`;
      if (student.crossModelConsistency.summary.crossModelAgreementRate < 20) {
        report += `  🔍 CRITICAL: Review evidence quality - may be insufficient or contradictory
  🔍 Check for data collection issues or edge cases
  🔍 Consider manual review by human assessors
`;
      } else if (student.crossModelConsistency.summary.crossModelAgreementRate < 30) {
        report += `  🔍 HIGH: Review rubric clarity for identified problematic dimensions
  🔍 Check for unusual patterns in student data
  🔍 Consider additional evidence collection
`;
      } else {
        report += `  🔍 MODERATE: Focus on high-variance dimensions
  🔍 Review model-specific interpretation differences
`;
      }

      report += `
${'='.repeat(40)}

`;
    });

    // Overall recommendations
    if (problemStudents.length > 0) {
      const avgAgreement = problemStudents.reduce((sum, s) => sum + s.crossModelConsistency.summary.crossModelAgreementRate, 0) / problemStudents.length;
      
      report += `${'='.repeat(80)}
SYSTEMIC RECOMMENDATIONS
${'='.repeat(80)}

Problem Student Rate: ${Math.round((problemStudents.length / analysisResults.totalStudents) * 100)}%
Average Agreement (Problem Students): ${Math.round(avgAgreement)}%

PRIORITY ACTIONS:
1. Review rubric clarity and specificity
2. Investigate data collection quality for problem students
3. Consider human validation for students with <20% agreement
4. Focus model tuning on most problematic dimensions
5. Implement evidence quality checks before assessment

`;
    }

    return report;
  }

  // Save files to local system (browser download) as RTF
  downloadRTFFile(content, filename) {
    // Convert plain text to RTF format
    const rtfContent = this.convertToRTF(content);
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Convert plain text content to RTF format
  convertToRTF(content) {
    // RTF header
    let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    
    // Split content into lines and process each line
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Handle headings (lines with === or lines that end with :)
      if (line.includes('===') || (line.trim().endsWith(':') && line.trim().length > 0 && !line.includes('Evidence:'))) {
        rtf += '\\par\\b\\fs24 ' + this.escapeRTF(line.replace(/=/g, '')) + '\\b0\\fs20\\par';
      }
      // Handle bullet points and numbered items
      else if (line.trim().match(/^(\d+\.|•|-|\*)/)) {
        rtf += '\\par ' + this.escapeRTF(line) + '\\par';
      }
      // Handle indented content (reasoning, evidence)
      else if (line.startsWith('     ') || line.startsWith('  ')) {
        rtf += '\\par\\li720 ' + this.escapeRTF(line.trim()) + '\\li0\\par';
      }
      // Regular lines
      else if (line.trim().length > 0) {
        rtf += '\\par ' + this.escapeRTF(line) + '\\par';
      }
      // Empty lines
      else {
        rtf += '\\par';
      }
    });
    
    // RTF footer
    rtf += '}';
    
    return rtf;
  }

  // Escape special RTF characters
  escapeRTF(text) {
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes
      .replace(/\{/g, '\\{')   // Escape opening braces
      .replace(/\}/g, '\\}')   // Escape closing braces
      .replace(/\n/g, '\\par') // Convert newlines to RTF paragraph breaks
      .replace(/✓/g, 'YES')    // Convert checkmarks to text
      .replace(/✗/g, 'NO');    // Convert X marks to text
  }

  // Generate and download files for a student
  async generateAndDownloadFiles(studentId) {
    try {
      console.log(`📁 Generating and downloading files for ${studentId}...`);
      
      const result = await this.generateStudentAnalysisFiles(studentId);
      
      // Generate filenames with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const promptFilename = `${studentId}_three_competency_prompt_${timestamp}.rtf`;
      const resultsFilename = `${studentId}_three_competency_results_${timestamp}.rtf`;
      
      // Download files
      this.downloadRTFFile(result.prompt_file, promptFilename);
      this.downloadRTFFile(result.results_file, resultsFilename);
      
      console.log(`✅ Downloaded files for ${studentId}:`, {
        promptFile: promptFilename,
        resultsFile: resultsFilename
      });
      
      return {
        success: true,
        student_id: studentId,
        files_generated: [promptFilename, resultsFilename],
        timestamp: result.generation_timestamp
      };
    } catch (error) {
      console.error(`Error generating and downloading files for ${studentId}:`, error);
      throw error;
    }
  }

  // Batch process multiple students
  async generateBatchAnalysis(studentIds, options = {}) {
    try {
      console.log(`🔄 Starting batch three-competency analysis for ${studentIds.length} students...`);
      
      const {
        downloadFiles = true,
        onProgress = null
      } = options;
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        console.log(`📊 Processing student ${i + 1}/${studentIds.length}: ${studentId}`);
        
        try {
          if (downloadFiles) {
            const result = await this.generateAndDownloadFiles(studentId);
            results.push(result);
          } else {
            const result = await this.generateStudentAnalysisFiles(studentId);
            results.push(result);
          }
          
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: studentIds.length,
              studentId,
              success: true
            });
          }
          
          // Small delay to avoid overwhelming the API
          if (i < studentIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${studentId}:`, error);
          errors.push({
            student_id: studentId,
            error: error.message
          });
          
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: studentIds.length,
              studentId,
              success: false,
              error: error.message
            });
          }
        }
      }
      
      const summary = {
        total_students: studentIds.length,
        successful: results.length,
        failed: errors.length,
        success_rate: `${(results.length / studentIds.length * 100).toFixed(1)}%`,
        results,
        errors,
        completed_at: new Date().toISOString()
      };
      
      console.log(`🎉 Batch analysis complete:`, summary);
      return summary;
      
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }
}

export default new ThreeCompetencyAnalyticsService();
