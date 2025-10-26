import pandas as pd
import numpy as np
from typing import Dict, Any
import logging
from scipy import stats

logger = logging.getLogger(__name__)

class DriftDetector:
    def __init__(self, threshold: float = 0.05):
        """Initialize drift detector with significance threshold"""
        self.threshold = threshold
    
    def detect_drift(self, reference_df: pd.DataFrame, target_df: pd.DataFrame) -> Dict[str, Any]:
        """Detect drift between reference and target datasets"""
        try:
            column_drift = {}
            drift_scores = []
            
            # Get common columns
            common_cols = list(set(reference_df.columns) & set(target_df.columns))
            
            for column in common_cols:
                # Determine column type
                is_numeric = pd.api.types.is_numeric_dtype(reference_df[column])
                
                if is_numeric:
                    # Numerical column - use KS test
                    drift_result = self._ks_test(reference_df, target_df, column)
                else:
                    # Categorical column - use Chi-square test
                    drift_result = self._chi_square_test(reference_df, target_df, column)
                
                column_drift[column] = drift_result
                drift_scores.append(drift_result['drift_score'])
            
            # Calculate overall drift score (average of column drift scores)
            overall_drift_score = np.mean(drift_scores) if drift_scores else 0.0
            drift_detected = overall_drift_score > self.threshold
            
            return {
                'drift_detected': drift_detected,
                'overall_drift_score': float(overall_drift_score),
                'column_drift': column_drift,
                'test_results': {
                    'total_columns_tested': len(common_cols),
                    'columns_with_drift': sum(1 for d in column_drift.values() if d['has_drift']),
                    'threshold': self.threshold
                }
            }
        except Exception as e:
            logger.error(f"Error detecting drift: {str(e)}")
            return {
                'drift_detected': False,
                'overall_drift_score': 0.0,
                'column_drift': {},
                'test_results': {'error': str(e)}
            }
    
    def _ks_test(self, ref_df: pd.DataFrame, target_df: pd.DataFrame, column: str) -> Dict[str, Any]:
        """Kolmogorov-Smirnov test for numerical columns"""
        try:
            # Get data
            ref_data = ref_df[column].dropna()
            target_data = target_df[column].dropna()
            
            # Perform KS test
            ks_statistic, p_value = stats.ks_2samp(ref_data, target_data)
            
            has_drift = p_value < self.threshold
            
            # Calculate PSI (Population Stability Index)
            psi_score = self._calculate_psi(ref_data, target_data)
            
            return {
                'column_name': column,
                'test_type': 'KS Test',
                'has_drift': bool(has_drift),
                'drift_score': float(ks_statistic),
                'p_value': float(p_value),
                'psi_score': float(psi_score),
                'reference_mean': float(ref_data.mean()),
                'target_mean': float(target_data.mean()),
                'reference_std': float(ref_data.std()),
                'target_std': float(target_data.std())
            }
        except Exception as e:
            logger.error(f"Error in KS test for column {column}: {str(e)}")
            return {
                'column_name': column,
                'test_type': 'KS Test',
                'has_drift': False,
                'drift_score': 0.0,
                'error': str(e)
            }
    
    def _chi_square_test(self, ref_df: pd.DataFrame, target_df: pd.DataFrame, column: str) -> Dict[str, Any]:
        """Chi-square test for categorical columns"""
        try:
            # Get value counts
            ref_counts = ref_df[column].value_counts().reset_index()
            ref_counts.columns = [column, 'count_ref']
            
            target_counts = target_df[column].value_counts().reset_index()
            target_counts.columns = [column, 'count_target']
            
            # Merge on column values
            merged = pd.merge(ref_counts, target_counts, on=column, how='outer').fillna(0)
            
            # Perform Chi-square test
            chi2_statistic, p_value = stats.chisquare(merged['count_target'], merged['count_ref'])
            
            has_drift = p_value < self.threshold
            
            return {
                'column_name': column,
                'test_type': 'Chi-Square Test',
                'has_drift': bool(has_drift),
                'drift_score': float(chi2_statistic),
                'p_value': float(p_value),
                'reference_unique_values': int(len(ref_counts)),
                'target_unique_values': int(len(target_counts))
            }
        except Exception as e:
            logger.error(f"Error in Chi-square test for column {column}: {str(e)}")
            return {
                'column_name': column,
                'test_type': 'Chi-Square Test',
                'has_drift': False,
                'drift_score': 0.0,
                'error': str(e)
            }
    
    def _calculate_psi(self, ref_data: pd.Series, target_data: pd.Series, bins: int = 10) -> float:
        """Calculate Population Stability Index (PSI)"""
        try:
            # Create bins based on reference data
            breakpoints = np.linspace(ref_data.min(), ref_data.max(), bins + 1)
            breakpoints[0] = -np.inf
            breakpoints[-1] = np.inf
            
            # Calculate distribution for reference and target
            ref_dist = np.histogram(ref_data, bins=breakpoints)[0] / len(ref_data)
            target_dist = np.histogram(target_data, bins=breakpoints)[0] / len(target_data)
            
            # Add small constant to avoid division by zero
            ref_dist = ref_dist + 0.0001
            target_dist = target_dist + 0.0001
            
            # Calculate PSI
            psi = np.sum((target_dist - ref_dist) * np.log(target_dist / ref_dist))
            
            return psi
        except Exception as e:
            logger.error(f"Error calculating PSI: {str(e)}")
            return 0.0