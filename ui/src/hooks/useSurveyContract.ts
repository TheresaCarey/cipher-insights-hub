import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { getContractAddress, isContractDeployed, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from './useZamaInstance';
import { useState } from 'react';
import { toast } from 'sonner';

export interface Survey {
  title: string;
  description: string;
  productCount: bigint;
  productNames: string[];
  endTime: bigint;
  isActive: boolean;
  isFinalized: boolean;
  admin: string;
  totalResponses: bigint;
}

export function useSurveyContract() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { zamaInstance, encrypt, decrypt, isLoading: zamaLoading } = useZamaInstance();
  const [isLoading, setIsLoading] = useState(false);

  // Get contract info for current network
  const contractAddress = getContractAddress(chainId);
  const contractDeployed = isContractDeployed(chainId);

  // Get survey count
  const getSurveyCount = async (): Promise<number> => {
    if (!publicClient || !contractDeployed) return 0;
    try {
      const count = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getSurveyCount',
      }) as bigint;
      return Number(count);
    } catch (error) {
      console.error('Error getting survey count:', error);
      return 0;
    }
  };

  // Get survey details
  const getSurvey = async (surveyId: number): Promise<Survey | null> => {
    if (!publicClient || !contractDeployed) return null;
    try {
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getSurvey',
        args: [BigInt(surveyId)],
      }) as any[];

      return {
        title: result[0],
        description: result[1],
        productCount: result[2],
        productNames: result[3],
        endTime: result[4],
        isActive: result[5],
        isFinalized: result[6],
        admin: result[7],
        totalResponses: result[8],
      };
    } catch (error) {
      console.error('Error getting survey:', error);
      return null;
    }
  };

  // Check if user has submitted
  const hasUserSubmitted = async (surveyId: number): Promise<boolean> => {
    if (!publicClient || !address || !contractDeployed) return false;
    try {
      const submitted = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'hasUserSubmitted',
        args: [BigInt(surveyId), address],
      }) as boolean;
      return submitted;
    } catch (error) {
      console.error('Error checking submission status:', error);
      return false;
    }
  };

  // Create survey
  const createSurvey = async (
    title: string,
    description: string,
    productNames: string[],
    durationInHours: number
  ) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createSurvey',
          args: [title, description, productNames, BigInt(durationInHours)],
          gas: 2000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'createSurvey',
          args: [title, description, productNames, BigInt(durationInHours)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Survey created successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error creating survey:', error);
      const errorMessage = error?.message || error?.reason || 'Failed to create survey';
      toast.error(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  // Submit ratings
  const submitRatings = async (surveyId: number, ratings: number[]) => {
    if (!walletClient || !address || !zamaInstance || !contractDeployed) {
      toast.error('Please connect your wallet and wait for encryption to initialize');
      return false;
    }

    setIsLoading(true);
    try {
      if (!encrypt) {
        throw new Error('Encryption not ready');
      }

      for (const rating of ratings) {
        if (rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
      }

      // Encrypt all ratings
      const encryptedInputs = await Promise.all(
        ratings.map(rating => encrypt(contractAddress, address, rating))
      );

      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        console.log("Calling submitRatings on localhost network (skipping gas estimation)");
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'submitRatings',
          args: [
            BigInt(surveyId),
            encryptedInputs.map(e => e.handles[0]),
            encryptedInputs.map(e => e.inputProof),
          ],
          gas: 5000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'submitRatings',
          args: [
            BigInt(surveyId),
            encryptedInputs.map(e => e.handles[0]),
            encryptedInputs.map(e => e.inputProof),
          ],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Ratings submitted successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error submitting ratings:', error);
      toast.error(error.message || 'Failed to submit ratings');
      setIsLoading(false);
      return false;
    }
  };

  // End survey
  const endSurvey = async (surveyId: number) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'endSurvey',
          args: [BigInt(surveyId)],
          gas: 1000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'endSurvey',
          args: [BigInt(surveyId)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Survey ended successfully!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error ending survey:', error);
      toast.error(error.message || 'Failed to end survey');
      setIsLoading(false);
      return false;
    }
  };

  // Finalize product (request decryption)
  const finalizeProduct = async (surveyId: number, productIndex: number) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'finalizeProduct',
          args: [BigInt(surveyId), BigInt(productIndex)],
          gas: 2000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'finalizeProduct',
          args: [BigInt(surveyId), BigInt(productIndex)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Finalization requested! Results will be available after decryption.');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error requesting finalization:', error);
      toast.error(error.message || 'Failed to request finalization');
      setIsLoading(false);
      return false;
    }
  };

  // Get decrypted sum for a product
  const getDecryptedSum = async (surveyId: number, productIndex: number): Promise<number | null> => {
    if (!publicClient || !contractDeployed) {
      return null;
    }

    try {
      const decryptedSum = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getDecryptedSum',
        args: [BigInt(surveyId), BigInt(productIndex)],
      }) as bigint;

      return Number(decryptedSum);
    } catch (error) {
      console.error('Error getting decrypted sum:', error);
      return null;
    }
  };

  // Check if survey is fully finalized
  const isSurveyFullyFinalized = async (surveyId: number): Promise<boolean> => {
    if (!publicClient || !contractDeployed) {
      return false;
    }

    try {
      const finalized = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'isSurveyFullyFinalized',
        args: [BigInt(surveyId)],
      }) as boolean;

      return finalized;
    } catch (error) {
      console.error('Error checking finalization status:', error);
      return false;
    }
  };

  // Mark survey as fully finalized
  const markSurveyFullyFinalized = async (surveyId: number) => {
    if (!walletClient || !address || !contractDeployed) {
      toast.error('Please connect your wallet or contract not deployed');
      return false;
    }

    setIsLoading(true);
    try {
      const isLocalhost = chainId === 31337;

      if (isLocalhost) {
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'markSurveyFullyFinalized',
          args: [BigInt(surveyId)],
          gas: 1000000n,
        });
        await publicClient!.waitForTransactionReceipt({ hash });
      } else {
        const { request } = await publicClient!.simulateContract({
          address: contractAddress,
          abi: CONTRACT_ABI,
          functionName: 'markSurveyFullyFinalized',
          args: [BigInt(surveyId)],
          account: address,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient!.waitForTransactionReceipt({ hash });
      }

      toast.success('Survey marked as fully finalized!');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error marking survey as finalized:', error);
      toast.error(error.message || 'Failed to mark survey as finalized');
      setIsLoading(false);
      return false;
    }
  };

  return {
    getSurveyCount,
    getSurvey,
    hasUserSubmitted,
    createSurvey,
    submitRatings,
    endSurvey,
    finalizeProduct,
    getDecryptedSum,
    isSurveyFullyFinalized,
    markSurveyFullyFinalized,
    contractDeployed,
    isLoading: isLoading || zamaLoading,
  };
}

