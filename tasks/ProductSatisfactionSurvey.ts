import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Decrypt product results for a survey
 * 
 * Usage:
 *   npx hardhat --network localhost task:decrypt-product --surveyId 0 --productIndex 0
 */
task("task:decrypt-product", "Decrypt product results for a survey")
  .addParam("surveyId", "Survey ID to decrypt")
  .addParam("productIndex", "Product index to decrypt")
  .addOptionalParam("address", "Optionally specify the ProductSatisfactionSurvey contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, fhevm, ethers } = hre;
    
    await fhevm.initializeCLIApi();
    
    // Get contract address
    let contractAddress: string;
    if (taskArguments.address) {
      contractAddress = taskArguments.address;
    } else {
      try {
        const deployment = await deployments.get("ProductSatisfactionSurvey");
        contractAddress = deployment.address;
      } catch {
        contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        console.log("⚠️  Using fallback address:", contractAddress);
      }
    }
    
    const surveyId = parseInt(taskArguments.surveyId);
    const productIndex = parseInt(taskArguments.productIndex);
    
    console.log("\n🔓 Decrypting Product Results");
    console.log("==============================\n");
    console.log(`Contract: ${contractAddress}`);
    console.log(`Survey ID: ${surveyId}`);
    console.log(`Product Index: ${productIndex}\n`);
    
    const signers = await ethers.getSigners();
    const surveyContract = await ethers.getContractAt("ProductSatisfactionSurvey", contractAddress);
    
    try {
      // Check if survey exists
      const totalCount = await surveyContract.getSurveyCount();
      if (surveyId >= Number(totalCount)) {
        console.error(`❌ Survey ID ${surveyId} does not exist.`);
        console.error(`   Available survey IDs: 0 to ${Number(totalCount) - 1}`);
        return;
      }
      
      // Get survey info
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
      
      if (productIndex >= Number(survey.productCount)) {
        console.error(`❌ Invalid product index. Survey has ${survey.productCount} products.`);
        return;
      }
      
      // Check if already decrypted
      try {
        const decryptedSum = await surveyContract.getDecryptedSum(surveyId, productIndex);
        if (Number(decryptedSum) > 0) {
          console.log(`✅ Product already decrypted! Sum: ${decryptedSum}`);
          const average = Number(survey.totalResponses) > 0 
            ? (Number(decryptedSum) / Number(survey.totalResponses)).toFixed(2)
            : "0.00";
          console.log(`   Average Rating: ${average}/5.00`);
          return;
        }
      } catch {
        // Not finalized yet, continue
      }
      
      // Get encrypted sum
      console.log("🔐 Getting encrypted sum...");
      const encryptedSum = await surveyContract.getEncryptedSum(surveyId, productIndex);
      console.log(`   Encrypted handle: ${encryptedSum}\n`);
      
      if (encryptedSum === ethers.ZeroHash || encryptedSum === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.error("❌ No encrypted sum found. Make sure ratings have been submitted.");
        return;
      }
      
      // Decrypt using FHEVM
      console.log("🔓 Decrypting encrypted sum...");
      const decryptedValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedSum,
        contractAddress,
        signers[0]
      );
      
      const sum = Number(decryptedValue);
      console.log(`✅ Decrypted sum: ${sum}\n`);
      
      // Find the requestId from events
      console.log("🔍 Looking for decryption request...");
      const filter = surveyContract.filters.FinalizeRequested(surveyId);
      const events = await surveyContract.queryFilter(filter);
      
      let requestId: bigint | null = null;
      
      // Find the most recent requestId for this survey
      for (const event of events.reverse()) {
        if (event.args && event.args.length >= 2) {
          requestId = event.args[1];
          console.log(`   Found requestId: ${requestId}`);
          break;
        }
      }
      
      if (!requestId) {
        console.error("❌ No FinalizeRequested event found.");
        console.error("   Please call finalizeProduct() first from the frontend.");
        return;
      }
      
      // Prepare callback data
      console.log("📞 Triggering decryption callback...");
      const sumBytes = ethers.solidityPacked(["uint32"], [sum]);
      
      // Call the callback function
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
      console.log(`\n✅ Decryption completed successfully!`);
      
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
  });


