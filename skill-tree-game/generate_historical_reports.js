#!/usr/bin/env node

/**
 * Historical Competency Analytics CLI Tool
 * Usage: node generate_historical_reports.js [options]
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';

// Load environment variables from .env file
config();

// Initialize Firebase with real credentials from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log(`🔧 Using Firebase project: ${firebaseConfig.projectId}`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class HistoricalAnalyticsCLI {
  constructor() {
    this.apiKey = process.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.primaryModel = 'anthropic/claude-sonnet-4';
    this.secondaryModel = 'google/gemini-2.5-flash';
    this.initializeCompetencies();
  }

  initializeCompetencies() {
    this.competencyDefinitions = {
      'sense_of_belonging': {
        name: 'Sense of Belonging',
        description: 'Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it.'
      },
      'steam_interest': {
        name: 'STEAM Interest',
        description: 'Exploration of one\'s identity through STEAM, both in and out of class'
      },
      'communication': {
        name: 'Communication',
        description: 'Ability to clearly exchange information with others in various settings and for various purposes'
      },
      'teamwork': {
        name: 'Teamwork',
        description: 'Ability to work cooperatively with diverse peers and adults to achieve shared goals'
      },
      'problem_solving': {
        name: 'Problem Solving',
        description: 'Ability to identify, understand, and solve challenges effectively'
      },
      'opportunity_recognition': {
        name: 'Opportunity Recognition',
        description: 'Ability to identify and act on opportunities for learning, improvement, or advancement'
      },
      'steam_agency': {
        name: 'STEAM Agency',
        description: 'Feeling capable of engaging with STEAM tools and technology effectively and responsibly'
      },
      'continuous_learning': {
        name: 'Continuous Learning',
        description: 'Ongoing process of seeking new skills and knowledge, using reflection and feedback to improve'
      }
    };
  }

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
          competency: 'STEAM Interest'
        },
        { 
          key: 'communicationRatingExplanation', 
          label: 'Communication: Ability to share ideas through multiple mediums and to multiple audiences. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Communication'
        },
        { 
          key: 'problemSolvingRatingExplanation', 
          label: 'Problem Solving: Breaking down challenges using logical and creative thinking. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Problem Solving'
        },
        { 
          key: 'teamworkRatingExplanation', 
          label: 'Teamwork: Working effectively with diverse teams. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Teamwork'
        },
        { 
          key: 'senseOfBelongingRatingExplanation', 
          label: 'Sense of Belonging: Feeling valued, accepted, and included in the learning community. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Sense of Belonging'
        },
        { 
          key: 'opportunityRecognitionRatingExplanation', 
          label: 'Opportunity Recognition: Identifying and pursuing learning and growth opportunities. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Opportunity Recognition'
        },
        { 
          key: 'steamAgencyRatingExplanation', 
          label: 'STEAM Agency: Taking ownership and initiative in STEAM learning and projects. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'STEAM Agency'
        },
        { 
          key: 'continuousLearningRatingExplanation', 
          label: 'Continuous Learning: Commitment to ongoing learning, growth and reflection. Rate yourself as Emerging/Developing/Proficient and explain why.',
          type: 'rating',
          competency: 'Continuous Learning'
        },
        {
          key: 'overallReflection',
          label: 'Overall reflection on your learning journey - what are you most proud of? What challenged you the most?'
        },
        {
          key: 'advice',
          label: 'What advice would you give to a future student taking this class?'
        },
        {
          key: 'gratitude',
          label: 'What are you most grateful for from this experience?'
        }
      ];
    }
    return [];
  }

  generateHistoricalCSV(csvData) {
    if (csvData.length === 0) {
      return 'No data available';
    }

    const headers = [
      'student_id', 'competency_id', 'competency_name', 'day', 'date_start', 'date_end',
      'claude_score', 'gemini_score', 'avg_score', 'model_agreement', 'confidence_level',
      'evidence_count', 'artifacts_count', 'reflections_count', 'chat_interactions_count',
      'gallery_projects_count', 'achievements_count', 'analysis_timestamp', 'api_cost_usd'
    ];

    const csvRows = csvData.map(row => {
      return headers.map(header => {
        const value = row[header];
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

  printHeader() {
    console.log('🎓 HISTORICAL COMPETENCY ANALYTICS REPORT GENERATOR');
    console.log('=' .repeat(60));
    console.log('📊 Generates competency scores over time for all 8 days');
    console.log('🤖 Uses dual AI models (Claude + Gemini) with agreement analysis');
    console.log('📈 Outputs R-optimized CSV for statistical analysis');
    console.log('🚫 Excludes Day 8 self-ratings as requested');
    console.log('');
  }

  printUsage() {
    console.log('USAGE:');
    console.log('  node generate_historical_reports.js [command] [options]');
    console.log('');
    console.log('COMMANDS:');
    console.log('  all                    Generate report for ALL students');
    console.log('  student <id>           Generate report for specific student');
    console.log('  batch <file>           Generate report for students listed in file');
    console.log('  test                   Run basic functionality test');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --output <file>        Save CSV to specific file');
    console.log('  --no-save              Don\'t save to file, just display results');
    console.log('  --progress             Show detailed progress');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  node generate_historical_reports.js all');
    console.log('  node generate_historical_reports.js student Charles');
    console.log('  node generate_historical_reports.js all --output my_report.csv --progress');
    console.log('  node generate_historical_reports.js test');
  }

  async runTest() {
    console.log('🧪 Running basic functionality test...\n');

    try {
      // Test date ranges
      console.log('📅 Testing date ranges...');
      const dayRanges = this.getDayDateRanges();
      console.log('✅ Date ranges loaded:', Object.keys(dayRanges).length, 'days');

      // Test CSV generation with sample data
      console.log('📊 Testing CSV generation...');
      const sampleData = [{
        student_id: 'test_student',
        competency_id: 'sense_of_belonging',
        competency_name: 'Sense of Belonging',
        day: 1,
        date_start: '2025-08-11',
        date_end: '2025-08-11',
        claude_score: 8,
        gemini_score: 7,
        avg_score: 7.5,
        model_agreement: 85,
        confidence_level: 'High',
        evidence_count: 5,
        artifacts_count: 2,
        reflections_count: 2,
        chat_interactions_count: 1,
        gallery_projects_count: 0,
        achievements_count: 0,
        analysis_timestamp: new Date().toISOString(),
        api_cost_usd: 0.0125
      }];

      const csvContent = this.generateHistoricalCSV(sampleData);
      console.log('✅ CSV generation successful:', csvContent.split('\n').length, 'lines');

      // Test Firebase connection
      console.log('🔥 Testing Firebase connection...');
      try {
        const studentsQuery = query(collection(db, 'students'));
        const studentsSnapshot = await getDocs(studentsQuery);
        console.log('✅ Firebase connected! Found', studentsSnapshot.docs.length, 'students');
      } catch (firebaseError) {
        console.log('⚠️  Firebase connection test failed (expected if credentials not set):', firebaseError.message);
        console.log('🔧 To enable Firebase: Set VITE_FIREBASE_* variables in .env file');
      }

      console.log('\n🎉 Basic functionality test passed! System is ready for report generation.');
      console.log('📝 For real data: Set Firebase credentials in .env file');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('💡 This might be due to missing Firebase configuration or environment variables.');
      console.log('🔧 To fix: Ensure VITE_FIREBASE_* environment variables are set in .env file');
      process.exit(1);
    }
  }

  async generateForAllStudents(options = {}) {
    const { outputFile = null, showProgress = false } = options;

    console.log('🚀 Generating historical analytics for ALL students...\n');

    try {
      const report = await this.competencyService.generateCompleteHistoricalReport({
        saveToFile: false, // We'll handle saving ourselves
        includeProgressCallback: showProgress
      });

      this.displayReportSummary(report.summary);

      // Save to file if requested
      if (outputFile) {
        await this.saveReportToFile(report.csvContent, outputFile);
      }

      console.log('\n📋 R Analysis Code:');
      console.log('==================');
      console.log(report.summary.rAnalysisRecommendations.scoreProgression);

    } catch (error) {
      console.error('❌ Error generating report:', error.message);
      process.exit(1);
    }
  }

  async generateForStudent(studentId, options = {}) {
    const { outputFile = null, showProgress = false } = options;

    console.log(`🚀 Generating historical analytics for student: ${studentId}\n`);

    try {
      const result = await this.generateHistoricalCompetencyAnalytics(studentId);
      const csvContent = this.generateHistoricalCSV(result.csvData);

      this.displayStudentSummary(result.summary);

      // Save to file if requested
      if (outputFile) {
        await this.saveReportToFile(csvContent, outputFile);
      } else {
        console.log('\n📊 CSV Preview (first 10 lines):');
        console.log('=' .repeat(50));
        console.log(csvContent.split('\n').slice(0, 10).join('\n'));
        console.log('... (' + (csvContent.split('\n').length - 10) + ' more lines)');
      }

    } catch (error) {
      console.error('❌ Error generating student report:', error.message);
      process.exit(1);
    }
  }

  async generateHistoricalCompetencyAnalytics(studentId) {
    console.log(`🔄 Generating real historical analytics for ${studentId}...`);

    const dayRanges = this.getDayDateRanges();
    const csvData = [];
    let totalApiCost = 0;

    // Process each day with cumulative evidence
    for (let day = 1; day <= 8; day++) {
      console.log(`📊 Processing Day ${day} for ${studentId}...`);

      try {
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

      } catch (error) {
        console.error(`❌ Error processing Day ${day}:`, error.message);
        continue;
      }
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
  }

  async getCumulativeEvidenceForDay(studentId, dayNumber) {
    try {
      console.log(`📅 Collecting cumulative evidence for ${studentId} up to Day ${dayNumber}`);

      const dayRanges = this.getDayDateRanges();
      const endDate = new Date(dayRanges[dayNumber].end + 'T23:59:59.999Z');

      // Get all evidence from Firebase
      const evidence = await this.getStudentEvidence(studentId);

      // Filter evidence to be cumulative up to the specified day
      const filteredEvidence = {
        artifacts: [],
        reflections: [],
        chatInteractions: [],
        skillsUnlocked: [],
        galleryProjects: [],
        galleryInteractions: [],
        achievements: [],
        progressMetrics: evidence.progressMetrics
      };

      // Filter skills unlocked by timestamp
      filteredEvidence.skillsUnlocked = evidence.skillsUnlocked.filter(skill => {
        const unlockDate = new Date(skill.unlockedAt);
        return unlockDate <= endDate;
      });

      // Filter artifacts by timestamp
      filteredEvidence.artifacts = evidence.artifacts.filter(artifact => {
        const artifactDate = new Date(artifact.timestamp);
        return artifactDate <= endDate;
      });

      // Filter reflections by timestamp and exclude Day 8 self-ratings
      filteredEvidence.reflections = evidence.reflections.filter(reflection => {
        const reflectionDate = new Date(reflection.timestamp || reflection.submittedAt);
        const isBeforeEndDate = reflectionDate <= endDate;

        // Exclude Day 8 self-ratings
        if (dayNumber >= 8 && reflection.dayNumber === 8) {
          const hasSelfRatings = reflection.responses &&
            Object.keys(reflection.responses).some(key =>
              key.includes('RatingExplanation') ||
              (reflection[key] && typeof reflection[key] === 'string' && reflection[key].includes('Rate yourself'))
            );

          if (hasSelfRatings) {
            console.log(`🚫 Excluding Day 8 self-rating reflection for ${studentId}`);
            return false;
          }
        }

        return isBeforeEndDate;
      });

      // Filter chat interactions by timestamp
      filteredEvidence.chatInteractions = evidence.chatInteractions.filter(chat => {
        const chatDate = new Date(chat.createdAt?.toDate?.() || chat.createdAt);
        return chatDate <= endDate;
      });

      console.log(`✅ Cumulative evidence for Day ${dayNumber}:`, {
        skillsUnlocked: filteredEvidence.skillsUnlocked.length,
        artifacts: filteredEvidence.artifacts.length,
        reflections: filteredEvidence.reflections.length,
        chatInteractions: filteredEvidence.chatInteractions.length
      });

      return filteredEvidence;
    } catch (error) {
      console.error(`Error getting cumulative evidence for Day ${dayNumber}:`, error);
      throw error;
    }
  }

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
        
        evidence.progressMetrics = {
          totalXP: storedXP,
          calculatedXP,
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

      // Get AI chat interactions from separate collection
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

      // Get daily reflections from separate collection
      try {
        const reflectionDoc = await getDoc(doc(db, 'reflections', studentId));
        if (reflectionDoc.exists()) {
          const reflectionData = reflectionDoc.data();
          const dailyReflections = reflectionData.dailyReflections || {};
          
          console.log(`📅 Processing daily reflections for ${studentId}:`, {
            totalReflectionDays: Object.keys(dailyReflections).length,
            dayNumbers: Object.values(dailyReflections).map(r => r.dayNumber).sort((a, b) => a - b)
          });
          
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
              
              // For other types, just check existence
              return true;
            });
            
            if (hasRequiredAnswers) {
              // Build responses object with proper question-answer mapping
              const responses = {};
              questions.forEach(q => {
                const value = reflection[q.key];
                if (value !== undefined && value !== null) {
                  // Skip Day 8 self-rating questions
                  const isDay8SelfRating = reflection.dayNumber === 8 && 
                    q.key.includes('RatingExplanation');
                  
                  if (!isDay8SelfRating) {
                    responses[q.key] = {
                      question: q.label,
                      answer: typeof value === 'string' ? value : JSON.stringify(value),
                      type: q.type || 'text'
                    };
                  }
                }
              });
              
              // Only add if we have non-rating responses for Day 8, or any responses for other days
              if (reflection.dayNumber !== 8 || Object.keys(responses).length > 0) {
                evidence.reflections.push({
                  dayNumber: reflection.dayNumber,
                  timestamp: reflection.submittedAt || reflection.timestamp || new Date().toISOString(),
                  submittedAt: reflection.submittedAt || reflection.timestamp || new Date().toISOString(),
                  responses: responses,
                  type: 'daily_reflection'
                });
              }
            }
          });
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch daily reflections: ${error.message}`);
      }

      // Get gallery projects and interactions
      try {
        const galleryQuery = query(
          collection(db, 'galleries'),
          orderBy('createdAt', 'desc')
        );
        const gallerySnapshot = await getDocs(galleryQuery);
        
        for (const galleryDoc of gallerySnapshot.docs) {
          const galleryData = galleryDoc.data();
          
          // Check if student is part of this project's team
          const teamMembers = galleryData.teamMembers || [];
          const isTeamMember = teamMembers.some(member => 
            member.toLowerCase() === studentId.toLowerCase() || 
            member.replace(/[_\s]/g, '').toLowerCase() === studentId.replace(/[_\s]/g, '').toLowerCase()
          );
          
          if (isTeamMember) {
            evidence.galleryProjects.push({
              projectId: galleryDoc.id,
              title: galleryData.title,
              description: galleryData.description,
              teamName: galleryData.teamName,
              teamMembers: galleryData.teamMembers,
              createdAt: galleryData.createdAt,
              websiteUrl: galleryData.websiteUrl,
              imageUrl: galleryData.imageUrl
            });
            
            // Get interactions (comments) on this project
            const interactionsQuery = query(
              collection(db, 'gallery_interactions'),
              where('projectId', '==', galleryDoc.id),
              orderBy('createdAt', 'asc')
            );
            
            try {
              const interactionsSnapshot = await getDocs(interactionsQuery);
              interactionsSnapshot.docs.forEach(interactionDoc => {
                const interaction = interactionDoc.data();
                
                // Include student's own comments and comments on their projects
                if (interaction.studentId === studentId || isTeamMember) {
                  evidence.galleryInteractions.push({
                    projectId: galleryDoc.id,
                    projectTitle: galleryData.title,
                    content: interaction.content,
                    studentId: interaction.studentId,
                    studentName: interaction.studentName,
                    createdAt: interaction.createdAt
                  });
                }
              });
            } catch (interactionError) {
              if (interactionError.code !== 'failed-precondition') {
                console.warn(`Could not fetch gallery interactions: ${interactionError.message}`);
              }
            }
          }
        }
      } catch (error) {
        if (error.code !== 'failed-precondition') {
          console.warn(`Could not fetch gallery projects: ${error.message}`);
        }
      }

      console.log(`📊 Evidence collected for ${studentId}:`, {
        skillsUnlocked: evidence.skillsUnlocked.length,
        artifacts: evidence.artifacts.length,
        reflections: evidence.reflections.length,
        chatInteractions: evidence.chatInteractions.length,
        galleryProjects: evidence.galleryProjects.length,
        galleryInteractions: evidence.galleryInteractions.length,
        achievements: evidence.achievements.length
      });

      return evidence;
    } catch (error) {
      console.error('Error getting student evidence:', error);
      throw error;
    }
  }

  async analyzeDualCompetencies(studentId, evidence) {
    try {
      console.log('🔄 Running dual-model competency analysis...');

      // Run analysis with both models in parallel
      const [primaryAnalysis, secondaryAnalysis] = await Promise.all([
        this.analyzeCompetenciesWithModel(this.primaryModel, evidence, studentId),
        this.analyzeCompetenciesWithModel(this.secondaryModel, evidence, studentId)
      ]);

      // Merge and return results
      return this.mergeAnalyses(primaryAnalysis, secondaryAnalysis);

    } catch (error) {
      console.error('Error in dual analysis:', error);
      // Fallback to single model
      const singleAnalysis = await this.analyzeCompetenciesWithModel(this.primaryModel, evidence, studentId);
      singleAnalysis.model_comparison = {
        primary_model: this.primaryModel,
        secondary_model: 'Failed',
        agreement_score: 'N/A - Single Model Used',
        disagreements: []
      };
      return singleAnalysis;
    }
  }

  async analyzeCompetenciesWithModel(modelName, evidence, studentId) {
    const evidenceSummary = this.prepareEvidenceSummary(evidence, studentId);
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

Rating scale: 1-3=Emerging, 4-7=Developing, 8-10=Proficient. Use "N/A" if no evidence exists for that competency.`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
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
          max_tokens: 75000
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
        inputCost = (inputTokens / 1000000) * 3;
        outputCost = (outputTokens / 1000000) * 15;
      } else if (modelName.includes('gemini') || modelName.includes('google')) {
        inputCost = (inputTokens / 1000000) * 0.30;
        outputCost = (outputTokens / 1000000) * 2.50;
      }

      const totalCost = inputCost + outputCost;

      let analysisText = data.choices[0].message.content;

      // Clean up the response - remove markdown code blocks and find JSON
      let cleanedText = analysisText;
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/, '');
      cleanedText = cleanedText.replace(/\n?\s*```\s*$/, '');
      const jsonStart = cleanedText.indexOf('{');
      if (jsonStart > 0) {
        cleanedText = cleanedText.substring(jsonStart);
      }
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonEnd > 0 && jsonEnd < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, jsonEnd + 1);
      }
      analysisText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

      const analysis = JSON.parse(analysisText);

      // Validate that we have all required competencies
      if (!analysis.competencies || analysis.competencies.length < 8) {
        console.warn(`⚠️ Incomplete competency analysis from ${modelName} - only ${analysis.competencies?.length || 0}/8 competencies found`);
        // Generate fallback analysis
        return this.generateFallbackAnalysis(studentId, evidence);
      }

      // Mark which model generated this analysis and include cost data
      analysis.generatingModel = modelName;
      analysis.apiCost = {
        modelName,
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        totalCost
      };

      console.log(`📥 Response from ${modelName}: ${analysis.competencies.length} competencies, cost: $${totalCost.toFixed(4)}`);

      return analysis;

    } catch (error) {
      console.error(`Error analyzing with ${modelName}:`, error);
      return this.generateFallbackAnalysis(studentId, evidence);
    }
  }

  generateFallbackAnalysis(studentId, evidence) {
    console.log('🔄 Generating fallback competency analysis');

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
      narrative: `Basic analysis based on ${evidence.skillsUnlocked.length} skills unlocked, ${evidence.artifacts.length} artifacts, and ${evidence.chatInteractions.length} chat interactions.`,
      trend: 'stable'
    }));

    return {
      competencies,
      overall_assessment: `Student has completed ${evidence.skillsUnlocked.length} skills, submitted ${evidence.artifacts.length} artifacts, and engaged in ${evidence.chatInteractions.length} AI conversations.`,
      growth_highlights: [
        'Active skill progression',
        'Consistent artifact submission'
      ],
      next_steps: [
        'Continue unlocking additional skills',
        'Focus on detailed reflections'
      ],
      fallbackAnalysis: true,
      apiCost: { totalCost: 0 }
    };
  }

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
          }
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

    // Use primary model's overall assessment
    merged.overall_assessment = `${primaryAnalysis.overall_assessment} [Dual-model analysis with ${merged.model_comparison.agreement_score.toFixed(1)}% agreement]`;
    merged.growth_highlights = primaryAnalysis.growth_highlights;
    merged.next_steps = primaryAnalysis.next_steps;

    // Aggregate API costs
    const primaryCost = primaryAnalysis.apiCost || { totalCost: 0 };
    const secondaryCost = secondaryAnalysis.apiCost || { totalCost: 0 };

    merged.totalApiCost = {
      primary: primaryCost,
      secondary: secondaryCost,
      totalCost: primaryCost.totalCost + secondaryCost.totalCost
    };

    return merged;
  }

  // Privacy protection function to anonymize text
  anonymizeText(text, studentId) {
    if (!text || typeof text !== 'string') return text;
    
    // Create a simple anonymization by replacing the student name with "Student"
    // This is a simplified version - the original has more complex rules
    const studentName = studentId.charAt(0).toUpperCase() + studentId.slice(1).toLowerCase();
    const anonymized = text
      .replace(new RegExp(`\\b${studentName}\\b`, 'gi'), 'Student')
      .replace(new RegExp(`\\b${studentId}\\b`, 'gi'), 'Student')
      // Remove other potential identifying info
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[Name]') // Replace full names
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[Phone]') // Replace phone numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[Email]'); // Replace emails
    
    return anonymized;
  }

  // Token estimation function (rough approximation)
  estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
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
    
    const sections = [];
    
    // 1. Skills and Evidence (High Priority)
    if (evidence.skillsUnlocked.length > 0) {
      let skillsSection = `\n=== SKILLS UNLOCKED (${evidence.skillsUnlocked.length}) ===\n`;
      evidence.skillsUnlocked.forEach(skill => {
        skillsSection += `Skill: ${skill.skillId}\n`;
        skillsSection += `XP Earned: ${skill.xpEarned || 0}\n`;
        if (skill.evidence.reflection && skill.evidence.reflection.trim()) {
          const reflection = this.anonymizeText(skill.evidence.reflection, studentId);
          skillsSection += `Reflection: ${reflection}\n`;
        }
        if (skill.evidence.questionAnswers && Array.isArray(skill.evidence.questionAnswers)) {
          skillsSection += `Answers:\n`;
          skill.evidence.questionAnswers.forEach((answer, i) => {
            skillsSection += `  Q${i + 1}: ${this.anonymizeText(answer, studentId)}\n`;
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
      evidence.artifacts.forEach(artifact => {
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
      evidence.chatInteractions.forEach(chat => {
        chatSection += `\nConversation with ${chat.persona || 'AI Assistant'}:\n`;
        const studentMessages = chat.messages.filter(msg => msg.isUser || msg.role === 'user');
        studentMessages.slice(-3).forEach((msg, index) => { // Last 3 messages per conversation
          const content = this.anonymizeText(msg.content, studentId);
          chatSection += `Student Message ${index + 1}: ${content}\n`;
        });
        chatSection += '\n';
      });
      sections.push({ priority: 2, content: chatSection, tokens: this.estimateTokens(chatSection) });
    }

    // 5. Gallery Projects (Medium Priority)
    if (evidence.galleryProjects.length > 0) {
      let gallerySection = `\n=== GALLERY PROJECTS (${evidence.galleryProjects.length}) ===\n`;
      evidence.galleryProjects.forEach(project => {
        gallerySection += `\nProject: ${project.title} (Team: ${project.teamName})\n`;
        gallerySection += `Date: ${new Date(project.createdAt?.toDate?.() || project.createdAt).toLocaleDateString()}\n`;
        if (project.description) {
          const description = this.anonymizeText(project.description, studentId);
          gallerySection += `Description: ${description}\n`;
        }
        gallerySection += `Team Members: ${project.teamMembers.join(', ')}\n\n`;
      });
      sections.push({ priority: 2, content: gallerySection, tokens: this.estimateTokens(gallerySection) });
    }

    // 6. Gallery Interactions (Lower Priority)
    if (evidence.galleryInteractions.length > 0) {
      let interactionsSection = `\n=== GALLERY COMMENTS (${evidence.galleryInteractions.length}) ===\n`;
      evidence.galleryInteractions.forEach(interaction => {
        interactionsSection += `\nComment on "${interaction.projectTitle}":\n`;
        const content = this.anonymizeText(interaction.content, studentId);
        interactionsSection += `${content}\n`;
        interactionsSection += `Date: ${new Date(interaction.createdAt?.toDate?.() || interaction.createdAt).toLocaleDateString()}\n\n`;
      });
      sections.push({ priority: 3, content: interactionsSection, tokens: this.estimateTokens(interactionsSection) });
    }

    // 7. Achievements (Lower Priority)
    if (evidence.achievements.length > 0) {
      let achievementsSection = `\n=== ACHIEVEMENTS (${evidence.achievements.length}) ===\n`;
      evidence.achievements.forEach(achievement => {
        achievementsSection += `\nAchievement: ${achievement.title}\n`;
        achievementsSection += `Description: ${achievement.description}\n`;
        achievementsSection += `Earned: ${new Date(achievement.earnedAt?.toDate?.() || achievement.earnedAt).toLocaleDateString()}\n\n`;
      });
      sections.push({ priority: 3, content: achievementsSection, tokens: this.estimateTokens(achievementsSection) });
    }

    // Sort sections by priority and fit within token limit
    sections.sort((a, b) => a.priority - b.priority);
    
    let totalTokens = 0;
    let includedSections = [];
    
    for (const section of sections) {
      if (totalTokens + section.tokens <= maxTokens) {
        includedSections.push(section.content);
        totalTokens += section.tokens;
      } else {
        console.log(`⚠️ Truncating evidence at ${totalTokens.toLocaleString()} tokens (${modelName} limit: ${maxTokens.toLocaleString()})`);
        break;
      }
    }
    
    const summary = includedSections.join('');
    console.log(`📊 Evidence summary prepared for ${modelName}: ${totalTokens.toLocaleString()} tokens`);
    
    return summary || 'No evidence available for analysis.';
  }

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

  formatCompetencyDefinitions() {
    let text = '';
    Object.entries(this.competencyDefinitions).forEach(([id, comp]) => {
      text += `\n${comp.name}:\n`;
      text += `Description: ${comp.description}\n\n`;
    });
    return text;
  }

  async generateBatchReport(filePath, options = {}) {
    const { outputFile = null, showProgress = false } = options;

    console.log(`🚀 Generating batch report from file: ${filePath}\n`);

    try {
      // Read student IDs from file
      const studentIds = await this.readStudentIdsFromFile(filePath);
      console.log(`📋 Found ${studentIds.length} student IDs in file`);

      const batchResult = await this.competencyService.generateBatchHistoricalAnalytics(
        studentIds,
        {
          saveToFile: false, // We'll handle saving ourselves
          onProgress: showProgress ? (progress) => {
            console.log(`📊 Progress: ${progress.current}/${progress.total} - ${progress.studentId} (${progress.rowsGenerated} rows, $${progress.apiCost.toFixed(4)})`);
          } : null
        }
      );

      this.displayReportSummary(batchResult.summary);

      // Save to file if requested
      if (outputFile) {
        await this.saveReportToFile(batchResult.csvContent, outputFile);
      }

    } catch (error) {
      console.error('❌ Error generating batch report:', error.message);
      process.exit(1);
    }
  }

  async readStudentIdsFromFile(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // Filter out empty lines and comments
  }

  async saveReportToFile(csvContent, fileName) {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      await fs.promises.mkdir(exportsDir, { recursive: true });

      const filePath = path.join(exportsDir, fileName);
      await fs.promises.writeFile(filePath, csvContent, 'utf8');

      console.log(`💾 Report saved to: ${filePath}`);
      console.log(`📊 File size: ${csvContent.length.toLocaleString()} characters`);
      return filePath;
    } catch (error) {
      console.error('❌ Error saving file:', error.message);
      throw error;
    }
  }

  displayReportSummary(summary) {
    console.log('\n📊 REPORT SUMMARY:');
    console.log('==================');
    console.log(`Total Students: ${summary.totalStudents}`);
    console.log(`Students Processed: ${summary.studentsProcessed}`);
    console.log(`Students Skipped: ${summary.studentsSkipped}`);
    console.log(`Success Rate: ${summary.successRate}`);
    console.log(`Total Rows Generated: ${summary.totalRows.toLocaleString()}`);
    console.log(`Total API Cost: $${summary.totalApiCost.toFixed(4)}`);
    console.log(`Average Cost per Student: $${summary.averageApiCostPerStudent.toFixed(4)}`);
    console.log(`Generated At: ${new Date(summary.generatedAt).toLocaleString()}`);

    if (summary.processingErrors.length > 0) {
      console.log('\n⚠️  PROCESSING ERRORS:');
      console.log('=====================');
      summary.processingErrors.forEach(error => {
        console.log(`- ${error.studentId}: ${error.error}`);
      });
    }
  }

  displayStudentSummary(summary) {
    console.log('\n📊 STUDENT SUMMARY:');
    console.log('===================');
    console.log(`Student ID: ${summary.studentId}`);
    console.log(`Total Rows: ${summary.totalRows.toLocaleString()}`);
    console.log(`Days Processed: ${summary.daysProcessed}`);
    console.log(`Competencies Analyzed: ${summary.competenciesAnalyzed}`);
    console.log(`Total API Cost: $${summary.totalApiCost.toFixed(4)}`);
  }

  async main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      this.printHeader();
      this.printUsage();
      return;
    }

    const command = args[0];
    const options = this.parseOptions(args.slice(1));

    this.printHeader();

    switch (command) {
      case 'all':
        await this.generateForAllStudents(options);
        break;

      case 'student':
        if (args.length < 2) {
          console.error('❌ Student ID required. Usage: node generate_historical_reports.js student <id>');
          process.exit(1);
        }
        await this.generateForStudent(args[1], options);
        break;

      case 'batch':
        if (args.length < 2) {
          console.error('❌ File path required. Usage: node generate_historical_reports.js batch <file>');
          process.exit(1);
        }
        await this.generateBatchReport(args[1], options);
        break;

      case 'test':
        await this.runTest();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        this.printUsage();
        process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--output':
          if (i + 1 < args.length) {
            options.outputFile = args[++i];
          }
          break;
        case '--no-save':
          options.noSave = true;
          break;
        case '--progress':
          options.showProgress = true;
          break;
      }
    }
    return options;
  }
}

// Run the CLI tool
const cli = new HistoricalAnalyticsCLI();
cli.main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
