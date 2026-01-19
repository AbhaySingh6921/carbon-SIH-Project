// app/(app)/my-plantations/page.js
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';
// import { plantations } from '../../../../lib/mockData';
// import { StatCard } from '../../../../components/StatCard'; // We can reuse this!
import styles from './myProject.module.css';

const STATUS_MAP = ["Submitted", "AI Verified", "Admin Verified", "Survival Verified", "Disputed", "Rejected"];

export default function MyPlantationsPage() {
  const { userRole, userAddress, contracts, loading: web3Loading } = useWeb3();
  const [projects, setProjects] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!contracts.mrvContract || !userAddress) return;

      try {
        setPageLoading(true);
        // 1. Get the array of project IDs for the user
        const projectIds = await contracts.mrvContract.getPlantationsByUploader(userAddress);
        if (projectIds.length === 0) {
          setProjects([]);
          return;
        }

        // 2. Fetch the details for each project ID
        const projectPromises = projectIds.map(id => contracts.mrvContract.getPlantation(id));
        const resolvedProjects = await Promise.all(projectPromises);
        
        setProjects(resolvedProjects);
      } catch (error) {
        console.error("Failed to fetch user projects:", error);
      } finally {
        setPageLoading(false);
      }
    };
    fetchUserProjects();
  }, [contracts, userAddress]);

  if (web3Loading) return <div>Loading...</div>;
  if (userRole !== 'NGO') return <p>Access Denied.</p>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Projects</h1>
          <p className={styles.subtitle}>Track all your blue carbon restoration projects on the registry.</p>
        </div>
        <Link href="/submit" className={styles.submitButton}>Submit New Project</Link>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.projectTable}>
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Species</th>
              <th>Units</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageLoading ? (
              <tr><td colSpan="5">Loading your projects from the blockchain...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan="5">You have not submitted any projects yet.</td></tr>
            ) : (
              projects.map(project => (
                <tr key={Number(project.id)}>
                  <td>#{Number(project.id)}</td>
                  <td>{project.species}</td>
                  <td>{Number(project.treeCount).toLocaleString()}</td>
                  <td>
                    <span className={`${styles.statusTag} ${styles[STATUS_MAP[Number(project.status)].toLowerCase()]}`}>
                      {STATUS_MAP[Number(project.status)]}
                    </span>
                  </td>
                  <td>
                    <Link href={`/my-Project/${project.id}`} className={styles.detailsLink}>View Details</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
