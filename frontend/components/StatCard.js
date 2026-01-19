// components/StatCard.js
import styles from '../styles/StatCard.module.css';

export const StatCard = ({ title, value, unit = '' }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.value}>
        {value}
        {unit && <span className={styles.unit}> {unit}</span>}
      </p>
    </div>
  );
};