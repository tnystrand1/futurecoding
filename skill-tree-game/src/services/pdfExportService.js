// Enhanced PDF Export Service for Competency Analytics with Dual Model Support
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFExportService {
  constructor() {
    this.margin = 20;
    this.lineHeight = 8;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
  }

  // Generate individual student competency report
  async generateStudentReport(studentData, competencyAnalysis) {
    const pdf = new jsPDF();
    let yPosition = this.margin;

    // Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Student Competency Report', this.margin, yPosition);
    yPosition += 15;

    // Student Info
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    const studentName = studentData.name || studentData.displayName || studentData.email || studentData.id || 'Unknown Student';
    pdf.text(`Student: ${studentName}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, yPosition);
    yPosition += 15;

    // Dual Model Analysis Info
    if (competencyAnalysis?.model_comparison) {
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'italic');
      const agreementScore = competencyAnalysis.model_comparison.agreement_score;
      const agreementText = (typeof agreementScore === 'number') ? agreementScore.toFixed(1) : 'N/A';
      pdf.text(`Analysis Method: Dual AI Model Assessment (${agreementText}% agreement)`, this.margin, yPosition);
      yPosition += this.lineHeight;
      pdf.text(`Primary Model: ${competencyAnalysis.model_comparison.primary_model}`, this.margin, yPosition);
      yPosition += this.lineHeight;
      pdf.text(`Secondary Model: ${competencyAnalysis.model_comparison.secondary_model}`, this.margin, yPosition);
      yPosition += 15;
    }

    // Competency Summary
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Competency Summary', this.margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    // XP and Interactions - check multiple possible fields
    const totalXP = studentData.totalXP || studentData.websitePower || studentData.gameState?.totalXP || 0;
    pdf.text(`Total XP: ${totalXP}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    
    pdf.text(`Total Interactions: ${competencyAnalysis?.totalInteractions || 0}`, this.margin, yPosition);
    yPosition += this.lineHeight;
    
    if (competencyAnalysis?.competencyScore && competencyAnalysis.competencyScore !== "N/A") {
      pdf.text(`Overall Competency Score: ${competencyAnalysis.competencyScore}/10`, this.margin, yPosition);
      yPosition += 15;
    } else {
      pdf.text('Overall Competency Score: N/A (Insufficient Evidence)', this.margin, yPosition);
      yPosition += 15;
    }

    // Skills Progress - check both gameState.skillTree and skills fields
    const skillsData = studentData.gameState?.skillTree || studentData.skills;
    if (skillsData) {
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Skills Progress', this.margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      const skillEntries = Object.entries(skillsData);
      const unlockedSkills = skillEntries.filter(([skillId, skill]) => skill.unlocked || skill.mastered);
      
      if (unlockedSkills.length > 0) {
        unlockedSkills.forEach(([skillId, skill]) => {
          const status = skill.mastered ? 'Mastered' : 'In Progress';
          const xp = skill.xp || 0;
          
          if (yPosition > this.pageHeight - 30) {
            pdf.addPage();
            yPosition = this.margin;
          }
          
          pdf.text(`• ${skill.name || skillId.replace(/_/g, ' ')}: ${status} (${xp} XP)`, this.margin + 5, yPosition);
          yPosition += 6;
        });
      } else {
        pdf.text('No skills unlocked yet', this.margin + 5, yPosition);
        yPosition += 6;
      }
    }

    yPosition += 15;

    // Individual Competency Scores with Evidence
    if (competencyAnalysis?.competencies && competencyAnalysis.competencies.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Detailed Competency Analysis', this.margin, yPosition);
      yPosition += 12;

      competencyAnalysis.competencies.forEach((competency) => {
        if (yPosition > this.pageHeight - 40) {
          pdf.addPage();
          yPosition = this.margin;
        }
        
        const rating = competency.rating;
        const ratingText = rating === "N/A" ? "No Evidence" : 
                          typeof rating === 'number' && rating <= 3 ? 'Emerging' : 
                          typeof rating === 'number' && rating <= 7 ? 'Developing' : 
                          typeof rating === 'number' ? 'Proficient' : 'Unknown';
        
        // Competency header with confidence if available
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        let headerText = `${competency.name}: ${rating === "N/A" ? "N/A" : (typeof rating === 'number' ? rating : 'Unknown') + "/10"} (${ratingText})`;
        if (competency.confidence) {
          headerText += ` [${competency.confidence} Confidence]`;
        }
        pdf.text(headerText, this.margin, yPosition);
        yPosition += 8;
        
        // Model scores if available
        if (competency.model_scores) {
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'italic');
          pdf.text(`Model Scores: Primary ${competency.model_scores.primary || 'N/A'} | Secondary ${competency.model_scores.secondary || 'N/A'}`, this.margin + 5, yPosition);
          yPosition += 6;
        }
        
        // Narrative
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        if (competency.narrative) {
          const narrativeLines = pdf.splitTextToSize(competency.narrative, this.pageWidth - (this.margin * 2) - 10);
          narrativeLines.forEach(line => {
            if (yPosition > this.pageHeight - 15) {
              pdf.addPage();
              yPosition = this.margin;
            }
            pdf.text(line, this.margin + 5, yPosition);
            yPosition += 5;
          });
        }
        
        // Competency-specific evidence snippets
        if (competency.evidence_snippets && competency.evidence_snippets.length > 0) {
          yPosition += 3;
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Supporting Evidence:', this.margin + 5, yPosition);
          yPosition += 6;
          
          pdf.setFont(undefined, 'normal');
          competency.evidence_snippets.forEach((snippet, idx) => {
            if (yPosition > this.pageHeight - 25) {
              pdf.addPage();
              yPosition = this.margin;
            }
            
            // Evidence snippet
            const snippetLines = pdf.splitTextToSize(`• ${snippet.type}: "${snippet.excerpt}"`, this.pageWidth - (this.margin * 2) - 15);
            snippetLines.forEach(line => {
              if (yPosition > this.pageHeight - 15) {
                pdf.addPage();
                yPosition = this.margin;
              }
              pdf.text(line, this.margin + 10, yPosition);
              yPosition += 5;
            });
            
            // Context if available
            if (snippet.context) {
              const contextLines = pdf.splitTextToSize(`  Context: ${snippet.context}`, this.pageWidth - (this.margin * 2) - 15);
              contextLines.forEach(line => {
                if (yPosition > this.pageHeight - 15) {
                  pdf.addPage();
                  yPosition = this.margin;
                }
                pdf.text(line, this.margin + 10, yPosition);
                yPosition += 4;
              });
            }
            yPosition += 2;
          });
        } else if (rating === "N/A") {
          yPosition += 3;
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'italic');
          pdf.text('No evidence found for this competency.', this.margin + 5, yPosition);
          yPosition += 6;
        }
        
        // Areas for improvement
        if (competency.areas_for_improvement && competency.areas_for_improvement.length > 0) {
          yPosition += 3;
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'bold');
          pdf.text('Areas for Growth:', this.margin + 5, yPosition);
          yPosition += 5;
          
          pdf.setFont(undefined, 'normal');
          competency.areas_for_improvement.forEach(area => {
            if (yPosition > this.pageHeight - 15) {
              pdf.addPage();
              yPosition = this.margin;
            }
            const areaLines = pdf.splitTextToSize(`• ${area}`, this.pageWidth - (this.margin * 2) - 15);
            areaLines.forEach(line => {
              pdf.text(line, this.margin + 10, yPosition);
              yPosition += 4;
            });
          });
        }
        
        yPosition += 12;
      });
    }

    // Overall Assessment
    if (competencyAnalysis?.overall_assessment) {
      if (yPosition > this.pageHeight - 50) {
        pdf.addPage();
        yPosition = this.margin;
      }
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Overall Assessment', this.margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      const assessmentLines = pdf.splitTextToSize(competencyAnalysis.overall_assessment, this.pageWidth - (this.margin * 2));
      assessmentLines.forEach(line => {
        if (yPosition > this.pageHeight - 20) {
          pdf.addPage();
          yPosition = this.margin;
        }
        pdf.text(line, this.margin, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Model Disagreements (if any)
    if (competencyAnalysis?.model_comparison?.disagreements && competencyAnalysis.model_comparison.disagreements.length > 0) {
      if (yPosition > this.pageHeight - 40) {
        pdf.addPage();
        yPosition = this.margin;
      }
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Model Disagreements (Manual Review Recommended)', this.margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      
      competencyAnalysis.model_comparison.disagreements.forEach(disagreement => {
        if (yPosition > this.pageHeight - 15) {
          pdf.addPage();
          yPosition = this.margin;
        }
        pdf.text(`• ${disagreement.competency}: Primary=${disagreement.primary_score}, Secondary=${disagreement.secondary_score} (Diff: ${disagreement.difference})`, this.margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // General Evidence Snippets (fallback for legacy data)
    if (competencyAnalysis?.evidenceSnippets && competencyAnalysis.evidenceSnippets.length > 0) {
      if (yPosition > this.pageHeight - 40) {
        pdf.addPage();
        yPosition = this.margin;
      }

      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Additional Evidence Snippets', this.margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');

      competencyAnalysis.evidenceSnippets.forEach((snippet, index) => {
        if (yPosition > this.pageHeight - 25) {
          pdf.addPage();
          yPosition = this.margin;
        }

        const snippetLines = pdf.splitTextToSize(`${index + 1}. ${snippet.type}: "${snippet.excerpt}"`, this.pageWidth - (this.margin * 2));
        snippetLines.forEach(line => {
          pdf.text(line, this.margin, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      });
    }

    return pdf;
  }

  // Generate summary report for all students
  async generateSummaryReport(studentsData, competencyAnalyses) {
    const pdf = new jsPDF();
    let yPosition = this.margin;

    // Header
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('Class Competency Summary', this.margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, yPosition);
    pdf.text(`Total Students: ${studentsData.length}`, this.pageWidth - 60, yPosition);
    yPosition += 8;
    
    // Add note about dual model analysis
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'italic');
    pdf.text('Analysis conducted using dual AI model assessment for enhanced reliability', this.margin, yPosition);
    yPosition += 15;

    // Table header
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Student Name', this.margin, yPosition);
    pdf.text('XP', this.margin + 50, yPosition);
    pdf.text('Interactions', this.margin + 75, yPosition);
    pdf.text('Competency Score', this.margin + 115, yPosition);
    pdf.text('Confidence', this.margin + 155, yPosition);
    yPosition += 8;

    // Horizontal line
    pdf.line(this.margin, yPosition - 2, this.pageWidth - this.margin, yPosition - 2);
    yPosition += 3;

    // Sort students alphabetically
    const sortedStudents = [...studentsData].sort((a, b) => {
      const nameA = (a.name || a.displayName || a.email || a.id || '').toLowerCase();
      const nameB = (b.name || b.displayName || b.email || b.id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Student data rows
    pdf.setFont(undefined, 'normal');
    sortedStudents.forEach((student) => {
      if (yPosition > this.pageHeight - 20) {
        pdf.addPage();
        yPosition = this.margin;
        
        // Repeat header on new page
        pdf.setFont(undefined, 'bold');
        pdf.text('Student Name', this.margin, yPosition);
        pdf.text('XP', this.margin + 50, yPosition);
        pdf.text('Interactions', this.margin + 75, yPosition);
        pdf.text('Competency Score', this.margin + 115, yPosition);
        pdf.text('Confidence', this.margin + 155, yPosition);
        yPosition += 8;
        pdf.line(this.margin, yPosition - 2, this.pageWidth - this.margin, yPosition - 2);
        yPosition += 3;
        pdf.setFont(undefined, 'normal');
      }

      // Use student.id as the key for competencyAnalyses (not student.uid)
      const analysis = competencyAnalyses[student.id];
      const name = (student.name || student.displayName || student.email || student.id || 'Unknown').substring(0, 20);
      const xp = student.totalXP || student.websitePower || student.gameState?.totalXP || 0;
      const interactions = analysis?.totalInteractions || 0;
      const score = analysis?.competencyScore || 'N/A';
      
      // Calculate average confidence
      let avgConfidence = 'N/A';
      if (analysis?.competencies) {
        const confidenceScores = analysis.competencies
          .filter(c => c.confidence)
          .map(c => c.confidence === 'High' ? 3 : c.confidence === 'Medium' ? 2 : 1);
        
        if (confidenceScores.length > 0) {
          const sum = confidenceScores.reduce((total, score) => total + (typeof score === 'number' ? score : 0), 0);
          const avg = sum / confidenceScores.length;
          avgConfidence = avg > 2.5 ? 'High' : avg > 1.5 ? 'Medium' : 'Low';
        }
      }

      pdf.text(name, this.margin, yPosition);
      pdf.text(xp.toString(), this.margin + 50, yPosition);
      pdf.text(interactions.toString(), this.margin + 75, yPosition);
      pdf.text(score.toString(), this.margin + 115, yPosition);
      pdf.text(avgConfidence, this.margin + 155, yPosition);
      
      yPosition += 6;
    });

    // Add model disagreement summary
    yPosition += 15;
    if (yPosition > this.pageHeight - 60) {
      pdf.addPage();
      yPosition = this.margin;
    }

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Model Agreement Analysis', this.margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');

    let totalDisagreements = 0;
    let totalAssessments = 0;
    
    Object.values(competencyAnalyses).forEach(analysis => {
      if (analysis?.model_comparison?.disagreements) {
        totalDisagreements += analysis.model_comparison.disagreements.length;
      }
      if (analysis?.competencies) {
        totalAssessments += analysis.competencies.length;
      }
    });

    const agreementRate = totalAssessments > 0 ? ((totalAssessments - totalDisagreements) / totalAssessments * 100).toFixed(1) : 'N/A';
    
    pdf.text(`Overall Model Agreement Rate: ${agreementRate}%`, this.margin, yPosition);
    yPosition += 6;
    pdf.text(`Total Competency Assessments: ${totalAssessments}`, this.margin, yPosition);
    yPosition += 6;
    pdf.text(`Significant Disagreements: ${totalDisagreements}`, this.margin, yPosition);
    yPosition += 6;
    
    if (totalDisagreements > 0) {
      pdf.text(`Recommendations: Review assessments with significant model disagreements for manual evaluation.`, this.margin, yPosition);
    }

    return pdf;
  }

  // Download PDF with given filename
  downloadPDF(pdf, filename) {
    pdf.save(filename);
  }

  // Extract evidence snippets for PDF reports (legacy method)
  extractEvidenceSnippets(studentData) {
    const snippets = [];
    
    if (studentData.gameState?.skillTree) {
      Object.entries(studentData.gameState.skillTree).forEach(([skillId, skill]) => {
        if (skill.evidence) {
          Object.entries(skill.evidence).forEach(([type, content]) => {
            if (content && typeof content === 'string' && content.length > 10) {
              snippets.push({
                type: type,
                skillId: skillId,
                excerpt: content.substring(0, 150) + (content.length > 150 ? '...' : '')
              });
            }
          });
        }
      });
    }

    return snippets;
  }
}

export default new PDFExportService();