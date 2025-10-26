import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [driftReports, setDriftReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/drift-reports`);
      setDriftReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
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
          Reports History
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          View historical quality and drift analysis reports
        </p>
      </div>

      <Tabs defaultValue="drift" style={{ width: '100%' }}>
        <TabsList data-testid="reports-tabs">
          <TabsTrigger value="drift" data-testid="drift-reports-tab">Drift Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="drift" data-testid="drift-reports-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading...</div>
          ) : driftReports.length === 0 ? (
            <Card style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent style={{ padding: '3rem', textAlign: 'center' }}>
                <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748b', fontSize: '1rem' }}>No drift reports available</p>
              </CardContent>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {driftReports.map((report) => (
                <Card
                  key={report.id}
                  data-testid={`drift-report-${report.id}`}
                  style={{
                    background: '#fff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: report.drift_detected ? '2px solid #fecaca' : '2px solid #d1fae5'
                  }}
                >
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {report.drift_detected ? (
                            <AlertTriangle size={24} color="#dc2626" />
                          ) : (
                            <CheckCircle2 size={24} color="#16a34a" />
                          )}
                          {report.drift_detected ? 'Drift Detected' : 'No Drift Detected'}
                        </CardTitle>
                        <CardDescription style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <Calendar size={16} />
                          {formatDate(report.report_date)}
                        </CardDescription>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: report.drift_detected ? '#fee2e2' : '#dcfce7',
                        color: report.drift_detected ? '#dc2626' : '#16a34a',
                        fontWeight: '700',
                        fontSize: '1.25rem'
                      }}>
                        {(report.overall_drift_score * 100).toFixed(2)}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Columns Tested
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                          {report.test_results.total_columns_tested}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                          Columns with Drift
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>
                          {report.test_results.columns_with_drift}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;