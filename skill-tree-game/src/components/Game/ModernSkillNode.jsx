import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn, formatTierName, getSkillStateClass } from '../../lib/utils';
import { CheckCircle, Lock, Zap, Star } from 'lucide-react';

const ModernSkillNode = ({ 
  skill, 
  unlocked, 
  available, 
  completed,
  onHover, 
  onClick,
  studentProgress 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSkillState = () => {
    if (completed) return 'completed';
    if (unlocked) return 'unlocked';
    if (available) return 'available';
    return 'locked';
  };

  const getSkillIcon = () => {
    const state = getSkillState();
    switch (state) {
      case 'completed':
        return <Star className="w-5 h-5 text-yellow-500 fill-current" />;
      case 'unlocked':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'available':
        return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Lock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTierColor = () => {
    const colors = {
      1: 'border-green-200 bg-green-50',
      2: 'border-blue-200 bg-blue-50', 
      3: 'border-purple-200 bg-purple-50'
    };
    return colors[skill.tier] || 'border-gray-200 bg-gray-50';
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(skill);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  const handleClick = () => {
    if (available && !unlocked) {
      onClick?.(skill);
    }
  };

  const state = getSkillState();
  const isClickable = available && !unlocked;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: `${skill.position.x}px`,
        top: `${skill.position.y}px`,
        zIndex: isHovered ? 20 : 10,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        style={{
          // Beautiful v0.dev card styling - FORCED
          width: '128px',
          height: '128px',
          borderRadius: '12px',
          border: state === 'completed' ? '3px solid #10b981' :
                  state === 'unlocked' ? '3px solid #059669' :
                  state === 'available' ? '3px solid #3b82f6' : '3px solid #d1d5db',
          backgroundColor: state === 'completed' ? '#ecfdf5' :
                          state === 'unlocked' ? '#d1fae5' :
                          state === 'available' ? '#eff6ff' : '#f9fafb',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                     isClickable ? '0 8px 12px -2px rgba(59, 130, 246, 0.15), 0 4px 6px -1px rgba(59, 130, 246, 0.1)' :
                     '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          opacity: !available ? 0.6 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          textAlign: 'center',
          position: 'relative',
          // Force override any external styles
          margin: '0 !important'
        }}
        onClick={handleClick}
      >
        {/* Skill Icon */}
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getSkillIcon()}
        </div>

        {/* Skill Name */}
        <h4 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#1f2937', 
          lineHeight: '1.2', 
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          {skill.name}
        </h4>

        {/* Tier Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          border: '1px solid',
          paddingLeft: '6px',
          paddingRight: '6px',
          paddingTop: '2px',
          paddingBottom: '2px',
          fontSize: '10px',
          fontWeight: '600',
          marginBottom: '4px',
          backgroundColor: skill.tier === 1 ? '#dcfce7' : skill.tier === 2 ? '#dbeafe' : '#ede9fe',
          borderColor: skill.tier === 1 ? '#bbf7d0' : skill.tier === 2 ? '#bfdbfe' : '#ddd6fe',
          color: skill.tier === 1 ? '#166534' : skill.tier === 2 ? '#1e40af' : '#7c3aed'
        }}>
          Tier {skill.tier}
        </div>

        {/* XP Reward */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '9999px',
          border: '1px solid #fef3c7',
          paddingLeft: '6px',
          paddingRight: '6px',
          paddingTop: '1px',
          paddingBottom: '1px',
          fontSize: '10px',
          fontWeight: '600',
          backgroundColor: '#fffbeb',
          borderColor: '#fef3c7',
          color: '#92400e'
        }}>
          +{skill.xpReward} XP
        </div>

        {/* Unlock indicator for available skills */}
        {isClickable && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '0',
              width: '12px',
              height: '12px',
              backgroundColor: '#2563eb',
              borderRadius: '50%'
            }} />
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30">
          <div style={{
            width: '256px',
            padding: '12px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-sm">{skill.name}</h5>
                  <Badge variant={`tier${skill.tier}`}>
                    Tier {skill.tier}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {skill.description || skill.unlockCriteria?.prompt || "Master this skill to unlock new abilities and earn XP."}
                </p>

                {skill.prerequisites.length > 0 && (
                  <div className="text-xs">
                    <span className="text-gray-500">Prerequisites: </span>
                    <span className="text-gray-700">
                      {skill.prerequisites.map(prereq => {
                        // We need to import SKILL_TREE to get skill names, for now just show the ID
                        return prereq.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">
                    +{skill.xpReward} XP
                  </span>
                  {isClickable && (
                    <span className="text-blue-600 font-medium animate-pulse">
                      Click to unlock!
                    </span>
                  )}
                </div>

                {skill.featuresUnlocked?.length > 0 && (
                  <div className="text-xs">
                    <span className="text-gray-500">Unlocks: </span>
                    <span className="text-purple-600">
                      {skill.featuresUnlocked.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ModernSkillNode;