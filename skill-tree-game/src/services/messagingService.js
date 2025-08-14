import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase-config';

class MessagingService {
  constructor() {
    this.conversationsRef = collection(db, 'conversations');
    this.messagesRef = collection(db, 'messages');
    this.messagingStatsRef = collection(db, 'student_messaging_stats');
  }

  // Create a conversation between two students
  async createConversation(student1Id, student2Id) {
    try {
      // Check if conversation already exists
      const existingConversation = await this.getExistingConversation(student1Id, student2Id);
      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const conversationData = {
        participants: [student1Id, student2Id].sort(), // Sort for consistent ordering
        createdAt: serverTimestamp(),
        lastMessage: null,
        messageCount: 0,
        isActive: true
      };

      const conversationRef = await addDoc(this.conversationsRef, conversationData);
      return {
        id: conversationRef.id,
        ...conversationData
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Check if conversation exists between two students
  async getExistingConversation(student1Id, student2Id) {
    try {
      const participants = [student1Id, student2Id].sort();
      const q = query(
        this.conversationsRef,
        where('participants', '==', participants)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking existing conversation:', error);
      return null;
    }
  }

  // Send a message
  async sendMessage(conversationId, senderId, receiverId, text, images = []) {
    try {
      // Determine message type
      const hasText = text && text.trim();
      const hasImages = images && images.length > 0;
      let messageType = 'text';
      if (hasImages && hasText) {
        messageType = 'mixed';
      } else if (hasImages) {
        messageType = 'image';
      }

      // Process images to store as data URLs (in a real app, you'd upload to storage)
      // Ensure we only store plain serializable data
      const imageData = images.map(img => ({
        id: String(img.id || Date.now() + Math.random()),
        name: String(img.name || 'image.png'),
        size: Number(img.size || 0),
        dataUrl: String(img.dataUrl || '')
      }));

      // Create message document - only include images if we have them
      const messageData = {
        conversationId,
        senderId,
        receiverId,
        text: hasText ? text.trim() : '',
        timestamp: serverTimestamp(),
        messageType,
        isRead: false,
        competencyTags: this.analyzeMessageForCompetencyTags(text)
      };

      // Only add images field if we have images to avoid empty arrays
      if (imageData && imageData.length > 0) {
        messageData.images = imageData;
      }

      const messageRef = await addDoc(this.messagesRef, messageData);

      // Update conversation with last message
      const conversationDoc = await getDoc(doc(this.conversationsRef, conversationId));
      const currentMessageCount = conversationDoc.data()?.messageCount || 0;
      
      // Create last message preview
      let lastMessageText = '';
      if (hasText && hasImages) {
        lastMessageText = `${text.trim()} 📷`;
      } else if (hasImages) {
        lastMessageText = `📷 ${images.length} image${images.length > 1 ? 's' : ''}`;
      } else {
        lastMessageText = text.trim();
      }

      await updateDoc(doc(this.conversationsRef, conversationId), {
        lastMessage: {
          text: lastMessageText,
          senderId,
          timestamp: serverTimestamp(),
          messageType
        },
        messageCount: currentMessageCount + 1
      });

      // Update messaging stats for sender
      await this.updateMessagingStats(senderId, 'message_sent');

      return {
        id: messageRef.id,
        ...messageData
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get conversations for a student
  async getStudentConversations(studentId) {
    try {
      // First try the indexed query
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting student conversations:', error);
      
      // Fallback: Get all conversations and filter client-side
      try {
        console.log('Falling back to client-side filtering...');
        const allConversationsSnapshot = await getDocs(this.conversationsRef);
        const conversations = allConversationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(conv => conv.participants?.includes(studentId))
          .sort((a, b) => {
            const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
            const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
            return bTime - aTime;
          });
        
        return conversations;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId, limitCount = 50) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  // Listen to real-time messages for a conversation
  listenToConversationMessages(conversationId, callback) {
    const q = query(
      this.messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  }

  // Listen to real-time conversations for a student
  listenToStudentConversations(studentId, callback) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const conversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(conversations);
      }, (error) => {
        console.error('Error in conversation listener:', error);
        // Fallback to simpler listener without ordering
        const fallbackQuery = query(
          this.conversationsRef,
          where('participants', 'array-contains', studentId)
        );
        
        return onSnapshot(fallbackQuery, (querySnapshot) => {
          const conversations = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => {
              const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
              const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
              return bTime - aTime;
            });
          callback(conversations);
        });
      });
    } catch (error) {
      console.error('Error setting up conversation listener:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, studentId) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', studentId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updates = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get all students for directory (excluding current student)
  async getStudentDirectory(currentStudentId) {
    try {
      // First, try to get students from the students collection
      const studentsRef = collection(db, 'students');
      const studentsQuery = await getDocs(studentsRef);
      const allStudents = new Set();
      
      // Add students from the students collection
      studentsQuery.docs.forEach(doc => {
        const studentId = doc.id;
        if (studentId !== currentStudentId) {
          allStudents.add(studentId);
        }
      });

      // Also check conversations for any additional students
      const conversationsQuery = await getDocs(this.conversationsRef);
      conversationsQuery.docs.forEach(doc => {
        const participants = doc.data().participants || [];
        participants.forEach(id => {
          if (id !== currentStudentId) {
            allStudents.add(id);
          }
        });
      });

      // If no students found in either collection, create some sample students
      if (allStudents.size === 0) {
        const sampleStudents = [
          'alice_smith', 'bob_johnson', 'carol_davis', 'david_brown', 
          'emma_wilson', 'frank_miller', 'grace_taylor', 'henry_anderson'
        ];
        sampleStudents.forEach(id => {
          if (id !== currentStudentId) {
            allStudents.add(id);
          }
        });
      }

      // Generate random avatars and online status
      const avatarEmojis = ['👤', '👩', '👨', '🧑', '👩‍💻', '👨‍💻', '🧑‍💻', '👩‍🎓', '👨‍🎓', '🧑‍🎓'];
      const avatarColors = ['#FF8C42', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#795548', '#607D8B', '#E91E63'];

      // Convert to array and get basic student info
      return Array.from(allStudents).map(id => ({
        id,
        name: id.replace(/_/g, ' '), // Convert ID to readable name
        avatar: { 
          emoji: avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)], 
          color1: avatarColors[Math.floor(Math.random() * avatarColors.length)]
        },
        isOnline: Math.random() > 0.3 // 70% chance of being online
      }));
    } catch (error) {
      console.error('Error getting student directory:', error);
      return [];
    }
  }

  // Get unread message count for a student
  async getUnreadCount(studentId) {
    try {
      const q = query(
        this.messagesRef,
        where('receiverId', '==', studentId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Update messaging statistics
  async updateMessagingStats(studentId, action) {
    try {
      const statsRef = doc(this.messagingStatsRef, studentId);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        const currentStats = statsDoc.data();
        const updates = {
          lastActive: serverTimestamp()
        };

        switch (action) {
          case 'message_sent':
            updates.totalMessages = (currentStats.totalMessages || 0) + 1;
            break;
          case 'conversation_started':
            updates.conversationsStarted = (currentStats.conversationsStarted || 0) + 1;
            break;
          case 'help_request':
            updates.helpRequests = (currentStats.helpRequests || 0) + 1;
            break;
          case 'help_offer':
            updates.helpOffers = (currentStats.helpOffers || 0) + 1;
            break;
        }

        await updateDoc(statsRef, updates);
      } else {
        // Create initial stats
        const initialStats = {
          studentId,
          totalMessages: action === 'message_sent' ? 1 : 0,
          conversationsStarted: action === 'conversation_started' ? 1 : 0,
          conversationsParticipated: 1,
          helpRequests: action === 'help_request' ? 1 : 0,
          helpOffers: action === 'help_offer' ? 1 : 0,
          lastActive: serverTimestamp(),
          communicationStyle: 'developing',
          preferredTopics: []
        };

        await updateDoc(statsRef, initialStats);
      }
    } catch (error) {
      console.error('Error updating messaging stats:', error);
    }
  }

  // Analyze message content for competency tags (basic implementation)
  analyzeMessageForCompetencyTags(text) {
    const tags = [];
    const lowerText = text.toLowerCase();

    // Communication indicators
    if (lowerText.includes('help') || lowerText.includes('question')) {
      tags.push('communication');
    }

    // Collaboration indicators
    if (lowerText.includes('work together') || lowerText.includes('partner') || lowerText.includes('team')) {
      tags.push('collaboration');
    }

    // Help-seeking behavior
    if (lowerText.includes('how do') || lowerText.includes('can you help') || lowerText.includes('stuck')) {
      tags.push('help_seeking');
    }

    // Help-offering behavior
    if (lowerText.includes('i can help') || lowerText.includes('try this') || lowerText.includes('here\'s how')) {
      tags.push('help_offering');
    }

    // Learning indicators
    if (lowerText.includes('learned') || lowerText.includes('discovered') || lowerText.includes('figured out')) {
      tags.push('continuous_learning');
    }

    return tags;
  }

  // Search conversations and messages
  async searchMessages(studentId, searchTerm) {
    try {
      // Get student's conversations
      const conversations = await this.getStudentConversations(studentId);
      const conversationIds = conversations.map(conv => conv.id);

      // Search in messages
      const searchResults = [];
      for (const convId of conversationIds) {
        const messages = await this.getConversationMessages(convId, 100);
        const matchingMessages = messages.filter(msg => 
          msg.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingMessages.length > 0) {
          searchResults.push({
            conversationId: convId,
            messages: matchingMessages
          });
        }
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService;
