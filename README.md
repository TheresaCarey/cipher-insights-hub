# Cipher Insights Hub - Anonymous Product Satisfaction Surveys

A fully homomorphic encryption (FHE) powered anonymous product satisfaction survey system built on Zama's fhEVM. This decentralized application enables completely private product ratings where individual ratings remain encrypted throughout the entire survey process until results are publicly revealed by the admin.

## 🚀 Live Demo

- **Live Application**: [https://cipher-insights-hub.vercel.app/](https://cipher-insights-hub.vercel.app/)
- **Demo Video**: [Watch on GitHub](https://github.com/TheresaCarey/cipher-insights-hub/blob/main/cipher-insights-hub.mp4)

The demo video showcases the complete workflow:
1. Creating a new survey with multiple products
2. Submitting encrypted ratings anonymously
3. Admin finalizing and decrypting results
4. Viewing aggregated statistics and charts

## 📊 Project Statistics

- **Total Surveys Created**: Supports unlimited surveys
- **Products per Survey**: 2-5 products
- **Rating Scale**: 1-5 (Very Unsatisfied to Very Satisfied)
- **Encryption**: Fully Homomorphic Encryption (FHE) via Zama's fhEVM
- **Network Support**: Localhost (31337) and Sepolia Testnet (11155111)

## 🎯 Features

- **Fully Anonymous Ratings**: Ratings are encrypted using FHE and remain private on-chain
- **Encrypted Aggregation**: Smart contract performs homomorphic addition on encrypted ratings
- **Admin-Only Decryption**: Only survey admins can decrypt the final rating sums
- **Tamper-Proof**: All data stored on blockchain with cryptographic guarantees
- **Modern UI**: Beautiful, responsive interface with RainbowKit wallet integration

## 🏗️ Architecture

### Smart Contract (ProductSatisfactionSurvey.sol)

The contract supports:
- Creating surveys with 2-5 products
- Submitting encrypted ratings (1-5) for each product
- On-chain homomorphic addition of encrypted ratings
- Admin finalization and decryption of results
- Prevention of double submission

### Rating Encoding

Products are rated on a scale of 1-5:
- 1 = Very Unsatisfied
- 2 = Unsatisfied
- 3 = Neutral
- 4 = Satisfied
- 5 = Very Satisfied

The smart contract sums all encrypted ratings for each product. The admin can then decrypt the sum and calculate average ratings using the total response count.

## 🔒 Security Features

- **Anonymous Ratings**: All ratings are encrypted before submission
- **On-Chain Privacy**: Ratings remain encrypted throughout the survey process
- **Admin-Only Decryption**: Only survey administrators can decrypt final results
- **Duplicate Prevention**: Users can only submit ratings once per survey
- **Input Validation**: Comprehensive validation for all user inputs

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Rainbow Wallet** or compatible Web3 wallet (MetaMask, etc.)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install contract dependencies
npm install

# Install UI dependencies
cd ui
npm install
cd ..
```

### 2. Compile Contracts

```bash
npm run compile
```

### 3. Run Tests

```bash
# Run local tests
npm run test
```

### 4. Deploy to Local Network

**Terminal 1: Start local FHEVM node**
```bash
npx hardhat node
```

**Terminal 2: Deploy contract**
```bash
npx hardhat deploy --network localhost
```

**Copy the deployed contract address** and update it in `ui/src/config/contracts.ts`:

```typescript
export const ProductSatisfactionSurveyAddresses: Record<string, { address: `0x${string}`, chainId: number, chainName: string }> = {
  "31337": {
    "address": "0xYourDeployedContractAddress", // Update this
    "chainId": 31337,
    "chainName": "hardhat"
  },
  // ...
};
```

### 5. Configure WalletConnect Project ID

Update `ui/src/config/wagmi.ts` with your WalletConnect project ID:

```typescript
export const config = getDefaultConfig({
  appName: 'Cipher Insights Hub',
  projectId: 'YOUR_PROJECT_ID', // Get from cloud.walletconnect.com
  chains: [localhost, sepolia, mainnet, polygon],
  ssr: false,
});
```

### 6. Start Frontend

```bash
cd ui
npm run dev
```

Visit `http://localhost:5173` to use the application.

## 🧪 Testing

### Local Testing

```bash
npm run test
```

The test suite includes:
- Survey creation
- Encrypted rating submission
- Rating aggregation
- Double submission prevention
- Survey finalization
- Decryption

### Sepolia Testnet

1. **Set up environment variables:**

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

2. **Deploy to Sepolia:**

```bash
npx hardhat deploy --network sepolia
```

3. **Update contract address in UI config**

4. **Run Sepolia tests:**

```bash
npx hardhat test --network sepolia test/ProductSatisfactionSurveySepolia.ts
```

## 📱 Using the Application

### Creating a Survey

1. Connect your wallet using RainbowKit
2. Click "Create Survey"
3. Fill in:
   - Survey title
   - Description
   - Product names (2-5 products)
   - Duration in hours
4. Submit transaction

### Submitting Ratings

1. Browse active surveys
2. Click "Submit Ratings" on a survey
3. Rate each product (1-5) using the slider
4. Your ratings are encrypted locally before submission
5. Submit the encrypted ratings transaction

### Viewing Results (Admin Only)

1. After the survey ends, admins can click "View & Decrypt Results"
2. Click "Decrypt Product Results" for each product to reveal the encrypted sum
3. The system calculates average ratings
4. Click "Mark Survey as Fully Finalized" when all products are decrypted

#### ⚠️ Localhost Decryption Note

On **localhost**, the FHEVM Gateway doesn't exist, so decryption callbacks won't trigger automatically. After clicking "Decrypt Product Results" in the frontend, you need to manually trigger the decryption using the Hardhat task:

**Prerequisites:**
1. Make sure Hardhat node is running:
   ```bash
   npx hardhat node
   ```

2. Run the decryption task in another terminal:
   ```bash
   npx hardhat --network localhost task:decrypt-product --surveyId 0 --productIndex 0
   ```

   Replace `0` with your actual survey ID and product index.

3. Refresh the frontend to see the decrypted results.

**Note:** On Sepolia testnet, decryption happens automatically via the real FHEVM Gateway (takes 3-10 minutes).

## 🔐 Security Features

- **End-to-End Encryption**: Ratings are encrypted on the client before submission
- **On-Chain Privacy**: Encrypted ratings stored on blockchain without revealing content
- **Homomorphic Computation**: Rating aggregation happens on encrypted data
- **Admin-Only Decryption**: Only the survey creator can decrypt results
- **Replay Protection**: Built-in double submission prevention

## 📁 Project Structure

```
cipher-insights-hub/
├── contracts/
│   ├── ProductSatisfactionSurvey.sol  # Main survey contract
│   └── FHECounter.sol                 # Example FHE contract
├── deploy/
│   └── deploy.ts                       # Deployment script
├── test/
│   ├── ProductSatisfactionSurvey.ts   # Local tests
│   ├── ProductSatisfactionSurveySepolia.ts # Sepolia integration tests
│   └── FHECounter.ts                  # Example tests
├── ui/
│   ├── src/
│   │   ├── components/                # React components
│   │   │   ├── SurveyCard.tsx
│   │   │   ├── SubmitRatingDialog.tsx
│   │   │   ├── ViewResultsDialog.tsx
│   │   │   ├── CreateSurveyDialog.tsx
│   │   │   └── Header.tsx
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useSurveyContract.ts
│   │   │   └── useZamaInstance.ts
│   │   ├── config/                     # Configuration
│   │   │   ├── contracts.ts            # Contract ABI & address
│   │   │   └── wagmi.ts               # Wallet config
│   │   ├── lib/                        # Utilities
│   │   │   └── fhevm.ts               # FHE encryption utilities
│   │   └── pages/
│   │       └── Index.tsx              # Main page
│   └── public/
│       ├── favicon.svg                 # Site favicon
│       └── logo.svg                    # Logo
├── hardhat.config.ts                    # Hardhat configuration
└── package.json
```

## 🛠️ Configuration

### Wallet Configuration

Update `ui/src/config/wagmi.ts` with your WalletConnect project ID:

```typescript
export const config = getDefaultConfig({
  appName: 'Cipher Insights Hub',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from cloud.walletconnect.com
  chains: [localhost, sepolia, mainnet, polygon],
  ssr: false,
});
```

### Network Configuration

The contract is configured for localhost (31337) by default. To use Sepolia testnet, update:
- `hardhat.config.ts` for deployment networks
- `ui/src/config/wagmi.ts` for frontend networks
- `ui/src/config/contracts.ts` for contract addresses

## 📚 Technology Stack

### Smart Contracts
- **Solidity 0.8.24**
- **FHEVM by Zama** - Fully Homomorphic Encryption
- **Hardhat** - Development environment
- **Hardhat Deploy** - Deployment management

### Frontend
- **React 18**
- **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **RainbowKit** - Wallet connection
- **Wagmi** - Ethereum hooks
- **Zama Relayer SDK** - FHE encryption

## 🔍 How It Works

### Rating Encryption Flow

1. **User rates products** in the UI (1-5 scale)
2. **Local encryption**: Ratings encrypted using Zama FHE SDK
3. **Submit transaction**: Encrypted ratings + proofs sent to smart contract
4. **On-chain aggregation**: Contract performs homomorphic addition for each product
5. **Admin decryption**: After survey ends, admin decrypts the sums
6. **Result calculation**: Using sums and total responses, average ratings are calculated

### Mathematical Example

For 2 products (A and B) with 3 responses:
- User 1: A=5, B=4
- User 2: A=4, B=5
- User 3: A=3, B=3

On-chain sums: 
- Product A: Enc(5) + Enc(4) + Enc(3) = Enc(12)
- Product B: Enc(4) + Enc(5) + Enc(3) = Enc(12)

After decryption:
- Product A: Sum = 12, Total = 3, Average = 4.0
- Product B: Sum = 12, Total = 3, Average = 4.0

## 💻 Smart Contract Code

### Core Contract Structure

The `ProductSatisfactionSurvey` contract manages surveys with encrypted ratings:

```solidity
contract ProductSatisfactionSurvey is SepoliaConfig {
    struct Survey {
        string title;
        string description;
        string[] productNames;
        uint256 productCount;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
        mapping(uint256 => euint32) encryptedSums; // Encrypted sum per product
        address admin;
        uint256 totalResponses;
        mapping(uint256 => uint32) decryptedSums; // Decrypted sum after finalization
    }
    
    Survey[] public surveys;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
}
```

### Key Functions

#### 1. Creating a Survey

```solidity
function createSurvey(
    string memory _title,
    string memory _description,
    string[] memory _productNames,
    uint256 _durationInHours
) external returns (uint256) {
    require(_productNames.length >= 2, "Must have at least 2 products");
    require(_productNames.length <= 5, "Cannot have more than 5 products");
    require(_durationInHours > 0, "Duration must be greater than 0");
    require(bytes(_title).length > 0, "Title cannot be empty");

    uint256 surveyId = surveys.length;
    Survey storage newSurvey = surveys.push();
    newSurvey.title = _title;
    newSurvey.description = _description;
    newSurvey.productCount = _productNames.length;
    newSurvey.productNames = _productNames;
    newSurvey.endTime = block.timestamp + (_durationInHours * 1 hours);
    newSurvey.isActive = true;
    newSurvey.admin = msg.sender;
    newSurvey.totalResponses = 0;

    emit SurveyCreated(surveyId, _title, msg.sender);
    return surveyId;
}
```

#### 2. Submitting Encrypted Ratings

```solidity
function submitRatings(
    uint256 _surveyId,
    externalEuint32[] calldata _encryptedRatings,
    bytes[] calldata inputProofs
) external surveyExists(_surveyId) surveyActive(_surveyId) {
    require(!hasSubmitted[_surveyId][msg.sender], "Already submitted");
    Survey storage survey = surveys[_surveyId];
    require(_encryptedRatings.length == survey.productCount, "Rating count mismatch");

    // Process each product rating
    for (uint256 i = 0; i < survey.productCount; i++) {
        // Convert external encrypted input to internal euint32
        euint32 encryptedRating = FHE.fromExternal(_encryptedRatings[i], inputProofs[i]);
        
        // Homomorphic addition: add encrypted rating to sum
        if (survey.totalResponses == 0) {
            survey.encryptedSums[i] = encryptedRating;
        } else {
            survey.encryptedSums[i] = FHE.add(survey.encryptedSums[i], encryptedRating);
        }
        
        // Grant permissions for homomorphic operations
        FHE.allowThis(survey.encryptedSums[i]);
        FHE.allow(survey.encryptedSums[i], survey.admin);
    }
    
    hasSubmitted[_surveyId][msg.sender] = true;
    survey.totalResponses++;
    emit RatingSubmitted(_surveyId, msg.sender);
}
```

#### 3. Requesting Decryption

```solidity
function finalizeProduct(uint256 _surveyId, uint256 _productIndex) 
    external surveyExists(_surveyId) onlyAdmin(_surveyId) {
    Survey storage survey = surveys[_surveyId];
    require(!survey.isActive, "Survey still active");
    require(_productIndex < survey.productCount, "Invalid product index");
    require(survey.decryptedSums[_productIndex] == 0, "Product already finalized");

    // Request decryption from FHE oracle
    bytes32[] memory cts = new bytes32[](1);
    cts[0] = FHE.toBytes32(survey.encryptedSums[_productIndex]);
    
    uint256 requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
    _requestToSurvey[requestId] = _surveyId;
    _requestToProductIndex[requestId] = _productIndex;
    emit FinalizeRequested(_surveyId, requestId);
}
```

#### 4. Decryption Callback

```solidity
function decryptionCallback(
    uint256 requestId, 
    bytes memory cleartexts, 
    bytes[] memory /*signatures*/
) public returns (bool) {
    uint256 surveyId = _requestToSurvey[requestId];
    uint256 productIndex = _requestToProductIndex[requestId];
    Survey storage survey = surveys[surveyId];
    
    require(survey.decryptedSums[productIndex] == 0, "Product already finalized");
    require(!survey.isActive, "Survey still active");

    // Parse decrypted sum (uint32)
    require(cleartexts.length >= 4, "Invalid cleartexts length");
    uint32 decryptedSum;
    assembly {
        decryptedSum := shr(224, mload(add(cleartexts, 32)))
    }

    survey.decryptedSums[productIndex] = decryptedSum;
    emit SurveyFinalized(surveyId, productIndex, decryptedSum);
    return true;
}
```

## 🔐 Encryption & Decryption Logic

### Frontend Encryption Flow

The encryption process happens client-side using Zama's FHE SDK:

#### 1. Initialize FHEVM Instance

```typescript
// ui/src/lib/fhevm.ts
export async function initializeFHEVM(chainId?: number): Promise<FhevmInstance> {
  // For localhost (31337): Use @fhevm/mock-utils
  // For Sepolia (11155111): Use @zama-fhe/relayer-sdk
  const config = chainId === 31337 
    ? { ...SepoliaConfig, network: localhostRpcUrl, chainId: 31337 }
    : { ...SepoliaConfig, network: window.ethereum };
  
  await initSDK(); // Initialize WASM
  return await createInstance(config);
}
```

#### 2. Encrypt Rating Value

```typescript
// ui/src/lib/fhevm.ts
export async function encryptInput(
  fhevm: FhevmInstance,
  contractAddress: string,
  userAddress: string,
  ratingValue: number
): Promise<EncryptedInput> {
  // Create encrypted input with contract address and user address
  const encryptedInput = fhevm
    .createEncryptedInput(contractAddress, userAddress)
    .add32(ratingValue); // Add rating (1-5) as uint32
  
  const encrypted = await encryptedInput.encrypt();
  
  return {
    handles: encrypted.handles.map(handle => ethers.hexlify(handle)),
    inputProof: ethers.hexlify(encrypted.inputProof)
  };
}
```

#### 3. Submit Encrypted Data

```typescript
// ui/src/hooks/useSurveyContract.ts
const submitRatings = async (surveyId: number, ratings: number[]) => {
  // Validate ratings (1-5)
  for (const rating of ratings) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
  }

  // Encrypt all ratings
  const encryptedInputs = await Promise.all(
    ratings.map(rating => encrypt(contractAddress, address, rating))
  );

  // Submit to contract
  await walletClient.writeContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'submitRatings',
    args: [
      BigInt(surveyId),
      encryptedInputs.map(e => e.handles[0]),
      encryptedInputs.map(e => e.inputProof),
    ],
  });
};
```

### Decryption Flow

#### 1. Request Decryption from Contract

```typescript
// Admin requests decryption for a product
const finalizeProduct = async (surveyId: number, productIndex: number) => {
  await walletClient.writeContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'finalizeProduct',
    args: [BigInt(surveyId), BigInt(productIndex)],
  });
  
  // Contract calls FHE oracle, which triggers decryptionCallback
};
```

#### 2. Decrypt on Frontend (for localhost)

```typescript
// ui/src/lib/fhevm.ts
export async function decryptEuint32(
  fhevm: FhevmInstance,
  handle: string,
  contractAddress: string,
  userAddress: string,
  signer: any,
  chainId?: number
): Promise<number> {
  if (chainId === 31337) {
    // Localhost: Use mock utils
    const provider = new JsonRpcProvider("http://localhost:8545");
    const value = await userDecryptHandleBytes32(
      provider,
      signer,
      contractAddress,
      handle,
      userAddress
    );
    return Number(value);
  } else if (chainId === 11155111) {
    // Sepolia: Use relayer SDK with EIP-712 signature
    const keypair = fhevm.generateKeypair();
    const eip712 = fhevm.createEIP712(/* ... */);
    const signature = await signer.signTypedData(/* ... */);
    const result = await fhevm.userDecrypt(/* ... */);
    return Number(result[handle] || 0);
  }
}
```

### Security Features

1. **Client-Side Encryption**: Ratings are encrypted before leaving the user's browser
2. **Homomorphic Operations**: Contract performs addition on encrypted data without decryption
3. **Admin-Only Decryption**: Only survey creator can request and view decrypted results
4. **Proof Verification**: Each encrypted input includes a proof verified by the contract
5. **Double Submission Prevention**: Mapping tracks which users have already submitted

## 📊 Contract Data Flow

```
User Input (1-5) 
    ↓
[Client Encryption] → Encrypted Rating + Proof
    ↓
[Smart Contract] → Homomorphic Addition
    ↓
Encrypted Sum (on-chain)
    ↓
[Admin Request] → Decryption Oracle
    ↓
[Decryption Callback] → Decrypted Sum
    ↓
Average Calculation (Sum / Total Responses)
```

## 🔑 Key Security Properties

1. **Privacy Preservation**: Individual ratings never revealed on-chain
2. **Tamper Resistance**: All operations verified cryptographically
3. **Access Control**: Only survey admin can decrypt results
4. **Replay Protection**: Users can only submit once per survey
5. **Time-Locked**: Surveys automatically end after specified duration

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/TheresaCarey/cipher-insights-hub/issues)
- Zama Documentation: [docs.zama.ai](https://docs.zama.ai)
- Zama Discord: [discord.gg/zama](https://discord.gg/zama)

## 🎬 Demo Video

A comprehensive demo video is included in the repository (`cipher-insights-hub.mp4`) demonstrating:
- Complete survey creation and management workflow
- Encrypted rating submission process
- Admin result decryption and visualization
- Real-time statistics and chart generation

The video provides a step-by-step walkthrough of all major features and use cases.

---

**Built with ❤️ using Zama's FHE technology**
