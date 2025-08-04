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
      <Card 
        className={cn(
          "w-32 h-32 cursor-pointer transition-all duration-300 group relative",
          getTierColor(),
          getSkillStateClass(state),
          isHovered && "scale-110 shadow-xl",
          isClickable && "hover:ring-2 hover:ring-blue-400 hover:shadow-lg",
          !available && "opacity-60"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3 h-full flex flex-col items-center justify-center text-center">
          {/* Skill Icon */}
          <div className="mb-2 flex items-center justify-center">
            {getSkillIcon()}
          </div>

          {/* Skill Name */}
          <h4 className="text-xs font-semibold text-gray-800 leading-tight mb-1">
            {skill.name}
          </h4>

          {/* Tier Badge */}
          <Badge 
            variant={`tier${skill.tier}`}
            className="text-xs mb-1"
          >
            {formatTierName(skill.tier)}
          </Badge>

          {/* XP Reward */}
          <Badge variant="xp" className="text-xs">
            +{skill.xpReward} XP
          </Badge>

          {/* Unlock indicator for available skills */}
          {isClickable && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              <div className="absolute top-0 w-3 h-3 bg-blue-600 rounded-full" />
            </div>
          )}
        </CardContent>

        {/* Hover Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30">
            <Card className="w-64 p-3 shadow-lg border-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-sm">{skill.name}</h5>
                  <Badge variant={`tier${skill.tier}`}>
                    Tier {skill.tier}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {skill.description || "Master this skill to unlock new abilities and earn XP."}
                </p>

                {skill.prerequisites.length > 0 && (
                  <div className="text-xs">
                    <span className="text-gray-500">Prerequisites: </span>
                    <span className="text-gray-700">
                      {skill.prerequisites.map(prereq => {
                        const prereqSkill = studentProgress?.skills?.[prereq];
                        return prereqSkill?.name || prereq;
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
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModernSkillNode;