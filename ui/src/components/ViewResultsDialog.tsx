import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Survey, useSurveyContract } from "@/hooks/useSurveyContract";
import { useState, useEffect } from "react";
import { Loader2, Lock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  survey: Survey;
  isAdmin: boolean;
  onSuccess: () => void;
}

export const ViewResultsDialog = ({
  open,
  onOpenChange,
  surveyId,
  survey,
  isAdmin,
  onSuccess,
}: ViewResultsDialogProps) => {
  const { getDecryptedSum, finalizeProduct, isSurveyFullyFinalized, markSurveyFullyFinalized, isLoading } = useSurveyContract();
  const [decryptedSums, setDecryptedSums] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalizingIndex, setFinalizingIndex] = useState<number | null>(null);
  const [isMarkingFinalized, setIsMarkingFinalized] = useState(false);

  useEffect(() => {
    if (open && isAdmin) {
      loadDecryptedSums();
    }
  }, [open, isAdmin, surveyId]);

  const loadDecryptedSums = async () => {
    setLoading(true);
    const sums: (number | null)[] = [];
    for (let i = 0; i < Number(survey.productCount); i++) {
      try {
        const sum = await getDecryptedSum(surveyId, i);
        sums.push(sum);
      } catch (error) {
        sums.push(null);
      }
    }
    setDecryptedSums(sums);
    setLoading(false);
  };

  const handleFinalizeProduct = async (productIndex: number) => {
    setFinalizingIndex(productIndex);
    const success = await finalizeProduct(surveyId, productIndex);
    if (success) {
      // Wait a bit for the decryption callback
      setTimeout(() => {
        loadDecryptedSums();
        setFinalizingIndex(null);
      }, 3000);
    } else {
      setFinalizingIndex(null);
    }
  };

  const handleMarkFullyFinalized = async () => {
    setLoading(true);
    setIsMarkingFinalized(true);
    const success = await markSurveyFullyFinalized(surveyId);
    setIsMarkingFinalized(false);
    if (success) {
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const calculateAverage = (sum: number | null, totalResponses: number): number | null => {
    if (sum === null || totalResponses === 0) return null;
    return sum / totalResponses;
  };

  const allFinalized = decryptedSums.every(sum => sum !== null && sum > 0);
  const totalResponses = Number(survey.totalResponses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Survey Results</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Decrypt and view the aggregated results. Each product's sum is decrypted separately."
              : "Results are only available to the survey admin."}
          </DialogDescription>
        </DialogHeader>

        {!isAdmin ? (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Only the survey admin can view results.</p>
          </div>
        ) : loading && decryptedSums.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading results...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {survey.productNames.map((productName, index) => {
              const sum = decryptedSums[index];
              const average = calculateAverage(sum, totalResponses);
              const isFinalized = sum !== null && sum > 0;

              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{productName}</CardTitle>
                      {isFinalized ? (
                        <span className="text-sm text-green-600 font-medium">Decrypted</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Encrypted</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isFinalized ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Sum:</span>
                            <span className="font-semibold">{sum}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Responses:</span>
                            <span className="font-semibold">{totalResponses}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Average Rating:</span>
                            <span className="font-bold text-lg">
                              {average !== null ? average.toFixed(2) : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Rating Scale</span>
                            <span>{average !== null ? `${average.toFixed(2)}/5.00` : ""}</span>
                          </div>
                          <Progress
                            value={average !== null ? (average / 5) * 100 : 0}
                            className="h-2"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          This product's ratings are still encrypted. Click below to decrypt.
                        </p>
                        <Button
                          onClick={() => handleFinalizeProduct(index)}
                          disabled={isLoading || finalizingIndex === index}
                          variant="outline"
                          className="w-full"
                        >
                          {finalizingIndex === index ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Decrypting...
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Decrypt Product Results
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {allFinalized && !survey.isFinalized && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleMarkFullyFinalized}
                  disabled={isLoading || isMarkingFinalized}
                  className="w-full"
                >
                  {(isLoading || isMarkingFinalized) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Mark Survey as Fully Finalized
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

