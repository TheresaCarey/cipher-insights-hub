import { ethers } from "hardhat";

/**
 * Manual trigger for local decryption (localhost only)
 * 
 * On localhost, FHEVM Gateway doesn't exist, so we need to manually
 * trigger the decryption callback to simulate what Gateway would do.
 * 
 * Usage: npx hardhat run scripts/trigger-local-decrypt.ts --network localhost
 * 
 * Arguments:
 *   --survey-id <number>  : Survey ID to decrypt (required)
 *   --product-index <number> : Product index to decrypt (required)
 */
async function main() {
  // Parse arguments from environment variables or command line
  // Hardhat doesn't support custom --flags, so we use env vars or process.argv
  let surveyId: number | null = null;
  let productIndex: number | null = null;
  
  // Try environment variables first
  if (process.env.SURVEY_ID) {
    surveyId = parseInt(process.env.SURVEY_ID);
  }
  if (process.env.PRODUCT_INDEX) {
    productIndex = parseInt(process.env.PRODUCT_INDEX);
  }
  
  // If not in env vars, try parsing from process.argv (after Hardhat's args)
  // Hardhat consumes --network and other flags, so we look for our custom format
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--survey-id' && i + 1 < args.length) {
      surveyId = parseInt(args[i + 1]);
    } else if (args[i] === '--product-index' && i + 1 < args.length) {
      productIndex = parseInt(args[i + 1]);
    } else if (args[i].startsWith('--survey-id=')) {
      surveyId = parseInt(args[i].split('=')[1]);
    } else if (args[i].startsWith('--product-index=')) {
      productIndex = parseInt(args[i].split('=')[1]);
    }
  }
  
  // Default to 0 if not provided (for quick testing)
  if (surveyId === null) {
    surveyId = 0;
    console.log("⚠️  No survey ID provided, using default: 0");
  }
  if (productIndex === null) {
    productIndex = 0;
    console.log("⚠️  No product index provided, using default: 0");
  }
  
  console.log("\n📝 Usage:");
  console.log("  Set environment variables:");
  console.log("    $env:SURVEY_ID=0; $env:PRODUCT_INDEX=0; npx hardhat run scripts/trigger-local-decrypt.ts --network localhost");
  console.log("\n  Or use inline format (may not work with Hardhat):");
  console.log("    npx hardhat run scripts/trigger-local-decrypt.ts --network localhost --survey-id=0 --product-index=0");
  console.log("\n  Or edit the script to hardcode values for quick testing\n");
  
  // Get deployed contract address
  let contractAddress: string;
  try {
    const deployment = await import("../deployments/localhost/ProductSatisfactionSurvey.json");
    contractAddress = deployment.address;
    console.log(`📍 Using deployed contract at: ${contractAddress}\n`);
  } catch {
    // Fallback to hardcoded address if deployment file not found
    contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log(`📍 Using fallback address: ${contractAddress}\n`);
  }
  
  const surveyContract = await ethers.getContractAt("ProductSatisfactionSurvey", contractAddress);
  const [deployer] = await ethers.getSigners();
  
  console.log("🔓 Manual Local Decryption Tool");
  console.log("================================\n");
  console.log(`📊 Survey ID: ${surveyId}`);
  console.log(`📦 Product Index: ${productIndex}\n`);
  
  try {
    // First check if there are any surveys
    const totalCount = await surveyContract.getSurveyCount();
    console.log(`📊 Total surveys in contract: ${totalCount}`);
    
    if (Number(totalCount) === 0) {
      console.error("\n❌ No surveys found in the contract.");
      console.error("   The contract at", contractAddress, "has no surveys.");
      console.error("\n💡 To fix this:");
      console.error("   1. Make sure you're connected to the correct network (localhost/31337)");
      console.error("   2. Create a survey using the frontend");
      console.error("   3. Submit some ratings");
      console.error("   4. End the survey");
      console.error("   5. Then run this script again");
      console.error("\n📋 To check what surveys exist, run:");
      console.error("   npx hardhat run scripts/list-surveys.ts --network localhost");
      return;
    }
    
    if (surveyId >= Number(totalCount)) {
      console.error(`❌ Survey ID ${surveyId} does not exist.`);
      console.error(`   Available survey IDs: 0 to ${Number(totalCount) - 1}`);
      console.error("\n💡 Tip: Run this command to list all surveys:");
      console.error("   npx hardhat run scripts/list-surveys.ts --network localhost");
      return;
    }
    
    // Check survey exists and get survey info
    const survey = await surveyContract.getSurvey(surveyId);
    console.log(`📋 Survey: "${survey.title}"`);
    console.log(`   Products: ${survey.productCount}`);
    console.log(`   Total Responses: ${survey.totalResponses}`);
    console.log(`   Is Active: ${survey.isActive}`);
    console.log(`   Is Finalized: ${survey.isFinalized}\n`);
    
    if (survey.isActive) {
      console.error("❌ Survey is still active. Please end the survey first.");
      return;
    }
    
    if (Number(productIndex) >= Number(survey.productCount)) {
      console.error(`❌ Invalid product index. Survey has ${survey.productCount} products.`);
      return;
    }
    
    // Check if already finalized
    try {
      const decryptedSum = await surveyContract.getDecryptedSum(surveyId, productIndex);
      if (Number(decryptedSum) > 0) {
        console.log(`✅ Product already decrypted! Sum: ${decryptedSum}`);
        return;
      }
    } catch {
      // Not finalized yet, continue
    }
    
    // Get encrypted sum
    console.log("🔐 Getting encrypted sum...");
    const encryptedSum = await surveyContract.getEncryptedSum(surveyId, productIndex);
    console.log(`   Encrypted handle: ${encryptedSum}\n`);
    
    // Get FHEVM instance using mock-utils
    console.log("🔓 Setting up FHEVM decryption...");
    
    try {
      // Fetch FHEVM metadata from Hardhat node
      const metadata = await ethers.provider.send("fhevm_relayer_metadata", []);
      
      if (!metadata || !metadata.ACLAddress || !metadata.InputVerifierAddress || !metadata.KMSVerifierAddress) {
        console.error("❌ FHEVM metadata not available from Hardhat node.");
        console.error("   Make sure Hardhat node is running with FHEVM plugin:");
        console.error("   npx hardhat node");
        return;
      }
      
      // Use @fhevm/mock-utils to create mock FHEVM instance
      const { MockFhevmInstance } = await import("@fhevm/mock-utils");
      
      const mockInstance = await MockFhevmInstance.create(
        ethers.provider as any,
        ethers.provider as any,
        {
          aclContractAddress: metadata.ACLAddress,
          chainId: 31337,
          gatewayChainId: 55815,
          inputVerifierContractAddress: metadata.InputVerifierAddress,
          kmsContractAddress: metadata.KMSVerifierAddress,
          verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
          verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
        }
      );
      
      // Decrypt the encrypted sum using mock FHEVM
      console.log("🔓 Decrypting encrypted sum...");
      const decryptedValue = await mockInstance.decrypt(encryptedSum);
      const sum = Number(decryptedValue);
      console.log(`✅ Decrypted sum: ${sum}\n`);
      
      // Find the requestId from events
      // We need to find the FinalizeRequested event for this survey and product
      console.log("🔍 Looking for decryption request...");
      const filter = surveyContract.filters.FinalizeRequested(surveyId);
      const events = await surveyContract.queryFilter(filter);
      
      let requestId: bigint | null = null;
      
      // Try to find requestId by checking the mapping in the contract
      // The contract stores _requestToSurvey and _requestToProductIndex mappings
      // We'll check all events and verify which one matches our productIndex
      for (const event of events.reverse()) {
        if (event.args && event.args.length >= 2) {
          const candidateRequestId = event.args[1];
          
          // Try to verify this requestId maps to our productIndex
          // We can't directly read private mappings, so we'll try to call the callback
          // with a test to see if it matches, or we can just use the most recent one
          // since typically there's only one pending request per product
          requestId = candidateRequestId;
          console.log(`   Found requestId: ${requestId}`);
          break;
        }
      }
      
      if (!requestId) {
        console.error("❌ No FinalizeRequested event found.");
        console.error("   Please call finalizeProduct() first from the frontend.");
        console.error("   Or check if the transaction was successful.");
        return;
      }
      
      // Verify the requestId maps to the correct survey and product
      // We can't read private mappings directly, but we can try the callback
      // and it will revert if the mapping is wrong
      console.log(`   Using requestId: ${requestId}`);
      
      // Prepare callback data
      // The callback expects: requestId, cleartexts (bytes), signatures (bytes[])
      // cleartexts should contain the decrypted sum as uint32 (4 bytes)
      console.log("📞 Triggering decryption callback...");
      
      // Pack the sum as bytes (uint32 = 4 bytes, big-endian)
      const sumBytes = ethers.solidityPacked(["uint32"], [sum]);
      
      // Call the callback function directly
      const callbackTx = await surveyContract.decryptionCallback(
        requestId,
        sumBytes,
        [] // Empty signatures array for mock
      );
      
      console.log(`   Transaction hash: ${callbackTx.hash}`);
      await callbackTx.wait();
      console.log("✅ Callback executed successfully!\n");
      
      // Verify results
      const finalSum = await surveyContract.getDecryptedSum(surveyId, productIndex);
      console.log("📈 Final Decrypted Result:");
      console.log(`   Product: ${survey.productNames[productIndex]}`);
      console.log(`   Decrypted Sum: ${finalSum}`);
      console.log(`   Total Responses: ${survey.totalResponses}`);
      if (Number(survey.totalResponses) > 0) {
        const average = Number(finalSum) / Number(survey.totalResponses);
        console.log(`   Average Rating: ${average.toFixed(2)}/5.00`);
      }
      console.log(`\n✅ Local decryption completed successfully!`);
      
    } catch (fhevmError: any) {
      console.error("❌ FHEVM decryption error:", fhevmError.message);
      if (fhevmError.message?.includes("fhevm_relayer_metadata")) {
        console.error("   Make sure Hardhat node is running with FHEVM plugin:");
        console.error("   npx hardhat node");
      }
      return;
    }
  } catch (error: any) {
    console.error("\n❌ Decryption failed:", error.message);
    if (error.data) {
      console.error("   Error data:", error.data);
    }
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

