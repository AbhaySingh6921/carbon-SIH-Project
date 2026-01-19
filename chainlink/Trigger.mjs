import { ethers } from "ethers";
import 'dotenv/config';
import WeatherABI11 from './WeatherABI.json' with { type: "json" };

// --- Configuration ---
const WeatherABI = WeatherABI11.abi;
const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.BOT_PRIVATE_KEY;
const contractAddress = process.env.WEATHER_SURVIVAL_ADDRESS;

/**
 * This is a pre-flight check to diagnose permission errors before sending a real transaction.
 */
async function runPreFlightChecks() {
    console.log("--- Running Pre-flight Checks ---");
    let checksPassed = true;

    if (!privateKey || !contractAddress) {
        console.error("❌ Fatal Error: BOT_PRIVATE_KEY or WEATHER_SURVIVAL_ADDRESS not found in .env file.");
        return false;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, WeatherABI, provider); // Read-only instance for checks

        const signerAddress = await signer.getAddress();
        const contractOwner = await contract.owner();

        console.log(`ℹ️  Your wallet address (from BOT_PRIVATE_KEY): ${signerAddress}`);
        console.log(`ℹ️  The contract's owner address (from blockchain): ${contractOwner}`);

        // THE CRITICAL CHECK: Compare the two addresses
        if (signerAddress.toLowerCase() !== contractOwner.toLowerCase()) {
            console.error("\n❌ Check Failed: Permission Denied!");
            console.error("   The private key in your .env file does not belong to the owner of the contract.");
            console.error("   ACTION REQUIRED: Update the BOT_PRIVATE_KEY in your .env file to be the private key for the owner's wallet.");
            checksPassed = false;
        } else {
            console.log("✅ Check Passed: Your wallet is the authorized owner of the contract.");
        }

    } catch (err) {
        console.error("❌ Fatal Error during pre-flight checks. Are your RPC_URL and contract address correct?", err.message);
        checksPassed = false;
    }

    console.log("--- Pre-flight Checks Finished ---\n");
    return checksPassed;
}

async function triggerChainlinkRequest(projectId, lat, lon) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, WeatherABI, signer);

    console.log(`🔗 Triggering Chainlink request for Project #${projectId} with coordinates [${lat}, ${lon}]...`);
    
    const tx = await contract.sendRequest(projectId, [lat, lon]);
    
    console.log(`- Transaction sent! Waiting for confirmation... Hash: ${tx.hash}`);
    await tx.wait();
    
    console.log(`✅ Success! Chainlink Function request has been initiated.`);
    console.log("   Monitor the request status on the Chainlink Functions explorer.");

  } catch (err) {
    console.error("❌ Error triggering request.");
    console.error(`   Full Error: ${err.message}`);
    if (err.data) {
        console.error("   Revert Data:", err.data);
    }
  }
}

async function main() {
  console.log("--- Chainlink Trigger Bot Starting ---");
  
  const canProceed = await runPreFlightChecks();
  
  if (canProceed) {
    // Ensure Project #3 exists before running
    await triggerChainlinkRequest(3, "63.1466", "-21.9426");
  } else {
      console.log("Aborting due to failed pre-flight checks. Please fix the issue reported above.");
  }
  
  console.log("--- Chainlink Trigger Bot Finished ---");
}

main();

