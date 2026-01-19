'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './homepage.module.css';
import { useWeb3 } from '../../../context/Web3Context';

// --- React-Leaflet Imports ---

import { useMap } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });


// This is a known workaround for a bug in Next.js with react-leaflet's default icon
let defaultIcon;
if (typeof window !== 'undefined') {
    const L = require('leaflet');
    defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
    });
}

/**
 * --- Map Controller Component ---
 * This component uses the `useMap` hook to control the map's view.
 */
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, map]);
    return null;
}

export default function HomePage() {
    const { contracts } = useWeb3();
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({ totalProjects: 0, totalUnits: 0, totalNgos: 0 });
    const [isLoading, setIsLoading] = useState(true);
    
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapZoom, setMapZoom] = useState(4);

    useEffect(() => {
        const fetchAllProjectsAndStats = async () => {
            if (!contracts.mrvContract) return;
            setIsLoading(true);
            try {
                const totalProjectsCount = await contracts.mrvContract.totalPlantations();
                const projectPromises = [];
                for (let i = 0; i < Number(totalProjectsCount); i++) {
                    projectPromises.push(contracts.mrvContract.getPlantation(i));
                }
                const allProjects = await Promise.all(projectPromises);
                
                const projectsWithCoords = allProjects.filter(p => p.latitude && p.longitude);
                setProjects(projectsWithCoords);
                console.log("Fetched Projects:", projectsWithCoords);

                const totalUnits = allProjects.reduce((sum, p) => sum + Number(p.treeCount), 0);
                const uniqueNgos = new Set(allProjects.map(p => p.uploader)).size;

                setStats({
                    totalProjects: allProjects.length,
                    totalUnits: totalUnits,
                    totalNgos: uniqueNgos,
                });

            } catch (error) {
                console.error("Failed to fetch projects and stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllProjectsAndStats();
    }, [contracts.mrvContract]);

    const handleProjectClick = (project) => {
        setMapCenter([parseFloat(project.latitude), parseFloat(project.longitude)]);
        setMapZoom(13); // Zoom in closer when a project is selected
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Global Blue Carbon Registry</h1>
                <p className={styles.subtitle}>
                    Tracking on-chain environmental projects with real-world impact.
                </p>
            </header>

            <main className={styles.mainContent}>
                {/* --- LEFT COLUMN: MAP --- */}
                <div className={styles.mapColumn}>
                    {isLoading ? (
                        <div className={styles.loadingOverlay}>Loading Map...</div>
                    ) : (
                        <div className={styles.mapWrapper}>
                            <MapContainer 
                                center={mapCenter}
                                zoom={mapZoom} 
                                className={styles.map}
                            >
                                <ChangeView center={mapCenter} zoom={mapZoom} />
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {projects.map(project => (
                                    <Marker 
                                        key={Number(project.id)}
                                        position={[parseFloat(project.latitude), parseFloat(project.longitude)]}
                                        icon={defaultIcon}
                                    >
                                        <Popup>
                                            <div className={styles.popupContent}>
                                                <h3>Project #{Number(project.id)}</h3>
                                                <p><strong>Species:</strong> {project.species}</p>
                                                <p><strong>Units:</strong> {Number(project.treeCount).toLocaleString()}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    )}
                </div>

                {/* --- RIGHT COLUMN: SIDEBAR WITH STATS AND PROJECT LIST --- */}
                <div className={styles.sidebarColumn}>
                    <div className={styles.statsPanel}>
                         <h2 className={styles.sectionTitle}>Platform Statistics</h2>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{isLoading ? '...' : stats.totalProjects.toLocaleString()}</span>
                            <span className={styles.statLabel}>Total Projects Submitted</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{isLoading ? '...' : stats.totalUnits.toLocaleString()}</span>
                            <span className={styles.statLabel}>Total Restoration Units</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{isLoading ? '...' : stats.totalNgos.toLocaleString()}</span>
                            <span className={styles.statLabel}>Participating Organizations</span>
                        </div>
                    </div>
                    
                    <div className={styles.projectListPanel}>
                        <h2 className={styles.sectionTitle}>Project Directory</h2>
                        <div className={styles.projectList}>
                            {isLoading ? <p>Loading projects...</p> : projects.map(project => (
                                <div 
                                    key={Number(project.id)} 
                                    className={styles.projectItem}
                                    onClick={() => handleProjectClick(project)}
                                >
                                    <span className={styles.projectId}>Project #{Number(project.id)}</span>
                                    <span className={styles.projectSpecies}>{project.species}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

