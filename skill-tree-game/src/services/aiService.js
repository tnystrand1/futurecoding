// AI Service for CodeCritic V10 - OpenRouter Integration
import { db } from '../utils/firebase-config';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { getCourseContext, formatCourseContextForAI } from '../data/courseReference';

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
          this.model = 'openai/o4-mini'; //
  }

  // Persona definitions for CodeCritic V10
  getPersonaPrompt(persona) {
    const personas = {
      'jaylen-brown': `You are CodeCritic embodying Jaylen Brown's persona - thoughtful, strategic, community-focused mentor. Ask deep questions about the student's community and interests before diving into projects. Be patient and methodical in your teaching. Focus on how coding can make a real difference. Always check understanding before moving forward.`,
      
      'ice-spice': `You are CodeCritic embodying Ice Spice's persona - confident, cool, straight to the point. Quick intro, then let's build. Keep explanations short and real. "Alright, what are we making?" Get their vision in 1-2 sentences, then jump straight into code. Cool energy, fast action, simple explanations. No long speeches - just results.`,
      
      'mrbeast': `You are CodeCritic embodying MrBeast's persona - energetic but responsive. FIRST answer any direct questions they ask (time, day, etc.). Then bring energy to coding projects. "Let's BUILD something AMAZING!" Quick project vision, then immediate action. Show code fast, celebrate small wins. Keep explanations short and focused. Be excited but listen carefully to what they're asking for.`,
      
      'valkyrae': `You are CodeCritic embodying Valkyrae's persona - supportive teammate who gets things done. "Hey! What are we building today?" Quick friendly check-in, then let's code together. "We got this!" Show code, explain briefly, then: "Want to try the next part?" Collaborative but efficient. Supportive vibes, steady progress.`,
      
      'neil-degrasse-tyson': `You are CodeCritic embodying Neil deGrasse Tyson's persona - curious scientist and teacher. Start with wonder about what the student wants to explore. Ask "why" questions and help them discover principles. Explain concepts with analogies. Never give answers without helping them think through the problem first.`
    };

    const basePrompt = `
CORE MANDATE: You are CodeCritic, a sophisticated, culturally responsive AI learning companion for a Boston high school student in their 8-day "Future Web Development with AI" course.

CRITICAL PEDAGOGICAL RULES:
1. ANSWER DIRECT QUESTIONS FIRST - If student asks "what time is it?" or "what day is it?", answer that specific question immediately
2. ALWAYS remember and reference previous conversations - check the message history for context about this student
3. Balance conversation with action - don't be overly verbose, get to coding quickly but thoughtfully
4. Break learning into small, digestible steps with clear explanations
5. Ask ONE focused question at a time, not multiple questions
6. Let students guide the creative vision - you provide technical support
7. Explain the "why" briefly, then show the "how" with code
8. Connect new concepts to what they already know
9. Celebrate small wins and learning moments concisely
10. Reference past projects and conversations to build continuity

INTERACTION FLOW:
1. FIRST: If the student asks a direct question (time, day, clarification), answer it immediately and precisely
2. THEN: Review any previous messages in this conversation to understand context
3. If returning student: briefly acknowledge what you remember, then address their current need
4. If new student: Quick intro (1-2 sentences), then dive into their project vision
5. Get their project idea quickly, then start building immediately
6. Provide code examples early and often with brief explanations
7. Check understanding with simple questions ("Ready to try this?")
8. Always include setup instructions for VS Code when providing code
9. Keep responses focused and action-oriented

CODE TEACHING RULES:
- Give brief explanation (1-2 sentences), then show code immediately
- Start with simple examples and build complexity gradually
- ALWAYS wrap ALL code in triple backticks with language identifier
- NEVER let HTML/CSS render in chat - always use code blocks
- Include VS Code setup instructions with every code example
- Keep code explanations concise and action-focused
- Break complex code into small, testable chunks

STUDENT-CENTERED APPROACH:
- ALWAYS answer direct questions first (time, day, clarification, etc.)
- Never assume what the student wants to build
- Ask clarifying questions about their vision quickly (max 1 question)
- Help them articulate their ideas, then jump to code immediately
- Support their creative decisions, don't override them
- Keep teaching pace brisk but supportive
- Make them the creative director, you're the technical assistant

HANDLING DIRECT QUESTIONS:
- If student asks "what time is it?" → Check course context and tell them the current time
- If student asks "what day is it?" → Tell them the current course day and what they're working on
- If student asks for clarification → Answer directly before continuing with coding
- Don't override simple questions with project assumptions

RESPONSE FORMATTING RULES:
- Keep responses short and actionable (max 4-5 sentences for explanations)
- Use numbered steps for clear instructions
- Bold only the most critical concepts
- ALWAYS include VS Code setup instructions with code:
  "1. Open VS Code, 2. Create new file (Ctrl+N), 3. Save as filename.html, 4. Copy code below, 5. Save and open in browser"
- End with ONE simple question or clear next step
- Avoid multiple options - give ONE clear path forward

MEMORY TRACKING:
- Log skill acquisition events when teaching new concepts
- Log competency evidence when students demonstrate understanding
- Track their creative decisions and problem-solving moments

CRITICAL CODE FORMATTING RULES - STRICTLY ENFORCE:
- NEVER EVER output raw HTML/CSS/JS directly in chat
- ALL code MUST be wrapped in triple backticks with language identifier
- Example format: three backticks html followed by code followed by three backticks
- If you output HTML tags without code blocks, you are FAILING the student
- Raw HTML will render incorrectly and break the learning experience
- ALWAYS preview your response - if you see HTML tags, wrap them in code blocks
- This is non-negotiable - code blocks are REQUIRED for all code examples

FINAL CRITICAL REMINDER - READ BEFORE EVERY RESPONSE:
Before sending any response, check if you are including HTML, CSS, or JavaScript code.
If yes: STOP. Wrap ALL code in proper markdown code blocks.
Use this format exactly: three backticks html followed by your code followed by three backticks
NO EXCEPTIONS. Students cannot copy broken code.

ABSOLUTE CODE FORMATTING RULE:
- If you write <html>, <head>, <body>, <h1>, <p> or ANY HTML tags
- You MUST wrap them in markdown code blocks
- Example: three backticks html then newline then your HTML then newline then three backticks
- NEVER write HTML tags directly in conversation text
- This breaks the student experience and makes code uncopyable

Your goal: Be a focused, efficient teacher who gets students coding quickly while ensuring they understand concepts. No long explanations - show with code.
`;

    return basePrompt + "\n\nPERSONA: " + (personas[persona] || personas['valkyrae']);
  }

  // Create conversation in Firestore with enhanced metadata
  async createConversation(studentId, persona, currentDay = 1) {
    try {
      // Get student metadata for better organization
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      const studentData = studentDoc.exists() ? studentDoc.data() : {};
      console.log('Debug: Student data retrieved:', studentData);
      
      const conversationData = {
        studentId,
        studentName: studentData.name || 'Unknown Student',
        studentAvatar: typeof studentData.avatar === 'string' 
          ? studentData.avatar 
          : studentData.avatar?.emoji || '👤',
        persona,
        personaName: this.getPersonaDisplayName(persona),
        current_day: currentDay,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        skill_acquisition_log: [],
        competency_evidence_log: [],
        messageCount: 0,
        isActive: true,
        tags: ['ai-chat', 'codecritic', persona, `day-${currentDay}`]
      };

      const docRef = await addDoc(collection(db, 'ai_conversations'), conversationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Helper to get persona display name
  getPersonaDisplayName(persona) {
    const personaNames = {
      'jaylen-brown': 'Jaylen Brown',
      'ice-spice': 'Ice Spice', 
      'mrbeast': 'MrBeast',
      'valkyrae': 'Valkyrae',
      'neil-degrasse-tyson': 'Neil deGrasse Tyson'
    };
    return personaNames[persona] || persona;
  }



  // Get conversation history
  async getConversationHistory(conversationId) {
    try {
      const messagesQuery = query(
        collection(db, 'ai_conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  // Save message to Firestore
  async saveMessage(conversationId, message, isUser = false) {
    try {
      const messageData = {
        content: message,
        isUser,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'ai_conversations', conversationId, 'messages'), messageData);
      
      // Update conversation metadata
      await updateDoc(doc(db, 'ai_conversations', conversationId), {
        lastActivity: serverTimestamp(),
        messageCount: (await this.getMessageCount(conversationId)) + 1
      });
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Get message count for conversation
  async getMessageCount(conversationId) {
    try {
      const conversationDoc = await getDoc(doc(db, 'ai_conversations', conversationId));
      return conversationDoc.data()?.messageCount || 0;
    } catch (error) {
      return 0;
    }
  }

  // Log skill acquisition
  async logSkillAcquisition(conversationId, skillName, description) {
    try {
      const conversationRef = doc(db, 'ai_conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      const currentLog = conversationDoc.data()?.skill_acquisition_log || [];
      
      const skillEvent = {
        skillName,
        description,
        timestamp: new Date().toISOString(),
        session: currentLog.length + 1
      };

      await updateDoc(conversationRef, {
        skill_acquisition_log: [...currentLog, skillEvent]
      });
    } catch (error) {
      console.error('Error logging skill acquisition:', error);
    }
  }

  // Log competency evidence
  async logCompetencyEvidence(conversationId, competency, evidence, lookFor) {
    try {
      const conversationRef = doc(db, 'ai_conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      const currentLog = conversationDoc.data()?.competency_evidence_log || [];
      
      const competencyEvent = {
        competency,
        evidence,
        lookFor,
        timestamp: new Date().toISOString(),
        session: currentLog.length + 1
      };

      await updateDoc(conversationRef, {
        competency_evidence_log: [...currentLog, competencyEvent]
      });
    } catch (error) {
      console.error('Error logging competency evidence:', error);
    }
  }

  // Send message to AI (OpenRouter)
  async sendMessage(conversationId, userMessage, persona = 'valkyrae') {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      // Save user message
      await this.saveMessage(conversationId, userMessage, true);

      // Get conversation data to extract student information
      const conversationDoc = await getDoc(doc(db, 'ai_conversations', conversationId));
      const conversationData = conversationDoc.data();
      const studentId = conversationData?.studentId;
      const conversationPersona = conversationData?.persona || persona;
      const currentDay = conversationData?.current_day || 1;
      
      // Get memory context instead of full chat history
      const memoryContext = await this.getMemoryContext(studentId);
      
      // Get recent conversation history (last 10 messages only for immediate context)
      const history = await this.getConversationHistory(conversationId);
      const recentHistory = history.slice(-10);
      
      // Get current time for course context
      const now = new Date();
      const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Get course context based on selected day and current time
      const courseContext = getCourseContext(currentDay, currentTime);
      const courseContextText = formatCourseContextForAI(courseContext, currentTime);
      
      // Log conversation context for debugging
      console.log(`🧠 AI Context: Using memory context + ${recentHistory.length} recent messages for conversation ${conversationId}`);
      console.log(`👤 Student Context: ${studentId}`);
      console.log(`📚 Course Context: Day ${currentDay}, Time: ${currentTime}`);
      if (courseContext?.currentActivity) {
        console.log(`🎯 Current Activity: ${courseContext.currentActivity.title}`);
      }
      
      // Build messages array for API with memory context + course context
      const systemPrompt = this.getPersonaPrompt(conversationPersona) + memoryContext + courseContextText;
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...recentHistory.slice(0, -1).map(msg => ({  // Previous history
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage  // Current user message
        }
      ];

      // Call OpenRouter API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FUTURE CODING ACADEMY - CodeCritic V10'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        let errorMessage = 'Unknown API error';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || response.statusText;
        } catch {
          errorMessage = response.statusText;
        }
        
        // Handle specific error types
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment and try again. (${errorMessage})`);
        } else if (response.status === 401) {
          throw new Error(`API authentication failed. Please check your API key configuration.`);
        } else if (response.status >= 500) {
          throw new Error(`Server error. The AI service is temporarily unavailable. (${errorMessage})`);
        } else {
          throw new Error(`OpenRouter API error: ${errorMessage}`);
        }
      }

      const data = await response.json();
      console.log('🤖 OpenRouter API Response:', data);
      
      const aiResponse = data.choices?.[0]?.message?.content || 
                        data.content || 
                        'Sorry, I encountered an error generating a response.';
      
      console.log('🗨️ AI Response:', aiResponse);

      // Save AI response
      await this.saveMessage(conversationId, aiResponse, false);

      // Auto-update memory with conversation context
      await this.updateConversationMemory(studentId, userMessage, aiResponse);

      return {
        success: true,
        message: aiResponse,
        usage: data.usage
      };

    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Save error message
      const errorMessage = `Sorry, I'm having trouble connecting right now. Error: ${error.message}`;
      await this.saveMessage(conversationId, errorMessage, false);
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  // Memory Management System
  async getStudentMemory(studentId) {
    try {
      const memoryDoc = await getDoc(doc(db, 'student_memories', studentId));
      if (memoryDoc.exists()) {
        return memoryDoc.data();
      } else {
        // Initialize new memory document
        const initialMemory = {
          // Long-term memory (persists across sessions)
          student_name: '',
          chosen_persona: '',
          student_local_context: '',
          project_history: [],
          skill_acquisition_log: [],
          skill_tree_progress: {
            current_archetype: '',
            projected_outcome: ''
          },
          success_moments: [],
          
          // Session memory (current day focused)
          current_day: 1,
          daily_goal: '',
          sprint_task: '',
          blockers: [],
          last_action: '',
          competency_evidence_log: [],
          
          // Metadata
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'student_memories', studentId), initialMemory);
        return initialMemory;
      }
    } catch (error) {
      console.error('Error getting student memory:', error);
      return null;
    }
  }

  async updateStudentMemory(studentId, updates) {
    try {
      await updateDoc(doc(db, 'student_memories', studentId), {
        ...updates,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating student memory:', error);
    }
  }

  async logSkillAcquisition(studentId, skillName, context) {
    try {
      const memory = await this.getStudentMemory(studentId);
      const newSkillEntry = {
        timestamp: new Date().toISOString(),
        skill_name: skillName,
        context: context
      };
      
      // Check if skill already logged
      const existingSkill = memory.skill_acquisition_log.find(entry => entry.skill_name === skillName);
      if (!existingSkill) {
        memory.skill_acquisition_log.push(newSkillEntry);
        await this.updateStudentMemory(studentId, {
          skill_acquisition_log: memory.skill_acquisition_log
        });
      }
    } catch (error) {
      console.error('Error logging skill acquisition:', error);
    }
  }

  async logCompetencyEvidence(studentId, competency, proficiencyLevel, studentAction, directQuote, reasoning) {
    try {
      const memory = await this.getStudentMemory(studentId);
      const evidenceEntry = {
        timestamp: new Date().toISOString(),
        student_action_summary: studentAction,
        direct_quote_or_action: directQuote,
        competency: competency,
        proficiency_level_observed: proficiencyLevel,
        reasoning: reasoning
      };
      
      memory.competency_evidence_log.push(evidenceEntry);
      await this.updateStudentMemory(studentId, {
        competency_evidence_log: memory.competency_evidence_log
      });
    } catch (error) {
      console.error('Error logging competency evidence:', error);
    }
  }

  async updateConversationMemory(studentId, userMessage, aiResponse) {
    try {
      const memory = await this.getStudentMemory(studentId);
      const updates = {};
      
      // Detect project mentions and update project history
      const projectKeywords = ['website', 'duck', 'project', 'jamaica pond', 'building', 'making'];
      const hasProjectMention = projectKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword) || aiResponse.toLowerCase().includes(keyword)
      );
      
      if (hasProjectMention) {
        const projectUpdate = `Working on duck website project for Jamaica Pond - ${new Date().toLocaleDateString()}`;
        if (!memory.project_history.includes(projectUpdate)) {
          memory.project_history.push(projectUpdate);
          updates.project_history = memory.project_history.slice(-5); // Keep last 5
        }
        
        // Update current archetype if not set
        if (!memory.skill_tree_progress.current_archetype) {
          updates.skill_tree_progress = {
            ...memory.skill_tree_progress,
            current_archetype: 'Duck Website Project'
          };
        }
      }
      
      // Detect code sharing and update skills
      if (aiResponse.includes('```') || aiResponse.includes('html') || aiResponse.includes('css')) {
        const skillUpdate = {
          timestamp: new Date().toISOString(),
          skill_name: 'HTML Structure',
          context: 'Learned basic HTML for duck website'
        };
        
        const hasSkill = memory.skill_acquisition_log.some(s => s.skill_name === 'HTML Structure');
        if (!hasSkill) {
          memory.skill_acquisition_log.push(skillUpdate);
          updates.skill_acquisition_log = memory.skill_acquisition_log;
        }
      }
      
      // Update last action
      updates.last_action = `Discussed ${hasProjectMention ? 'duck project' : 'coding topics'}`;
      updates.lastUpdated = new Date().toISOString();
      
      if (Object.keys(updates).length > 0) {
        await this.updateStudentMemory(studentId, updates);
        console.log('💾 Updated memory for student:', studentId, updates);
      }
      
    } catch (error) {
      console.error('Error updating conversation memory:', error);
    }
  }

  async getMemoryContext(studentId) {
    try {
      const memory = await this.getStudentMemory(studentId);
      if (!memory) return '';
      
      // Build concise memory context for AI
      const context = `
STUDENT MEMORY CONTEXT:
Name: ${memory.student_name || 'Unknown'}
Persona: ${memory.chosen_persona || 'Not selected'}
Current Day: ${memory.current_day}/8
Daily Goal: ${memory.daily_goal || 'Not set'}
Local Context: ${memory.student_local_context || 'None'}

Recent Skills Learned: ${memory.skill_acquisition_log.slice(-5).map(s => s.skill_name).join(', ') || 'None'}
Current Project: ${memory.skill_tree_progress.current_archetype || 'Not selected'}
Recent Blockers: ${memory.blockers.slice(-3).join(', ') || 'None'}
Last Action: ${memory.last_action || 'None'}

Project History: ${memory.project_history.slice(-3).join('; ') || 'None'}
Success Moments: ${memory.success_moments.slice(-2).join('; ') || 'None'}`;

      return context;
    } catch (error) {
      console.error('Error getting memory context:', error);
      return '';
    }
  }

  // Get student's active conversation
  async getActiveConversation(studentId) {
    try {
      // Use simpler query to avoid index requirements
      const conversationsQuery = query(
        collection(db, 'ai_conversations'),
        where('studentId', '==', studentId)
      );
      
      const snapshot = await getDocs(conversationsQuery);
      if (!snapshot.empty) {
        // Filter and sort in memory to find most recent active conversation
        const activeConversations = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(conv => conv.isActive === true)
          .sort((a, b) => {
            const dateA = a.lastActivity?.toDate?.() || new Date(a.lastActivity);
            const dateB = b.lastActivity?.toDate?.() || new Date(b.lastActivity);
            return dateB - dateA; // Most recent first
          });
        
        return activeConversations[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active conversation:', error);
      return null;
    }
  }

  // End conversation (mark as inactive)
  async endConversation(conversationId) {
    try {
      await updateDoc(doc(db, 'ai_conversations', conversationId), {
        isActive: false,
        endedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  // Update conversation day
  async updateConversationDay(conversationId, newDay) {
    try {
      await updateDoc(doc(db, 'ai_conversations', conversationId), {
        current_day: newDay,
        lastActivity: serverTimestamp()
      });
      console.log(`📅 Updated conversation ${conversationId} to Day ${newDay}`);
    } catch (error) {
      console.error('Error updating conversation day:', error);
      throw error;
    }
  }

  // Reset chat while preserving memory
  async resetChat(studentId, newPersona = null, newDay = null) {
    try {
      // End current active conversation
      const activeConversation = await this.getActiveConversation(studentId);
      if (activeConversation) {
        await this.endConversation(activeConversation.id);
      }
      
      // Update memory if new day or persona provided
      const updates = {};
      if (newPersona) {
        updates.chosen_persona = newPersona;
      }
      if (newDay) {
        updates.current_day = newDay;
        updates.last_action = `Started Day ${newDay}`;
      }
      
      if (Object.keys(updates).length > 0) {
        await this.updateStudentMemory(studentId, updates);
      }
      
      console.log(`🔄 Chat reset for student ${studentId}. New persona: ${newPersona}, Day: ${newDay}`);
      
      return {
        success: true,
        message: 'Chat reset successfully while preserving memory'
      };
    } catch (error) {
      console.error('Error resetting chat:', error);
      throw error;
    }
  }

  // Get all conversations for teacher dashboard (organized by student)
  async getAllConversationsForTeacher() {
    try {
      const conversationsQuery = query(
        collection(db, 'ai_conversations'),
        orderBy('lastActivity', 'desc')
      );
      
      const snapshot = await getDocs(conversationsQuery);
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group by student for easier teacher navigation
      const groupedByStudent = {};
      conversations.forEach(conv => {
        if (!groupedByStudent[conv.studentId]) {
          groupedByStudent[conv.studentId] = {
            studentName: conv.studentName || 'Unknown Student',
            studentAvatar: typeof conv.studentAvatar === 'string' 
              ? conv.studentAvatar 
              : conv.studentAvatar?.emoji || '👤',
            conversations: []
          };
        }
        groupedByStudent[conv.studentId].conversations.push(conv);
      });

      return groupedByStudent;
    } catch (error) {
      console.error('Error getting conversations for teacher:', error);
      return {};
    }
  }

  // Export full chat log for a student (for end of class)
  async exportStudentChatLog(studentId) {
    try {
      // Use a simpler query to avoid index requirements, then sort in memory
      const conversationsQuery = query(
        collection(db, 'ai_conversations'),
        where('studentId', '==', studentId)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const fullLog = [];

      for (const convDoc of conversationsSnapshot.docs) {
        const conversation = { id: convDoc.id, ...convDoc.data() };
        
        // Get all messages for this conversation
        const messagesQuery = query(
          collection(db, 'ai_conversations', convDoc.id, 'messages'),
          orderBy('timestamp', 'asc')
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        const messages = messagesSnapshot.docs.map(doc => doc.data());
        
        fullLog.push({
          conversation: conversation,
          messages: messages
        });
      }

      // Sort conversations by creation date (client-side sorting)
      fullLog.sort((a, b) => {
        const dateA = a.conversation.createdAt?.toDate?.() || new Date(a.conversation.createdAt);
        const dateB = b.conversation.createdAt?.toDate?.() || new Date(b.conversation.createdAt);
        return dateA - dateB;
      });

      return {
        studentId,
        studentName: fullLog[0]?.conversation?.studentName || 'Unknown Student',
        exportDate: new Date().toISOString(),
        totalConversations: fullLog.length,
        totalMessages: fullLog.reduce((sum, conv) => sum + conv.messages.length, 0),
        chatHistory: fullLog
      };
    } catch (error) {
      console.error('Error exporting student chat log:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();