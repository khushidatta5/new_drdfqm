import pandas as pd
import numpy as np
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class DataQualityChecker:
    def __init__(self):
        pass
    
    def check_missing_values(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Check for missing values in each column"""
        try:
            total_rows = len(df)
            missing_info = {}
            
            for column in df.columns:
                missing_count = df[column].isna().sum()
                missing_percentage = (missing_count / total_rows) * 100 if total_rows > 0 else 0
                
                missing_info[column] = {
                    'count': int(missing_count),
                    'percentage': round(missing_percentage, 2)
                }
            
            return {
                'total_rows': int(total_rows),
                'columns': missing_info
            }
        except Exception as e:
            logger.error(f"Error checking missing values: {str(e)}")
            return {}
    
    def check_duplicates(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Check for duplicate rows"""
        try:
            total_rows = len(df)
            unique_rows = len(df.drop_duplicates())
            duplicate_count = total_rows - unique_rows
            
            return {
                'total_rows': int(total_rows),
                'unique_rows': int(unique_rows),
                'duplicate_count': int(duplicate_count),
                'duplicate_percentage': round((duplicate_count / total_rows) * 100, 2) if total_rows > 0 else 0
            }
        except Exception as e:
            logger.error(f"Error checking duplicates: {str(e)}")
            return {}
    
    def detect_outliers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect outliers using IQR method for numeric columns"""
        try:
            outliers_info = {}
            
            # Get numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            for column in numeric_cols:
                col_data = df[column].dropna()
                
                if len(col_data) > 0:
                    Q1 = col_data.quantile(0.25)
                    Q3 = col_data.quantile(0.75)
                    IQR = Q3 - Q1
                    
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    
                    outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
                    outlier_count = len(outliers)
                    
                    outliers_info[column] = {
                        'count': int(outlier_count),
                        'percentage': round((outlier_count / len(col_data)) * 100, 2),
                        'lower_bound': float(lower_bound),
                        'upper_bound': float(upper_bound)
                    }
            
            return outliers_info
        except Exception as e:
            logger.error(f"Error detecting outliers: {str(e)}")
            return {}
    
    def check_data_types(self, df: pd.DataFrame) -> Dict[str, str]:
        """Get data types for all columns"""
        try:
            return {col: str(dtype) for col, dtype in df.dtypes.items()}
        except Exception as e:
            logger.error(f"Error checking data types: {str(e)}")
            return {}
    
    def get_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get comprehensive statistics for the dataset"""
        try:
            stats = {}
            
            # Get numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if numeric_cols:
                # Get summary statistics
                summary = df[numeric_cols].describe()
                stats['numeric_summary'] = summary.to_dict('records')
            
            # Get categorical columns
            categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
            
            stats['categorical_columns'] = categorical_cols
            stats['numeric_columns'] = numeric_cols
            
            # Get value counts for categorical columns (limited to first 5 columns)
            stats['categorical_summary'] = {}
            for col_name in categorical_cols[:5]:
                value_counts = df[col_name].value_counts().head(10).reset_index()
                value_counts.columns = [col_name, 'count']
                stats['categorical_summary'][col_name] = value_counts.to_dict('records')
            
            return stats
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {}