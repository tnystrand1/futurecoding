import React, { useState, useEffect, useRef } from 'react';
import galleryService from '../../services/galleryService';

const CommentFeed = ({ projectId, currentStudentId, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    loadComments();
    
    // Set up real-time listener
    const unsubscribe = galleryService.listenToProjectInteractions(projectId, (interactions) => {
      const commentInteractions = interactions.filter(i => i.type === 'comment');
      setComments(commentInteractions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyingTo]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await galleryService.getProjectInteractions(projectId);
      if (result.success) {
        const commentInteractions = result.interactions.filter(i => i.type === 'comment');
        setComments(commentInteractions);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const result = await galleryService.addComment(
        projectId,
        currentStudentId,
        newComment.trim(),
        replyingTo
      );

      if (result.success) {
        setNewComment('');
        setReplyingTo(null);
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim() || submitting) return;

    try {
      setSubmitting(true);
      const result = await galleryService.updateComment(commentId, editText.trim());

      if (result.success) {
        setEditingComment(null);
        setEditText('');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const result = await galleryService.deleteComment(commentId, projectId);
      if (result.success) {
        // Comments will update automatically via real-time listener
        if (onCommentAdded) {
          onCommentAdded(); // Update parent metrics
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const getStudentName = (studentId) => {
    if (studentId === currentStudentId) return 'You';
    return studentId.replace(/_/g, ' ');
  };

  const getStudentAvatar = (studentId) => {
    if (studentId === currentStudentId) return '👤';
    // Generate a consistent avatar based on student ID
    const avatars = ['👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬', '👨‍🚀', '👩‍🚀'];
    const index = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
  };

  const formatTimestamp = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Organize comments into threads
  const organizeComments = () => {
    const topLevelComments = comments.filter(c => !c.parentCommentId);
    const replies = comments.filter(c => c.parentCommentId);
    
    return topLevelComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parentCommentId === comment.id)
    }));
  };

  const threadedComments = organizeComments();

  const CommentItem = ({ comment, isReply = false }) => {
    const isOwnComment = comment.studentId === currentStudentId;
    const isEditing = editingComment === comment.id;

    return (
      <div style={{
        background: isReply 
          ? 'rgba(52, 152, 219, 0.1)' 
          : isOwnComment 
            ? 'rgba(52, 152, 219, 0.15)'
            : 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(139, 69, 19, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '8px',
        marginLeft: isReply ? '20px' : '0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          {/* Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            border: '2px solid #8B4513',
            flexShrink: 0
          }}>
            {getStudentAvatar(comment.studentId)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '12px',
                color: '#8B4513'
              }}>
                {getStudentName(comment.studentId)}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#8B4513',
                opacity: 0.6
              }}>
                {formatTimestamp(comment.createdAt)}
                {comment.isEdited && ' (edited)'}
              </div>
            </div>

            {/* Content */}
            {isEditing ? (
              <div style={{ marginBottom: '8px' }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid #8B4513',
                    borderRadius: '4px',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                  maxLength={500}
                />
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '6px'
                }}>
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting || !editText.trim()}
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      background: '#7f8c8d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '13px',
                color: '#8B4513',
                lineHeight: '1.4',
                marginBottom: '8px',
                wordBreak: 'break-word'
              }}>
                {comment.content}
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '11px'
              }}>
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
                  </button>
                )}
                
                {isOwnComment && (
                  <>
                    <button
                      onClick={() => startEdit(comment)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f39c12',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reply Form */}
            {replyingTo === comment.id && !isReply && (
              <form onSubmit={handleSubmitComment} style={{ marginTop: '8px' }}>
                <textarea
                  ref={replyInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    padding: '8px',
                    border: '2px solid #3498db',
                    borderRadius: '4px',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                  maxLength={500}
                />
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '6px'
                }}>
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    style={{
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment('');
                    }}
                    style={{
                      background: '#7f8c8d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Comments List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
        paddingRight: '4px'
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#8B4513',
            fontSize: '12px'
          }}>
            Loading comments...
          </div>
        ) : threadedComments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#8B4513',
            fontSize: '12px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
            <div>No comments yet</div>
            <div style={{ opacity: 0.7, marginTop: '4px' }}>
              Be the first to share your thoughts!
            </div>
          </div>
        ) : (
          threadedComments.map(comment => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* New Comment Form */}
      {!replyingTo && (
        <form onSubmit={handleSubmitComment} style={{
          borderTop: '1px solid rgba(139, 69, 19, 0.2)',
          paddingTop: '12px'
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              border: '2px solid #8B4513',
              flexShrink: 0
            }}>
              {getStudentAvatar(currentStudentId)}
            </div>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts, suggestions, or feedback..."
              style={{
                flex: 1,
                minHeight: '50px',
                padding: '8px',
                border: '2px solid #8B4513',
                borderRadius: '6px',
                fontSize: '12px',
                resize: 'vertical',
                background: 'rgba(255, 255, 255, 0.9)'
              }}
              maxLength={500}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#8B4513',
              opacity: 0.7
            }}>
              {newComment.length}/500 characters
            </div>
            
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              style={{
                background: submitting || !newComment.trim() 
                  ? '#bdc3c7' 
                  : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentFeed;
