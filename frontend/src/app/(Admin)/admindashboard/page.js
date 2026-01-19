'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';
import { StatCard } from '../../../../components/StatCard';
import styles from './admindashboard.module.css';

const STATUS_MAP = [
  "Submitted",
  "AI Verified",
  "Admin Verified",
  "Survival Verified",
  "Disputed",
  "Rejected"
];

export default function AdminDashboard() {
  const { userRole, contracts, loading } = useWeb3();

  const [stats, setStats] = useState({ pending: 0, total: 0, verified: 0, ngos: 0 });
  const [allProjects, setAllProjects] = useState([]);
  const [weatherScores, setWeatherScores] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingScore, setLoadingScore] = useState({});

  // ✅ 1. Listen for Chainlink ScoreReceived event
  useEffect(() => {
    if (!contracts?.woContract) return;

    const handleScoreReceived = async (requestId, score, projectId) => {
      const pid = Number(projectId);
      try {
        const latestScore = await contracts.woContract.getProjectScore(pid);
        setWeatherScores(prev => ({ ...prev, [pid]: Number(latestScore) }));
        setLoadingScore(prev => ({ ...prev, [pid]: false }));

        // ✅ Show in console when score is actually received
        console.log(`✅ Weather score received for Project #${pid}: ${Number(latestScore)} / 100`);
      } catch (error) {
        console.error(`⚠️ Failed to fetch score for project ${pid}:`, error);
        setLoadingScore(prev => ({ ...prev, [pid]: false }));
      }
    };

    contracts.woContract.on("ScoreReceived", handleScoreReceived);
    return () => {
      contracts.woContract.off("ScoreReceived", handleScoreReceived);
    };
  }, [contracts?.woContract]);

  // ✅ 2. Fetch projects + scores (runs on load or contract change)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!contracts?.mrvContract || !contracts?.woContract) return;
      setIsLoading(true);

      try {
        const totalProjectsCount = Number(await contracts.mrvContract.totalPlantations());
        const projectPromises = [];

        for (let i = 0; i < totalProjectsCount; i++) {
          projectPromises.push(contracts.mrvContract.plantations(i));
        }

        const fetchedProjects = await Promise.all(projectPromises);
        const sortedProjects = fetchedProjects.sort((a, b) => Number(b.id) - Number(a.id));
        setAllProjects(sortedProjects);

        const pending = sortedProjects.filter(p => Number(p.status) === 0 || Number(p.status) === 1);
        const verified = sortedProjects.filter(p => Number(p.status) === 2 || Number(p.status) === 3);
        const uniqueNgoCount = new Set(sortedProjects.map(p => p.uploader)).size;

        setStats({
          pending: pending.length,
          total: sortedProjects.length,
          verified: verified.length,
          ngos: uniqueNgoCount,
        });

        const scorePromises = sortedProjects.map(async (p) => {
          try {
            const score = await contracts.woContract.getProjectScore(Number(p.id));
            return [Number(p.id), Number(score)];
          } catch {
            return [Number(p.id), null];
          }
        });

        const resolvedScores = await Promise.all(scorePromises);
        const scoreMap = Object.fromEntries(resolvedScores);
        setWeatherScores(scoreMap);
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [contracts?.mrvContract, contracts?.woContract]);

  // ✅ 3. Request weather score from Chainlink Functions
  const handleGetWeatherScore = async (projectId) => {
    if (!contracts?.woContract || !contracts?.mrvContract) return;
    // if (!consumers.includes(contracts.woContract.address)) {
    //      alert("Contract not added as consumer yet. Please authorize in Chainlink subscription.");
    //      return;
    // }

    setLoadingScore(prev => ({ ...prev, [projectId]: true }));

    try {
      const plantation = await contracts.mrvContract.plantations(projectId);
      const lat = plantation.latitude;
      const lon = plantation.longitude;

      await contracts.woContract.sendRequest(projectId, [lat, lon]);
      console.log(`📡 Request sent for Project #${projectId}. Waiting for Chainlink oracle response...`);
    } catch (error) {
      console.error(`❌ Error requesting weather score for project ${projectId}:`, error);
      setLoadingScore(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Loading UI
  if (loading) {
    return <div className={styles.centeredMessage}>Loading user and blockchain data...</div>;
  }

  // Access control
  if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'NGO') {
    return (
      <div className={styles.authMessage}>
        <h2>Access Denied</h2>
        <p>You must be connected with an Admin or Owner wallet to view this page.</p>
      </div>
    );
  }

  // ✅ 4. Render UI
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Verification Dashboard</h1>
        <p className={styles.subtitle}>Review and verify blue carbon restoration projects submitted by NGOs.</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Pending Reviews" value={isLoading ? '...' : stats.pending} />
        <StatCard title="Total Projects" value={isLoading ? '...' : stats.total} />
        <StatCard title="Verified Projects" value={isLoading ? '...' : stats.verified} />
        <StatCard title="Active NGOs" value={isLoading ? '...' : stats.ngos} />
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Project Overview</h2>

          {isLoading ? (
            <p>Loading projects...</p>
          ) : (
            <table className={styles.queueTable}>
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Submitter Address</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Weather Score 🌦️</th>
                  <th>Review</th>
                </tr>
              </thead>

              <tbody>
                {allProjects.map((project) => {
                  const projectId = Number(project.id);
                  const statusString = STATUS_MAP[Number(project.status)];
                  const scoreValue = weatherScores[projectId];

                  return (
                    <tr key={projectId}>
                      <td>{projectId}</td>
                      <td className={styles.addressCell}>{project.uploader}</td>
                      <td>{Number(project.treeCount).toLocaleString()}</td>
                      <td>
                        <span
                          className={`${styles.statusTag} ${styles[statusString?.toLowerCase().replace(' ', '')]}`}
                        >
                          {statusString || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.scoreButton}
                          onClick={() => handleGetWeatherScore(projectId)}
                          disabled={loadingScore[projectId]}
                        >
                          {loadingScore[projectId] ? "Fetching..." : "Get Score"}
                        </button>
                        {scoreValue !== undefined && (
                          <div className={styles.smallScore}>
                            {typeof scoreValue === "number" && scoreValue > 0
                              ? `${scoreValue} / 100`
                              : "—"}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admindashboard/review/${projectId}`}
                          className={styles.reviewButton}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
