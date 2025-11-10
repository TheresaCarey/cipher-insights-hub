import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle, BarChart3, Lock } from "lucide-react";
import { useAccount } from 'wagmi';
import { useSurveyContract, Survey } from '@/hooks/useSurveyContract';
import { useState, useEffect } from 'react';
import { SubmitRatingDialog } from './SubmitRatingDialog';
import { ViewResultsDialog } from './ViewResultsDialog';

interface SurveyCardProps {
  surveyId: number;
  survey: Survey;
  onUpdate: () => void;
}

export const SurveyCard = ({ surveyId, survey, onUpdate }: SurveyCardProps) => {
  const { address, isConnected } = useAccount();
  const { hasUserSubmitted, endSurvey, isSurveyFullyFinalized } = useSurveyContract();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFullyFinalized, setIsFullyFinalized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setIsAdmin(address.toLowerCase() === survey.admin.toLowerCase());
      checkSubmissionStatus();
      checkFinalizationStatus();
    }
  }, [isConnected, address, survey.admin]);

  const checkSubmissionStatus = async () => {
    if (!isConnected || !address) return;
    try {
      const submitted = await hasUserSubmitted(surveyId);
      setHasSubmitted(submitted);
    } catch (error) {
      console.error('Error checking submission status:', error);
      setHasSubmitted(false);
    }
  };

  const checkFinalizationStatus = async () => {
    if (!isConnected) return;
    const finalized = await isSurveyFullyFinalized(surveyId);
    setIsFullyFinalized(finalized);
  };

  const handleEndSurvey = async () => {
    setLoading(true);
    const success = await endSurvey(surveyId);
    if (success) {
      onUpdate();
    }
    setLoading(false);
  };

  const isEnded = !survey.isActive;

  return (
    <Card className="transition-all hover:shadow-lg md:max-w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="mb-2">{survey.title}</CardTitle>
            <CardDescription>{survey.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            {survey.isActive ? (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            ) : survey.isFinalized ? (
              <Badge variant="secondary">Finalized</Badge>
            ) : (
              <Badge variant="outline">Ended</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{Number(survey.totalResponses)} responses</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Products:</span> {survey.productNames.join(', ')}
          </div>
        </div>

        {isConnected ? (
          <div className="flex flex-col gap-2">
            {survey.isActive && !hasSubmitted && (
              <Button onClick={() => setShowSubmitDialog(true)} className="w-full">
                Submit Ratings
              </Button>
            )}
            {survey.isActive && hasSubmitted && (
              <Button variant="outline" disabled className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Already Submitted
              </Button>
            )}
            {isEnded && isAdmin && !survey.isFinalized && (
              <>
                <Button
                  onClick={() => setShowResultsDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View & Decrypt Results
                </Button>
                {!isFullyFinalized && (
                  <p className="text-xs text-muted-foreground text-center">
                    Finalize all products to view results
                  </p>
                )}
              </>
            )}
            {isEnded && isAdmin && survey.isFinalized && (
              <Button
                onClick={() => setShowResultsDialog(true)}
                variant="default"
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Final Results
              </Button>
            )}
            {isEnded && !isAdmin && (
              <Button variant="outline" disabled className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Results (Admin Only)
              </Button>
            )}
            {survey.isActive && isAdmin && (
              <Button
                onClick={handleEndSurvey}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? 'Ending...' : 'End Survey'}
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" disabled className="w-full">
            Connect Wallet to Participate
          </Button>
        )}
      </CardContent>

      <SubmitRatingDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        surveyId={surveyId}
        survey={survey}
        onSuccess={() => {
          setShowSubmitDialog(false);
          checkSubmissionStatus();
          onUpdate();
        }}
      />

      <ViewResultsDialog
        open={showResultsDialog}
        onOpenChange={setShowResultsDialog}
        surveyId={surveyId}
        survey={survey}
        isAdmin={isAdmin}
        onSuccess={onUpdate}
      />
    </Card>
  );
};

