import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartWidget } from "./ChartWidget";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Survey, useSurveyContract } from "@/hooks/useSurveyContract";
import { useState, useEffect } from "react";
import { Loader2, Lock, BarChart3, RefreshCw, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
  const { getDecryptedSum, finalizeProduct, decryptAndFinalizeProduct, isSurveyFullyFinalized, markSurveyFullyFinalized, isLoading } = useSurveyContract();
  const [decryptedSums, setDecryptedSums] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalizingIndex, setFinalizingIndex] = useState<number | null>(null);
  const [isMarkingFinalized, setIsMarkingFinalized] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && isAdmin) {
      loadDecryptedSums();
    }
  }, [open, isAdmin, surveyId]);

  // Auto-refresh when dialog is open to catch manual decryptions
  useEffect(() => {
    if (!open || !isAdmin) return;
    
    // Set up periodic refresh on localhost to catch manual decryptions
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      const refreshInterval = setInterval(async () => {
        const sums: (number | null)[] = [];
        let foundDecrypted = false;
        for (let i = 0; i < Number(survey.productCount); i++) {
          try {
            const sum = await getDecryptedSum(surveyId, i);
            sums.push(sum);
            // If we find a decrypted result for the product being finalized, clear the finalizing state
            if (sum !== null && sum > 0) {
              foundDecrypted = true;
              if (finalizingIndex === i) {
                setFinalizingIndex(null);
                toast.success(`Product "${survey.productNames[i]}" decrypted successfully!`);
              }
            }
          } catch (error) {
            sums.push(null);
          }
        }
        setDecryptedSums(sums);
      }, 3000); // Refresh every 3 seconds on localhost (faster detection)
      
      return () => clearInterval(refreshInterval);
    }
  }, [open, isAdmin, surveyId, survey.productCount, survey.productNames]);

  const loadDecryptedSums = async () => {
    setLoading(true);
    const sums: (number | null)[] = [];
    for (let i = 0; i < Number(survey.productCount); i++) {
      try {
        const sum = await getDecryptedSum(surveyId, i);
        sums.push(sum);
        // If we find a decrypted result and this product was being finalized, clear the state
        if (sum !== null && sum > 0 && finalizingIndex === i) {
          console.log(`[ViewResultsDialog] Found decrypted result for product ${i}, clearing finalizing state`);
          setFinalizingIndex(null);
        }
      } catch (error) {
        sums.push(null);
      }
    }
    setDecryptedSums(sums);
    setLoading(false);
  };

  const handleFinalizeProduct = async (productIndex: number) => {
    console.log('[ViewResultsDialog] handleFinalizeProduct called', { surveyId, productIndex });
    
    // Prevent double-clicking
    if (finalizingIndex === productIndex || isLoading) {
      console.log('[ViewResultsDialog] Already processing, skipping...');
      return;
    }

    setFinalizingIndex(productIndex);
    
    try {
      // Check if we're on localhost - use direct decryption
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // On localhost, use direct frontend decryption (like build-lock-log)
        console.log('[ViewResultsDialog] Using direct frontend decryption for localhost...');
        const success = await decryptAndFinalizeProduct(surveyId, productIndex);
        
        if (success) {
          await loadDecryptedSums();
          setFinalizingIndex(null);
        } else {
          setFinalizingIndex(null);
        }
      } else {
        // On Sepolia, use normal flow (gateway handles decryption)
        console.log('[ViewResultsDialog] Calling finalizeProduct for Sepolia...');
        const success = await finalizeProduct(surveyId, productIndex);
        
        if (success) {
          toast.success('Decryption requested. Waiting for results...');
          
          // Poll for results
          let attempts = 0;
          const maxAttempts = 20;
          const pollInterval = 2000;
          
          const pollForResults = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            while (attempts < maxAttempts) {
              attempts++;
              console.log(`[ViewResultsDialog] Polling attempt ${attempts}/${maxAttempts} for product ${productIndex}...`);
              
              try {
                const sum = await getDecryptedSum(surveyId, productIndex);
                if (sum !== null && sum > 0) {
                  console.log('[ViewResultsDialog] Decryption complete!', { sum, productIndex });
                  toast.success(`Product "${survey.productNames[productIndex]}" decrypted successfully! Sum: ${sum}`);
                  await loadDecryptedSums();
                  setFinalizingIndex(null);
                  return;
                } else {
                  console.log(`[ViewResultsDialog] Attempt ${attempts}: Sum is ${sum}, still waiting...`);
                }
              } catch (error: any) {
                if (error?.message?.includes('Product not finalized yet') || 
                    error?.message?.includes('not finalized')) {
                  console.log(`[ViewResultsDialog] Attempt ${attempts}: Product not finalized yet, continuing to wait...`);
                } else {
                  console.warn(`[ViewResultsDialog] Attempt ${attempts}: Error checking decryption status:`, error);
                }
              }
              
              if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
              }
            }
            
            console.warn('[ViewResultsDialog] Decryption timeout');
            toast.warning('Decryption is taking longer than expected. The results may still be processing. Please check again in a moment or refresh the page.');
            await loadDecryptedSums();
            setFinalizingIndex(null);
          };
          
          pollForResults();
        } else {
          console.error('[ViewResultsDialog] Finalization failed');
          setFinalizingIndex(null);
        }
      }
    } catch (error: any) {
      console.error('[ViewResultsDialog] Error in handleFinalizeProduct:', error);
      toast.error(error?.message || 'Failed to decrypt product results');
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

  const copyDecryptCommand = async (productIndex: number) => {
    const command = `npx hardhat --network localhost task:decrypt-product --surveyId ${surveyId} --productIndex ${productIndex}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(productIndex);
      toast.success('Command copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy command');
    }
  };

  const allFinalized = decryptedSums.every(sum => sum !== null && sum > 0);
  const totalResponses = Number(survey.totalResponses);
  
  // Check if any product is being finalized
  const isAnyProductFinalizing = finalizingIndex !== null;

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
              const percentage = average ? ((average / 5) * 100).toFixed(0) : null;
              const isFinalized = sum !== null && sum > 0;
              const isCurrentlyFinalizing = finalizingIndex === index;

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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[ViewResultsDialog] Button clicked', { surveyId, productIndex: index });
                            handleFinalizeProduct(index);
                          }}
                          disabled={isLoading || finalizingIndex === index || loading}
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
                        {isCurrentlyFinalizing && !isFinalized && (
                          <div className="space-y-2 p-3 bg-muted rounded-lg border">
                            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (
                              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                                <p className="font-semibold mb-2">⚠️ Localhost Decryption Required</p>
                                <p className="mb-2 text-[11px]">On localhost, decryption requires a manual command. Follow these steps:</p>
                                <ol className="list-decimal list-inside space-y-1 mb-3 text-[10px]">
                                  <li>Ensure Hardhat node is running in a terminal: <code className="bg-background px-1 rounded font-mono">npx hardhat node</code></li>
                                  <li>In another terminal, run the decryption command:</li>
                                </ol>
                                <div className="bg-background p-2 rounded border mb-2 relative">
                                  <code className="text-[10px] break-all font-mono block pr-8">
                                    npx hardhat --network localhost task:decrypt-product --surveyId {surveyId} --productIndex {index}
                                  </code>
                                  <Button
                                    onClick={() => copyDecryptCommand(index)}
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    title="Copy command to clipboard"
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <p className="text-[10px] mb-2">After running the command, results will appear automatically (refreshing every 5 seconds).</p>
                                <Button
                                  onClick={async () => {
                                    console.log('[ViewResultsDialog] Manual refresh requested');
                                    await loadDecryptedSums();
                                    toast.info('Results refreshed');
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  className="w-full mt-2"
                                  disabled={loading}
                                >
                                  <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                  Refresh Results Now
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground text-center">
                                  Processing decryption request... This may take 10-30 seconds.
                                </p>
                                <Button
                                  onClick={async () => {
                                    console.log('[ViewResultsDialog] Manual refresh requested');
                                    await loadDecryptedSums();
                                    toast.info('Results refreshed');
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  disabled={loading}
                                >
                                  <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                  Refresh Results
                                </Button>
                              </>
                            )}
                          </div>
                        )}
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

