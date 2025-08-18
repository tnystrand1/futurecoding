import React, { useState, useEffect } from 'react';
import galleryService from '../../services/galleryService';
import CommentFeed from './CommentFeed';

const GalleryDetail = ({ project, currentStudentId, onBack }) => {
  const [liked, setLiked] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [localMetrics, setLocalMetrics] = useState(project.metrics || {});
  const [loading, setLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const reactions = ['❤️', '👏', '🔥', '💡', '🎨', '🚀', '👍', '🤩'];

  useEffect(() => {
    checkUserInteractions();
    recordView();
  }, [project.id, currentStudentId]);

  const recordView = async () => {
    try {
      await galleryService.recordView(project.id, currentStudentId);
      setLocalMetrics(prev => ({
        ...prev,
        views: (prev.views || 0) + 1
      }));
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const checkUserInteractions = async () => {
    try {
      const [likeInteraction, reactionInteraction] = await Promise.all([
        galleryService.getInteraction(project.id, currentStudentId, 'like'),
        galleryService.getInteraction(project.id, currentStudentId, 'reaction')
      ]);
      
      setLiked(!!likeInteraction);
      setCurrentReaction(reactionInteraction?.reaction || null);
    } catch (error) {
      console.error('Error checking interactions:', error);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const result = await galleryService.likeProject(project.id, currentStudentId);
      
      if (result.success) {
        setLiked(result.liked);
        setLocalMetrics(prev => ({
          ...prev,
          likes: (prev.likes || 0) + (result.liked ? 1 : -1)
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reaction) => {
    if (loading) return;
    
    try {
      setLoading(true);
      await galleryService.addReaction(project.id, currentStudentId, reaction);
      setCurrentReaction(currentReaction === reaction ? null : reaction);
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTechBadgeColor = (tech) => {
    const colors = {
      'HTML': '#E34F26',
      'CSS': '#1572B6', 
      'JavaScript': '#F7DF1E',
      'React': '#61DAFB',
      'Vue': '#4FC08D',
      'Angular': '#DD0031',
      'Node.js': '#339933',
      'Python': '#3776AB',
      'PHP': '#777BB4'
    };
    return colors[tech] || '#8B4513';
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
          border: '3px solid #8B4513',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(139, 69, 19, 0.1)',
                color: '#8B4513',
                border: '1px solid rgba(139, 69, 19, 0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ← Back to Gallery
            </button>

            {/* Featured Badge */}
            {project.featured && (
              <div style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#8B4513',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid #8B4513',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                ⭐ FEATURED PROJECT
              </div>
            )}
          </div>

          {/* Project Info */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            {/* Team Avatar */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              border: '3px solid #8B4513',
              color: 'white',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              🏆
            </div>

            <div style={{ flex: 1 }}>
              {/* Title and Team */}
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#8B4513',
                lineHeight: '1.2'
              }}>
                {project.title}
              </h1>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#8B4513',
                  fontWeight: 'bold'
                }}>
                  by {project.teamName || project.teamId}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#8B4513',
                  opacity: 0.7
                }}>
                  {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Technology Badges */}
              {project.technologies && project.technologies.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '12px'
                }}>
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      style={{
                        background: getTechBadgeColor(tech),
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div style={{
                fontSize: '14px',
                color: '#8B4513',
                lineHeight: '1.5',
                marginBottom: '16px'
              }}>
                {showFullDescription || project.description.length <= 200 ? (
                  project.description
                ) : (
                  <>
                    {project.description.substring(0, 200)}...
                    <button
                      onClick={() => setShowFullDescription(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3498db',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}
                    >
                      Read more
                    </button>
                  </>
                )}
                {showFullDescription && project.description.length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3498db',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      marginLeft: '4px'
                    }}
                  >
                    Show less
                  </button>
                )}
              </div>

              {/* Interaction Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(139, 69, 19, 0.2)'
              }}>
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                    color: liked ? '#e74c3c' : '#8B4513',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = 'rgba(139, 69, 19, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {liked ? '❤️' : '🤍'}
                  </span>
                  <span>{formatNumber(localMetrics.likes || 0)} Likes</span>
                </button>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  fontSize: '14px',
                  color: '#8B4513'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>💬</span>
                    <span><strong>{formatNumber(localMetrics.comments || 0)}</strong> Comments</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👁️</span>
                    <span><strong>{formatNumber(localMetrics.views || 0)}</strong> Views</span>
                  </div>
                </div>

                {/* Visit Website */}
                {project.websiteUrl && (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>🔗</span>
                    <span>Visit Live Site</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px'
        }}>
          {/* Website Preview */}
          <div style={{
            background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
            border: '3px solid #8B4513',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              color: '#8B4513',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🌐 Live Preview
            </h2>
            
            {project.websiteUrl ? (
              <div style={{
                background: '#fff',
                border: '2px solid #8B4513',
                borderRadius: '8px',
                height: '600px',
                overflow: 'hidden'
              }}>
                <iframe
                  src={project.websiteUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title={`${project.title} - Live Preview`}
                />
              </div>
            ) : (
              <div style={{
                background: '#f8f9fa',
                border: '2px dashed #8B4513',
                borderRadius: '8px',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B4513',
                fontSize: '16px'
              }}>
                No live preview available
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Reactions */}
            <div style={{
              background: 'linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)',
              border: '3px solid #8B4513',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                color: '#4A148C',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                💫 Quick Reactions
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}>
                {reactions.map(reaction => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(reaction)}
                    disabled={loading}
                    style={{
                      background: currentReaction === reaction 
                        ? 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
                        : 'rgba(139, 69, 19, 0.1)',
                      border: `2px solid ${currentReaction === reaction ? '#7B1FA2' : 'rgba(139, 69, 19, 0.3)'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '20px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      aspectRatio: '1'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && currentReaction !== reaction) {
                        e.target.style.background = 'rgba(139, 69, 19, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && currentReaction !== reaction) {
                        e.target.style.background = 'rgba(139, 69, 19, 0.1)';
                      }
                    }}
                  >
                    {reaction}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div style={{
              background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
              border: '3px solid #8B4513',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              height: '500px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#8B4513',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💬 Comments & Feedback
              </h3>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <CommentFeed
                  projectId={project.id}
                  currentStudentId={currentStudentId}
                  onCommentAdded={() => {
                    setLocalMetrics(prev => ({
                      ...prev,
                      comments: (prev.comments || 0) + 1
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryDetail;
