# Historical Competency Analytics Feature Specification

## Overview
Generate time-based competency scores for each of the 8 course days, with dual LLM scoring and CSV export optimized for R statistical analysis.

## Course Timeline
- **Days 1-4:** August 11-14, 2025 (Week 1)
- **Days 5-8:** August 18-21, 2025 (Week 2)

## Core Requirements

### 1. Historical Evidence Reconstruction
For each day (1-8), reconstruct the evidence available at that point in time:
- Skills unlocked by that date
- Reflections submitted by that date
- Chat interactions up to that date
- Gallery projects submitted by that date
- Achievements earned by that date

### 2. Evidence Filtering
- **EXCLUDE Day 8 self-ratings:** Remove `steamInterestRatingExplanation`, `belongingRatingExplanation`, `communicationRatingExplanation` from evidence set
- **Include all other evidence types:** Skills, reflections (days 1-7), chat logs, gallery data, achievements

### 3. Dual LLM Competency Scoring
For each day and each student:
- Run competency analysis using both Claude Sonnet and Gemini Flash
- Generate 8 competency scores (1-10 scale) per day per student
- Include confidence scores and model agreement metrics

### 4. CSV Export Format
**File:** `competency_scores_over_time.csv`

**Columns:**
```csv
student_id,student_name,day,date,competency_id,competency_name,
claude_score,gemini_score,final_score,confidence,agreement_score,
evidence_count_skills,evidence_count_reflections,evidence_count_chats,
evidence_count_gallery,evidence_count_achievements,total_evidence_items
```

**Sample Row:**
```csv
Charles,Charles,3,2025-08-13,sense_of_belonging,Sense of Belonging,
7,6,6.5,High,85.2,2,3,8,0,1,14
```

## Implementation Components

### 1. HistoricalCompetencyService.js
```javascript
class HistoricalCompetencyService {
  // Core methods:
  async generateHistoricalAnalysis(studentIds, startDate, endDate)
  async reconstructEvidenceForDay(studentId, dayNumber, cutoffDate)
  async analyzeCompetenciesForDay(studentId, dayNumber, evidence)
  exportToCSV(analysisResults)
}
```

### 2. Date Mapping
```javascript
const DAY_DATES = {
  1: '2025-08-11',
  2: '2025-08-12', 
  3: '2025-08-13',
  4: '2025-08-14',
  5: '2025-08-18',
  6: '2025-08-19',
  7: '2025-08-20',
  8: '2025-08-21'
};
```

### 3. Evidence Timestamp Filtering
- **Skills:** Use `evidence.submittedAt` or `unlockedAt` timestamps
- **Reflections:** Use `submittedAt` timestamps  
- **Chat Interactions:** Use `createdAt` timestamps
- **Gallery Projects:** Use `createdAt` timestamps
- **Achievements:** Use `earnedAt` timestamps

### 4. Day 8 Evidence Exclusion
```javascript
const excludeDay8SelfRatings = (evidence) => {
  return evidence.reflections.filter(reflection => {
    if (reflection.dayNumber === 8) {
      // Remove self-rating explanations but keep other Day 8 data
      const filteredResponses = { ...reflection.responses };
      delete filteredResponses.steamInterestRatingExplanation;
      delete filteredResponses.belongingRatingExplanation; 
      delete filteredResponses.communicationRatingExplanation;
      return { ...reflection, responses: filteredResponses };
    }
    return reflection;
  });
};
```

## User Interface

### 1. Teacher Dashboard Tab
- **"Historical Analytics"** tab in TeacherView.jsx
- Student selection checkboxes
- Date range selector (default: full course)
- "Generate Historical Analysis" button
- Progress indicator for LLM processing
- Download CSV button

### 2. Analysis Options
- **Single Student:** Individual progression over time
- **Multiple Students:** Class comparison over time  
- **Specific Date Range:** Custom time periods
- **Competency Focus:** Analyze specific competencies only

## R Analysis Optimization

### 1. CSV Structure Features
- **Tidy Data Format:** Each row = one competency score observation
- **Proper Data Types:** Numeric scores, date formats, factor variables
- **No Missing Data Codes:** Use NA for missing values
- **Consistent Naming:** snake_case for R compatibility

### 2. Suggested R Analysis Code
```r
# Load data
library(readr)
library(dplyr)
library(ggplot2)
library(lubridate)

data <- read_csv("competency_scores_over_time.csv")
data$date <- as.Date(data$date)

# Competency progression over time
ggplot(data, aes(x = day, y = final_score, color = competency_name)) +
  geom_line(aes(group = student_id), alpha = 0.3) +
  geom_smooth(method = "loess") +
  facet_wrap(~competency_name) +
  theme_minimal()

# Model agreement analysis
cor(data$claude_score, data$gemini_score, use = "complete.obs")
```

## Performance Considerations

### 1. Batch Processing
- Process students in batches of 5-10 to prevent API rate limits
- Show progress indicator: "Processing student 3 of 15..."
- Implement retry logic for API failures

### 2. Caching Strategy
- Cache historical evidence reconstructions
- Store intermediate LLM responses
- Resume interrupted batch jobs

### 3. Memory Management
- Stream CSV generation for large datasets
- Clear evidence objects after processing each student

## Security & Privacy

### 1. Data Anonymization
- Use student IDs rather than names in API calls
- Remove PII from evidence before LLM processing
- Anonymize exported CSV if requested

### 2. Access Control
- Restrict to authenticated teachers only
- Log all historical analysis requests
- Rate limit analysis generation

## Testing Strategy

### 1. Unit Tests
- Date filtering accuracy
- Evidence reconstruction completeness
- CSV format validation

### 2. Integration Tests  
- End-to-end analysis pipeline
- LLM API integration
- File download functionality

### 3. Data Validation
- Spot-check historical evidence accuracy
- Verify competency score ranges (1-10)
- Validate CSV import in R

## Success Metrics

### 1. Accuracy Metrics
- Evidence reconstruction completeness: >95%
- Timestamp filtering accuracy: 100%
- CSV format compliance: 100%

### 2. Performance Metrics
- Analysis completion time: <2 minutes for 20 students
- LLM API success rate: >98%
- CSV generation time: <30 seconds

### 3. Usability Metrics
- Teacher adoption rate: Monitor usage
- R analysis success rate: Survey users
- Feature satisfaction: Feedback collection

## Future Enhancements

### 1. Visualization Dashboard
- Interactive competency progression charts
- Student comparison heat maps
- Evidence timeline visualization

### 2. Statistical Analysis
- Automated trend detection
- Competency correlation analysis
- Predictive modeling integration

### 3. Export Formats
- SPSS export option
- Excel format with charts
- JSON format for further processing

---

**Priority:** High - Requested feature for educational research
**Estimated Effort:** 2-3 weeks development + testing
**Dependencies:** Existing competency service, dual LLM infrastructure
