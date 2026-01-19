'use client'
import { plantations, users } from '../../../../lib/mockData';
import { ProjectCard } from '../../../../components/ProjectCard';
import styles from './explorer.module.css';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';

export default function ExplorerPage() {
  const { contracts } = useWeb3();
  const [verifiedProjects, setVerifiedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifiedProjects = async () => {
      if (!contracts.mrvContract) return;

      try {
        setLoading(true);
        const totalProjectsCount = Number(await contracts.mrvContract.totalPlantations());
        
        if (totalProjectsCount === 0) {
            setLoading(false);
            return;
        }

        const projectPromises = [];
        for (let i = 0; i < totalProjectsCount; i++) {
          projectPromises.push(contracts.mrvContract.plantations(i));
        }
        const allProjects = await Promise.all(projectPromises);

        // Filter for projects that are in a 'Verified' state
        const verified = allProjects.filter(p => Number(p.status) === 2 || Number(p.status) === 3);
        setVerifiedProjects(verified);

      } catch(error) {
        console.error("Failed to fetch verified projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVerifiedProjects();
  }, [contracts]);


  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Project Explorer</h1>
        <p className={styles.subtitle}>
          Discover verified blue carbon restoration projects from around the world.
        </p>
      </div>

      <div className={styles.summaryBar}>
        <p>Showing <strong>{verifiedProjects.length}</strong> verified projects</p>
      </div>

      <div className={styles.projectsGrid}>
        {loading ? (
          <p>Loading projects from the blockchain...</p>
        ) : verifiedProjects.length > 0 ? (
          verifiedProjects.map(project => (
            <ProjectCard key={Number(project.id)} project={project} />
          ))
        ) : (
          <p>No verified projects found.</p>
        )}
      </div>
    </div>
  );
}