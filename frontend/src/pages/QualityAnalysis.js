import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, TrendingDown, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QualityAnalysis = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [qualityReport, setQualityReport] = useState(null);
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

  const runQualityCheck = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await axios.post(`${API}/quality-check/${selectedDataset}`);
      setQualityReport(response.data);
      toast.success('Quality analysis completed');
    } catch (error) {
      console.error('Error running quality check:', error);
      toast.error('Failed to analyze dataset quality');
    } finally {
      setAnalyzing(false);
    }
  };

  const getMissingPercentage = () => {
    if (!qualityReport?.missing_values?.columns) return 0;
    const columns = Object.values(qualityReport.missing_values.columns);
    const avgPercentage = columns.reduce((sum, col) => sum + col.percentage, 0) / columns.length;
    return avgPercentage.toFixed(2);
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
          Data Quality Analysis
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Analyze missing values, duplicates, outliers, and data statistics
        </p>
      </div>

      {/* Dataset Selection */}
      <Card data-testid="dataset-selector" style={{
        marginBottom: '2rem',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <CardHeader>
          <CardTitle>Select Dataset</CardTitle>
          <CardDescription>Choose a dataset to analyze its quality</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger data-testid="dataset-select">
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.filename} ({dataset.rows.toLocaleString()} rows)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runQualityCheck}
              disabled={!selectedDataset || analyzing}
              data-testid="run-quality-check-btn"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#fff',
                padding: '0.625rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              {analyzing ? 'Analyzing...' : 'Run Quality Check'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Report */}
      {qualityReport && (
        <>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <Card data-testid="missing-values-summary" style={{
              background: getMissingPercentage() > 10 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#fff'
            }}>
              <CardHeader>
                <CardTitle style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getMissingPercentage() > 10 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                  Missing Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{getMissingPercentage()}%</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Average across columns</div>
              </CardContent>
            </Card>

            <Card data-testid="duplicates-summary" style={{
              background: qualityReport.duplicates.duplicate_percentage > 5 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              border: 'none',
              color: '#fff'
            }}>
              <CardHeader>
                <CardTitle style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={24} />
                  Duplicates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  {qualityReport.duplicates.duplicate_count.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  {qualityReport.duplicates.duplicate_percentage}% of total rows
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missing Values Details */}
          <Card data-testid="missing-values-details" style={{
            marginBottom: '2rem',
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <CardHeader>
              <CardTitle>Missing Values by Column</CardTitle>
              <CardDescription>Detailed breakdown of missing data</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Column</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Missing Count</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(qualityReport.missing_values.columns).map(([column, data]) => (
                      <tr key={column} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>{column}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>{data.count}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            background: data.percentage > 10 ? '#fee2e2' : data.percentage > 5 ? '#fef3c7' : '#dcfce7',
                            color: data.percentage > 10 ? '#dc2626' : data.percentage > 5 ? '#d97706' : '#16a34a'
                          }}>
                            {data.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Outliers */}
          {Object.keys(qualityReport.outliers).length > 0 && (
            <Card data-testid="outliers-details" style={{
              marginBottom: '2rem',
              background: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <CardHeader>
                <CardTitle>Outlier Detection</CardTitle>
                <CardDescription>Outliers detected using IQR method</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Column</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Outlier Count</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Percentage</th>
                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>Bounds</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(qualityReport.outliers).map(([column, data]) => (
                        <tr key={column} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', color: '#0f172a', fontWeight: '500' }}>{column}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>{data.count}</td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              background: data.percentage > 5 ? '#fee2e2' : '#fef3c7',
                              color: data.percentage > 5 ? '#dc2626' : '#d97706'
                            }}>
                              {data.percentage}%
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.875rem' }}>
                            [{data.lower_bound.toFixed(2)}, {data.upper_bound.toFixed(2)}]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default QualityAnalysis;