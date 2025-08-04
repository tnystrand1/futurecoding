import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import EvidenceUploader from './EvidenceUploader';
import { cn } from '../../lib/utils';
import { X, Upload, FileText, MessageSquare, Code, Camera, CheckCircle } from 'lucide-react';

const ModernEvidenceModal = ({ skill, onSubmit, onClose }) => {
  const [evidence, setEvidence] = useState({
    type: '',
    reflection: '',
    code: '',
    screenshot: '',
    aiChat: ''
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const evidenceTypes = [
    { key: 'reflection', label: 'Reflection', icon: MessageSquare, required: true },
    { key: 'code', label: 'Code Sample', icon: Code, required: false },
    { key: 'screenshot', label: 'Screenshot', icon: Camera, required: true },
    { key: 'aiChat', label: 'AI Conversation', icon: FileText, required: false }
  ];

  const steps = [
    'Evidence Type',
    'Submit Evidence',
    'Review & Submit'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(evidence);
    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvidenceChange = useCallback((field, value) => {
    setEvidence(prev => ({ ...prev, [field]: value }));
  }, []);

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return evidence.type !== '';
      case 1:
        return evidence.reflection.trim() !== '' && evidence.screenshot !== '';
      case 2:
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);
  const canSubmit = evidence.reflection.trim() !== '' && evidence.screenshot !== '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Submit Evidence: {skill.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={`tier${skill.tier}`}>
                    Tier {skill.tier}
                  </Badge>
                  <Badge variant="xp">
                    +{skill.xpReward} XP
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  index <= currentStep 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-200 text-gray-500"
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  index <= currentStep ? "text-blue-600" : "text-gray-500"
                )}>
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-4 transition-all",
                    index < currentStep ? "bg-blue-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Choose Evidence Type</h3>
                <p className="text-gray-600 mb-4">
                  Select the type of evidence you'd like to submit for this skill.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceTypes.map((type) => (
                  <Card
                    key={type.key}
                    className={cn(
                      "cursor-pointer border-2 transition-all hover:shadow-md",
                      evidence.type === type.key 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleEvidenceChange('type', type.key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <type.icon className={cn(
                          "w-6 h-6",
                          evidence.type === type.key ? "text-blue-600" : "text-gray-500"
                        )} />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          {type.required && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Submit Your Evidence</h3>
                <p className="text-gray-600 mb-4">
                  Provide evidence that demonstrates your mastery of {skill.name}.
                </p>
              </div>

              <form className="space-y-6">
                {/* Reflection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reflection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={evidence.reflection}
                    onChange={(e) => handleEvidenceChange('reflection', e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what you learned and how you applied this skill..."
                    required
                  />
                </div>

                {/* Screenshot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Screenshot Evidence <span className="text-red-500">*</span>
                  </label>
                  <EvidenceUploader
                    evidenceType="screenshot"
                    currentValue={evidence.screenshot}
                    onUpload={(url) => handleEvidenceChange('screenshot', url)}
                  />
                </div>

                {/* Optional: Code Sample */}
                {evidence.type === 'code' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Sample
                    </label>
                    <textarea
                      value={evidence.code}
                      onChange={(e) => handleEvidenceChange('code', e.target.value)}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Paste your code here..."
                    />
                  </div>
                )}

                {/* Optional: AI Chat */}
                {evidence.type === 'aiChat' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Conversation
                    </label>
                    <textarea
                      value={evidence.aiChat}
                      onChange={(e) => handleEvidenceChange('aiChat', e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Share your conversation with AI tools..."
                    />
                  </div>
                )}
              </form>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Your Submission</h3>
                <p className="text-gray-600 mb-4">
                  Please review your evidence before submitting.
                </p>
              </div>

              <div className="space-y-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Skill: {skill.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {skill.description || "Complete this skill to advance your learning journey."}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={`tier${skill.tier}`}>Tier {skill.tier}</Badge>
                      <Badge variant="xp">+{skill.xpReward} XP</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Your Evidence</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Reflection:</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {evidence.reflection.slice(0, 150)}
                          {evidence.reflection.length > 150 && '...'}
                        </p>
                      </div>
                      
                      {evidence.screenshot && (
                        <div>
                          <span className="text-sm font-medium">Screenshot:</span>
                          <div className="mt-1">
                            <img
                              src={evidence.screenshot}
                              alt="Evidence screenshot"
                              className="w-32 h-24 object-cover rounded border"
                            />
                          </div>
                        </div>
                      )}

                      {evidence.code && (
                        <div>
                          <span className="text-sm font-medium">Code Sample:</span>
                          <p className="text-xs text-gray-600 mt-1 font-mono bg-gray-100 p-2 rounded">
                            {evidence.code.slice(0, 100)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="border-t bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Evidence
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ModernEvidenceModal;