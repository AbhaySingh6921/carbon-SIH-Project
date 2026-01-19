'use client';
import { useState, useEffect } from 'react';
import { useWeb3 } from '../../../../context/Web3Context';
import styles from './ngo-management.module.css';

// Enum mapping for NGOStatus from the smart contract
const NGO_STATUS_MAP = ["Pending", "Whitelisted", "Blacklisted"];

export default function NgoManagementPage() {
    const { userRole, contracts, loading: web3Loading } = useWeb3();
    const [pageLoading, setPageLoading] = useState(true);
    const [allNgos, setAllNgos] = useState([]);

    // State for the "Whitelist New NGO" form
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCountry, setNewCountry] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Function to fetch data from the NGOContract contract
    const fetchNgoData = async () => {
        if (!contracts.ngoContract) return;
        try {
            setPageLoading(true);
            // Fetch total number of NGOs first
const count = await contracts.ngoContract.getNGOCount();
const ngoAddresses = [];

// Loop through the array
for (let i = 0; i < Number(count); i++) {
    const addr = await contracts.ngoContract.ngoList(i);
    ngoAddresses.push(addr);
}

// Fetch each NGO’s details
const ngoDataPromises = ngoAddresses.map(addr => contracts.ngoContract.ngos(addr));
const resolvedNgos = await Promise.all(ngoDataPromises);
setAllNgos(resolvedNgos);

        } catch (error) {
            console.error("Failed to fetch NGO data:", error);
        } finally {
            setPageLoading(false);
        }
    };

    // Fetch data on component mount and when contracts are ready
    useEffect(() => {
        if(contracts.ngoContract) {
            fetchNgoData();
        }
    }, [contracts.ngoContract]);

    // Handler for the form submission
    const handleWhitelist = async (e) => {
        e.preventDefault();
        if (!newName || !newAddress || !newCountry) return alert("All fields are required.");
        
        setIsSubmitting(true);
        try {
            const tx = await contracts.ngoContract.whitelistNGO(newAddress, newName, newCountry);
            await tx.wait();
            alert("NGO successfully whitelisted!");
            // Reset form and refresh data
            setNewName('');
            setNewAddress('');
            setNewCountry('');
            fetchNgoData();
        } catch (error) {
            console.error("Failed to whitelist NGO:", error);
            alert(`Error: ${error.reason || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for changing an NGO's status
    const handleSetStatus = async (ngoAddress, newStatus) => {
        if (!confirm(`Are you sure you want to set this NGO's status to ${NGO_STATUS_MAP[newStatus]}? This is a serious action.`)) return;

        try {
            const tx = await contracts.ngoContract.setNGOStatus(ngoAddress, newStatus);
            await tx.wait();
            alert("NGO status updated successfully!");
            fetchNgoData(); // Refresh list
        } catch (error) {
            console.error("Failed to set NGO status:", error);
            alert(`Error: ${error.reason || error.message}`);
        }
    };
    
    // Protection logic
    if (web3Loading) return <div>Connecting to wallet...</div>;
    if (userRole !== 'ADMIN') return <p>Access Denied. You must be an admin.</p>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>NGO Management</h1>
                <p className={styles.subtitle}>Whitelist new organizations and manage the status of existing ones.</p>
            </div>

            <div className={styles.mainGrid}>
                {/* Whitelist Form Card */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Whitelist a New NGO</h2>
                    <form onSubmit={handleWhitelist} className={styles.form}>
                        <input type="text" placeholder="NGO Name" value={newName} onChange={e => setNewName(e.target.value)} required />
                        <input type="text" placeholder="Country (e.g., India)" value={newCountry} onChange={e => setNewCountry(e.target.value)} required />
                        <input type="text" placeholder="Wallet Address (0x...)" value={newAddress} onChange={e => setNewAddress(e.target.value)} required />
                        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Whitelisting...' : 'Whitelist NGO'}</button>
                    </form>
                </div>

                {/* NGO List Card */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Registered NGOs</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.ngoTable}>
                            <thead>
                                <tr>
                                    <th>Organization</th>
                                    <th>Country</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageLoading ? (
                                    <tr><td colSpan="4">Loading NGO data...</td></tr>
                                ) : (
                                    allNgos.map(ngo => (
                                        <tr key={ngo.walletAddress}>
                                            <td>
                                                <div className={styles.orgInfo}>
                                                    <span className={styles.orgName}>{ngo.name}</span>
                                                    <span className={styles.addressCell}>{ngo.walletAddress}</span>
                                                </div>
                                            </td>
                                            <td>{ngo.country}</td>
                                            <td>
                                                <span className={`${styles.statusTag} ${styles[NGO_STATUS_MAP[Number(ngo.status)].toLowerCase()]}`}>
                                                    {NGO_STATUS_MAP[Number(ngo.status)]}
                                                </span>
                                            </td>
                                            <td className={styles.actions}>
                                                {Number(ngo.status) === 1 && (
                                                    <button onClick={() => handleSetStatus(ngo.walletAddress, 2)} className={styles.blacklistButton}>Blacklist</button>
                                                )}
                                                {Number(ngo.status) === 2 && (
                                                    <button onClick={() => handleSetStatus(ngo.walletAddress, 1)} className={styles.whitelistButton}>Re-Whitelist</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

