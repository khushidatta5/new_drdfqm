import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GitCompare, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriftDetection = () => {
  const [datasets, setDatasets] = useState([]);
  const [referenceDataset, setReferenceDataset] = useState('');
  const [targetDataset, setTargetDataset] = useState('');
  const [driftReport, setDriftReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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

  const runDriftCheck = async () => {
    if (!referenceDataset || !targetDataset) {
      toast.error('Please select both reference and target datasets');
      return;
    }

    if (referenceDataset === targetDataset) {
      toast.error('Please select different datasets');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await axios.post(`${API}/drift-check?reference_id=${referenceDataset}&target_id=${targetDataset}`);
      setDriftReport(response.data);
      toast.success('Drift analysis completed');
    } catch (error) {
      console.error('Error running drift check:', error);
      toast.error('Failed to analyze data drift');
    } finally {
      setAnalyzing(false);
    }
  };

  const getDatasetName = (id) => {
    const dataset = datasets.find(d => d.id === id);
    return dataset ? dataset.filename : 'Unknown';
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
          Data Drift Detection
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Compare datasets to detect distribution changes and drift
        </p>
      </div>

      {/* Dataset Selection */}
      <Card data-testid="drift-dataset-selector" style={{
        marginBottom: '2rem',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <CardHeader>
          <CardTitle>Select Datasets to Compare</CardTitle>
          <CardDescription>Choose a reference (baseline) dataset and a target (current) dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>
                Reference Dataset (Baseline)
              </label>
              <Select value={referenceDataset} onValueChange={setReferenceDataset}>
                <SelectTrigger data-testid="reference-dataset-select">
                  <SelectValue placeholder="Select reference dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>
                Target Dataset (Current)
              </label>
              <Select value={targetDataset} onValueChange={setTargetDataset}>
                <SelectTrigger data-testid="target-dataset-select">
                  <SelectValue placeholder="Select target dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={runDriftCheck}
            disabled={!referenceDataset || !targetDataset || analyzing}
            data-testid="run-drift-check-btn"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              padding: '0.625rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              width: '100%'
            }}
          >
            {analyzing ? 'Analyzing Drift...' : 'Run Drift Detection'}
          </Button>
        </CardContent>
      </Card>

      {/* Drift Report */}
      {driftReport && (
        <>
          {/* Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <Card data-testid="drift-status-card" style={{
              background: driftReport.drift_detected
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#fff'
            }}>
              <CardHeader>
                <CardTitle style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {driftReport.drift_detected ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                  Drift Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {driftReport.drift_detected ? 'DRIFT DETECTED' : 'NO DRIFT'}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="drift-score-card" style={{
              background: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <TrendingUp size={24} color="#8b5cf6" />
                  Overall Drift Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f172a' }}>
                  {(driftReport.overall_drift_score * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card data-testid="columns-drifted-card" style={{
              background: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <GitCompare size={24} color="#0ea5e9" />
                  Columns with Drift
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f172a' }}>
                  {driftReport.test_results.columns_with_drift}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  out of {driftReport.test_results.total_columns_tested} columns
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column-wise Drift Details */}
          <Card data-testid="column-drift-details" style={{
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <CardHeader>
              <CardTitle>Column-wise Drift Analysis</CardTitle>
              <CardDescription>
                Comparing {getDatasetName(referenceDataset)} (reference) vs {getDatasetName(targetDataset)} (target)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Column</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>Test Type</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Drift Score</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>P-Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(driftReport.column_drift).map(([column, data]) => (
                      <tr key={column} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>{data.column_name}</td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                          {data.test_type}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {data.has_drift ? (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              background: '#fee2e2',
                              color: '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <AlertTriangle size={14} /> Drift
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              background: '#dcfce7',
                              color: '#16a34a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <CheckCircle2 size={14} /> Stable
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                          {data.drift_score.toFixed(4)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                          {data.p_value ? data.p_value.toFixed(4) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DriftDetection;