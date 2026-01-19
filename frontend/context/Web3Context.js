// context/Web3Context.js
'use client';

import React, { useState, useContext, createContext,useEffect,useCallback } from 'react';
import { ethers } from 'ethers';
import axios from "axios";
import { 
  carbonCreditAddress, CC_ABI,
  mrvRegistryAddress, MRV_ABI,
  stakeReputationAddress, SR_ABI,
  verificationAddress, V_ABI,
  verificationOracleAddress, VO_ABI,
  WeatherSurvivalAddress, W_ABI,
   NgoManagerAddress, NGOM_ABI,
  
} from '../lib/contractConfig';
import { useRouter } from 'next/navigation';

const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [userRole, setUserRole] = useState('PUBLIC');
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isFirstConnection, setIsFirstConnection] = useState(true);
  const [contractOwner, setContractOwner] = useState(null);

  // --- Hardcoded Admin Addresses ---
  const ADMIN_ADDRESSES = [
    '0xA4ef2885D0A00F21D0Ac59d1b9178cDD92e2e17a'.toLowerCase(),
  ];


  // ----------------- Wallet Connect -----------------
  const connectWallet = useCallback(async (redirect = true) => {
        setLoading(true);
        try {
            if (!window.ethereum) {
                alert("Please install MetaMask.");
                setLoading(false);
                return;
            }

            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            // Request accounts every time to handle account switching
            await browserProvider.send("eth_requestAccounts", []);
            const currentSigner = await browserProvider.getSigner();
            const currentAddress = await currentSigner.getAddress();

            // --- Instantiate All Contracts ---
            const vContract = new ethers.Contract(verificationAddress, V_ABI, currentSigner);
            const ngoContract = new ethers.Contract(NgoManagerAddress, NGOM_ABI, currentSigner);
            
            const loadedContracts = {
                ccContract: new ethers.Contract(carbonCreditAddress, CC_ABI, currentSigner),
                mrvContract: new ethers.Contract(mrvRegistryAddress, MRV_ABI, currentSigner),
                srContract: new ethers.Contract(stakeReputationAddress, SR_ABI, currentSigner),
                woContract: new ethers.Contract(WeatherSurvivalAddress, W_ABI, currentSigner),
                vContract: vContract,
                ngoContract: ngoContract
            };

            // --- Determine User Role (Cleaned and Corrected Logic) ---
            const ownerAddr = await vContract.owner();
            let role = 'PUBLIC';
            let destination = '/';

           if (ADMIN_ADDRESSES.includes(currentAddress.toLowerCase())) {
                role = 'ADMIN';
                destination = '/admindashboard';
            } else {
                const isNgo = await ngoContract.isWhitelisted(currentAddress);
                if (isNgo) {
                    role = 'NGO';
                    destination = '/dashboard';
                }
            }
            
            // --- Set All State at Once ---
            setProvider(browserProvider);
            setSigner(currentSigner);
            setUserAddress(currentAddress);
            setContracts(loadedContracts);
            
            setUserRole(role);
            
            console.log(`Wallet connected: ${currentAddress}, Role: ${role}`);
            localStorage.setItem("connectedWallet", "true");

            if (redirect) {
                router.push(destination);
            }

        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setLoading(false);
        }
    }, [router]);

  // ----------------- Helper Functions -----------------

  // 1. Upload file to IPFS (using Pinata)
   const uploadToIpfs = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("/api/uploadToIpfs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!res.data.IpfsHash) {
      throw new Error(res.data.error || "No IPFS hash returned");
    }

    return res.data.IpfsHash;
  } catch (err) {
    console.error("IPFS Upload Error:", err.response?.data || err.message);
    throw new Error("Failed to upload file to IPFS");
  }
};
  // 2. Approve token transfer
  const approveTokenTransfer = async (onStatusUpdate) => {
    onStatusUpdate("Step 2/4: Approving token transfer...");
    const stakeAmount = await contracts.srContract.minimumStake();
    const stakingTokenContract = new ethers.Contract(carbonCreditAddress, erc20Abi, signer);
    const approveTx = await stakingTokenContract.approve(stakeReputationAddress, stakeAmount);
    await approveTx.wait();
    return stakeAmount;
  };

  // 3. Stake tokens
  const stakeTokens = async (stakeAmount, onStatusUpdate) => {
    onStatusUpdate("Step 3/4: Staking tokens...");
    const stakeTx = await contracts.srContract.stakeTokens(stakeAmount);
    await stakeTx.wait();
  };

  // 4. Register plantation
  const registerPlantation = async (formData, ipfsHash, onStatusUpdate) => {
    onStatusUpdate("Step 4/4: Registering project on the blockchain...");
    const registerTx = await contracts.mrvContract.registerPlantation(
      formData.species,
      formData.treeCount,
      ipfsHash,
      formData.description,
      formData.latitude,
      formData.longitude
    );
    await registerTx.wait();
  };

  // ----------------- Main Flow -----------------
  const submitNewProject = async (formData, file, onStatusUpdate) => {
  if (!contracts.srContract || !contracts.mrvContract || !signer) {
      throw new Error("Web3 provider not ready.");
  }

  // 1. Upload file to IPFS
  onStatusUpdate('Step 1/4: Uploading file to IPFS...');
  const ipfsHash = await uploadToIpfs(file);

  // 2. Approve token transfer
  onStatusUpdate(`Step 2/4: Approving token transfer...`);
  const stakeAmount = await contracts.srContract.minimumStake();
  const stakingTokenContract = new ethers.Contract(carbonCreditAddress, erc20Abi, signer);
  const approveTx = await stakingTokenContract.approve(stakeReputationAddress, stakeAmount);
  await approveTx.wait();

  // 3. Stake tokens
  onStatusUpdate(`Step 3/4: Staking tokens...`);
  const stakeTx = await contracts.srContract.stakeTokens(stakeAmount);
  await stakeTx.wait();

  // 4. Register plantation
  onStatusUpdate(`Step 4/4: Registering project on the blockchain...`);
  const registerTx = await contracts.mrvContract.registerPlantation(
      formData.species,
      formData.treeCount,
      ipfsHash,
      formData.description,
      formData.latitude,
      formData.longitude
  );
  await registerTx.wait();
};


// --- Wallet and Chain Listeners ---
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;
        
        // --- THIS IS THE FIX ---
        // When accounts change, re-run the entire connectWallet logic
        // to update the signer, contracts, and role.
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                console.log("Account switched. Re-connecting...");
                connectWallet(false); // Re-connect but don't redirect
            } else {
                logout();
            }
        };
        const handleChainChanged = () => window.location.reload();

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            }
        };
    }, [connectWallet]); // Dependency array includes connectWallet

    // --- Auto Reconnect on Page Load ---
    useEffect(() => {
        if (localStorage.getItem("connectedWallet")) {
            connectWallet(false);
        } else {
            setLoading(false);
        }
    }, [connectWallet]);

  // ----------------- Logout -----------------
  const logout = () => {
    setProvider(null);
    setSigner(null);
    setUserAddress(null);
    setUserRole('PUBLIC');
    setContracts({});
   localStorage.removeItem("connectedWallet");
    router.push('/');
  };


  return (
    <Web3Context.Provider value={{
      provider, signer, userAddress, userRole, contracts,
      connectWallet, logout, submitNewProject,contractOwner,
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
