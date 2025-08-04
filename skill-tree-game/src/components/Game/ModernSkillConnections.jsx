import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';

const ModernSkillConnections = ({ skills, studentProgress, hoveredSkill }) => {
  const connections = useMemo(() => {
    const connectionLines = [];
    
    Object.values(skills).forEach(skill => {
      skill.prerequisites.forEach(prereqId => {
        const prereqSkill = skills[prereqId];
        if (prereqSkill) {
          const isPrereqUnlocked = studentProgress?.skills?.[prereqId]?.unlocked || false;
          const isCurrentUnlocked = studentProgress?.skills?.[skill.id]?.unlocked || false;
          const isCurrentAvailable = skill.tier === 1 || skill.prerequisites.every(id => 
            studentProgress?.skills?.[id]?.unlocked
          );

          // Calculate connection path
          const startX = prereqSkill.position.x;
          const startY = prereqSkill.position.y;
          const endX = skill.position.x;
          const endY = skill.position.y;

          // Create smooth curved path
          const midY = startY + ((endY - startY) * 0.6);
          const controlX1 = startX;
          const controlY1 = midY;
          const controlX2 = endX;
          const controlY2 = midY;

          const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

          // Determine connection state
          let connectionState = 'locked';
          if (isCurrentUnlocked && isPrereqUnlocked) {
            connectionState = 'completed';
          } else if (isCurrentAvailable && isPrereqUnlocked) {
            connectionState = 'available';
          } else if (isPrereqUnlocked) {
            connectionState = 'prereq-met';
          }

          // Highlight if involved in hover
          const isHighlighted = hoveredSkill && (
            hoveredSkill.id === skill.id || 
            hoveredSkill.id === prereqId ||
            hoveredSkill.prerequisites?.includes(prereqId) ||
            skill.prerequisites.includes(hoveredSkill.id)
          );

          connectionLines.push({
            id: `${prereqId}-${skill.id}`,
            pathData,
            state: connectionState,
            isHighlighted,
            startX,
            startY,
            endX,
            endY,
            prereqId,
            skillId: skill.id
          });
        }
      });
    });

    return connectionLines;
  }, [skills, studentProgress, hoveredSkill]);

  const getConnectionClass = (state, isHighlighted) => {
    const baseClass = "transition-all duration-500 ease-in-out";
    
    const stateClasses = {
      locked: "stroke-gray-300 stroke-2 opacity-30",
      'prereq-met': "stroke-blue-400 stroke-2 opacity-60",
      available: "stroke-blue-500 stroke-3 opacity-80 drop-shadow-sm",
      completed: "stroke-green-500 stroke-3 opacity-90 drop-shadow-md"
    };

    const highlightClass = isHighlighted 
      ? "stroke-4 opacity-100 drop-shadow-lg animate-pulse" 
      : "";

    return cn(baseClass, stateClasses[state], highlightClass);
  };

  const getArrowClass = (state, isHighlighted) => {
    const baseClass = "transition-all duration-500 ease-in-out";
    
    const stateClasses = {
      locked: "fill-gray-300 opacity-30",
      'prereq-met': "fill-blue-400 opacity-60",
      available: "fill-blue-500 opacity-80 drop-shadow-sm",
      completed: "fill-green-500 opacity-90 drop-shadow-md"
    };

    const highlightClass = isHighlighted 
      ? "opacity-100 drop-shadow-lg scale-125" 
      : "";

    return cn(baseClass, stateClasses[state], highlightClass);
  };

  // Create animated flow particles for active connections
  const getFlowParticle = (connection, delay = 0) => {
    if (connection.state === 'available' || connection.state === 'completed') {
      return (
        <circle
          key={`particle-${connection.id}-${delay}`}
          r="3"
          className={cn(
            "transition-all duration-300",
            connection.state === 'completed' ? "fill-green-400" : "fill-blue-400",
            "opacity-70"
          )}
        >
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            begin={`${delay}s`}
          >
            <mpath href={`#path-${connection.id}`} />
          </animateMotion>
        </circle>
      );
    }
    return null;
  };

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-0"
      style={{ overflow: 'visible' }}
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradient definitions for enhanced visual appeal */}
        <linearGradient id="availableGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
        </linearGradient>
        
        <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
        </linearGradient>

        {/* Glow filter for highlighted connections */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Connection paths */}
      {connections.map(connection => (
        <g key={connection.id}>
          {/* Hidden path for particle animation */}
          <path
            id={`path-${connection.id}`}
            d={connection.pathData}
            stroke="none"
            fill="none"
          />
          
          {/* Visible connection line */}
          <path
            d={connection.pathData}
            fill="none"
            className={getConnectionClass(connection.state, connection.isHighlighted)}
            style={{
              filter: connection.isHighlighted ? 'url(#glow)' : 'none'
            }}
          />

          {/* Arrow marker */}
          <polygon
            points={`${connection.endX-8},${connection.endY-12} ${connection.endX+8},${connection.endY-12} ${connection.endX},${connection.endY-4}`}
            className={getArrowClass(connection.state, connection.isHighlighted)}
            style={{
              filter: connection.isHighlighted ? 'url(#glow)' : 'none',
              transformOrigin: `${connection.endX}px ${connection.endY-8}px`
            }}
          />

          {/* Animated flow particles */}
          {getFlowParticle(connection, 0)}
          {getFlowParticle(connection, 1)}
          {getFlowParticle(connection, 2)}
        </g>
      ))}

      {/* Tier separator lines */}
      <g className="tier-separators opacity-20">
        <line
          x1="50" y1="400"
          x2="950" y2="400"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1="50" y1="250"
          x2="950" y2="250"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      </g>

      {/* Tier labels */}
      <g className="tier-labels">
        <text
          x="30" y="520"
          className="fill-gray-500 text-sm font-medium"
          transform="rotate(-90, 30, 520)"
        >
          TIER I: FOUNDATIONS
        </text>
        <text
          x="30" y="350"
          className="fill-gray-500 text-sm font-medium"
          transform="rotate(-90, 30, 350)"
        >
          TIER II: APPLICATIONS
        </text>
        <text
          x="30" y="180"
          className="fill-gray-500 text-sm font-medium"
          transform="rotate(-90, 30, 180)"
        >
          TIER III: SPECIALIZATIONS
        </text>
      </g>
    </svg>
  );
};

export default ModernSkillConnections;