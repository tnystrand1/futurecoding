import React, { useState } from 'react';
import { SKILL_TREE } from '../../data/skillTreeData';

const CivSkillTree = ({ studentId, studentProgress, onSkillClick }) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);
  
  const isSkillUnlocked = (skillId) => {
    return studentProgress.skills?.[skillId]?.unlocked || false;
  };
  
  const isSkillAvailable = (skill) => {
    if (skill.tier === 1) return true;
    
    const prereqsMet = skill.prerequisites.every(prereq => 
      isSkillUnlocked(prereq)
    );
    
    const altPathMet = skill.alternativePaths?.some(path =>
      path.every(skillId => isSkillUnlocked(skillId))
    ) || false;
    
    return prereqsMet || altPathMet;
  };

  const getSkillNodeClass = (skill) => {
    if (isSkillUnlocked(skill.id)) return 'civ-skill-node unlocked';
    if (isSkillAvailable(skill)) return 'civ-skill-node available';
    return 'civ-skill-node locked';
  };

  const getSkillIcon = (skill) => {
    const iconMap = {
      'cultural_mapping': '🎨',
      'client_discovery': '🤝',
      'descriptive_prompting': '💬',
      'code_implementation': '⚡',
      'project_scoping': '📋',
      'iterative_refinement': '🔄',
      'user_testing': '👥',
      'ai_assisted_debugging': '🤖',
      'accessibility': '♿',
      'api_integration': '🔗',
      'ai_tool_evaluation': '🧠',
      'peer_feedback': '👂',
      'output_evaluation': '📊',
      'css_variables': '🎭',
      'form_validation': '✅',
      'deployment': '🚀'
    };
    return iconMap[skill.id] || '📚';
  };

  // Create connections between skills
  const renderConnections = () => {
    const connections = [];
    
    Object.values(SKILL_TREE).forEach(skill => {
      skill.prerequisites.forEach(prereqId => {
        const prereqSkill = SKILL_TREE[prereqId];
        if (prereqSkill) {
          const startX = prereqSkill.position.x + 60; // Center of prereq node
          const startY = prereqSkill.position.y + 30; // Top of prereq node
          const endX = skill.position.x + 60; // Center of current node
          const endY = skill.position.y + 90; // Bottom of current node
          
          // Create clearer, more architectural paths
          let pathData;
          
          // If skills are roughly vertically aligned, use straight line
          if (Math.abs(startX - endX) < 50) {
            pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
          } else {
            // Create clean L-shaped paths like technical diagrams
            const midY = startY + ((endY - startY) * 0.5);
            // Add small rounded corners for a more polished look
            const cornerRadius = 8;
            
            if (startX < endX) {
              // Going right
              pathData = `M ${startX} ${startY} 
                         L ${startX} ${midY - cornerRadius} 
                         Q ${startX} ${midY} ${startX + cornerRadius} ${midY}
                         L ${endX - cornerRadius} ${midY}
                         Q ${endX} ${midY} ${endX} ${midY + cornerRadius}
                         L ${endX} ${endY}`;
            } else {
              // Going left
              pathData = `M ${startX} ${startY} 
                         L ${startX} ${midY - cornerRadius} 
                         Q ${startX} ${midY} ${startX - cornerRadius} ${midY}
                         L ${endX + cornerRadius} ${midY}
                         Q ${endX} ${midY} ${endX} ${midY + cornerRadius}
                         L ${endX} ${endY}`;
            }
          }
          
          let connectionClass = 'civ-connection-line';
          if (isSkillUnlocked(skill.id) && isSkillUnlocked(prereqId)) {
            connectionClass += ' unlocked';
          } else if (isSkillAvailable(skill) && isSkillUnlocked(prereqId)) {
            connectionClass += ' available';
          }
          
          connections.push(
            <g key={`${prereqId}-${skill.id}`}>
              <path
                d={pathData}
                className={connectionClass}
              />
              {/* Add arrow at the end */}
              <polygon
                points={`${endX-5},${endY-10} ${endX+5},${endY-10} ${endX},${endY-2}`}
                className={connectionClass}
                style={{ strokeWidth: 0 }}
              />
            </g>
          );
        }
      });
    });
    
    return connections;
  };

  return (
    <div style={{ position: 'relative', height: '700px', margin: '30px' }}>
      {/* Tier separators for visual clarity */}
      <div className="civ-tier-separator tier-1"></div>
      <div className="civ-tier-separator tier-2"></div>
      <div className="civ-tier-separator tier-3"></div>
      
      {/* Tier labels */}
      <div style={{
        position: 'absolute',
        left: '10px',
        top: '520px',
        color: '#8B4513',
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(255, 215, 0, 0.3)'
      }}>
        TIER I: FOUNDATIONS
      </div>
      <div style={{
        position: 'absolute',
        left: '10px',
        top: '370px',
        color: '#8B4513',
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(255, 215, 0, 0.3)'
      }}>
        TIER II: APPLICATIONS
      </div>
      <div style={{
        position: 'absolute',
        left: '10px',
        top: '220px',
        color: '#8B4513',
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(255, 215, 0, 0.3)'
      }}>
        TIER III: SPECIALIZATIONS
      </div>
      
      <svg className="civ-connections" viewBox="0 0 1000 700">
        {renderConnections()}
      </svg>
      
      {Object.values(SKILL_TREE).map(skill => (
        <div
          key={skill.id}
          className={getSkillNodeClass(skill)}
          style={{
            left: `${skill.position.x}px`,
            top: `${skill.position.y}px`,
          }}
          onMouseEnter={() => setHoveredSkill(skill)}
          onMouseLeave={() => setHoveredSkill(null)}
          onClick={() => {
            if (isSkillAvailable(skill) && !isSkillUnlocked(skill.id)) {
              onSkillClick(skill);
            }
          }}
          title={skill.description}
        >
          <div className="civ-skill-icon">
            {isSkillUnlocked(skill.id) ? '✓' : 
             !isSkillAvailable(skill) ? '🔒' : 
             getSkillIcon(skill)}
          </div>
          <div className="civ-skill-name">{skill.name}</div>
          <div className="civ-skill-tier">Tier {skill.tier}</div>
        </div>
      ))}
      
      {hoveredSkill && (
        <div 
          style={{
            position: 'absolute',
            left: `${hoveredSkill.position.x + 130}px`,
            top: `${hoveredSkill.position.y}px`,
            background: 'rgba(139, 69, 19, 0.95)',
            color: '#FFD700',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #DAA520',
            maxWidth: '250px',
            fontSize: '12px',
            lineHeight: '1.4',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
            {hoveredSkill.name}
          </div>
          <div style={{ marginBottom: '6px', color: '#F5DEB3' }}>
            {hoveredSkill.description}
          </div>
          <div style={{ fontSize: '11px', color: '#DAA520' }}>
            <strong>Competency:</strong> {hoveredSkill.competency}<br/>
            <strong>XP Reward:</strong> {hoveredSkill.xpReward}<br/>
            {hoveredSkill.prerequisites.length > 0 && (
              <>
                <strong>Prerequisites:</strong> {hoveredSkill.prerequisites.map(prereq => 
                  SKILL_TREE[prereq]?.name
                ).join(', ')}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CivSkillTree;