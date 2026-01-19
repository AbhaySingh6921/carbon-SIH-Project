// app/(admin)/layout.js
'use client';

import { AdminSidebar } from './../../../components/AdminSidebar';
import { useWeb3 } from '../../../context/Web3Context';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  // 1. Get the correct variables from the context: loading and userRole
  const { loading, userRole } = useWeb3();

  // 2. Implement the 3-stage protection logic
  
  // STAGE 1: While the context is connecting, show a loading message.
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <p>Connecting and verifying user role...</p>
      </div>
    );
  }

  // STAGE 2: After loading, if the role is NOT admin, deny access.
  if (userRole !== 'ADMIN') {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>You must be connected with an authorized admin wallet to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <div className={styles.pageContent}>
        {children}
      </div>
    </div>
  );
}