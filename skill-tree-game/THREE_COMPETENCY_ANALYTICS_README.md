# Three Competency Analytics Service

## Overview

A NEW analytics service specifically designed to analyze student competency development across 3 key areas:
- **STEAM Interest**: Exploration of identity through Science, Technology, Engineering, Arts, and Mathematics
- **Sense of Belonging**: Feeling connected to learning community and accepted by peers and adults
- **Communication**: Ability to clearly exchange information in various settings and purposes

## Key Features

### ✅ Requirements Met
- **3 Competency Focus**: Only analyzes the requested 3 competencies (not the original 8)
- **Dual LLM Analysis**: Uses both Claude Sonnet-4 and Gemini 2.5 Flash for inter-rater reliability
- **Text File Outputs**: Generates separate prompt and analysis result files (not CSV)
- **Day 8 Exclusion**: Automatically omits Day 8 student self-ratings from evidence
- **Complete Data Set**: Uses final complete data (not temporal analysis)
- **New Service**: Separate from existing competency analytics (does not overwrite)

### 📊 Output Format
For each student, generates 2 text files:
1. **Prompt File** (`{studentId}_three_competency_prompt_{date}.txt`)
   - Complete competency rubrics
   - All student evidence (excluding Day 8 self-ratings)
   - Full prompts sent to both LLMs
   
2. **Results File** (`{studentId}_three_competency_results_{date}.txt`)
   - Claude Sonnet-4 analysis results (JSON)
   - Gemini 2.5 Flash analysis results (JSON)
   - Inter-rater reliability comparison
   - Summary statistics

## Technical Implementation

### Service Location
- **Main Service**: `src/services/ThreeCompetencyAnalyticsService.js`
- **Admin Interface**: `src/components/Admin/ThreeCompetencyAnalytics.jsx`

### Data Sources Analyzed
- **Skills Evidence**: Approved skill submissions and reflections
- **Daily Reflections**: Days 1-7 only (Day 8 excluded)
- **AI Chat Interactions**: Complete conversation history
- **Artifacts**: Code, project briefs, feedback, test results
- **Gallery Projects**: Team project submissions
- **Gallery Interactions**: Comments and reactions
- **Achievements**: Earned achievements and milestones

### Competency Rubrics

#### STEAM Interest
**Definition**: Exploration of one's identity and self-expression through Science, Technology, Engineering, Arts, and Mathematics both within and outside of the structured class environment.

**Dimensions**:
1. Actively seeks opportunities to learn about STEAM subjects
2. Engages in STEAM activities as means of exploring personal interests, values, and identity
3. Willing to experiment and tinker with various STEAM tools and materials
4. Curious and motivated to learn and use STEAM tools outside of structured class environment

#### Sense of Belonging  
**Definition**: Feeling connected to a learning community or professional setting, and accepted and valued by peers and adults in it.

**Dimensions**:
1. Feel interpersonal connection with others in learning community or professional setting
2. Recognize positive messages and representations that reflect their own potential and capacity for success
3. Feel that they have a rightful place in the TPZ community as a contributor and learner

#### Communication
**Definition**: Ability to clearly exchange information and common understanding with others in a variety of settings and for a variety of purposes (e.g., inform, instruct, motivate, and persuade).

**Dimensions**:
1. Demonstrates attentiveness and understanding to others with whom they are interacting
2. Clearly share ideas and information, choose appropriate methods for circumstances, and effectively adapt style and message to audience

### Rating Scale
- **1 = Emerging**: Limited evidence of competency behaviors
- **2 = Developing**: Some evidence but inconsistent application  
- **3 = Proficient**: Consistent demonstration of competency behaviors

## Usage Instructions

### Prerequisites
1. Ensure you have OpenRouter API key configured in environment variables
2. Service uses existing Firebase data collections (no additional setup required)

### Single Student Analysis
```javascript
import threeCompetencyService from './services/ThreeCompetencyAnalyticsService';

// Generate and download files for one student
const result = await threeCompetencyService.generateAndDownloadFiles('student_id');
console.log('Files generated:', result.files_generated);
```

### Batch Analysis
```javascript
// Analyze multiple students
const studentIds = ['student1', 'student2', 'student3'];
const results = await threeCompetencyService.generateBatchAnalysis(studentIds, {
  downloadFiles: true,
  onProgress: (progress) => {
    console.log(`Progress: ${progress.current}/${progress.total} - ${progress.studentId}`);
  }
});
```

### Admin Interface Usage
1. Navigate to Teacher Dashboard
2. Access "Three Competency Analytics" tab/section
3. Select students for analysis (individual or batch)
4. Click "Run Analysis" 
5. Files automatically download to Downloads folder

## Integration with Existing System

