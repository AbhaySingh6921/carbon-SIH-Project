// FILE: components/OwnerPanel.js
'use client';

import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import styles from '../styles/OwnerPanel.module.css';

export default function OwnerPanel() {  // <--- default export
    const { contracts, contractOwner, userAddress } = useWeb3();
    const [newAdmin, setNewAdmin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (userAddress !== contractOwner) return null;

    const handleSetAdmin = async () => {
        if (!newAdmin || !contracts.vContract) return;
        console.log("User address:", userAddress);
console.log("Contract owner:", contractOwner);

        setIsSubmitting(true);
        try {
            const tx = await contracts.vContract.setAdminAddress(newAdmin);
            await tx.wait();
            alert(`Successfully set new admin to: ${newAdmin}`);
            setNewAdmin('');
        } catch (error) {
            console.error("Failed to set admin:", error);
            alert("Failed to set new admin. See console for details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles['owner-panel']}>
            <h3>Owner Controls</h3>
            <p>Set a new Admin address for the Verification contract.</p>
            <input 
                type="text" 
                placeholder="0x..." 
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
            />
            <button onClick={handleSetAdmin} disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Assign New Admin"}
            </button>
        </div>
    );
}
export { OwnerPanel }; // <--- named export
