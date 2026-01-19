// app/(app)/layout.js
import { Navbar } from '../../../components/Navbar';
import { Sidebar } from '../../../components/Sidebar';
import styles from './layout.module.css';

export default function AppLayout({ children }) {
  return (
    <div className={styles.appLayout}>
      
      <Sidebar />
      
      <div className={styles.pageContent}>
        {children}
      </div>
    </div>
  );
}