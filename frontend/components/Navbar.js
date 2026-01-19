// components/Navbar.js
'use client';

import Link from 'next/link';
import { ConnectWalletButton } from './ConnectWalletButton';
import styles from '../styles/Navbar.module.css';

export const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">Blue Carbon Registry</Link>
      </div>
      <div className={styles.navLinks}>
        <Link href="/">Home</Link>
        <Link href="/explorer">Explorer</Link>
      </div>
      <div className={styles.walletButton}>
        <ConnectWalletButton />
      </div>
    </nav>
  );
};