### Adding to Teacher Dashboard
To integrate the new component into the existing teacher dashboard:

1. **Import the component**:
```javascript
import ThreeCompetencyAnalytics from './components/Admin/ThreeCompetencyAnalytics';
```

2. **Add to router or tab system**:
```javascript
// Example tab structure
const tabs = [
  { id: 'students', label: 'Students', component: <StudentsTab /> },
  { id: 'analytics', label: 'Analytics', component: <AnalyticsTab /> },
  { id: 'three-competency', label: 'Three Competency Analytics', component: <ThreeCompetencyAnalytics /> }
];
```

3. **Add navigation button/link**:
```javascript
<button onClick={() => setActiveTab('three-competency')}>
  📊 Three Competency Analytics
</button>
```

### Data Privacy & Security
- Student data is anonymized before sending to LLMs
- No data is permanently stored by the analytics service  
- All analysis happens in real-time
- Generated files contain analysis results only (not raw student data)

## API Cost Considerations

### Expected Costs (Estimates)
- **Claude Sonnet-4**: ~$0.15-0.30 per student analysis
- **Gemini 2.5 Flash**: ~$0.02-0.05 per student analysis
- **Total per student**: ~$0.17-0.35

### Cost Management
- Batch processing includes automatic delays between students
- Progress tracking shows real-time cost accumulation
- Error handling prevents unnecessary retries
- Token usage is logged and reported

## Output File Examples

### Prompt File Structure
```
THREE COMPETENCY ANALYTICS - PROMPT FILE
Student: student_123
Generated: 2025-01-14T10:30:00.000Z
Models Used: Claude Sonnet-4, Gemini 2.5 Flash

===============================================================================
COMPETENCY DEFINITIONS AND RUBRICS
===============================================================================
[Complete rubric definitions for all 3 competencies]

===============================================================================
STUDENT EVIDENCE (Day 8 self-ratings excluded as requested)
===============================================================================
[Complete anonymized evidence summary]

===============================================================================
CLAUDE SONNET-4 PROMPT
===============================================================================
[Full prompt sent to Claude]

===============================================================================
GEMINI 2.5 FLASH PROMPT
===============================================================================
[Full prompt sent to Gemini]
```

### Results File Structure
```
THREE COMPETENCY ANALYTICS - RESULTS FILE
Student: student_123
Generated: 2025-01-14T10:30:00.000Z
Models Used: Claude Sonnet-4, Gemini 2.5 Flash

===============================================================================
CLAUDE SONNET-4 ANALYSIS RESULTS
===============================================================================
[Complete JSON analysis from Claude]

===============================================================================
GEMINI 2.5 FLASH ANALYSIS RESULTS
===============================================================================
[Complete JSON analysis from Gemini]

===============================================================================
INTER-RATER RELIABILITY COMPARISON
===============================================================================
[Dimension-by-dimension comparison with agreement rates]

===============================================================================
SUMMARY STATISTICS
===============================================================================
[Overall statistics, agreement rates, evidence counts, API usage]
```

## Troubleshooting

### Common Issues
1. **API Rate Limits**: Service includes automatic delays between requests
2. **Large Evidence Sets**: Service optimizes token usage for model limits
3. **Network Errors**: Includes retry logic and error handling
4. **Missing Evidence**: Service gracefully handles students with limited data

### Error Messages
- `"No evidence available"`: Student has no approved skills or reflections
- `"API authentication failed"`: Check OpenRouter API key configuration
- `"Rate limit exceeded"`: Wait and retry, or reduce batch size

### Performance Tips
- Process students in smaller batches (5-10 at a time) for better reliability
- Run analysis during off-peak hours to minimize API latency
- Ensure stable internet connection for large batch operations

## Future Enhancements

### Potential Additions
- **R Script Generation**: Auto-generate R analysis scripts for statistical analysis
- **Comparative Reports**: Compare cohorts or time periods
- **Visualization Dashboard**: Interactive charts and graphs
- **Email Reports**: Automatic report distribution
- **Custom Rubrics**: Allow modification of competency definitions

### Integration Opportunities
- **Google Sheets Export**: Direct export to Google Sheets for collaboration
- **LMS Integration**: Connect with learning management systems
- **Parent Portals**: Generate parent-friendly competency reports
- **Transcript Integration**: Include competency scores in academic transcripts

## Support & Maintenance

### Monitoring
- All API calls are logged with usage statistics
- Error rates and success metrics are tracked
- Performance monitoring includes response times and token usage

### Updates
- Service is designed to be updated independently of existing analytics
- New competency definitions can be added without affecting current functionality
- LLM models can be upgraded by changing model configuration

---

**Created**: January 2025  
**Version**: 1.0  
**Author**: AI Assistant  
**Status**: Ready for Testing and Integration
