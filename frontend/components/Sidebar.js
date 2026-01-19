// components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../styles/Sidebar.module.css';

export const Sidebar = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Plantations', href: '/my-Project' },
    { name: 'Submit Project', href: '/submit' },
  ];

  return (
    <aside className={styles.sidebar}>
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