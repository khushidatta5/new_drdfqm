import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Database, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/datasets`);
      setDatasets(response.data);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Dataset "${response.data.filename}" uploaded successfully`);
      fetchDatasets();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload dataset');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          fontFamily: 'Space Grotesk, sans-serif',
          color: '#0f172a',
          marginBottom: '0.5rem'
        }}>
          Data Management Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Upload, analyze, and monitor your datasets for quality and drift
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <Card data-testid="total-datasets-card" style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          border: 'none',
          color: '#fff'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={24} />
              Total Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{datasets.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="total-rows-card" style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <TrendingUp size={24} color="#10b981" />
              Total Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f172a' }}>
              {datasets.reduce((sum, d) => sum + d.rows, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card data-testid="upload-area" style={{
        marginBottom: '2rem',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <CardHeader>
          <CardTitle>Upload Dataset</CardTitle>
          <CardDescription>Upload a CSV file to analyze data quality and drift</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#0ea5e9' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
              background: dragActive ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <Upload size={48} color="#0ea5e9" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
              {uploading ? 'Uploading...' : 'Drop your CSV file here or click to browse'}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Supports CSV files only</p>
            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Datasets List */}
      <div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '1.5rem'
        }}>
          Your Datasets
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
        ) : datasets.length === 0 ? (
          <Card style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent style={{ padding: '3rem', textAlign: 'center' }}>
              <Database size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b', fontSize: '1rem' }}>No datasets uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {datasets.map((dataset) => (
              <Card
                key={dataset.id}
                data-testid={`dataset-card-${dataset.id}`}
                style={{
                  background: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                <CardHeader>
                  <CardTitle style={{ fontSize: '1.125rem', color: '#0f172a', wordBreak: 'break-word' }}>
                    {dataset.filename}
                  </CardTitle>
                  <CardDescription>{formatDate(dataset.upload_date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Rows:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{dataset.rows.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Columns:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{dataset.columns}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Size:</span>
                      <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatBytes(dataset.file_size)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;