import { useMemo } from 'react';

/**
 * Feature flags for gradual rollout of v0.dev components
 * These can be controlled via environment variables or runtime config
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => ({
    // Dashboard modernization
    useModernDashboard: import.meta.env.VITE_MODERN_DASHBOARD === 'true' || false,
    
    // Skill tree enhancements
    useModernSkillTree: import.meta.env.VITE_MODERN_SKILL_TREE === 'true' || false,
    
    // Form improvements
    useModernForms: import.meta.env.VITE_MODERN_FORMS === 'true' || false,
    
    // Keep Civilization theme as option
    enableCivTheme: import.meta.env.VITE_ENABLE_CIV_THEME !== 'false',
    
    // Development features
    showComponentSwitcher: import.meta.env.DEV === true,
    
    // Performance features
    enableLazyLoading: import.meta.env.VITE_LAZY_LOADING === 'true' || false,
    
    // Accessibility features
    enhancedA11y: import.meta.env.VITE_ENHANCED_A11Y === 'true' || false,
  }), []);

  return flags;
};

/**
 * Component switcher for development
 * Allows toggling between old and new components
 */
export const useComponentSwitcher = () => {
  const flags = useFeatureFlags();
  
  const switchComponent = (flagName, newValue) => {
    if (flags.showComponentSwitcher) {
      // In development, we could store this in localStorage
      localStorage.setItem(`flag_${flagName}`, newValue.toString());
      window.location.reload(); // Simple reload for now
    }
  };

  return { switchComponent, flags };
};