  // app/(app)/my-plantations/[id]/page.js
  'use client';

  import { useState, useEffect } from 'react';
  import { useParams } from 'next/navigation';
  import { useWeb3 } from '../../../../../context/Web3Context';
  import styles from './project-details.module.css';
  import Link from 'next/link';

  const STATUS_MAP = ["Submitted", "AI Verified", "Admin Verified", "Survival Verified", "Disputed", "Rejected"];

  export default function ProjectDetailsPage() {
    const { userRole, contracts, loading: web3Loading } = useWeb3();
    const params = useParams(); // Hook to get the [id] from the URL
    const projectId = params.id;

    const [project, setProject] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
      const fetchProjectDetails = async () => {
        if (!contracts.mrvContract || !projectId) return;
        
        try {
          setPageLoading(true);
          const projectData = await contracts.mrvContract.getPlantation(projectId);
          setProject(projectData);
        } catch (error) {
          console.error("Failed to fetch project details:", error);
        } finally {
          setPageLoading(false);
        }
      };
      fetchProjectDetails();
    }, [contracts, projectId]);

    // Protection logic
    if (web3Loading || pageLoading) {
      return <div className={styles.centeredMessage}>Loading project data from the blockchain...</div>;
    }
    if (userRole !== 'NGO') {
      return <div className={styles.centeredMessage}>Access Denied. Please connect an NGO wallet.</div>;
    }
    if (!project) {
      return <div className={styles.centeredMessage}>Project not found.</div>;
    }

    const statusString = STATUS_MAP[Number(project.status)];
    const ipfsGatewayUrl = `https://gateway.pinata.cloud/ipfs/${project.ipfsHash}`;

    return (
      <div className={styles.pageContainer}>
        <Link href="/my-Project" className={styles.backLink}>← Back to My Projects</Link>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Project #{projectId}</h1>
          <span className={`${styles.statusTag} ${styles[statusString.toLowerCase().replace(' ', '')]}`}>
            {statusString}
          </span>
        </div>

        <p className={styles.description}>{project.description}</p>
        
        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <h4>Location</h4>
            <p>{project.latitude}, {project.longitude}</p>
          </div>
          <div className={styles.detailCard}>
            <h4>Species</h4>
            <p>{project.species}</p>
          </div>
          <div className={styles.detailCard}>
            <h4>Restoration Units</h4>
            <p>{Number(project.treeCount).toLocaleString()}</p>
          </div>
          <div className={styles.detailCard}>
            <h4>Submitter</h4>
            <p className={styles.address}>{project.uploader}</p>
          </div>
          <div className={`${styles.detailCard} ${styles.fullWidth}`}>
            <h4>IPFS Proof</h4>
            <a href={ipfsGatewayUrl} target="_blank" rel="noopener noreferrer" className={styles.ipfsLink}>
              {project.ipfsHash}
            </a>
          </div>
        </div>
      </div>
    );
  }