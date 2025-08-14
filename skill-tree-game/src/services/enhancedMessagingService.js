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

class EnhancedMessagingService {
  constructor() {
    this.conversationsRef = collection(db, 'conversations');
    this.messagesRef = collection(db, 'messages');
    this.studentsRef = collection(db, 'students');
    this.messagingStatsRef = collection(db, 'messagingStats');
  }

  // Send a message with enhanced attachment support
  async sendMessage(conversationId, senderId, receiverId, text, attachments = []) {
    try {
      // Determine message type and process attachments
      const hasText = text && text.trim();
      const hasAttachments = attachments && attachments.length > 0;
      
      let messageType = 'text';
      const processedAttachments = [];
      
      if (hasAttachments) {
        const imageAttachments = attachments.filter(att => att.type === 'image');
        const codeAttachments = attachments.filter(att => att.type === 'code');
        
        if (imageAttachments.length > 0 && codeAttachments.length > 0) {
          messageType = 'mixed_media';
        } else if (imageAttachments.length > 0) {
          messageType = hasText ? 'mixed' : 'image';
        } else if (codeAttachments.length > 0) {
          messageType = hasText ? 'code_mixed' : 'code';
        }
        
        // Process all attachments
        attachments.forEach(attachment => {
          if (attachment.type === 'image') {
            processedAttachments.push({
              id: String(attachment.id || Date.now() + Math.random()),
              type: 'image',
              name: String(attachment.name || 'image.png'),
              size: Number(attachment.size || 0),
              dataUrl: String(attachment.dataUrl || '')
            });
          } else if (attachment.type === 'code') {
            processedAttachments.push({
              id: String(attachment.id || Date.now() + Math.random()),
              type: 'code',
              name: String(attachment.name || 'code.txt'),
              size: Number(attachment.size || 0),
              content: String(attachment.content || ''),
              language: String(attachment.language || 'text')
            });
          }
        });
      }

      // Create message document
      const messageData = {
        conversationId,
        senderId,
        receiverId,
        text: hasText ? text.trim() : '',
        timestamp: serverTimestamp(),
        messageType,
        isRead: false,
        competencyTags: this.analyzeMessageForCompetencyTags(text, processedAttachments)
      };

      // Only add attachments field if we have attachments
      if (processedAttachments.length > 0) {
        messageData.attachments = processedAttachments;
      }

      const messageRef = await addDoc(this.messagesRef, messageData);

      // Update conversation with last message
      const conversationDoc = await getDoc(doc(this.conversationsRef, conversationId));
      const currentMessageCount = conversationDoc.data()?.messageCount || 0;
      
      // Create last message preview
      let lastMessageText = this.createMessagePreview(text, processedAttachments, messageType);

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
        success: true,
        messageId: messageRef.id,
        messageType,
        attachmentCount: processedAttachments.length
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Create appropriate message preview for conversation list
  createMessagePreview(text, attachments, messageType) {
    const imageCount = attachments.filter(att => att.type === 'image').length;
    const codeCount = attachments.filter(att => att.type === 'code').length;
    
    let preview = '';
    
    if (text && text.trim()) {
      preview = text.trim().substring(0, 50);
      if (text.trim().length > 50) preview += '...';
    }
    
    const attachmentIcons = [];
    if (imageCount > 0) {
      attachmentIcons.push(`📷${imageCount > 1 ? imageCount : ''}`);
    }
    if (codeCount > 0) {
      attachmentIcons.push(`💻${codeCount > 1 ? codeCount : ''}`);
    }
    
    if (attachmentIcons.length > 0) {
      if (preview) {
        return `${preview} ${attachmentIcons.join(' ')}`;
      } else {
        return attachmentIcons.join(' ');
      }
    }
    
    return preview || 'Message';
  }

  // Enhanced competency analysis including code attachments
  analyzeMessageForCompetencyTags(text, attachments = []) {
    const tags = [];
    const content = text ? text.toLowerCase() : '';
    
    // Text-based analysis
    if (content.includes('help') || content.includes('stuck') || content.includes('error')) {
      tags.push('help-seeking');
    }
    if (content.includes('figured out') || content.includes('solution') || content.includes('fixed')) {
      tags.push('problem-solving');
    }
    if (content.includes('work together') || content.includes('collaborate') || content.includes('pair')) {
      tags.push('collaboration');
    }
    if (content.includes('completed') || content.includes('finished') || content.includes('done')) {
      tags.push('progress-sharing');
    }
    
    // Code-based analysis
    const codeAttachments = attachments.filter(att => att.type === 'code');
    if (codeAttachments.length > 0) {
      tags.push('code-sharing');
      
      codeAttachments.forEach(codeFile => {
        const codeContent = codeFile.content ? codeFile.content.toLowerCase() : '';
        const language = codeFile.language || '';
        
        // Language-specific tags
        if (language === 'html' || codeContent.includes('<div') || codeContent.includes('<html')) {
          tags.push('html-development');
        }
        if (language === 'css' || codeContent.includes('margin:') || codeContent.includes('color:')) {
          tags.push('css-styling');
        }
        if (language === 'javascript' || codeContent.includes('function') || codeContent.includes('const ')) {
          tags.push('javascript-programming');
        }
        
        // Complexity indicators
        if (codeContent.includes('function') || codeContent.includes('class') || codeContent.includes('=>')) {
          tags.push('advanced-programming');
        }
        if (codeContent.includes('error') || codeContent.includes('debug') || codeContent.includes('console.log')) {
          tags.push('debugging');
        }
      });
    }
    
    // Text code analysis
    if (content.includes('```') || content.includes('function') || content.includes('<div')) {
      tags.push('inline-code-sharing');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Update existing methods to handle new attachment structure
  async getConversationMessages(conversationId, limitCount = 50) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  // Create a new conversation
  async createConversation(participant1Id, participant2Id) {
    try {
      // Check if conversation already exists
      const existingConversation = await this.getExistingConversation(participant1Id, participant2Id);
      if (existingConversation) {
        return existingConversation;
      }

      const conversationData = {
        participants: [participant1Id, participant2Id],
        createdAt: serverTimestamp(),
        lastMessage: {
          text: '',
          senderId: '',
          timestamp: serverTimestamp()
        },
        messageCount: 0
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

  // Check for existing conversation between two participants
  async getExistingConversation(participant1Id, participant2Id) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', participant1Id)
      );
      
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(participant2Id)) {
          return {
            id: doc.id,
            ...data
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing conversation:', error);
      return null;
    }
  }

  // Get student conversations with fallback logic
  async getStudentConversations(studentId) {
    try {
      // Try indexed query first
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.warn('Indexed query failed, using fallback:', error);
      
      // Fallback: get all conversations and filter client-side
      const allConversationsSnapshot = await getDocs(this.conversationsRef);
      const conversations = allConversationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(conv => conv.participants.includes(studentId))
        .sort((a, b) => {
          const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
          const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
      
      return conversations;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isRead: true })
      );
      
      await Promise.all(updatePromises);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return 0;
    }
  }

  // Get student directory
  async getStudentDirectory(excludeStudentId = null) {
    try {
      const snapshot = await getDocs(this.studentsRef);
      let students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out the current student
      if (excludeStudentId) {
        students = students.filter(student => student.id !== excludeStudentId);
      }

      // If no students found, add sample students for testing
      if (students.length === 0) {
        students = [
          { id: 'sample_student_1', name: 'Alex Chen', avatar: '👨‍💻', online: true },
          { id: 'sample_student_2', name: 'Maya Rodriguez', avatar: '👩‍🎨', online: false },
          { id: 'sample_student_3', name: 'Jordan Kim', avatar: '👨‍🔬', online: true },
          { id: 'sample_student_4', name: 'Sam Taylor', avatar: '👩‍💻', online: true }
        ].filter(student => student.id !== excludeStudentId);
      }

      return students;
    } catch (error) {
      console.error('Error getting student directory:', error);
      return [];
    }
  }

  // Get unread message count
  async getUnreadCount(userId) {
    try {
      const q = query(
        this.messagesRef,
        where('receiverId', '==', userId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Listen to conversation messages with real-time updates
  listenToConversationMessages(conversationId, callback, limitCount = 50) {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
      );
      
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messages);
      });
    } catch (error) {
      console.error('Error listening to conversation messages:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Listen to student conversations with real-time updates
  listenToStudentConversations(studentId, callback) {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains', studentId),
        orderBy('lastMessage.timestamp', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(conversations);
      }, (error) => {
        console.warn('Real-time query failed, using fallback:', error);
        
        // Fallback listener
        const unsubscribe = onSnapshot(this.conversationsRef, (snapshot) => {
          const conversations = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(conv => conv.participants.includes(studentId))
            .sort((a, b) => {
              const aTime = a.lastMessage?.timestamp?.toDate?.() || new Date(0);
              const bTime = b.lastMessage?.timestamp?.toDate?.() || new Date(0);
              return bTime - aTime;
            });
          callback(conversations);
        });
        
        return unsubscribe;
      });
    } catch (error) {
      console.error('Error listening to student conversations:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Update messaging statistics
  async updateMessagingStats(studentId, action) {
    try {
      const statsDocRef = doc(this.messagingStatsRef, studentId);
      const statsDoc = await getDoc(statsDocRef);
      
      if (statsDoc.exists()) {
        const currentStats = statsDoc.data();
        const updates = {
          lastActive: serverTimestamp()
        };
        
        switch (action) {
          case 'message_sent':
            updates.messagesSent = (currentStats.messagesSent || 0) + 1;
            updates.totalInteractions = (currentStats.totalInteractions || 0) + 1;
            break;
          case 'message_received':
            updates.messagesReceived = (currentStats.messagesReceived || 0) + 1;
            break;
          case 'conversation_started':
            updates.conversationsStarted = (currentStats.conversationsStarted || 0) + 1;
            break;
        }
        
        await updateDoc(statsDocRef, updates);
      } else {
        // Create new stats document
        const newStats = {
          studentId,
          messagesSent: action === 'message_sent' ? 1 : 0,
          messagesReceived: action === 'message_received' ? 1 : 0,
          conversationsStarted: action === 'conversation_started' ? 1 : 0,
          totalInteractions: action === 'message_sent' ? 1 : 0,
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        };
        
        await updateDoc(statsDocRef, newStats);
      }
    } catch (error) {
      console.error('Error updating messaging stats:', error);
    }
  }
}

export default new EnhancedMessagingService();
