import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../utils/firebase-config';

class GalleryService {
  constructor() {
    this.galleriesRef = collection(db, 'galleries');
    this.interactionsRef = collection(db, 'gallery_interactions');
    this.viewsRef = collection(db, 'gallery_views');
  }

  // Create a new gallery project
  async createProject(projectData) {
    try {
      const project = {
        ...projectData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        isPublic: true,
        featured: false,
        metrics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0
        }
      };

      const docRef = await addDoc(this.galleriesRef, project);
      return {
        success: true,
        id: docRef.id,
        project: { id: docRef.id, ...project }
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing project
  async updateProject(projectId, updates) {
    try {
      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp()
      };

      await updateDoc(doc(this.galleriesRef, projectId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a project
  async deleteProject(projectId) {
    try {
      await deleteDoc(doc(this.galleriesRef, projectId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all public projects
  async getAllProjects() {
    try {
      const q = query(
        this.galleriesRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, projects };
    } catch (error) {
      console.error('Error getting projects:', error);
      return { success: false, projects: [], error: error.message };
    }
  }

  // Get featured projects
  async getFeaturedProjects() {
    try {
      const q = query(
        this.galleriesRef,
        where('featured', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, projects };
    } catch (error) {
      console.error('Error getting featured projects:', error);
      return { success: false, projects: [], error: error.message };
    }
  }

  // Get project by ID
  async getProject(projectId) {
    try {
      const docSnap = await getDoc(doc(this.galleriesRef, projectId));
      
      if (docSnap.exists()) {
        return {
          success: true,
          project: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return { success: false, error: 'Project not found' };
      }
    } catch (error) {
      console.error('Error getting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Get projects by team
  async getProjectsByTeam(teamId) {
    try {
      const q = query(
        this.galleriesRef,
        where('teamId', '==', teamId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, projects };
    } catch (error) {
      console.error('Error getting team projects:', error);
      return { success: false, projects: [], error: error.message };
    }
  }

  // Record a project view
  async recordView(projectId, studentId) {
    try {
      // Add view record
      await addDoc(this.viewsRef, {
        galleryId: projectId,
        studentId,
        viewedAt: serverTimestamp()
      });

      // Increment view count
      await updateDoc(doc(this.galleriesRef, projectId), {
        'metrics.views': increment(1)
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording view:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a like to a project
  async likeProject(projectId, studentId) {
    try {
      // Check if already liked
      const existingLike = await this.getInteraction(projectId, studentId, 'like');
      
      if (existingLike) {
        // Remove like
        await deleteDoc(doc(this.interactionsRef, existingLike.id));
        await updateDoc(doc(this.galleriesRef, projectId), {
          'metrics.likes': increment(-1)
        });
        return { success: true, liked: false };
      } else {
        // Add like
        await addDoc(this.interactionsRef, {
          galleryId: projectId,
          studentId,
          type: 'like',
          createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(this.galleriesRef, projectId), {
          'metrics.likes': increment(1)
        });
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a reaction to a project
  async addReaction(projectId, studentId, reaction) {
    try {
      // Remove existing reaction if any
      const existingReaction = await this.getInteraction(projectId, studentId, 'reaction');
      if (existingReaction) {
        await deleteDoc(doc(this.interactionsRef, existingReaction.id));
      }

      // Add new reaction
      await addDoc(this.interactionsRef, {
        galleryId: projectId,
        studentId,
        type: 'reaction',
        reaction,
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Add a comment to a project
  async addComment(projectId, studentId, content, parentCommentId = null) {
    try {
      const comment = {
        galleryId: projectId,
        studentId,
        type: 'comment',
        content,
        parentCommentId,
        createdAt: serverTimestamp(),
        isEdited: false
      };

      const docRef = await addDoc(this.interactionsRef, comment);
      
      // Increment comment count
      await updateDoc(doc(this.galleriesRef, projectId), {
        'metrics.comments': increment(1)
      });

      return {
        success: true,
        comment: { id: docRef.id, ...comment }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Update a comment
  async updateComment(commentId, newContent) {
    try {
      await updateDoc(doc(this.interactionsRef, commentId), {
        content: newContent,
        isEdited: true,
        editedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a comment
  async deleteComment(commentId, projectId) {
    try {
      await deleteDoc(doc(this.interactionsRef, commentId));
      
      // Decrement comment count
      await updateDoc(doc(this.galleriesRef, projectId), {
        'metrics.comments': increment(-1)
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all interactions for a project
  async getProjectInteractions(projectId) {
    try {
      const q = query(
        this.interactionsRef,
        where('galleryId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const interactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, interactions };
    } catch (error) {
      console.error('Error getting interactions:', error);
      return { success: false, interactions: [], error: error.message };
    }
  }

  // Get specific interaction
  async getInteraction(projectId, studentId, type) {
    try {
      const q = query(
        this.interactionsRef,
        where('galleryId', '==', projectId),
        where('studentId', '==', studentId),
        where('type', '==', type)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting interaction:', error);
      return null;
    }
  }

  // Listen to project interactions in real-time
  listenToProjectInteractions(projectId, callback) {
    try {
      const q = query(
        this.interactionsRef,
        where('galleryId', '==', projectId),
        orderBy('createdAt', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const interactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(interactions);
      });
    } catch (error) {
      console.error('Error listening to interactions:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Listen to all projects in real-time
  listenToAllProjects(callback) {
    try {
      const q = query(
        this.galleriesRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(projects);
      });
    } catch (error) {
      console.error('Error listening to projects:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Feature/unfeature a project (teacher only)
  async toggleFeatured(projectId, featured) {
    try {
      await updateDoc(doc(this.galleriesRef, projectId), {
        featured,
        lastUpdated: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error toggling featured status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get gallery analytics
  async getAnalytics(projectId) {
    try {
      // Get view history
      const viewsQuery = query(
        this.viewsRef,
        where('galleryId', '==', projectId),
        orderBy('viewedAt', 'desc')
      );
      
      const viewsSnapshot = await getDocs(viewsQuery);
      const views = viewsSnapshot.docs.map(doc => doc.data());

      // Get interaction breakdown
      const interactionsQuery = query(
        this.interactionsRef,
        where('galleryId', '==', projectId)
      );
      
      const interactionsSnapshot = await getDocs(interactionsQuery);
      const interactions = interactionsSnapshot.docs.map(doc => doc.data());

      // Process analytics
      const analytics = {
        totalViews: views.length,
        uniqueViewers: new Set(views.map(v => v.studentId)).size,
        totalLikes: interactions.filter(i => i.type === 'like').length,
        totalComments: interactions.filter(i => i.type === 'comment').length,
        reactions: {},
        topViewers: {},
        engagementRate: 0
      };

      // Count reactions
      interactions.filter(i => i.type === 'reaction').forEach(reaction => {
        analytics.reactions[reaction.reaction] = (analytics.reactions[reaction.reaction] || 0) + 1;
      });

      // Count top viewers
      views.forEach(view => {
        analytics.topViewers[view.studentId] = (analytics.topViewers[view.studentId] || 0) + 1;
      });

      // Calculate engagement rate
      if (analytics.uniqueViewers > 0) {
        const engagedUsers = new Set([
          ...interactions.map(i => i.studentId)
        ]).size;
        analytics.engagementRate = Math.round((engagedUsers / analytics.uniqueViewers) * 100);
      }

      return { success: true, analytics };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GalleryService();
