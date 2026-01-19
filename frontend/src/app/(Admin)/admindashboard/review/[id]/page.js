// app/(admin)/review/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWeb3 } from '../../../../../../context/Web3Context';
import styles from './review.module.css';



export default function ReviewPage() {
  const { userRole, contracts, loading: web3Loading } = useWeb3();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusLabel = (status) => {
    const num = Number(status);
    switch (num) {
      case 0: return 'Submitted ⏳';
      case 1: return 'AI Verified 🤖';
      case 2: return 'Admin Verified ✅';
      case 3: return 'Survival Verified 🌱';
      case 4: return 'Disputed ⚠️';
      case 5: return 'Rejected ❌';
      default: return 'Unknown';
    }
  };

  const fetchProjectDetails = async () => {
    if (!contracts.mrvContract || !projectId) return;
    try {
      setPageLoading(true);
      const projectData = await contracts.mrvContract.getPlantation(projectId);
      
      // Convert BigNumbers to numbers where needed
      const formattedProject = {
        ...projectData,
        id: Number(projectData.id),
        treeCount: Number(projectData.treeCount),
        status: Number(projectData.status),
      };

      setProject(formattedProject);
    } catch (error) {
      console.error('Failed to fetch project details:', error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [contracts, projectId]);

  const handleDecision = async (isApproved) => {
    if (!contracts.vContract) {
      alert('Verification contract not loaded.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = await contracts.vContract.submitAdminVerification(projectId, isApproved);
      await tx.wait();

      // 🔑 Refetch from blockchain after transaction
      await fetchProjectDetails();

      alert(`Project has been successfully ${isApproved ? 'approved' : 'rejected'}!`);
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (web3Loading || pageLoading) {
    return <div className={styles.centeredMessage}>Loading project data from the blockchain...</div>;
  }

  if (userRole !== 'ADMIN') {
    return <div className={styles.centeredMessage}>Access Denied.</div>;
  }

  if (!project) {
    return <div className={styles.centeredMessage}>Project not found.</div>;
  }

  const isActionPending = project.status === 0; // Only Submitted projects can take action

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Review Project #{projectId}</h1>
      <div className={styles.contentGrid}>
        {/* Details */}
        <div className={styles.detailsCard}>
          <h2 className={styles.sectionTitle}>Project Details</h2>
          <div className={styles.detailItem}>
            <span>Submitter Address</span>
            <p className={styles.address}>{project.uploader}</p>
          </div>
          <div className={styles.detailItem}>
            <span>Species</span>
            <p>{project.species}</p>
          </div>
          <div className={styles.detailItem}>
            <span>Restoration Units</span>
            <p>{project.treeCount.toLocaleString()}</p>
          </div>
          <div className={styles.detailItem}>
            <span>IPFS Hash</span>
            <p className={styles.address}>{project.ipfsHash}</p>
          </div>
          <div className={styles.detailItem}>
            <span>Status</span>
            <p>{getStatusLabel(project.status)}</p>
          </div>
        </div>

        {/* Actions */}
        {isActionPending ? (
          <div className={styles.actionsCard}>
            <h2 className={styles.sectionTitle}>Verification Actions</h2>
            <p>Review the details and approve or reject this submission.</p>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.button} ${styles.rejectButton}`}
                onClick={() => handleDecision(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Reject'}
              </button>
              <button
                className={`${styles.button} ${styles.approveButton}`}
                onClick={() => handleDecision(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Approve'}
              </button>
            </div>
            {isSubmitting && <p className={styles.pendingText}>Waiting for transaction confirmation...</p>}
          </div>
        ) : (
          <div className={styles.completedCard}>
            <p className={styles.completedText}>
              Action Completed: {getStatusLabel(project.status)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
