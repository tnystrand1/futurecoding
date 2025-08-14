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
    this.primaryModel = 'anthropic/claude-3-5-sonnet-20241022'; // Primary model for analysis
    this.secondaryModel = 'google/gemini-2.5-flash'; // Secondary model for interrater reliability
    this.initializeCompetencies();
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
    } else {
      // Default questions for days 5+
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
        skillsUnlocked: []
      };

      // Get student's approved skills and evidence
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const skills = studentData.skills || {};
        
        Object.entries(skills).forEach(([skillId, skillData]) => {
          if (skillData.unlocked && skillData.evidence?.status === 'approved') {
            evidence.skillsUnlocked.push({
              skillId,
              evidence: skillData.evidence,
              unlockedAt: skillData.unlockedAt || skillData.evidence.submittedAt
            });
            
            // Extract artifacts and reflections
            if (skillData.evidence.reflection) {
              evidence.reflections.push({
                skillId,
                content: skillData.evidence.reflection,
                timestamp: skillData.evidence.submittedAt
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
          
          Object.values(dailyReflections).forEach(reflection => {
            // Get the questions for this day to validate and extract data
            const questions = this.getQuestionsForDay(reflection.dayNumber);
            const hasAllAnswers = questions.every(q => reflection[q.key] && reflection[q.key].trim());
            
            if (hasAllAnswers) {
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
            }
          });
        }
      } catch (error) {
        console.warn('Could not fetch daily reflections:', error);
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
      combinedAnalysis.evidenceCount = {
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        skillsUnlocked: evidence.skillsUnlocked.length
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
        skillsUnlocked: evidence.skillsUnlocked.length
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
    const evidenceSummary = this.prepareEvidenceSummary(evidence, studentId);
    const competencyDefinitionsText = this.formatCompetencyDefinitions();

    const prompt = `
Analyze student evidence for 8 competencies. Return ONLY valid JSON.

IMPORTANT: If no evidence exists for a competency, set rating to "N/A" and evidence_snippets to empty array.

Competencies: ${Object.keys(this.competencyDefinitions).join(', ')}

Evidence: ${evidenceSummary.substring(0, 2000)}

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
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} for model ${modelName}`);
    }

    const data = await response.json();
    let analysisText = data.choices[0].message.content;
    
    // Clean up the response - remove any text before the JSON
    const jsonStart = analysisText.indexOf('{');
    if (jsonStart > 0) {
      analysisText = analysisText.substring(jsonStart);
    }
    
    // Remove control characters that cause JSON parsing errors
    analysisText = analysisText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Try to fix incomplete JSON by finding the last complete object
    if (!analysisText.trim().endsWith('}')) {
      console.warn(`AI response appears truncated for ${modelName}, attempting to fix...`);
      const lastCompleteObject = analysisText.lastIndexOf('}');
      if (lastCompleteObject > 0) {
        analysisText = analysisText.substring(0, lastCompleteObject + 1);
      }
    }
    
    try {
      const analysis = JSON.parse(analysisText);
      
      // Validate that we have all required competencies
      if (!analysis.competencies || analysis.competencies.length < 8) {
        console.warn(`Incomplete competency analysis from ${modelName} - using fallback`);
        return this.generateFallbackAnalysis(studentId, evidence);
      }
      
      // Mark which model generated this analysis
      analysis.generatingModel = modelName;
      return analysis;
    } catch (parseError) {
      console.error(`Error parsing AI response from ${modelName}:`, parseError);
      console.error(`Raw AI response (first 1000 chars):`, analysisText.substring(0, 1000));
      
      // Use fallback analysis if parsing fails
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
        `${evidence.chatInteractions.length} AI interactions recorded`
      ],
      evidence_snippets: [],
      areas_for_improvement: [
        'Continue building evidence through skill completion',
        'Engage more deeply with reflection activities'
      ],
      narrative: `Basic analysis based on ${evidence.skillsUnlocked.length} skills unlocked and ${evidence.artifacts.length} artifacts. More detailed assessment requires AI analysis.`,
      trend: 'stable'
    }));

    return {
      studentId,
      analysisDate: new Date().toISOString(),
      competencies,
      overall_assessment: `Student has completed ${evidence.skillsUnlocked.length} skills and submitted ${evidence.artifacts.length} artifacts. This is a basic analysis - AI analysis temporarily unavailable.`,
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
        skillsUnlocked: evidence.skillsUnlocked.length
      },
      fallbackAnalysis: true
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

  // Prepare evidence summary for AI analysis (with privacy protection)
  prepareEvidenceSummary(evidence, studentId) {
    let summary = '';

    // Skills and Evidence
    summary += `\n=== SKILLS UNLOCKED (${evidence.skillsUnlocked.length}) ===\n`;
    evidence.skillsUnlocked.forEach(skill => {
      summary += `Skill: ${skill.skillId}\n`;
      if (skill.evidence.reflection) {
        summary += `Reflection: ${this.anonymizeText(skill.evidence.reflection, studentId)}\n`;
      }
      summary += `Unlocked: ${new Date(skill.unlockedAt).toLocaleDateString()}\n\n`;
    });

    // Artifacts
    summary += `\n=== ARTIFACTS (${evidence.artifacts.length}) ===\n`;
    evidence.artifacts.forEach(artifact => {
      summary += `Type: ${artifact.type} (${artifact.skillId})\n`;
      const content = artifact.content.substring(0, 500) + (artifact.content.length > 500 ? '...' : '');
      summary += `Content: ${this.anonymizeText(content, studentId)}\n`;
      summary += `Date: ${new Date(artifact.timestamp).toLocaleDateString()}\n\n`;
    });

    // Reflections
    summary += `\n=== REFLECTIONS (${evidence.reflections.length}) ===\n`;
    evidence.reflections.forEach(reflection => {
      if (reflection.type === 'daily_reflection') {
        summary += `Daily Reflection - Day ${reflection.dayNumber}\n`;
        
        // Add each response dynamically
        Object.values(reflection.responses).forEach(response => {
          summary += `${response.question}: ${this.anonymizeText(response.answer, studentId)}\n`;
        });
        
        summary += `Date: ${new Date(reflection.timestamp).toLocaleDateString()}\n\n`;
      } else {
        summary += `Skill: ${reflection.skillId}\n`;
        summary += `Reflection: ${this.anonymizeText(reflection.content, studentId)}\n`;
        summary += `Date: ${new Date(reflection.timestamp).toLocaleDateString()}\n\n`;
      }
    });

    // Chat Interactions (sample recent ones)
    summary += `\n=== AI CHAT INTERACTIONS (${evidence.chatInteractions.length} conversations) ===\n`;
    const recentChats = evidence.chatInteractions.slice(0, 3); // Last 3 conversations
    recentChats.forEach(chat => {
      summary += `Persona: ${chat.persona}\n`;
      summary += `Date: ${new Date(chat.createdAt?.toDate?.() || chat.createdAt).toLocaleDateString()}\n`;
      
      // Sample of student messages (anonymized)
      const studentMessages = chat.messages.filter(msg => msg.isUser).slice(-5); // Last 5 student messages
      summary += `Student messages:\n`;
      studentMessages.forEach(msg => {
        const content = msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '');
        summary += `- ${this.anonymizeText(content, studentId)}\n`;
      });
      summary += '\n';
    });

    return summary;
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
        skillsUnlocked: evidence.skillsUnlocked.length
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
      chatInteractions: evidence.chatInteractions.length
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

    // Sort by timestamp (newest first) and limit to 10 most recent
    const sortedSnippets = snippets
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    console.log(`📝 Generated ${sortedSnippets.length} evidence snippets:`, 
      sortedSnippets.map(s => ({ type: s.type, excerpt: s.excerpt.substring(0, 50) + '...' }))
    );

    return sortedSnippets;
  }

  // Get historical competency data (placeholder for future timeline feature)
  async getCompetencyHistory(studentId, timeRange = '30d') {
    // This would track competency ratings over time
    // For now, return current analysis with mock historical data
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
  }
}

export default new CompetencyService();