// FHEVM SDK utilities for frontend
import { ethers, JsonRpcProvider } from "ethers";

// Import @zama-fhe/relayer-sdk - use static import
// Note: Vite config excludes this from optimization
// The UMD script in index.html sets up window.relayerSDK which is required
import { createInstance, initSDK, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

// Import @fhevm/mock-utils for localhost mock FHEVM
// Note: Use dynamic import to avoid including in production bundle
let MockFhevmInstance: any = null;
let userDecryptHandleBytes32: any = null;

export interface EncryptedInput {
  handles: string[];
  inputProof: string;
}

let fhevmInstance: FhevmInstance | null = null;
let isSDKInitialized = false;

/**
 * Initialize FHEVM instance
 * Local network (31337): Uses @fhevm/mock-utils + Hardhat plugin
 * Sepolia (11155111): Uses @zama-fhe/relayer-sdk
 * Note: @zama-fhe/relayer-sdk requires window.ethereum (EIP-1193 provider)
 */
export async function initializeFHEVM(chainId?: number): Promise<FhevmInstance> {
  if (!fhevmInstance) {
    // Check if window.ethereum is available
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("window.ethereum is not available. Please install MetaMask or another Web3 wallet.");
    }

    // Get chain ID from window.ethereum if not provided
    let currentChainId = chainId;
    if (!currentChainId) {
      try {
        const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" });
        currentChainId = parseInt(chainIdHex, 16);
      } catch (error) {
        console.error("[FHEVM] Failed to get chain ID:", error);
        currentChainId = 31337; // Default to localhost
      }
    }

    console.log("[FHEVM] Current chain ID:", currentChainId);

    // Initialize SDK only for Sepolia (not for localhost)
    // Localhost uses Mock FHEVM which doesn't need SDK initialization
    if (currentChainId === 11155111 && !isSDKInitialized) {
      console.log("[FHEVM] Initializing FHE SDK for Sepolia...");
      try {
        await initSDK();
        isSDKInitialized = true;
        console.log("[FHEVM] ✅ FHE SDK initialized successfully");
      } catch (error: any) {
        console.error("[FHEVM] SDK initialization error:", error);
        // Continue anyway - createInstance might still work
        isSDKInitialized = true; // Mark as attempted to avoid retry loop
        console.warn("[FHEVM] Continuing with createInstance...");
      }
    }

    // Configure FHEVM instance
    let config: any;
    
    if (currentChainId === 31337) {
      // For localhost (chainId 31337), use Hardhat's FHEVM mock
      // Hardhat node provides FHEVM mock functionality via @fhevm/hardhat-plugin
      // We need to fetch FHEVM metadata from Hardhat node and use @fhevm/mock-utils
      const localhostRpcUrl = "http://localhost:8545";
      
      try {
        // Fetch FHEVM metadata from Hardhat node
        const provider = new JsonRpcProvider(localhostRpcUrl);
        const metadata = await provider.send("fhevm_relayer_metadata", []);
        
        if (metadata && metadata.ACLAddress && metadata.InputVerifierAddress && metadata.KMSVerifierAddress) {
          // Use @fhevm/mock-utils to create mock FHEVM instance
          if (!MockFhevmInstance) {
            // Dynamic import to avoid including in production bundle
            const mockUtils = await import("@fhevm/mock-utils");
            MockFhevmInstance = mockUtils.MockFhevmInstance;
            userDecryptHandleBytes32 = mockUtils.userDecryptHandleBytes32;
          }
          
          const mockInstance = await MockFhevmInstance.create(provider, provider, {
            aclContractAddress: metadata.ACLAddress,
            chainId: 31337,
            gatewayChainId: 55815,
            inputVerifierContractAddress: metadata.InputVerifierAddress,
            kmsContractAddress: metadata.KMSVerifierAddress,
            verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
            verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
          });
          
          fhevmInstance = mockInstance;
          console.log("[FHEVM] ✅ Mock FHEVM instance created successfully");
          return fhevmInstance;
        }
      } catch (error: any) {
        console.warn("[FHEVM] Failed to create FHEVM mock instance:", error);
        // Fall through to try SepoliaConfig
      }
      
      // Fallback: try using SepoliaConfig with localhost RPC
      config = {
        ...SepoliaConfig,
        // Use localhost RPC URL for mock FHEVM
        network: localhostRpcUrl,
        // Use localhost chainId for mock FHEVM
        chainId: 31337,
      };
    } else {
      // For other networks, use SepoliaConfig as is
      config = {
        ...SepoliaConfig,
        network: (window as any).ethereum,
      };
    }
    
    try {
      console.log("[FHEVM] Creating FHEVM instance with config:", config);
      
      // Add a small delay to ensure SDK is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      fhevmInstance = await createInstance(config);
      console.log("[FHEVM] ✅ FHEVM instance created successfully");
    } catch (error: any) {
      console.error("[FHEVM] ❌ Failed to create FHEVM instance:", error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to create FHEVM instance";
      if (error.message) {
        if (currentChainId === 31337) {
          // For localhost, provide localhost-specific error messages
          if (error.message.includes("fetch") || error.message.includes("network")) {
            errorMessage = "Unable to connect to local Hardhat node. Please ensure Hardhat node is running (npx hardhat node).";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Request timeout. Please check if Hardhat node is running.";
          } else if (error.message.includes("getCoprocessorSigners") || error.message.includes("BAD_DATA")) {
            errorMessage = "Unable to fetch FHEVM contract data from local Hardhat node. Please ensure Hardhat node is running and FHEVM contracts are deployed.";
          } else {
            errorMessage = `FHEVM instance creation failed: ${error.message}`;
          }
        } else {
          // For other networks, provide Sepolia-specific error messages
          if (error.message.includes("fetch") || error.message.includes("network")) {
            errorMessage = "Unable to connect to Sepolia network. Please check your network connection or try again later.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Request timeout. Please check your network connection or try again later.";
          } else if (error.message.includes("getCoprocessorSigners") || error.message.includes("BAD_DATA")) {
            errorMessage = "Unable to fetch FHEVM contract data from Sepolia network. Please ensure your network connection is normal or switch to Sepolia network.";
          } else {
            errorMessage = `FHEVM instance creation failed: ${error.message}`;
          }
        }
      } else {
        errorMessage = "Unable to fetch data. Please check your network connection or try again later.";
      }
      
      throw new Error(errorMessage);
    }
  }
  
  return fhevmInstance;
}

/**
 * Get or initialize FHEVM instance
 */
export async function getFHEVMInstance(chainId?: number): Promise<FhevmInstance> {
  return initializeFHEVM(chainId);
}

/**
 * Encrypt input data
 */
export async function encryptInput(
  fhevm: FhevmInstance,
  contractAddress: string,
  userAddress: string,
  ratingValue: number
): Promise<EncryptedInput> {
  if (ratingValue < 1 || ratingValue > 5) {
    throw new Error("Rating value must be between 1 and 5");
  }
  
  try {
    const encryptedInput = fhevm
      .createEncryptedInput(contractAddress, userAddress)
      .add32(ratingValue);
    
    const encrypted = await encryptedInput.encrypt();
    
    const handles = encrypted.handles.map(handle => {
      const hexHandle = ethers.hexlify(handle);
      if (hexHandle.length < 66) {
        const padded = hexHandle.slice(2).padStart(64, '0');
        return `0x${padded}`;
      }
      if (hexHandle.length > 66) {
        return hexHandle.slice(0, 66);
      }
      return hexHandle;
    });
    
    return {
      handles,
      inputProof: ethers.hexlify(encrypted.inputProof),
    };
  } catch (error: any) {
    console.error("[FHEVM] Encryption failed:", error);
    throw new Error(`Encryption failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Decrypt euint32 value (single value)
 */
export async function decryptEuint32(
  fhevm: FhevmInstance,
  handle: string,
  contractAddress: string,
  userAddress: string,
  signer: any,
  chainId?: number
): Promise<number> {
  const isLocalNetwork = chainId === 31337;
  const isSepoliaNetwork = chainId === 11155111;
  
  // Generate keypair (works for both localhost and Sepolia)
  let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
  if (typeof (fhevm as any).generateKeypair === "function") {
    keypair = (fhevm as any).generateKeypair();
  } else {
    // Fallback: create a dummy keypair for mock instances
    keypair = {
      publicKey: new Uint8Array(32).fill(0),
      privateKey: new Uint8Array(32).fill(0),
    };
  }
  
  const contractAddresses = [contractAddress as `0x${string}`];
  const startTimestamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = "10";
  
  // Create EIP712 signature
  let eip712: any;
  if (typeof (fhevm as any).createEIP712 === "function") {
    eip712 = (fhevm as any).createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimestamp,
      durationDays
    );
  } else {
    // Fallback EIP712 structure for mock instances
    eip712 = {
      domain: {
        name: "FHEVM",
        version: "1",
        chainId: chainId,
        verifyingContract: contractAddresses[0],
      },
      types: {
        UserDecryptRequestVerification: [
          { name: "publicKey", type: "bytes" },
          { name: "contractAddresses", type: "address[]" },
          { name: "startTimestamp", type: "string" },
          { name: "durationDays", type: "string" },
        ],
      },
      message: {
        publicKey: ethers.hexlify(keypair.publicKey),
        contractAddresses,
        startTimestamp,
        durationDays,
      },
    };
  }
  
  // Sign the EIP712 message
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );
  
  // For localhost, remove "0x" prefix from signature (as per build-lock-log)
  const signatureForDecrypt = isLocalNetwork 
    ? signature.replace("0x", "") 
    : signature;
  
  // Use userDecrypt method (works for both localhost mock and Sepolia)
  const handleContractPairs = [
    { handle, contractAddress: contractAddress as `0x${string}` },
  ];
  
  const result = await (fhevm as any).userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signatureForDecrypt,
    contractAddresses,
    userAddress as `0x${string}`,
    startTimestamp,
    durationDays
  );
  
  const decrypted = Number(result[handle] || 0);
  return decrypted;
}

/**
 * Reset FHEVM instance (for network switching)
 */
export function resetFHEVMInstance() {
  fhevmInstance = null;
  console.log("[FHEVM] Instance reset");
}


