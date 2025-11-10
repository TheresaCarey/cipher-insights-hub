// ProductSatisfactionSurvey contract addresses by network
export const ProductSatisfactionSurveyAddresses: Record<string, { address: `0x${string}`, chainId: number, chainName: string }> = {
  "31337": {
    "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Deployed to localhost (no time restrictions)
    "chainId": 31337,
    "chainName": "hardhat"
  },
  "11155111": {
    "address": "0xAf2b3F90961B065CD0Ca1752e6A99204Dc489020", // Deployed to Sepolia
    "chainId": 11155111,
    "chainName": "sepolia"
  }
};

// Get contract info for current network
export function getContractInfo(chainId?: number) {
  const effectiveChainId = chainId?.toString() || "31337";
  return ProductSatisfactionSurveyAddresses[effectiveChainId];
}

// Check if contract is deployed on current network
export function isContractDeployed(chainId?: number): boolean {
  const contractInfo = getContractInfo(chainId);
  const isDeployed = contractInfo && contractInfo.address !== "0x0000000000000000000000000000000000000000";
  
  if (typeof window !== 'undefined') {
    console.log('[Contract] ChainId:', chainId, 'ContractInfo:', contractInfo, 'IsDeployed:', isDeployed);
  }
  
  return isDeployed;
}

// Validate contract address format
export function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Get contract address for current network
export function getContractAddress(chainId?: number): `0x${string}` {
  const contractInfo = getContractInfo(chainId);
  return contractInfo?.address || "0x0000000000000000000000000000000000000000";
}

// Contract ABI - Generated from ProductSatisfactionSurvey.sol
export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "SurveyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "RatingSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "FinalizeRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "productIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "decryptedSum",
        "type": "uint256"
      }
    ],
    "name": "SurveyFinalized",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_productNames",
        "type": "string[]"
      }
    ],
    "name": "createSurvey",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_productIndex",
        "type": "uint256"
      }
    ],
    "name": "finalizeProduct",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      }
    ],
    "name": "getSurvey",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "productCount",
        "type": "uint256"
      },
      {
        "internalType": "string[]",
        "name": "productNames",
        "type": "string[]"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isFinalized",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "admin",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "totalResponses",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSurveyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_productIndex",
        "type": "uint256"
      }
    ],
    "name": "getEncryptedSum",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "hasUserSubmitted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      },
      {
        "internalType": "externalEuint32[]",
        "name": "_encryptedRatings",
        "type": "bytes32[]"
      },
      {
        "internalType": "bytes[]",
        "name": "inputProofs",
        "type": "bytes[]"
      }
    ],
    "name": "submitRatings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      }
    ],
    "name": "endSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_productIndex",
        "type": "uint256"
      }
    ],
    "name": "getDecryptedSum",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "cleartexts",
        "type": "bytes"
      },
      {
        "internalType": "bytes[]",
        "name": "signatures",
        "type": "bytes[]"
      }
    ],
    "name": "decryptionCallback",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      }
    ],
    "name": "isSurveyFullyFinalized",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_surveyId",
        "type": "uint256"
      }
    ],
    "name": "markSurveyFullyFinalized",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

