# Component Migration Plan: Current → v0.dev Design

## Migration Strategy Overview

This document outlines the step-by-step plan for migrating from the current Civilization III-inspired design to a modern v0.dev design while preserving all game functionality.

## Current Component Architecture

### 📁 **Student Components**
- `Dashboard.jsx` - Main student dashboard (CSS Modules)
- `CivDashboard.jsx` - Civilization III-styled dashboard  
- `WebsitePreview.jsx` - Preview panel for student websites

### 📁 **Game Components** 
- `SkillTree.jsx` - Original skill tree visualization
- `CivSkillTree.jsx` - Civilization III-styled skill tree
- `SkillNode.jsx` - Individual skill nodes
- `SkillConnections.jsx` - Lines connecting prerequisite skills
- `SkillAdvisor.jsx` - AI advisor panel

### 📁 **Documentation Components**
- `DocumentModal.jsx` - Evidence submission modal
- `EvidenceUploader.jsx` - File upload component (Firebase Storage)

### 📁 **Shared Components**
- `AchievementToast.jsx` - Achievement notification toasts
- `LoadingSpinner.jsx` - Loading indicators

### 📁 **Instructor Components**
- `InstructorDashboard.jsx` - Teacher/admin interface

## Migration Mapping: Old → New

### **Phase 1a: Core Layout (Week 3)**

| Current Component | New v0.dev Component | Migration Notes |
|-------------------|---------------------|-----------------|
| `Dashboard.jsx` | `ModernDashboard.jsx` | Replace CSS Modules with Tailwind classes |
| `CivDashboard.jsx` | Keep as `CivDashboard.jsx` | Preserve for theme toggle option |
| Main layout | Add responsive grid layout | Mobile-first approach |

### **Phase 1b: Skill Tree (Week 4)**

| Current Component | New v0.dev Component | Migration Notes |
|-------------------|---------------------|-----------------|
| `SkillTree.jsx` | `ModernSkillTree.jsx` | Replace with SVG/Canvas + Tailwind |
| `CivSkillTree.jsx` | Keep as `CivSkillTree.jsx` | Preserve medieval theme option |
| `SkillNode.jsx` | `SkillCard.jsx` | Modern card design with hover effects |
| `SkillConnections.jsx` | `SkillConnections.jsx` | Enhanced with smooth animations |

### **Phase 1c: Forms & Interactions (Week 5)**

| Current Component | New v0.dev Component | Migration Notes |
|-------------------|---------------------|-----------------|
| `DocumentModal.jsx` | `EvidenceModal.jsx` | Modern modal with better UX |
| `EvidenceUploader.jsx` | `ModernFileUpload.jsx` | Drag-and-drop, better preview |
| `AchievementToast.jsx` | `Toast.jsx` | Modern toast with variants |

## Data Layer Preservation

### **🔒 Must Preserve (Zero Breaking Changes)**
- `useGameState.js` - Firebase hooks and state management
- `gameLogic.js` - All XP calculations and skill unlocking logic  
- `skillTreeData.js` - Skill definitions and prerequisites
- `firebase-config.js` - Database and storage configuration
- All Firebase Storage file upload functionality

### **🔄 Can Enhance (Backward Compatible)**
- Add TypeScript definitions
- Improve error handling
- Add loading states
- Enhance accessibility

## Modern Component Patterns to Implement

### **1. Compound Components**
```jsx
<SkillTree>
  <SkillTree.Header />
  <SkillTree.Grid>
    <SkillTree.Node />
    <SkillTree.Connection />
  </SkillTree.Grid>
  <SkillTree.Legend />
</SkillTree>
```

### **2. Custom Hooks for Logic**
```jsx
// Extract reusable logic
const useSkillTree = () => { ... }
const useAchievements = () => { ... }
const useEvidenceUpload = () => { ... }
```

### **3. Variant-Based Styling**
```jsx
// Using class-variance-authority
const skillNodeVariants = cva("skill-node", {
  variants: {
    state: {
      locked: "opacity-50 grayscale",
      available: "ring-blue-400 animate-pulse",
      unlocked: "ring-green-400",
      completed: "ring-gold-400 bg-gradient-to-br"
    }
  }
})
```

## Design System Integration

### **Colors**
- Maintain civ-gold (#DAA520) for achievements
- Add modern primary/secondary color palette
- Ensure WCAG 2.1 AA contrast compliance

### **Typography** 
- Keep pixel fonts for retro game elements
- Add modern sans-serif for improved readability
- Responsive font scaling

### **Spacing & Layout**
- Implement consistent spacing scale
- Use CSS Grid and Flexbox
- Mobile-first responsive breakpoints

## Feature Flags for Gradual Rollout

```jsx
// Allow switching between themes during development
const useFeatureFlags = () => {
  return {
    useModernDashboard: true,
    useModernSkillTree: false, // Gradual rollout
    useCivTheme: true // Keep as option
  }
}
```

## Testing Strategy

### **Component Tests**
- [ ] Test each migrated component in isolation
- [ ] Ensure props/callbacks work identically
- [ ] Verify accessibility improvements

### **Integration Tests** 
- [ ] Firebase operations still work
- [ ] Skill unlocking logic unchanged
- [ ] File uploads to Firebase Storage
- [ ] Student progress persistence

### **Visual Regression Tests**
- [ ] Screenshot comparisons
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## Rollback Plan

### **Branch Strategy**
- Main branch: Current working system
- Feature branch: `feature/v0dash-integration`
- Each component gets its own sub-branch
- Merge only after thorough testing

### **Feature Toggle Implementation**
```jsx
// In main App.jsx
const isDashboardV2Enabled = process.env.VITE_ENABLE_MODERN_DASHBOARD === 'true'

return isDashboardV2Enabled ? <ModernDashboard /> : <Dashboard />
```

## Success Metrics

### **Performance**
- [ ] Page load time < 2 seconds
- [ ] First contentful paint < 1 second
- [ ] Lighthouse score > 90

### **Accessibility**
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader compatibility
- [ ] Keyboard navigation

### **Mobile Experience**
- [ ] Touch-friendly interactions
- [ ] Responsive on all screen sizes
- [ ] Offline capability maintained

## Timeline Checkpoints

- **Week 3 End**: Core layout migration complete
- **Week 4 End**: Skill tree visualization updated
- **Week 5 End**: Forms and interactions modernized
- **Week 6 End**: Mobile responsiveness verified
- **Week 7 End**: Testing complete, ready for merge

---

**Next Action**: Begin with Phase 1a - Core Layout migration by creating `ModernDashboard.jsx` component.