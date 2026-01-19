// components/ConnectWalletButton.js
'use client';

import { useWeb3 } from '../context/Web3Context';
import styles from '../styles/ConnectWalletButton.module.css'; // We will create this CSS file next

export const ConnectWalletButton = () => {
  const { userAddress, userRole, connectWallet, logout } = useWeb3();

  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (userAddress) {
    return (
      <div className={styles.userInfo}>
        <span>{truncateAddress(userAddress)} ({userRole})</span>
        <button onClick={logout} className={styles.logoutButton}>Logout</button>
      </div>
    );
  } else {
    return (
      <button onClick={()=>connectWallet(true)} className={styles.connectButton}>
        Connect Wallet
      </button>
    );
  }
};