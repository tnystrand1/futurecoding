// Enhanced Competency Analysis Service with Dual LLM Scoring
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

class CompetencyService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.primaryModel = 'anthropic/claude-sonnet-4'; // Primary model for analysis
    this.secondaryModel = 'google/gemini-2.5-flash'; // Secondary model for interrater reliability
    this.initializeCompetencies();
  }

  // Helper function to map student ID to team ID
  getStudentTeamId(studentId) {
    // Map students to their team IDs based on the team structure from ProjectSubmission.jsx
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
    
    // Convert underscore format to regular name for lookup
    const studentName = studentId.replace(/_/g, ' ');
    
    return studentTeamMap[studentName] || 'unassigned_team';
  }

  // Helper function to get questions for a specific day (matches student and teacher components)
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
      // Default questions for days 9+
      return [
        { key: 'learned', label: 'What did you learn in class today?' },
        { key: 'challenges', label: 'What challenges did you face today?' },
        { key: 'feeling', label: 'How are you feeling about your progress?' }
      ];
    }
  }

  initializeCompetencies() {
    // 8 Competency definitions based on the RTF content provided
    this.competencyDefinitions = {
      'sense_of_belonging': {
        name: 'Sense of Belonging',
        description: 'Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it.',
        dimensions: [
          'Feel interpersonal connection with others',
          'Recognize positive messages',
          'Feel they have a rightful place'
        ]
      },
      'steam_interest': {
        name: 'STEAM Interest',
        description: 'Exploration of one\'s identity through STEAM, both in and out of class',
        dimensions: [
          'Actively seeks opportunities',
          'Engages in STEAM for self-expression',
          'Experiments and tinkers',
          'Curious outside of class'
        ]
      },
      'communication': {
        name: 'Communication',
        description: 'Ability to clearly exchange information with others in various settings and for various purposes',
        dimensions: [
          'Demonstrates attentiveness',
          'Clearly shares ideas'
        ]
      },
      'teamwork': {
        name: 'Teamwork',
        description: 'Ability to work cooperatively with diverse peers and adults to achieve shared goals',
        dimensions: [
          'Appropriately shares responsibility',
          'Shows respect and appreciation',
          'Compromises and supports'
        ]
      },
      'problem_solving': {
        name: 'Problem Solving',
        description: 'Ability to identify, understand, and solve challenges effectively',
        dimensions: [
          'Accurately names and understands the problem',
          'Clearly defines success and develops a plan',
          'Evaluates and learns'
        ]
      },
      'opportunity_recognition': {
        name: 'Opportunity Recognition',
        description: 'Ability to identify and act on opportunities for learning, improvement, or advancement',
        dimensions: [
          'Finds opportunities in challenges',
          'Motivated to capitalize',
          'Develops a plan'
        ]
      },
      'steam_agency': {
        name: 'STEAM Agency',
        description: 'Feeling capable of engaging with STEAM tools and technology effectively and responsibly',
        dimensions: [
          'Feels capable of participating',
          'Feels capable of using tools',
          'Uses informed judgment'
        ]
      },
      'continuous_learning': {
        name: 'Continuous Learning',
        description: 'Ongoing process of seeking new skills and knowledge, using reflection and feedback to improve',
        dimensions: [
          'Proactively seeks',
          'Enhances skills with technology',
          'Integrates and reflects'
        ]
      }
    };
  }

  // Get all evidence and interactions for a student
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
        
        // Extract progress metrics with XP validation
        const calculatedXP = Object.values(skills)
          .filter(skill => skill.unlocked)
          .reduce((sum, skill) => sum + (skill.xpEarned || 0), 0);
          
        const storedXP = studentData.totalXP || 0;
        
        // Log XP discrepancy if found
        if (calculatedXP !== storedXP) {
          console.warn(`🚨 XP MISMATCH for ${studentId}:`, {
            storedXP,
            calculatedXP,
            difference: Math.abs(storedXP - calculatedXP),
            unlockedSkills: Object.entries(skills)
              .filter(([_, skill]) => skill.unlocked)
              .map(([id, skill]) => ({ id, xpEarned: skill.xpEarned }))
          });
        }
        
        evidence.progressMetrics = {
          totalXP: storedXP, // Use stored value but log discrepancies
          calculatedXP, // Include calculated value for comparison
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
              xpEarned: skillData.xpEarned || 0,
              xpReward: skillData.xpReward || skillData.xpEarned || 0
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
          // Fallback: query without orderBy while index is building
          const fallbackQuery = query(
            collection(db, 'ai_conversations'),
            where('studentId', '==', studentId)
          );
          conversationsSnapshot = await getDocs(fallbackQuery);
        } else {
          throw error;
        }
      }
      
      // Sort conversations by createdAt (newest first) in case we used fallback query
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
        
        // Get messages for this conversation
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

      // Get daily reflections
      try {
        const reflectionDoc = await getDoc(doc(db, 'reflections', studentId));
        if (reflectionDoc.exists()) {
          const reflectionData = reflectionDoc.data();
          const dailyReflections = reflectionData.dailyReflections || {};
          
          console.log(`📅 Processing daily reflections for ${studentId}:`, {
            totalReflectionDays: Object.keys(dailyReflections).length,
            dayNumbers: Object.values(dailyReflections).map(r => r.dayNumber).sort((a, b) => a - b)
          });
          
          const includedDays = [];
          const excludedDays = [];
          
          Object.values(dailyReflections).forEach(reflection => {
            // Get the questions for this day to validate and extract data
            const questions = this.getQuestionsForDay(reflection.dayNumber);
            
            // Enhanced validation that handles different field types and optional fields
            const hasRequiredAnswers = questions.every(q => {
              // Skip validation for optional fields
              if (q.optional) return true;
              
              const value = reflection[q.key];
              if (!value) return false;
              
              // For string fields, check if trimmed value exists
              if (typeof value === 'string') {
                return value.trim().length > 0;
              }
              
              // For non-string fields (images, etc), just check if value exists
              return true;
            });
            
            console.log(`🔍 Day ${reflection.dayNumber} reflection validation:`, {
              dayNumber: reflection.dayNumber,
              questions: questions.map(q => ({ key: q.key, type: q.type, optional: q.optional })),
              reflectionKeys: Object.keys(reflection),
              hasRequiredAnswers,
              fieldValidation: questions.map(q => ({
                key: q.key,
                exists: !!reflection[q.key],
                value: typeof reflection[q.key] === 'string' ? reflection[q.key].substring(0, 50) + '...' : typeof reflection[q.key]
              }))
            });
            
            if (hasRequiredAnswers) {
              const reflectionData = {
                type: 'daily_reflection',
                dayNumber: reflection.dayNumber,
                timestamp: reflection.submittedAt,
                responses: {}
              };
              
              // Add all responses for this day dynamically
              questions.forEach(q => {
                reflectionData.responses[q.key] = {
                  question: q.label,
                  answer: reflection[q.key]
                };
              });
              
              evidence.reflections.push(reflectionData);
              includedDays.push(reflection.dayNumber);
            } else {
              const missingFields = questions.filter(q => !q.optional && !reflection[q.key]).map(q => q.key);
              let reason = 'Missing required fields';
              
              // Special check for Day 8 field name mismatch
              if (reflection.dayNumber === 8) {
                const oldFieldNames = ['steamInterestRating', 'belongingRating', 'communicationRating'];
                const hasOldFields = oldFieldNames.some(field => reflection[field]);
                if (hasOldFields) {
                  reason = 'Field name mismatch - found old field names instead of expected *Explanation fields';
                  console.warn(`⚠️ Day 8 reflection has old field names:`, {
                    expectedFields: questions.map(q => q.key),
                    foundOldFields: oldFieldNames.filter(field => reflection[field]),
                    allReflectionKeys: Object.keys(reflection)
                  });
                }
              }
              
              excludedDays.push({
                day: reflection.dayNumber,
                reason,
                missingFields
              });
            }
          });
          
          // Log summary of included vs excluded days
          console.log(`✅ Reflection days INCLUDED in competency analysis:`, includedDays.sort((a, b) => a - b));
          console.log(`❌ Reflection days EXCLUDED from competency analysis:`, excludedDays);
        }
      } catch (error) {
        console.warn('Could not fetch daily reflections:', error);
      }

      // Get gallery projects and interactions
      try {
        // Get student's gallery projects (by team ID for team projects)
        const studentTeamId = this.getStudentTeamId(studentId); // Helper method to map student to team
        
        // Query gallery projects
        let galleryQuery;
        if (studentTeamId) {
          galleryQuery = query(
            collection(db, 'galleries'),
            where('teamId', '==', studentTeamId),
            orderBy('createdAt', 'desc')
          );
        } else {
          // Fallback: look for projects where the student might be individually listed
          galleryQuery = query(
            collection(db, 'galleries'),
            orderBy('createdAt', 'desc')
          );
        }
        
        const gallerySnapshot = await getDocs(galleryQuery);
        gallerySnapshot.docs.forEach(projectDoc => {
          const projectData = projectDoc.data();
          
          // Filter to only include projects from student's team if no direct match
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

        // Get gallery interactions (comments, likes, etc.) by this student
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
              type: interactionData.type, // 'like', 'comment', 'reaction'
              galleryId: interactionData.galleryId,
              content: interactionData.content, // For comments
              reaction: interactionData.reaction, // For reactions
              createdAt: interactionData.createdAt
            });
          });
        } catch (indexError) {
          console.warn(`⚠️ Gallery interactions query failed (missing Firestore index): ${indexError.message}`);
          console.warn(`📋 Falling back to simpler query without orderBy...`);
          
          try {
            // Fallback: query without orderBy to avoid index requirement
            const fallbackQuery = query(
              collection(db, 'gallery_interactions'),
              where('studentId', '==', studentId)
            );
            
            const fallbackSnapshot = await getDocs(fallbackQuery);
            const interactions = fallbackSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Sort manually by createdAt
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
            
            console.log(`✅ Retrieved ${evidence.galleryInteractions.length} gallery interactions using fallback query`);
          } catch (fallbackError) {
            console.warn(`❌ Gallery interactions fallback also failed: ${fallbackError.message}`);
          }
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

  // Dual model analysis for interrater reliability
  async analyzeDualCompetencies(studentId, evidence) {
    try {
      console.log('🔄 Running dual-model competency analysis...');
      
      // Run analysis with both models in parallel
      const [primaryAnalysis, secondaryAnalysis] = await Promise.all([
        this.analyzeCompetenciesWithModel(this.primaryModel, evidence, studentId),
        this.analyzeCompetenciesWithModel(this.secondaryModel, evidence, studentId)
      ]);
      
      // Compare and merge results
      const combinedAnalysis = this.mergeAnalyses(primaryAnalysis, secondaryAnalysis);
      combinedAnalysis.studentId = studentId;
      combinedAnalysis.analysisDate = new Date().toISOString();
      
      // Log cost summary
      if (combinedAnalysis.totalApiCost) {
        console.log(`💰 Analysis cost summary for ${studentId}:`, {
          totalCost: `$${combinedAnalysis.totalApiCost.totalCost.toFixed(4)}`,
          tokenUsage: `${combinedAnalysis.totalApiCost.totalInputTokens.toLocaleString()} input + ${combinedAnalysis.totalApiCost.totalOutputTokens.toLocaleString()} output`,
          breakdown: combinedAnalysis.totalApiCost.costBreakdown
        });
      }
      combinedAnalysis.evidenceCount = {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      };
      
      // Add evidence snippets and metrics
      combinedAnalysis.evidenceSnippets = this.extractEvidenceSnippets(evidence);
      combinedAnalysis.totalInteractions = evidence.chatInteractions.reduce((total, chat) => total + chat.messages.length, 0);
      
      // Calculate competency score (excluding N/A ratings)
      const validRatings = combinedAnalysis.competencies
        .filter(comp => comp.rating !== "N/A")
        .map(comp => comp.rating);
      
      if (validRatings.length > 0) {
        combinedAnalysis.competencyScore = Math.round(validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length);
      } else {
        combinedAnalysis.competencyScore = "N/A";
      }
      
      return combinedAnalysis;
    } catch (error) {
      console.error('Error in dual analysis:', error);
      console.log('🔄 Falling back to single model analysis...');
      // Fallback to single model
      const singleAnalysis = await this.analyzeCompetenciesWithModel(this.primaryModel, evidence, studentId);
      
      // Add fallback indicators
      singleAnalysis.studentId = studentId;
      singleAnalysis.analysisDate = new Date().toISOString();
      singleAnalysis.evidenceCount = {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      };
      
      singleAnalysis.evidenceSnippets = this.extractEvidenceSnippets(evidence);
      singleAnalysis.totalInteractions = evidence.chatInteractions.reduce((total, chat) => total + chat.messages.length, 0);
      
      // Calculate competency score (excluding N/A ratings)
      const validRatings = singleAnalysis.competencies
        .filter(comp => comp.rating !== "N/A")
        .map(comp => comp.rating);
      
      if (validRatings.length > 0) {
        singleAnalysis.competencyScore = Math.round(validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length);
      } else {
        singleAnalysis.competencyScore = "N/A";
      }
      
      // Mark as single model fallback
      singleAnalysis.model_comparison = {
        primary_model: this.primaryModel,
        secondary_model: 'Failed',
        agreement_score: 'N/A - Single Model Used',
        disagreements: []
      };
      
      return singleAnalysis;
    }
  }

  // Helper method to run analysis with specific model
  async analyzeCompetenciesWithModel(modelName, evidence, studentId = null) {
    const evidenceSummary = this.prepareEvidenceSummary(evidence, studentId, modelName);
    const competencyDefinitionsText = this.formatCompetencyDefinitions();

    const prompt = `
CRITICAL: Return ONLY raw JSON - no markdown, no code blocks, no explanations.

Analyze student evidence for 8 competencies. Output pure JSON only.

IMPORTANT: If no evidence exists for a competency, set rating to "N/A" and evidence_snippets to empty array.

Competencies: ${Object.keys(this.competencyDefinitions).join(', ')}

Evidence: ${evidenceSummary}

Return this exact JSON structure:
{
  "competencies": [
    {
      "id": "sense_of_belonging",
      "name": "Sense of Belonging", 
      "rating": "N/A" OR 1-10,
      "evidence": ["general evidence point 1", "general evidence point 2"],
      "evidence_snippets": [
        {
          "type": "Chat Interaction" OR "Reflection" OR "Artifact",
          "excerpt": "Direct quote/snippet from student work showing this competency",
          "context": "Brief context about when/how this was demonstrated"
        }
      ],
      "areas_for_improvement": ["suggestion 1", "suggestion 2"],
      "narrative": "Brief explanation with specific reference to evidence",
      "trend": "improving/stable/declining"
    }
    // ... continue for all 8 competencies
  ],
  "overall_assessment": "Brief summary",
  "growth_highlights": ["highlight 1", "highlight 2"],
  "next_steps": ["step 1", "step 2"]
}

Rating scale: 1-3=Emerging, 4-7=Developing, 8-10=Proficient. Use "N/A" if no evidence exists for that competency. Provide actual excerpts from student work in evidence_snippets.`;

    // Log the full prompt being sent to the LLM
    console.log(`🤖 FULL LLM PROMPT FOR ${modelName}:`);
    console.log(`=====================================`);
    console.log(`SYSTEM: You are an expert educational assessor specializing in competency-based evaluation for high school STEAM education. Always provide complete, valid JSON responses.`);
    console.log(`\nUSER PROMPT (${prompt.length} characters):`);
    console.log(prompt);
    console.log(`=====================================`);

    console.log(`🚀 Sending request to ${modelName} with ${prompt.length} character prompt and 75k token limit`);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FUTURE CODING ACADEMY - Competency Analysis'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assessor specializing in competency-based evaluation for high school STEAM education. Always provide complete, valid JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 75000  // Ultra-high limit to ensure complete competency analyses
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} for model ${modelName}`);
    }

    const data = await response.json();
    // Calculate API costs
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    
    let inputCost = 0;
    let outputCost = 0;
    
    if (modelName.includes('claude') || modelName.includes('anthropic')) {
      // Claude Sonnet 4: $3/M input, $15/M output
      inputCost = (inputTokens / 1000000) * 3;
      outputCost = (outputTokens / 1000000) * 15;
    } else if (modelName.includes('gemini') || modelName.includes('google')) {
      // Gemini 2.5 Flash: $0.30/M input, $2.50/M output  
      inputCost = (inputTokens / 1000000) * 0.30;
      outputCost = (outputTokens / 1000000) * 2.50;
    }
    
    const totalCost = inputCost + outputCost;
    
    console.log(`📥 Response metadata from ${modelName}:`, {
      usage: data.usage,
      finishReason: data.choices[0].finish_reason,
      responseLength: data.choices[0].message.content.length,
      inputTokens: inputTokens.toLocaleString(),
      outputTokens: outputTokens.toLocaleString(),
      cost: `$${totalCost.toFixed(4)} (in: $${inputCost.toFixed(4)}, out: $${outputCost.toFixed(4)})`
    });
    
    // Store cost data for later use
    const costData = {
      modelName,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost
    };
    
    let analysisText = data.choices[0].message.content;
    
    // Clean up the response - remove markdown code blocks and find JSON
    // Handle patterns like: ```json\n{...}\n``` or ```\n{...}\n```
    let cleanedText = analysisText;
    
    // Remove opening markdown blocks
    cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/, '');
    
    // Remove closing markdown blocks  
    cleanedText = cleanedText.replace(/\n?\s*```\s*$/, '');
    
    // Find the actual JSON start
    const jsonStart = cleanedText.indexOf('{');
    if (jsonStart > 0) {
      cleanedText = cleanedText.substring(jsonStart);
    }
    
    // Find the actual JSON end and remove any trailing text after the last }
    const jsonEnd = cleanedText.lastIndexOf('}');
    if (jsonEnd > 0 && jsonEnd < cleanedText.length - 1) {
      cleanedText = cleanedText.substring(0, jsonEnd + 1);
    }
    
    // Remove control characters that cause JSON parsing errors
    analysisText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    console.log(`🧹 Cleaned response from ${modelName}: ${analysisText.length} chars (was ${data.choices[0].message.content.length})`);
    console.log(`🔍 Response starts: "${analysisText.substring(0, 100)}"`);
    console.log(`🔚 Response ends: "${analysisText.slice(-100)}"`);  
    
    // Handle truncated responses more intelligently
    const responseEndsCorrectly = analysisText.trim().endsWith('}') || analysisText.trim().endsWith(']}');
    if (!responseEndsCorrectly || analysisText.length < 5000) {
      console.warn(`⚠️ AI response appears truncated for ${modelName} (${analysisText.length} chars), attempting to fix...`);
      console.log(`📏 Response length: ${analysisText.length} characters`);
      console.log(`🔚 Response ending: "${analysisText.slice(-100)}"`); // Show last 100 chars
      
      // Try to find the last complete competency object
      const competencyPattern = /"id":\s*"[^"]+"/g;
      const competencies = [...analysisText.matchAll(competencyPattern)];
      console.log(`🔍 Found ${competencies.length} competency objects in truncated response`);
      
      if (competencies.length >= 6) { // If we have at least 6 competencies, try to repair
        console.log(`🔧 Attempting conservative JSON repair with ${competencies.length} competencies`);
        
        // Try to find the last complete competency without being too aggressive
        let repairedText = analysisText;
        
        // Step 1: Clean up common truncation artifacts
        repairedText = repairedText.replace(/[,\s]*$/, ''); // Remove trailing commas/whitespace
        repairedText = repairedText.replace(/,\s*[\{\[][\s\S]*$/, ''); // Remove incomplete trailing objects
        
        // Step 2: Check if we have a complete competencies array
        const competenciesStart = repairedText.indexOf('"competencies":');
        if (competenciesStart >= 0) {
          const arrayStart = repairedText.indexOf('[', competenciesStart);
          if (arrayStart >= 0) {
            // Count complete competency objects from the array start
            let completeCompetencies = 0;
            let braceCount = 0;
            let inCompetency = false;
            
            for (let i = arrayStart; i < repairedText.length; i++) {
              if (repairedText[i] === '{') {
                braceCount++;
                inCompetency = true;
              } else if (repairedText[i] === '}') {
                braceCount--;
                if (inCompetency && braceCount === 0) {
                  completeCompetencies++;
                  inCompetency = false;
                }
              }
            }
            
            console.log(`🔍 Found ${completeCompetencies} complete competency objects in response`);
            
            // If we have most competencies, try minimal repair
            if (completeCompetencies >= 6) {
              // Only add missing closing brackets without truncating content
              const openBraces = (repairedText.match(/\[/g) || []).length;
              const closeBraces = (repairedText.match(/\]/g) || []).length;
              const openCurlies = (repairedText.match(/\{/g) || []).length;
              const closeCurlies = (repairedText.match(/\}/g) || []).length;
              
              // Close arrays first
              if (openBraces > closeBraces) {
                repairedText += '\n  ]';
              }
              
              // Add minimal overall_assessment if missing and we're missing the closing structure
              if (!repairedText.includes('"overall_assessment"') && openCurlies > closeCurlies) {
                repairedText += ',\n  "overall_assessment": "Comprehensive analysis completed",';
                repairedText += '\n  "growth_highlights": ["Evidence-based assessment"],';
                repairedText += '\n  "next_steps": ["Continue skill development"]';
              }
              
              // Close main object
              if (openCurlies > closeCurlies) {
                repairedText += '\n}';
              }
              
              analysisText = repairedText;
              console.log(`✅ Conservative JSON repair completed for ${modelName} (${analysisText.length} chars preserved)`);
            }
          }
        }
      } else {
        console.warn(`❌ Too few competencies found (${competencies.length}) in truncated response from ${modelName}`);
      }
    }
    
    // Debug: Log JSON structure before parsing
    console.log(`🔍 About to parse JSON for ${modelName} (${analysisText.length} chars)`);
    console.log(`📋 JSON structure check:`, {
      startsWithBrace: analysisText.trim().startsWith('{'),
      endsWithBrace: analysisText.trim().endsWith('}'),
      hasCompetencies: analysisText.includes('"competencies"'),
      openBraces: (analysisText.match(/\{/g) || []).length,
      closeBraces: (analysisText.match(/\}/g) || []).length,
      openSquare: (analysisText.match(/\[/g) || []).length,
      closeSquare: (analysisText.match(/\]/g) || []).length
    });
    
    try {
      const analysis = JSON.parse(analysisText);
      
          // Validate that we have all required competencies
    if (!analysis.competencies || analysis.competencies.length < 8) {
      console.warn(`❌ Incomplete competency analysis from ${modelName} - only ${analysis.competencies?.length || 0}/8 competencies found`);
      console.warn(`🔄 Switching to fallback analysis to ensure full assessment`);
      return this.generateFallbackAnalysis(studentId, evidence);
    }
      
      // Mark which model generated this analysis and include cost data
      analysis.generatingModel = modelName;
      analysis.apiCost = costData;
      return analysis;
    } catch (parseError) {
      console.error(`Error parsing AI response from ${modelName}:`, parseError);
      console.error(`Raw AI response (first 1000 chars):`, analysisText.substring(0, 1000));
      
      // Enhanced debug: Show context around the error position if available
      if (parseError.message.includes('position')) {
        const position = parseInt(parseError.message.match(/position (\d+)/)?.[1]);
        if (position) {
          const start = Math.max(0, position - 100);
          const end = Math.min(analysisText.length, position + 100);
          console.error(`🔍 Context around error position ${position}:`, analysisText.substring(start, end));
          console.error(`🎯 Error character: "${analysisText[position] || 'EOF'}"`);
        }
      }
      
      // Use fallback analysis if parsing fails
      console.error(`Generating fallback competency analysis for ${modelName}`);
      return this.generateFallbackAnalysis(studentId, evidence);
    }
  }

  // Merge analyses from both models
  mergeAnalyses(primaryAnalysis, secondaryAnalysis) {
    const merged = {
      competencies: [],
      model_comparison: {
        primary_model: this.primaryModel,
        secondary_model: this.secondaryModel,
        agreement_score: 0,
        disagreements: []
      }
    };
    
    // Merge competency scores
    primaryAnalysis.competencies.forEach((primaryComp, index) => {
      const secondaryComp = secondaryAnalysis.competencies.find(g => g.id === primaryComp.id);
      
      if (secondaryComp) {
        const primaryRating = primaryComp.rating === "N/A" ? null : primaryComp.rating;
        const secondaryRating = secondaryComp.rating === "N/A" ? null : secondaryComp.rating;
        
        let finalRating, confidence;
        
        if (primaryRating === null && secondaryRating === null) {
          finalRating = "N/A";
          confidence = "High";
        } else if (primaryRating === null || secondaryRating === null) {
          finalRating = primaryRating || secondaryRating;
          confidence = "Medium";
        } else {
          const diff = Math.abs(primaryRating - secondaryRating);
          finalRating = Math.round((primaryRating + secondaryRating) / 2);
          confidence = diff <= 1 ? "High" : diff <= 2 ? "Medium" : "Low";
          
          if (diff > 2) {
            merged.model_comparison.disagreements.push({
              competency: primaryComp.name,
              primary_score: primaryRating,
              secondary_score: secondaryRating,
              difference: diff
            });
          }
        }
        
        merged.competencies.push({
          ...primaryComp,
          rating: finalRating,
          confidence: confidence,
          model_scores: {
            primary: primaryRating,
            secondary: secondaryRating
          },
          // Combine evidence snippets from both models
          evidence_snippets: [
            ...(primaryComp.evidence_snippets || []),
            ...(secondaryComp.evidence_snippets || [])
          ].slice(0, 3) // Limit to top 3 snippets per competency
        });
      }
    });
    
    // Calculate agreement score
    const validComparisons = merged.competencies.filter(c => 
      c.model_scores.primary !== null && c.model_scores.secondary !== null
    );
    
    if (validComparisons.length > 0) {
      const totalDiff = validComparisons.reduce((sum, comp) => 
        sum + Math.abs(comp.model_scores.primary - comp.model_scores.secondary), 0
      );
      merged.model_comparison.agreement_score = Math.max(0, 100 - (totalDiff / validComparisons.length) * 10);
    }
    
    // Use primary model's overall assessment but note dual analysis
    merged.overall_assessment = `${primaryAnalysis.overall_assessment} [Dual-model analysis with ${merged.model_comparison.agreement_score.toFixed(1)}% agreement]`;
    merged.growth_highlights = primaryAnalysis.growth_highlights;
    merged.next_steps = primaryAnalysis.next_steps;
    
    // Aggregate API costs from both models
    const primaryCost = primaryAnalysis.apiCost || { totalCost: 0, inputTokens: 0, outputTokens: 0 };
    const secondaryCost = secondaryAnalysis.apiCost || { totalCost: 0, inputTokens: 0, outputTokens: 0 };
    
    merged.totalApiCost = {
      primary: primaryCost,
      secondary: secondaryCost,
      totalCost: primaryCost.totalCost + secondaryCost.totalCost,
      totalInputTokens: primaryCost.inputTokens + secondaryCost.inputTokens,
      totalOutputTokens: primaryCost.outputTokens + secondaryCost.outputTokens,
      costBreakdown: `$${(primaryCost.totalCost + secondaryCost.totalCost).toFixed(4)} (${primaryCost.modelName || 'Primary'}: $${primaryCost.totalCost.toFixed(4)}, ${secondaryCost.modelName || 'Secondary'}: $${secondaryCost.totalCost.toFixed(4)})`
    };
    
    return merged;
  }

  // Legacy single model analysis (kept for backwards compatibility)
  async analyzeCompetencies(studentId, evidence) {
    try {
      return await this.analyzeCompetenciesWithModel(this.primaryModel, evidence, studentId);
    } catch (error) {
      console.error('Error analyzing competencies:', error);
      throw error;
    }
  }

  // Generate fallback analysis when AI parsing fails
  generateFallbackAnalysis(studentId, evidence) {
    console.log('Generating fallback competency analysis');
    
    const competencies = Object.entries(this.competencyDefinitions).map(([id, comp]) => ({
      id,
      name: comp.name,
      rating: evidence.skillsUnlocked.length > 0 ? Math.min(Math.max(3 + Math.floor(evidence.skillsUnlocked.length / 2), 1), 10) : "N/A",
      evidence: [
        `${evidence.skillsUnlocked.length} skills unlocked`,
        `${evidence.artifacts.length} artifacts submitted`,
        `${evidence.chatInteractions.length} AI interactions recorded`,
        `${evidence.galleryProjects.length} gallery projects submitted`,
        `${evidence.galleryInteractions.length} gallery interactions`,
        `${evidence.achievements.length} achievements earned`
      ],
      evidence_snippets: [],
      areas_for_improvement: [
        'Continue building evidence through skill completion',
        'Engage more deeply with reflection activities'
      ],
      narrative: `Basic analysis based on ${evidence.skillsUnlocked.length} skills unlocked, ${evidence.artifacts.length} artifacts, ${evidence.galleryProjects.length} gallery projects, and ${evidence.achievements.length} achievements. More detailed assessment requires AI analysis.`,
      trend: 'stable'
    }));

    return {
      studentId,
      analysisDate: new Date().toISOString(),
      competencies,
      overall_assessment: `Student has completed ${evidence.skillsUnlocked.length} skills, submitted ${evidence.artifacts.length} artifacts, created ${evidence.galleryProjects.length} gallery projects, and earned ${evidence.achievements.length} achievements. This is a basic analysis - AI analysis temporarily unavailable.`,
      growth_highlights: [
        'Active skill progression',
        'Consistent artifact submission'
      ],
      next_steps: [
        'Continue unlocking additional skills',
        'Focus on detailed reflections'
      ],
      evidenceCount: {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      },
      fallbackAnalysis: true,
      totalApiCost: {
        primary: { totalCost: 0, inputTokens: 0, outputTokens: 0, modelName: 'N/A' },
        secondary: { totalCost: 0, inputTokens: 0, outputTokens: 0, modelName: 'N/A' },
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        costBreakdown: '$0.0000 (Fallback analysis - no API calls)'
      }
    };
  }

  // Format competency definitions for AI prompt
  formatCompetencyDefinitions() {
    let text = '';
    Object.entries(this.competencyDefinitions).forEach(([id, comp]) => {
      text += `\n${comp.name}:\n`;
      text += `Description: ${comp.description}\n`;
      text += `Key Dimensions:\n`;
      comp.dimensions.forEach(dim => {
        text += `- ${dim}\n`;
      });
      text += '\n';
    });
    return text;
  }

  // Remove personally identifying information from text
  anonymizeText(text, studentId) {
    if (!text) return text;
    
    // Create a temporary anonymous ID for this session
    const tempId = `STUDENT_${studentId.slice(-6).toUpperCase()}`;
    
    // Common name patterns and personal identifiers to anonymize
    let anonymized = text;
    
    // Remove email addresses
    anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
    
    // Replace common personal pronouns with student ID when referring to self
    anonymized = anonymized.replace(/\b(my name is|i am|i'm called)\s+[a-zA-Z]+/gi, `I am ${tempId}`);
    
    // Replace "My name" references
    anonymized = anonymized.replace(/\bmy name\b/gi, `my identifier`);
    
    // Remove phone numbers
    anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
    
    return anonymized;
  }

  // Estimate tokens more accurately than simple character division
  estimateTokens(text) {
    // More accurate token estimation based on:
    // - Average English word = ~1.3 tokens
    // - Punctuation and spacing = additional tokens
    // - Technical terms and code = often more tokens
    const words = text.split(/\s+/).length;
    const specialChars = (text.match(/[^\w\s]/g) || []).length;
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    
    return Math.ceil(words * 1.4 + specialChars * 0.3 + codeBlocks * 50);
  }

  // Create optimized evidence summary that fits within LLM token limits
  createOptimizedEvidenceSummary(evidence, studentId, modelName = 'claude', maxTokens = null) {
    // Set model-specific token limits (leaving headroom for system prompt)
    if (!maxTokens) {
      if (modelName.includes('claude') || modelName.includes('sonnet')) {
        maxTokens = 180000; // 90% of Claude's 200k limit
      } else if (modelName.includes('gemini') || modelName.includes('google')) {
        maxTokens = 900000; // 90% of Gemini's 1M limit  
      } else {
        maxTokens = 50000; // Conservative fallback for unknown models
      }
    }
    console.log(`🎯 Creating evidence summary for ${modelName} - Student: ${studentId} (${maxTokens.toLocaleString()} token limit)`);
    console.log(`📋 Evidence counts:`, {
      skillsUnlocked: evidence.skillsUnlocked.length,
      artifacts: evidence.artifacts.length,
      reflections: evidence.reflections.length,
      chatInteractions: evidence.chatInteractions.length,
      galleryProjects: evidence.galleryProjects.length,
      galleryInteractions: evidence.galleryInteractions.length,
      achievements: evidence.achievements.length
    });
    
    const sections = [];
    
    // 1. Skills and Evidence (High Priority)
    if (evidence.skillsUnlocked.length > 0) {
      let skillsSection = `\n=== SKILLS UNLOCKED (${evidence.skillsUnlocked.length}) ===\n`;
      evidence.skillsUnlocked.forEach(skill => {
        skillsSection += `Skill: ${skill.skillId}\n`;
        skillsSection += `XP Earned: ${skill.xpEarned || 0}\n`;
        if (skill.evidence.reflection && skill.evidence.reflection.trim()) {
          const reflection = this.anonymizeText(skill.evidence.reflection, studentId);
          skillsSection += `Reflection: ${reflection}\n`; // Include full reflection
        }
        if (skill.evidence.questionAnswers && Array.isArray(skill.evidence.questionAnswers)) {
          skillsSection += `Answers:\n`;
          skill.evidence.questionAnswers.forEach((answer, i) => {
            skillsSection += `  Q${i + 1}: ${this.anonymizeText(answer, studentId)}\n`; // Include full answers
          });
        }
        skillsSection += `Unlocked: ${new Date(skill.unlockedAt).toLocaleDateString()}\n\n`;
      });
      sections.push({ priority: 1, content: skillsSection, tokens: this.estimateTokens(skillsSection) });
    }

    // 2. Daily Reflections (High Priority) 
    const dailyReflections = evidence.reflections.filter(r => r.type === 'daily_reflection');
    if (dailyReflections.length > 0) {
      let reflectionsSection = `\n=== DAILY REFLECTIONS (${dailyReflections.length}) ===\n`;
      dailyReflections.forEach(reflection => {
        reflectionsSection += `\nDay ${reflection.dayNumber} Reflection (${new Date(reflection.timestamp).toLocaleDateString()}):\n`;
        Object.values(reflection.responses).forEach(response => {
          const answer = this.anonymizeText(response.answer, studentId);
          reflectionsSection += `Q: ${response.question}\n`;
          reflectionsSection += `A: ${answer}\n\n`;
        });
      });
      sections.push({ priority: 1, content: reflectionsSection, tokens: this.estimateTokens(reflectionsSection) });
    }

    // 3. Artifacts (Medium Priority)
    if (evidence.artifacts.length > 0) {
      let artifactsSection = `\n=== ARTIFACTS (${evidence.artifacts.length}) ===\n`;
      evidence.artifacts.forEach(artifact => { // Include ALL artifacts
        artifactsSection += `\nArtifact: ${artifact.type} (${artifact.skillId})\n`;
        artifactsSection += `Date: ${new Date(artifact.timestamp).toLocaleDateString()}\n`;
        const content = this.anonymizeText(artifact.content, studentId);
        artifactsSection += `Content:\n${content}\n\n`;
      });
      sections.push({ priority: 2, content: artifactsSection, tokens: this.estimateTokens(artifactsSection) });
    }

    // 4. Chat Interactions (Medium Priority)
    if (evidence.chatInteractions.length > 0) {
      let chatSection = `\n=== AI CHAT INTERACTIONS (${evidence.chatInteractions.length} conversations) ===\n`;
      evidence.chatInteractions.forEach(chat => { // Include ALL conversations
        chatSection += `\nConversation with ${chat.persona} (${new Date(chat.createdAt?.toDate?.() || chat.createdAt).toLocaleDateString()}):\n`;
        const studentMessages = chat.messages.filter(msg => msg.isUser);
        studentMessages.forEach((msg, index) => {
          const content = this.anonymizeText(msg.content, studentId);
          chatSection += `Student Message ${index + 1}: ${content}\n`;
        });
        chatSection += `Total student messages: ${studentMessages.length}\n\n`;
      });
      sections.push({ priority: 2, content: chatSection, tokens: this.estimateTokens(chatSection) });
    }

    // 5. Gallery Projects (Medium Priority)
    if (evidence.galleryProjects.length > 0) {
      let gallerySection = `\n=== GALLERY PROJECTS (${evidence.galleryProjects.length}) ===\n`;
      evidence.galleryProjects.forEach(project => {
        gallerySection += `\nProject: ${project.title}\n`;
        gallerySection += `Team: ${project.teamName}\n`;
        gallerySection += `Website URL: ${project.websiteUrl}\n`;
        const desc = this.anonymizeText(project.description, studentId);
        gallerySection += `Description: ${desc}\n`; // Include full description
        gallerySection += `Technologies: ${project.technologies.join(', ')}\n`;
        gallerySection += `Views: ${project.metrics.views || 0} | Likes: ${project.metrics.likes || 0}\n`;
        gallerySection += `Created: ${new Date(project.createdAt?.toDate?.() || project.createdAt).toLocaleDateString()}\n\n`;
      });
      sections.push({ priority: 2, content: gallerySection, tokens: this.estimateTokens(gallerySection) });
    }

    // 6. Gallery Interactions & Achievements (Lower Priority)
    if (evidence.galleryInteractions.length > 0 || evidence.achievements.length > 0) {
      let miscSection = '';
      
      if (evidence.galleryInteractions.length > 0) {
        miscSection += `\n=== GALLERY INTERACTIONS (${evidence.galleryInteractions.length}) ===\n`;
        evidence.galleryInteractions.forEach(interaction => { // Include ALL interactions
          miscSection += `\n${interaction.type} on ${interaction.galleryId}\n`;
          miscSection += `Date: ${new Date(interaction.createdAt?.toDate?.() || interaction.createdAt).toLocaleDateString()}\n`;
          if (interaction.content) {
            const content = this.anonymizeText(interaction.content, studentId);
            miscSection += `Content: ${content}\n`; // Include full content
          }
          if (interaction.reaction) {
            miscSection += `Reaction: ${interaction.reaction}\n`;
          }
          miscSection += '\n';
        });
      }
      
      if (evidence.achievements.length > 0) {
        miscSection += `\n=== ACHIEVEMENTS (${evidence.achievements.length}) ===\n`;
        evidence.achievements.forEach(achievement => { // Include ALL achievements
          miscSection += `\n${achievement.title}\n`;
          miscSection += `Description: ${achievement.description}\n`; // Include full description
          miscSection += `XP Reward: ${achievement.xpReward}\n`;
          miscSection += `Earned: ${new Date(achievement.earnedAt?.toDate?.() || achievement.earnedAt).toLocaleDateString()}\n\n`;
        });
      }
      
      if (miscSection) {
        sections.push({ priority: 3, content: miscSection, tokens: this.estimateTokens(miscSection) });
      }
    }

    // 7. Progress Metrics (Always include, low token cost)
    let metricsSection = `\n=== PROGRESS METRICS ===\n`;
    metricsSection += `Total XP: ${evidence.progressMetrics.totalXP} | Level: ${evidence.progressMetrics.currentLevel}\n`;
    metricsSection += `Website Power: ${evidence.progressMetrics.websitePower} | Profile: ${evidence.progressMetrics.developerProfile || 'None'}\n`;
    sections.push({ priority: 1, content: metricsSection, tokens: this.estimateTokens(metricsSection) });

    // Build final summary within token limits
    let summary = '';
    let totalTokens = 0;
    
    // Add sections by priority until we hit token limit
    const sortedSections = sections.sort((a, b) => a.priority - b.priority);
    
    for (const section of sortedSections) {
      if (totalTokens + section.tokens <= maxTokens) {
        summary += section.content;
        totalTokens += section.tokens;
      } else {
        console.warn(`⚠️ Skipping section due to token limit (${section.tokens} tokens would exceed ${maxTokens} limit)`);
      }
    }

    console.log(`📊 Optimized summary results:`, {
      finalLength: summary.length,
      estimatedTokens: Math.round(totalTokens),
      sectionsIncluded: sortedSections.filter(s => summary.includes(s.content.substring(0, 50))).length,
      sectionsTotal: sortedSections.length,
      tokenLimit: maxTokens,
      utilizationPct: Math.round((totalTokens / maxTokens) * 100)
    });

    // Log the full evidence summary for debugging
    console.log(`📤 FULL LLM EVIDENCE SUMMARY (${summary.length} characters):`);
    console.log(`=====================================`);
    console.log(summary);
    console.log(`=====================================`);
    
    return summary;
  }

  // Prepare evidence summary for AI analysis (with privacy protection)
  prepareEvidenceSummary(evidence, studentId, modelName = 'claude') {
    console.log(`🔤 Preparing evidence summary for ${modelName} - Student: ${studentId}`);
    console.log(`📋 Evidence counts:`, {
      skillsUnlocked: evidence.skillsUnlocked.length,
      artifacts: evidence.artifacts.length,
      reflections: evidence.reflections.length,
      chatInteractions: evidence.chatInteractions.length,
      galleryProjects: evidence.galleryProjects.length,
      galleryInteractions: evidence.galleryInteractions.length,
      achievements: evidence.achievements.length
    });
    
    // Always use optimized summary with model-specific token limits
    return this.createOptimizedEvidenceSummary(evidence, studentId, modelName);
  }

  // Get competency analysis for a student (now uses dual model by default)
  async getCompetencyAnalysis(studentId) {
    try {
      console.log(`🔍 Starting dual-model competency analysis for student: ${studentId}`);
      
      // Get all evidence
      const evidence = await this.getStudentEvidence(studentId);
      console.log(`📊 Evidence collected:`, {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      });

      // Debug: Log sample chat interactions
      if (evidence.chatInteractions.length > 0) {
        console.log(`💬 Sample chat interactions:`, evidence.chatInteractions.slice(0, 2).map(chat => ({
          persona: chat.persona,
          messageCount: chat.messages.length,
          studentMessages: chat.messages.filter(msg => msg.isUser).length,
          recentStudentMessage: chat.messages.filter(msg => msg.isUser).slice(-1)[0]?.content?.substring(0, 100)
        })));
      }

      // Analyze competencies with dual models
      const analysis = await this.analyzeDualCompetencies(studentId, evidence);
      console.log(`✅ Dual-model competency analysis completed for ${studentId}`);

      return analysis;
    } catch (error) {
      console.error('Error in getCompetencyAnalysis:', error);
      throw error;
    }
  }

  // Extract evidence snippets for PDF reports
  extractEvidenceSnippets(evidence) {
    const snippets = [];
    console.log(`🔍 Extracting evidence snippets from:`, {
      reflections: evidence.reflections.length,
      artifacts: evidence.artifacts.length,
      chatInteractions: evidence.chatInteractions.length,
      galleryProjects: evidence.galleryProjects.length,
      galleryInteractions: evidence.galleryInteractions.length
    });
    
    // Extract from reflections
    evidence.reflections.forEach((reflection, index) => {
      if (reflection.content && reflection.content.length > 20) {
        snippets.push({
          type: 'Reflection',
          skillId: reflection.skillId,
          excerpt: reflection.content.substring(0, 150) + (reflection.content.length > 150 ? '...' : ''),
          timestamp: reflection.timestamp
        });
      }
    });

    // Extract from artifacts
    evidence.artifacts.forEach((artifact, index) => {
      if (artifact.content && artifact.content.length > 20) {
        snippets.push({
          type: artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1),
          skillId: artifact.skillId,
          excerpt: artifact.content.substring(0, 150) + (artifact.content.length > 150 ? '...' : ''),
          timestamp: artifact.timestamp
        });
      }
    });

    // Extract from chat interactions (meaningful student messages)
    evidence.chatInteractions.forEach((chat, chatIndex) => {
      const meaningfulMessages = chat.messages
        .filter(msg => msg.isUser && msg.content && msg.content.length > 30)
        .slice(-2); // Last 2 meaningful messages per conversation
      
      meaningfulMessages.forEach((message, msgIndex) => {
        snippets.push({
          type: 'Chat Interaction',
          skillId: `${chat.persona} conversation`,
          excerpt: message.content.substring(0, 150) + (message.content.length > 150 ? '...' : ''),
          timestamp: message.timestamp
        });
      });
    });

    // Extract from gallery projects (teamwork, problem-solving evidence)
    evidence.galleryProjects.forEach((project, index) => {
      if (project.description && project.description.length > 20) {
        snippets.push({
          type: 'Gallery Project',
          skillId: `${project.title} (Team: ${project.teamName})`,
          excerpt: project.description.substring(0, 150) + (project.description.length > 150 ? '...' : ''),
          timestamp: project.createdAt
        });
      }
    });

    // Extract from gallery interactions (communication evidence)
    evidence.galleryInteractions.forEach((interaction, index) => {
      if (interaction.content && interaction.content.length > 20) {
        snippets.push({
          type: 'Gallery Comment',
          skillId: `Comment on project`,
          excerpt: interaction.content.substring(0, 150) + (interaction.content.length > 150 ? '...' : ''),
          timestamp: interaction.createdAt
        });
      }
    });

    // Extract from achievements (milestone evidence)
    evidence.achievements.forEach((achievement, index) => {
      snippets.push({
        type: 'Achievement',
        skillId: achievement.title,
        excerpt: achievement.description,
        timestamp: achievement.earnedAt
      });
    });

    // Sort by timestamp (newest first) and limit to 15 most recent (increased from 10)
    const sortedSnippets = snippets
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    console.log(`📝 Generated ${sortedSnippets.length} evidence snippets:`, 
      sortedSnippets.map(s => ({ type: s.type, excerpt: s.excerpt.substring(0, 50) + '...' }))
    );

    return sortedSnippets;
  }

  // Get date ranges for each of the 8 days
  getDayDateRanges() {
    return {
      1: { start: '2025-08-11', end: '2025-08-11' },
      2: { start: '2025-08-12', end: '2025-08-12' },
      3: { start: '2025-08-13', end: '2025-08-13' },
      4: { start: '2025-08-14', end: '2025-08-14' },
      5: { start: '2025-08-18', end: '2025-08-18' },
      6: { start: '2025-08-19', end: '2025-08-19' },
      7: { start: '2025-08-20', end: '2025-08-20' },
      8: { start: '2025-08-21', end: '2025-08-21' }
    };
  }

  // Get cumulative evidence up to a specific day (excluding Day 8 self-ratings)
  async getCumulativeEvidenceForDay(studentId, dayNumber, excludeDay8SelfRatings = true) {
    try {
      console.log(`📅 Collecting cumulative evidence for ${studentId} up to Day ${dayNumber}`);

      const dayRanges = this.getDayDateRanges();
      const endDate = new Date(dayRanges[dayNumber].end + 'T23:59:59.999Z');

      // Get all evidence using existing method
      const allEvidence = await this.getStudentEvidence(studentId);

      // Filter evidence to be cumulative up to the specified day
      const filteredEvidence = {
        artifacts: [],
        reflections: [],
        chatInteractions: [],
        skillsUnlocked: [],
        galleryProjects: [],
        galleryInteractions: [],
        achievements: [],
        progressMetrics: allEvidence.progressMetrics
      };

      // Filter skills unlocked by timestamp
      filteredEvidence.skillsUnlocked = allEvidence.skillsUnlocked.filter(skill => {
        const unlockDate = new Date(skill.unlockedAt);
        return unlockDate <= endDate;
      });

      // Filter artifacts by timestamp
      filteredEvidence.artifacts = allEvidence.artifacts.filter(artifact => {
        const artifactDate = new Date(artifact.timestamp);
        return artifactDate <= endDate;
      });

      // Filter reflections by timestamp and exclude Day 8 self-ratings if specified
      filteredEvidence.reflections = allEvidence.reflections.filter(reflection => {
        const reflectionDate = new Date(reflection.timestamp || reflection.submittedAt);
        const isBeforeEndDate = reflectionDate <= endDate;

        // Exclude Day 8 self-ratings if requested
        if (excludeDay8SelfRatings && reflection.dayNumber === 8) {
          // Check if this reflection contains self-rating questions
          const day8Questions = this.getQuestionsForDay(8);
          const selfRatingKeys = ['steamInterestRatingExplanation', 'belongingRatingExplanation', 'communicationRatingExplanation'];

          // If this reflection has self-rating content, exclude it
          const hasSelfRatings = selfRatingKeys.some(key =>
            reflection.responses && reflection.responses[key] ||
            reflection[key] && typeof reflection[key] === 'string' && reflection[key].includes('Rate yourself')
          );

          if (hasSelfRatings) {
            console.log(`🚫 Excluding Day 8 self-rating reflection for ${studentId}`);
            return false;
          }
        }

        return isBeforeEndDate;
      });

      // Filter chat interactions by timestamp
      filteredEvidence.chatInteractions = allEvidence.chatInteractions.filter(chat => {
        const chatDate = new Date(chat.createdAt?.toDate?.() || chat.createdAt);
        return chatDate <= endDate;
      });

      // Filter gallery projects by timestamp
      filteredEvidence.galleryProjects = allEvidence.galleryProjects.filter(project => {
        const projectDate = new Date(project.createdAt?.toDate?.() || project.createdAt);
        return projectDate <= endDate;
      });

      // Filter gallery interactions by timestamp
      filteredEvidence.galleryInteractions = allEvidence.galleryInteractions.filter(interaction => {
        const interactionDate = new Date(interaction.createdAt?.toDate?.() || interaction.createdAt);
        return interactionDate <= endDate;
      });

      // Filter achievements by timestamp
      filteredEvidence.achievements = allEvidence.achievements.filter(achievement => {
        const achievementDate = new Date(achievement.earnedAt?.toDate?.() || achievement.earnedAt);
        return achievementDate <= endDate;
      });

      console.log(`✅ Cumulative evidence for Day ${dayNumber}:`, {
        skillsUnlocked: filteredEvidence.skillsUnlocked.length,
        artifacts: filteredEvidence.artifacts.length,
        reflections: filteredEvidence.reflections.length,
        chatInteractions: filteredEvidence.chatInteractions.length,
        galleryProjects: filteredEvidence.galleryProjects.length,
        galleryInteractions: filteredEvidence.galleryInteractions.length,
        achievements: filteredEvidence.achievements.length
      });

      return filteredEvidence;
    } catch (error) {
      console.error(`Error getting cumulative evidence for Day ${dayNumber}:`, error);
      throw error;
    }
  }

  // Generate historical competency analytics CSV data
  async generateHistoricalCompetencyAnalytics(studentId) {
    try {
      console.log(`🔄 Starting historical competency analytics for ${studentId}`);

      const dayRanges = this.getDayDateRanges();
      const csvData = [];
      let totalApiCost = 0;

      // Process each day with cumulative evidence
      for (let day = 1; day <= 8; day++) {
        console.log(`📊 Processing Day ${day} for ${studentId}`);

        // Get cumulative evidence up to this day
        const evidence = await this.getCumulativeEvidenceForDay(studentId, day);

        // Skip if no evidence available for this day
        if (evidence.skillsUnlocked.length === 0 &&
            evidence.reflections.length === 0 &&
            evidence.artifacts.length === 0 &&
            evidence.chatInteractions.length === 0) {
          console.log(`⏭️ Skipping Day ${day} - no evidence available`);
          continue;
        }

        // Analyze competencies with dual models
        const analysis = await this.analyzeDualCompetencies(studentId, evidence);

        // Track API costs
        if (analysis.totalApiCost) {
          totalApiCost += analysis.totalApiCost.totalCost;
        }

        // Generate CSV row for each competency
        analysis.competencies.forEach(comp => {
          const dayRange = dayRanges[day];
          const modelAgreement = comp.confidence === 'High' ? 95 :
                              comp.confidence === 'Medium' ? 75 : 60;

          const csvRow = {
            student_id: studentId,
            competency_id: comp.id,
            competency_name: comp.name,
            day: day,
            date_start: dayRange.start,
            date_end: dayRange.end,
            claude_score: comp.model_scores?.primary || (comp.rating === "N/A" ? null : comp.rating),
            gemini_score: comp.model_scores?.secondary || (comp.rating === "N/A" ? null : comp.rating),
            avg_score: comp.rating === "N/A" ? null : comp.rating,
            model_agreement: modelAgreement,
            confidence_level: comp.confidence || 'Medium',
            evidence_count: evidence.artifacts.length + evidence.reflections.length + evidence.chatInteractions.length,
            artifacts_count: evidence.artifacts.length,
            reflections_count: evidence.reflections.length,
            chat_interactions_count: evidence.chatInteractions.length,
            gallery_projects_count: evidence.galleryProjects.length,
            achievements_count: evidence.achievements.length,
            analysis_timestamp: new Date().toISOString(),
            api_cost_usd: analysis.totalApiCost?.totalCost || 0
          };

          csvData.push(csvRow);
        });

        console.log(`✅ Completed Day ${day} analysis with ${analysis.competencies.length} competencies`);
      }

      console.log(`🎉 Historical analytics complete for ${studentId}:`, {
        totalRows: csvData.length,
        totalApiCost: `$${totalApiCost.toFixed(4)}`,
        daysProcessed: csvData.length > 0 ? Math.max(...csvData.map(row => row.day)) : 0
      });

      return {
        csvData,
        summary: {
          studentId,
          totalRows: csvData.length,
          totalApiCost,
          daysProcessed: [...new Set(csvData.map(row => row.day))].length,
          competenciesAnalyzed: [...new Set(csvData.map(row => row.competency_id))].length
        }
      };

    } catch (error) {
      console.error(`Error generating historical analytics for ${studentId}:`, error);
      throw error;
    }
  }

  // Generate CSV string from historical analytics data
  generateHistoricalCSV(csvData) {
    if (csvData.length === 0) {
      return 'No data available';
    }

    // CSV headers
    const headers = [
      'student_id',
      'competency_id',
      'competency_name',
      'day',
      'date_start',
      'date_end',
      'claude_score',
      'gemini_score',
      'avg_score',
      'model_agreement',
      'confidence_level',
      'evidence_count',
      'artifacts_count',
      'reflections_count',
      'chat_interactions_count',
      'gallery_projects_count',
      'achievements_count',
      'analysis_timestamp',
      'api_cost_usd'
    ];

    // Create CSV rows
    const csvRows = csvData.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle null/undefined values and escape commas/quotes
        if (value === null || value === undefined) {
          return 'NA';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
  }

  // Generate historical analytics for multiple students (batch processing)
  async generateBatchHistoricalAnalytics(studentIds, options = {}) {
    try {
      console.log(`🔄 Starting batch historical analytics for ${studentIds.length} students`);

      const {
        saveToFile = false,
        fileName = `historical_competency_analytics_${new Date().toISOString().split('T')[0]}.csv`,
        onProgress = null
      } = options;

      const allCsvData = [];
      const batchSummary = {
        totalStudents: studentIds.length,
        studentsProcessed: 0,
        studentsSkipped: 0,
        totalRows: 0,
        totalApiCost: 0,
        processingErrors: []
      };

      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
        console.log(`📊 Processing student ${i + 1}/${studentIds.length}: ${studentId}`);

        try {
          // Generate historical analytics for this student
          const studentAnalytics = await this.generateHistoricalCompetencyAnalytics(studentId);

          // Add to combined data
          allCsvData.push(...studentAnalytics.csvData);

          // Update batch summary
          batchSummary.studentsProcessed++;
          batchSummary.totalRows += studentAnalytics.csvData.length;
          batchSummary.totalApiCost += studentAnalytics.summary.totalApiCost;

          console.log(`✅ Completed ${studentId}: ${studentAnalytics.csvData.length} rows, $${studentAnalytics.summary.totalApiCost.toFixed(4)}`);

          // Call progress callback if provided
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: studentIds.length,
              studentId,
              rowsGenerated: studentAnalytics.csvData.length,
              apiCost: studentAnalytics.summary.totalApiCost
            });
          }

          // Small delay to avoid overwhelming the API
          if (i < studentIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Error processing ${studentId}:`, error);
          batchSummary.studentsSkipped++;
          batchSummary.processingErrors.push({
            studentId,
            error: error.message
          });
        }
      }

      // Generate combined CSV
      const csvContent = this.generateHistoricalCSV(allCsvData);

      // Save to file if requested
      let filePath = null;
      if (saveToFile) {
        filePath = await this.saveCsvToFile(csvContent, fileName);
      }

      const finalSummary = {
        ...batchSummary,
        csvContent,
        filePath,
        generatedAt: new Date().toISOString(),
        averageApiCostPerStudent: batchSummary.studentsProcessed > 0 ?
          batchSummary.totalApiCost / batchSummary.studentsProcessed : 0,
        successRate: (batchSummary.studentsProcessed / batchSummary.totalStudents * 100).toFixed(1) + '%'
      };

      console.log(`🎉 Batch historical analytics complete:`, finalSummary);

      return {
        csvData: allCsvData,
        csvContent,
        summary: finalSummary
      };

    } catch (error) {
      console.error(`Error in batch historical analytics:`, error);
      throw error;
    }
  }

  // Save CSV content to file
  async saveCsvToFile(csvContent, fileName) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Create exports directory if it doesn't exist
      const exportsDir = path.join(process.cwd(), 'exports');
      await fs.mkdir(exportsDir, { recursive: true });

      // Write CSV file
      const filePath = path.join(exportsDir, fileName);
      await fs.writeFile(filePath, csvContent, 'utf8');

      console.log(`💾 CSV saved to: ${filePath}`);
      return filePath;

    } catch (error) {
      console.error(`Error saving CSV to file:`, error);
      // Fallback: return content without saving
      console.warn(`⚠️ Could not save to file, returning CSV content instead`);
      return null;
    }
  }

  // Get list of all students for batch processing
  async getAllStudentsForAnalytics() {
    try {
      // This would typically query your database for all active students
      // For now, returning a placeholder - you'll need to implement this based on your data structure
      console.log(`📋 Getting all students for analytics (placeholder implementation)`);

      // Example implementation - replace with actual database query
      const studentsQuery = query(collection(db, 'students'));
      const studentsSnapshot = await getDocs(studentsQuery);

      const studentIds = studentsSnapshot.docs.map(doc => doc.id);

      console.log(`📊 Found ${studentIds.length} students for analytics`);
      return studentIds;

    } catch (error) {
      console.error(`Error getting all students:`, error);
      throw error;
    }
  }

  // Generate complete historical analytics report (CSV + summary)
  async generateCompleteHistoricalReport(options = {}) {
    try {
      const {
        studentIds = null,
        saveToFile = true,
        includeProgressCallback = true
      } = options;

      // Get student list if not provided
      let targetStudents = studentIds;
      if (!targetStudents) {
        targetStudents = await this.getAllStudentsForAnalytics();
      }

      if (targetStudents.length === 0) {
        throw new Error('No students found for analytics');
      }

      console.log(`🚀 Generating complete historical report for ${targetStudents.length} students`);

      // Progress callback for real-time updates
      const progressCallback = includeProgressCallback ? (progress) => {
        console.log(`📊 Progress: ${progress.current}/${progress.total} students (${progress.studentId}: ${progress.rowsGenerated} rows)`);
      } : null;

      // Generate batch analytics
      const report = await this.generateBatchHistoricalAnalytics(targetStudents, {
        saveToFile,
        onProgress: progressCallback
      });

      // Add R analysis recommendations to the summary
      report.summary.rAnalysisRecommendations = {
        scoreProgression: `
# Score progression over time
ggplot(data, aes(x=day, y=avg_score, color=competency_name)) +
  geom_line(aes(group=student_id), alpha=0.3) +
  geom_smooth(method="loess") +
  facet_wrap(~competency_name) +
  labs(title="Competency Score Progression Over 8 Days",
       x="Day", y="Average Score") +
  theme_minimal()
`,
        modelAgreementAnalysis: `
# Model agreement analysis by day
model_agreement_by_day <- data %>%
  group_by(day, competency_id) %>%
  summarise(avg_agreement = mean(model_agreement, na.rm=TRUE)) %>%
  ggplot(aes(x=day, y=avg_agreement, color=competency_id)) +
  geom_line() +
  labs(title="AI Model Agreement Over Time",
       x="Day", y="Average Agreement (%)") +
  theme_minimal()
`,
        apiCostTracking: `
# API cost tracking
cost_analysis <- data %>%
  group_by(day) %>%
  summarise(total_cost = sum(api_cost_usd),
           cost_per_student = total_cost / n_distinct(student_id)) %>%
  ggplot(aes(x=day, y=cost_per_student)) +
  geom_bar(stat="identity", fill="skyblue") +
  labs(title="API Cost per Student by Day",
       x="Day", y="Cost per Student ($)") +
  theme_minimal()
`
      };

      console.log(`✅ Complete historical report generated successfully!`);
      console.log(`📊 Summary: ${report.summary.totalRows} total rows, ${report.summary.totalApiCost.toFixed(4)} total cost`);

      return report;

    } catch (error) {
      console.error(`Error generating complete historical report:`, error);
      throw error;
    }
  }

  // Get historical competency data with full implementation
  async getCompetencyHistory(studentId, timeRange = '30d') {
    try {
      console.log(`📈 Getting competency history for ${studentId} (${timeRange})`);

      // For historical analytics, use the new comprehensive method
      if (timeRange === 'historical_analytics') {
        return await this.generateHistoricalCompetencyAnalytics(studentId);
      }

      // For regular history requests, use current analysis with mock historical data
    const currentAnalysis = await this.getCompetencyAnalysis(studentId);
    
    return {
      current: currentAnalysis,
      history: [
        // Mock historical data - in real implementation, this would be stored analyses
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          competencies: currentAnalysis.competencies.map(comp => ({
            ...comp,
            rating: comp.rating === "N/A" ? "N/A" : Math.max(1, comp.rating - Math.random() * 2) // Slightly lower historical rating
          }))
        }
      ]
    };
    } catch (error) {
      console.error(`Error in getCompetencyHistory for ${studentId}:`, error);
      throw error;
    }
  }
}

export default new CompetencyService();

/*
📊 HISTORICAL COMPETENCY ANALYTICS - USAGE GUIDE
==============================================

This service now includes comprehensive historical competency analytics that generates
competency scores over time for each of the 8 days with cumulative evidence collection.

🎯 CORE FEATURES:
- Generates competency scores for each day (1-8) with cumulative evidence
- Excludes Day 8 reflection self-ratings as requested
- Uses both Claude Sonnet-4 and Gemini 2.5 Flash models
- Outputs R-optimized CSV format
- Preserves existing database data
- Supports batch processing for multiple students

📅 DATE RANGES:
- Days 1-4: 8/11/25-8/14/25
- Days 5-8: 8/18/25-8/21/25

🔧 USAGE EXAMPLES:
=================

1. Generate historical analytics for a single student:
```javascript
const competencyService = new CompetencyService();
const result = await competencyService.generateHistoricalCompetencyAnalytics('student_123');

// Access the data
console.log(result.csvData); // Array of CSV row objects
console.log(result.summary); // Processing summary
```

2. Generate CSV string:
```javascript
const csvContent = competencyService.generateHistoricalCSV(result.csvData);
console.log(csvContent);
```

3. Batch process multiple students:
```javascript
const studentIds = ['student_1', 'student_2', 'student_3'];
const batchResult = await competencyService.generateBatchHistoricalAnalytics(studentIds, {
  saveToFile: true,
  fileName: 'my_historical_analytics.csv',
  onProgress: (progress) => {
    console.log(`Progress: ${progress.current}/${progress.total} students`);
  }
});
```

4. Generate complete report for all students:
```javascript
const report = await competencyService.generateCompleteHistoricalReport({
  saveToFile: true,
  includeProgressCallback: true
});

// Access R analysis recommendations
console.log(report.summary.rAnalysisRecommendations.scoreProgression);
```

📋 CSV OUTPUT FORMAT:
====================
The CSV includes these columns (R-optimized):
- student_id: Student identifier
- competency_id: One of 8 competency IDs (sense_of_belonging, steam_interest, etc.)
- competency_name: Human-readable competency name
- day: Day number (1-8)
- date_start/date_end: Date range for that day
- claude_score/gemini_score: Individual model scores (1-10 or NA)
- avg_score: Average of both models (1-10 or NA)
- model_agreement: Agreement percentage between models
- confidence_level: High/Medium/Low confidence
- evidence_count: Total evidence items for that day
- artifacts_count, reflections_count, etc.: Breakdown by evidence type
- analysis_timestamp: When analysis was performed
- api_cost_usd: Cost of API calls for this analysis

🎨 R ANALYSIS EXAMPLES:
======================
The system provides pre-built R analysis code snippets:

1. Score Progression Over Time:
```r
ggplot(data, aes(x=day, y=avg_score, color=competency_name)) +
  geom_line(aes(group=student_id), alpha=0.3) +
  geom_smooth(method="loess") +
  facet_wrap(~competency_name) +
  labs(title="Competency Score Progression Over 8 Days")
```

2. Model Agreement Analysis:
```r
model_agreement_by_day <- data %>%
  group_by(day, competency_id) %>%
  summarise(avg_agreement = mean(model_agreement, na.rm=TRUE)) %>%
  ggplot(aes(x=day, y=avg_agreement, color=competency_id)) +
  geom_line() +
  labs(title="AI Model Agreement Over Time")
```

3. API Cost Tracking:
```r
cost_analysis <- data %>%
  group_by(day) %>%
  summarise(total_cost = sum(api_cost_usd),
           cost_per_student = total_cost / n_distinct(student_id)) %>%
  ggplot(aes(x=day, y=cost_per_student)) +
  geom_bar(stat="identity", fill="skyblue") +
  labs(title="API Cost per Student by Day")
```

⚙️ CONFIGURATION NOTES:
======================
- Evidence is collected CUMULATIVELY (Day 5 includes all previous days)
- Day 8 self-ratings are automatically excluded from evidence set
- Uses current AI models for reanalysis (not preserving old scores)
- Database data is preserved - only reads, never writes
- API costs are tracked and included in output

🚨 IMPORTANT:
============
- This system makes many API calls - monitor your usage and costs
- Processing multiple students can take significant time
- Ensure you have proper error handling in production
- The getAllStudentsForAnalytics() method needs customization for your data structure
*/