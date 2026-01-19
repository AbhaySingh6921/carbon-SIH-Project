// lib/contractConfig.js
import carbonCreditAbi from './abis/CarbonCreditAbi.json';
import mrvRegistryAbi from './abis/MRVRegistryAbi.json';
import stakeReputationAbi from './abis/StakeReputationAbi.json';
import verificationAbi from './abis/VerificationAbi.json';
import verificationOracleAbi from './abis/VerificationOracleAbi.json';
import weatherSurviveAbi from './abis/WeatherSurviveAbi.json'
import NgoManagerAbi from './abis/ngoManager.json';

// --- PASTE YOUR DEPLOYED SEPOLIA ADDRESSES HERE ---
export const carbonCreditAddress = "0xC478348A356327b5E0963D04aA690916ccfFfD23";
export const mrvRegistryAddress = "0x5Bd7094F1Dcfd1EE844260fe3ED1A427c201B85b";
export const stakeReputationAddress = "0xFf48c1572322f0FdD1427b3F17287DD5bbF2052e";
export const verificationAddress = "0x277D86813C949e5289019245cDe8Ff7D732A2ce8";
export const verificationOracleAddress = "0x8B22cC10C77009B4080F89E96D766Ab78dD77D5D";
export const WeatherSurvivalAddress = "0x60211494D266CDe7A1981f9787daA5Eb8C306E0f";
export const NgoManagerAddress = "0x40660c48932849132902829F2C053Ef56084b109";
// ----------------------------------------------------

// Export ABIs  
export const CC_ABI = carbonCreditAbi.abi;
export const MRV_ABI = mrvRegistryAbi.abi;
export const SR_ABI = stakeReputationAbi.abi;
export const V_ABI = verificationAbi.abi;
export const VO_ABI = verificationOracleAbi.abi;
export const W_ABI = weatherSurviveAbi.abi;
export const NGOM_ABI = NgoManagerAbi.abi;