import { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { SurveyCard } from "@/components/SurveyCard";
import { CreateSurveyDialog } from "@/components/CreateSurveyDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useSurveyContract, Survey } from '@/hooks/useSurveyContract';
import { toast } from 'sonner';

const Index = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { getSurveyCount, getSurvey, contractDeployed } = useSurveyContract();
  const [surveys, setSurveys] = useState<{ id: number; data: Survey }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Check if user is on wrong network
  const isWrongNetwork = isConnected && chainId !== 31337 && !contractDeployed;

  // Debug: Log network info
  useEffect(() => {
    if (isConnected) {
      console.log('[Index] Connected - ChainId:', chainId, 'ContractDeployed:', contractDeployed);
    } else {
      console.log('[Index] Not connected - Please connect wallet');
    }
  }, [isConnected, chainId, contractDeployed]);

  const loadSurveys = async () => {
    if (!contractDeployed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const count = await getSurveyCount();
      const loadedSurveys: { id: number; data: Survey }[] = [];

      for (let i = 0; i < count; i++) {
        const survey = await getSurvey(i);
        if (survey) {
          loadedSurveys.push({ id: i, data: survey });
        }
      }

      setSurveys(loadedSurveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast.error('Failed to load surveys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && contractDeployed) {
      loadSurveys();
    } else {
      setSurveys([]);
      setLoading(false);
    }
  }, [isConnected, contractDeployed]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Product Satisfaction Surveys</h2>
              <p className="text-muted-foreground">
                Anonymous product comparison surveys powered by FHE technology
              </p>
            </div>
            {isConnected && contractDeployed && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Survey
              </Button>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view surveys
            </p>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
              <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
              anonymous surveys. All ratings are encrypted before submission and remain private.
            </div>
          </div>
        ) : !contractDeployed ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isWrongNetwork ? 'Wrong Network' : 'Contract Not Deployed'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isWrongNetwork 
                ? `You're connected to Chain ID ${chainId}, but the contract is deployed on localhost (Chain ID: 31337).`
                : 'The survey contract is not deployed on this network.'}
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              {isWrongNetwork ? (
                <>
                  <p><strong>Current Network:</strong> Chain ID {chainId}</p>
                  <p><strong>Required Network:</strong> Localhost (Chain ID: 31337)</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => {
                        try {
                          switchChain({ chainId: 31337 });
                        } catch (error) {
                          toast.error('Failed to switch network. Please switch manually in your wallet.');
                        }
                      }}
                      className="mb-4"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Switch to Localhost Network
                    </Button>
                  </div>
                  <p className="text-xs mt-4">
                    <strong>Don't have localhost network?</strong> Add it to your wallet:
                  </p>
                  <code className="block bg-muted p-2 rounded mt-2 text-left text-xs">
                    Network Name: Localhost 8545<br />
                    RPC URL: http://localhost:8545<br />
                    Chain ID: 31337<br />
                    Currency Symbol: ETH
                  </code>
                </>
              ) : (
                <>
                  <p><strong>Current Network:</strong> Chain ID {chainId}</p>
                  <p className="mt-4">To deploy the contract:</p>
                  <code className="block bg-muted p-2 rounded mt-2 text-left">
                    # Terminal 1: Start Hardhat node<br />
                    npx hardhat node<br />
                    <br />
                    # Terminal 2: Deploy contract<br />
                    npx hardhat deploy --network localhost
                  </code>
                  <p className="mt-4 text-xs">
                    <strong>Note:</strong> Make sure you're connected to the localhost network (Chain ID: 31337) in your wallet.
                  </p>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
              <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
              anonymous surveys. All ratings are encrypted before submission and remain private.
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No surveys found. Create the first one!
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Survey
            </Button>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-4">
              <strong>Note:</strong> This app uses Fully Homomorphic Encryption (FHE) for secure,
              anonymous surveys. All ratings are encrypted before submission and remain private.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                surveyId={survey.id}
                survey={survey.data}
                onUpdate={loadSurveys}
              />
            ))}
          </div>
        )}
      </main>

      <CreateSurveyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadSurveys}
      />
    </div>
  );
};

export default Index;
