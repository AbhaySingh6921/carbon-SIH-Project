// components/AdminSidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// We can reuse the same styles from the main sidebar
import styles from '../styles/Sidebar.module.css'; 

export const AdminSidebar = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Verification Dashboard', href: '/admindashboard' },
    { name: 'NGO Management', href: '/ngo-management' },
    {name:' Owner Controls', href: '/owner-controls' }
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.adminHeader}>
        <h4>Admin Panel</h4>
      </div>
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              href={link.href}
              key={link.name}
              className={isActive ? styles.activeLink : styles.link}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};