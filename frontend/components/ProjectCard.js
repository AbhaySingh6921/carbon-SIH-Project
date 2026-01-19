// components/ProjectCard.js
import Link from 'next/link';
import styles from '../styles/ProjectCard.module.css';

const STATUS_MAP = [
  "Submitted",
  "AI Verified",
  "Admin Verified",
  "Survival Verified",
  "Disputed",
  "Rejected"
];

export const ProjectCard = ({ project }) => {
  const statusString = STATUS_MAP[Number(project.status)];

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        🌿 Plantation #{Number(project.id)}
      </h3>

      <p className={styles.description}>
        {project.description || `This project restores ${project.species}.`}
      </p>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span>🌱 Species</span>
          <strong>{project.species}</strong>
        </div>

        <div className={styles.metaItem}>
          <span>🌳 Tree Count</span>
          <strong>{Number(project.treeCount).toLocaleString()}</strong>
        </div>

        <div className={styles.metaItem}>
          <span>📍 Coordinates</span>
          <strong>
            {project.latitude}, {project.longitude}
          </strong>
        </div>

        <div className={styles.metaItem}>
          <span>🧑‍💼 Uploader</span>
          <strong className={styles.address}>
            {project.uploader}
          </strong>
        </div>

        <div className={styles.metaItem}>
          <span>📦 IPFS Proof</span>
          <Link 
            href={`https://ipfs.io/ipfs/${project.ipfsHash}`} 
            target="_blank" 
            className={styles.address}
          >
            {project.ipfsHash?.slice(0, 15)}...
          </Link>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span
          className={`${styles.statusTag} ${
            styles[statusString.toLowerCase().replace(' ', '')]
          }`}
        >
          {statusString}
        </span>
        <Link
          href={`https://sepolia.etherscan.io/address/${project.uploader}`}
          target="_blank"
          className={styles.detailsLink}
        >
          View on Etherscan
        </Link>
      </div>
    </div>
  );
};