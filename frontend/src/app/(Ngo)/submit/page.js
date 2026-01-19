'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWeb3 } from '../../../../context/Web3Context';
import styles from './submit.module.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function SubmitPage() {
  const { userRole, submitNewProject, loading: web3Loading } = useWeb3();
  const router = useRouter();

  const [formData, setFormData] = useState({
    description: '', latitude: '', longitude: '', treeCount: '', species: '',
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    multiple: false
  });

  // Handle form input changes
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  // Submit project
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload a proof file.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      await submitNewProject(formData, file, setStatusMessage);
      toast.success('Project submitted successfully!');
      router.push('/my-Project');
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(`Submission failed: ${error.message || error}`);
      setStatusMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== 'NGO') return <p>Access Denied.</p>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Submit a New Project</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="description">Project Description</label>
          <textarea id="description" rows="5" value={formData.description} onChange={handleInputChange} required />
        </div>

        <div className={styles.gridGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="latitude">Latitude</label>
            <input id="latitude" type="number" step="any" placeholder="e.g., 22.5726" value={formData.latitude} onChange={handleInputChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="longitude">Longitude</label>
            <input id="longitude" type="number" step="any" placeholder="e.g., 88.3639" value={formData.longitude} onChange={handleInputChange} required />
          </div>
        </div>

        <div className={styles.gridGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="treeCount">Number of Trees / Units</label>
            <input id="treeCount" type="number" value={formData.treeCount} onChange={handleInputChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="species">Species Info</label>
            <input id="species" type="text" value={formData.species} onChange={handleInputChange} required />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Upload Proof (Image/Video)</label>
          <div {...getRootProps({ className: styles.dropzone, ...(isDragActive ? { "data-active": true } : {}) })}>
            <input {...getInputProps()} />
            {file ? <p>{file.name}</p> : <p>Drag & drop a file here, or click to select</p>}
          </div>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isSubmitting || web3Loading}>
          {isSubmitting ? 'Submitting...' : 'Submit Project to Registry'}
        </button>

        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </form>
    </div>
  );
}
