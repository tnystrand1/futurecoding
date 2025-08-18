import React, { useState, useEffect } from 'react';
import galleryService from '../../services/galleryService';

const GalleryCard = ({ project, currentStudentId, onProjectClick, compact = false }) => {
  const [liked, setLiked] = useState(false);
  const [localMetrics, setLocalMetrics] = useState(project.metrics || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [project.id, currentStudentId]);

  const checkIfLiked = async () => {
    try {
      const interaction = await galleryService.getInteraction(project.id, currentStudentId, 'like');
      setLiked(!!interaction);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent triggering project click
    
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

  const handleCardClick = async () => {
    // Record view when card is clicked
    await galleryService.recordView(project.id, currentStudentId);
    onProjectClick(project);
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
    <div
      onClick={handleCardClick}
      style={{
        background: 'linear-gradient(135deg, #F4E4BC 0%, #E6D5A8 100%)',
        border: '3px solid #8B4513',
        borderRadius: '12px',
        padding: compact ? '12px' : '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        position: 'relative',
        marginBottom: compact ? '12px' : '16px'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-4px)';
        e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }}
    >
      {/* Featured Badge */}
      {project.featured && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '12px',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          color: '#8B4513',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold',
          border: '2px solid #8B4513',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          ⭐ FEATURED
        </div>
      )}

      {/* Team Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: compact ? '8px' : '12px'
      }}>
        <div style={{
          width: compact ? '32px' : '40px',
          height: compact ? '32px' : '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? '14px' : '16px',
          border: '2px solid #8B4513',
          color: 'white',
          fontWeight: 'bold'
        }}>
          🏆
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? '12px' : '14px',
            fontWeight: 'bold',
            color: '#8B4513',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {project.teamName || project.teamId}
          </div>
          <div style={{
            fontSize: compact ? '10px' : '11px',
            color: '#8B4513',
            opacity: 0.7
          }}>
            {new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Project Title */}
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: compact ? '14px' : '16px',
        fontWeight: 'bold',
        color: '#8B4513',
        lineHeight: '1.3',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {project.title}
      </h3>

      {/* Description */}
      <p style={{
        margin: '0 0 12px 0',
        fontSize: compact ? '11px' : '12px',
        color: '#8B4513',
        opacity: 0.8,
        lineHeight: '1.4',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: compact ? 2 : 3,
        WebkitBoxOrient: 'vertical'
      }}>
        {project.description}
      </p>

      {/* Technology Badges */}
      {project.technologies && project.technologies.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          {project.technologies.slice(0, compact ? 3 : 5).map((tech, index) => (
            <span
              key={index}
              style={{
                background: getTechBadgeColor(tech),
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '9px',
                fontWeight: 'bold',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > (compact ? 3 : 5) && (
            <span style={{
              background: '#8B4513',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '9px',
              fontWeight: 'bold'
            }}>
              +{project.technologies.length - (compact ? 3 : 5)}
            </span>
          )}
        </div>
      )}

      {/* Website Preview */}
      {project.websiteUrl && (
        <div style={{
          background: '#fff',
          border: '2px solid #8B4513',
          borderRadius: '8px',
          height: compact ? '80px' : '100px',
          marginBottom: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <iframe
            src={project.websiteUrl}
            style={{
              width: '100%',
              height: '200%',
              border: 'none',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              pointerEvents: 'none'
            }}
            title={`Preview of ${project.title}`}
          />
          
          {/* Overlay to prevent interaction */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255,255,255,0.1)'
          }} />
        </div>
      )}

      {/* Interaction Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid rgba(139, 69, 19, 0.2)'
      }}>
        {/* Left side - interactions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              fontSize: compact ? '11px' : '12px',
              color: liked ? '#e74c3c' : '#8B4513'
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
            <span style={{ fontSize: compact ? '14px' : '16px' }}>
              {liked ? '❤️' : '🤍'}
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {formatNumber(localMetrics.likes || 0)}
            </span>
          </button>

          {/* Comments */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: compact ? '11px' : '12px',
            color: '#8B4513'
          }}>
            <span style={{ fontSize: compact ? '14px' : '16px' }}>💬</span>
            <span style={{ fontWeight: 'bold' }}>
              {formatNumber(localMetrics.comments || 0)}
            </span>
          </div>

          {/* Views */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: compact ? '11px' : '12px',
            color: '#8B4513'
          }}>
            <span style={{ fontSize: compact ? '14px' : '16px' }}>👁️</span>
            <span style={{ fontWeight: 'bold' }}>
              {formatNumber(localMetrics.views || 0)}
            </span>
          </div>
        </div>

        {/* Right side - visit link */}
        {project.websiteUrl && (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            <span>🔗</span>
            <span>Visit</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default GalleryCard;
