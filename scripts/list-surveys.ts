import { ethers } from "hardhat";

/**
 * List all surveys in the contract
 * 
 * Usage: npx hardhat run scripts/list-surveys.ts --network localhost
 */
async function main() {
  // Get deployed contract address
  let contractAddress: string;
  try {
    const deployment = await import("../deployments/localhost/ProductSatisfactionSurvey.json");
    contractAddress = deployment.address;
    console.log(`📍 Using deployed contract at: ${contractAddress}\n`);
  } catch {
    contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log(`📍 Using fallback address: ${contractAddress}\n`);
  }
  
  const surveyContract = await ethers.getContractAt("ProductSatisfactionSurvey", contractAddress);
  
  console.log("📋 Listing All Surveys");
  console.log("=====================\n");
  
  try {
    // Get total survey count
    const count = await surveyContract.getSurveyCount();
    const surveyCount = Number(count);
    
    console.log(`Total Surveys: ${surveyCount}\n`);
    
    if (surveyCount === 0) {
      console.log("No surveys found. Create a survey first using the frontend.");
      return;
    }
    
    // List each survey
    for (let i = 0; i < surveyCount; i++) {
      try {
        const survey = await surveyContract.getSurvey(i);
        console.log(`Survey ID: ${i}`);
        console.log(`  Title: "${survey.title}"`);
        console.log(`  Description: "${survey.description}"`);
        console.log(`  Products: ${survey.productCount}`);
        console.log(`  Product Names: ${survey.productNames.join(", ")}`);
        console.log(`  Total Responses: ${survey.totalResponses}`);
        console.log(`  Is Active: ${survey.isActive}`);
        console.log(`  Is Finalized: ${survey.isFinalized}`);
        console.log(`  Admin: ${survey.admin}`);
        console.log(`  Created: ${new Date(Number(survey.createdTime) * 1000).toLocaleString()}`);
        console.log(`  End Time: ${new Date(Number(survey.endTime) * 1000).toLocaleString()}`);
        
        // Check decryption status for each product
        if (!survey.isActive && Number(survey.totalResponses) > 0) {
          console.log(`  Decryption Status:`);
          for (let j = 0; j < Number(survey.productCount); j++) {
            try {
              const decryptedSum = await surveyContract.getDecryptedSum(i, j);
              if (Number(decryptedSum) > 0) {
                const average = Number(decryptedSum) / Number(survey.totalResponses);
                console.log(`    Product ${j} (${survey.productNames[j]}): ✅ Decrypted - Sum: ${decryptedSum}, Avg: ${average.toFixed(2)}/5.00`);
              } else {
                console.log(`    Product ${j} (${survey.productNames[j]}): 🔒 Encrypted - Ready to decrypt`);
              }
            } catch {
              console.log(`    Product ${j} (${survey.productNames[j]}): 🔒 Encrypted - Ready to decrypt`);
            }
          }
        }
        console.log("");
      } catch (error: any) {
        console.log(`Survey ID: ${i} - Error: ${error.message}\n`);
      }
    }
    
  } catch (error: any) {
    console.error("\n❌ Error listing surveys:", error.message);
    if (error.data) {
      console.error("   Error data:", error.data);
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

