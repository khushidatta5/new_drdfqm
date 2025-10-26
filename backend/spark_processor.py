import pandas as pd
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class SparkDataProcessor:
    """Data processor using pandas for CSV processing"""
    
    def __init__(self):
        """Initialize data processor"""
        logger.info("Data processor initialized (using pandas)")
    
    def pandas_to_spark(self, df_pandas: pd.DataFrame) -> pd.DataFrame:
        """Return pandas DataFrame (compatibility method)"""
        return df_pandas
    
    def spark_to_pandas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return pandas DataFrame (compatibility method)"""
        return df
    
    def get_basic_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get basic statistics for a pandas DataFrame"""
        try:
            stats = {}
            
            # Get column types
            stats['column_types'] = {col: str(dtype) for col, dtype in df.dtypes.items()}
            
            # Get numeric columns
            numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
            
            if numeric_cols:
                # Get summary statistics for numeric columns
                summary = df[numeric_cols].describe()
                stats['numeric_summary'] = summary.to_dict()
            
            return stats
        except Exception as e:
            logger.error(f"Error getting basic stats: {str(e)}")
            return {}
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Basic data cleaning operations"""
        try:
            # Remove duplicate rows
            df_clean = df.drop_duplicates()
            
            return df_clean
        except Exception as e:
            logger.error(f"Error cleaning data: {str(e)}")
            return df
    
    def stop(self):
        """Stop processor (compatibility method)"""
        logger.info("Data processor stopped")