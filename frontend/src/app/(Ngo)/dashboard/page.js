// app/(app)/dashboard/page.js
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';
import { StatCard } from '../../../../components/StatCard';
//import { plantations } from '../../../../lib/mockData'; // Import plantation data
import styles from './dashboard.module.css';
import { ethers } from 'ethers';


// We need this map to convert the status number from the contract into a readable string
const STATUS_MAP = ["Submitted", "AI Verified", "Admin Verified", "Survival Verified", "Disputed", "Rejected"];

export default function Dashboard() {
  const { userRole, userAddress, contracts, loading: web3Loading } = useWeb3();

  const [stats, setStats] = useState({ reputation: 0, credits: 0, staked: 0, projects: 0 });
  // --- NEW STATE VARIABLE FOR PROJECTS ---
  const [recentProjects, setRecentProjects] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

 useEffect(() => {
  const fetchDashboardData = async () => {
    if (!contracts.srContract || !userAddress) return;

    setPageLoading(true);

    try {
      // --- FETCH STATS INDIVIDUALLY ---
      // We'll set default values in case of an error.
      let reputation = 0;
      let credits = 0;
      let staked = 0;
      let projectIds = [];

      try {
        reputation = await contracts.srContract.reputationScore(userAddress);
        credits = await contracts.ccContract.balanceOf(userAddress);
        staked = await contracts.srContract.stakedAmount(userAddress);
      } catch (error) {
        console.error("Failed to fetch core stats (reputation, credits, staked):", error);
      }
      
      try {
        projectIds = await contracts.mrvContract.getPlantationsByUploader(userAddress);
      } catch (error) {
        console.error("Failed to fetch project IDs:", error);
        // If this fails, projectIds remains an empty array, which is fine.
      }
      
      // Update the stats regardless of individual failures
      setStats({
        reputation: Number(reputation),
        credits: Number(ethers.formatUnits(credits, 18)),
        staked: Number(ethers.formatUnits(staked, 18)),
        projects: projectIds.length,
      });


      // --- FETCH PROJECT DETAILS (this part is fine) ---
      if (projectIds.length > 0) {
        const projectPromises = projectIds.map(id => contracts.mrvContract.getPlantation(id));
        const resolvedProjects = await Promise.all(projectPromises);
        const sortedProjects = [...resolvedProjects].sort((a,b) => Number(b.id) - Number(a.id));
        setRecentProjects(sortedProjects.slice(0, 3));
      } else {
        setRecentProjects([]); // Ensure recent projects is empty if there are no IDs
      }

    } catch (error) {
      // This will catch any other unexpected errors
      console.error("An unexpected error occurred in fetchDashboardData:", error);
    } finally {
      setPageLoading(false);
    }
  };

  fetchDashboardData();
}, [contracts, userAddress]); 

  if (web3Loading) return <div>Loading user data...</div>;
  if (userRole !== 'NGO') {
    return (
      <div className={styles.authMessage}>
        <h2>Access Denied</h2>
        <p>Please connect your designated NGO wallet to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>Welcome!</h1>
      <div className={styles.statsGrid}>
        {/* ... StatCards are unchanged ... */}
        <StatCard title="Reputation Score" value={pageLoading ? '...' : stats.reputation} />
        <StatCard title="Carbon Credits" value={pageLoading ? '...' : stats.credits.toLocaleString()} unit="BCC" />
        <StatCard title="Total Staked" value={pageLoading ? '...' : stats.staked.toLocaleString()} unit="Tokens" />
        <StatCard title="Projects Submitted" value={pageLoading ? '...' : stats.projects} />
      </div>

      <div className={styles.quickActions}>
        <Link href="/submit" className={styles.actionButton}>Submit New Project</Link>
        <Link href="/my-Project" className={styles.actionLink}>View All Projects →</Link>
      </div>

      {/* --- THIS SECTION NOW WORKS --- */}
      <div className={styles.recentActivity}>
        <h2 className={styles.sectionTitle}>Recent Project Activity</h2>
        {pageLoading ? (<p>Loading projects...</p>) : recentProjects.length > 0 ? (
          <ul className={styles.activityList}>
            {recentProjects.map(project => {
              const statusString = STATUS_MAP[Number(project.status)];
              return (
              <li key={Number(project.id)} className={styles.activityItem}>
                <div className={styles.activityDetails}>
                  {/* Note: We display the data available from the contract */}
                  <p className={styles.projectName}>Project #{Number(project.id)}</p>
                  <p className={styles.projectLocation}>Species: {project.species}</p>
                </div>
                <span className={`${styles.statusTag} ${styles[statusString.toLowerCase().replace(' ', '')]}`}>
                  {statusString}
                </span>
              </li>
            )})}
          </ul>
        ) : (
          <p>You have no recent project activity.</p>
        )}
      </div>
    </div>
  );
}