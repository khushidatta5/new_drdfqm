from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import io
from spark_processor import SparkDataProcessor
from quality_checker import DataQualityChecker
from drift_detector import DriftDetector

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize processors
spark_processor = SparkDataProcessor()
quality_checker = DataQualityChecker()
drift_detector = DriftDetector()

# Define Models
class Dataset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rows: int
    columns: int
    column_names: List[str]
    file_size: int
    data_summary: Optional[Dict[str, Any]] = None

class QualityReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dataset_id: str
    report_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    missing_values: Dict[str, Any]
    duplicates: Dict[str, Any]
    outliers: Dict[str, Any]
    data_types: Dict[str, str]
    statistics: Dict[str, Any]

class DriftReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference_dataset_id: str
    target_dataset_id: str
    report_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    drift_detected: bool
    column_drift: Dict[str, Any]
    overall_drift_score: float
    test_results: Dict[str, Any]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Data Drift & Quality Management System API"}

@api_router.post("/upload", response_model=Dataset)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV file and store metadata in MongoDB"""
    try:
        # Read file content
        contents = await file.read()
        file_size = len(contents)
        
        # Process with pandas
        df_pandas = pd.read_csv(io.BytesIO(contents))
        
        # Get basic statistics
        rows = len(df_pandas)
        columns = len(df_pandas.columns)
        column_names = df_pandas.columns.tolist()
        
        # Get data summary
        summary_stats = spark_processor.get_basic_stats(df_pandas)
        
        # Create dataset object
        dataset = Dataset(
            filename=file.filename,
            rows=rows,
            columns=columns,
            column_names=column_names,
            file_size=file_size,
            data_summary=summary_stats
        )
        
        # Store in MongoDB
        doc = dataset.model_dump()
        doc['upload_date'] = doc['upload_date'].isoformat()
        doc['csv_data'] = contents.decode('utf-8')  # Store raw CSV
        
        await db.datasets.insert_one(doc)
        
        return dataset
    except Exception as e:
        logging.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/datasets", response_model=List[Dataset])
async def get_datasets():
    """Get all uploaded datasets"""
    datasets = await db.datasets.find({}, {"_id": 0, "csv_data": 0}).to_list(1000)
    
    for dataset in datasets:
        if isinstance(dataset['upload_date'], str):
            dataset['upload_date'] = datetime.fromisoformat(dataset['upload_date'])
    
    return datasets

@api_router.post("/quality-check/{dataset_id}", response_model=QualityReport)
async def run_quality_check(dataset_id: str):
    """Run quality analysis on a dataset"""
    try:
        # Get dataset from MongoDB
        dataset_doc = await db.datasets.find_one({"id": dataset_id}, {"_id": 0})
        if not dataset_doc:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Load CSV data
        csv_data = dataset_doc.get('csv_data')
        df = pd.read_csv(io.StringIO(csv_data))
        
        # Run quality checks
        missing_values = quality_checker.check_missing_values(df)
        duplicates = quality_checker.check_duplicates(df)
        outliers = quality_checker.detect_outliers(df)
        data_types = quality_checker.check_data_types(df)
        statistics = quality_checker.get_statistics(df)
        
        # Create quality report
        report = QualityReport(
            dataset_id=dataset_id,
            missing_values=missing_values,
            duplicates=duplicates,
            outliers=outliers,
            data_types=data_types,
            statistics=statistics
        )
        
        # Store in MongoDB
        doc = report.model_dump()
        doc['report_date'] = doc['report_date'].isoformat()
        await db.quality_reports.insert_one(doc)
        
        return report
    except Exception as e:
        logging.error(f"Error in quality check: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in quality check: {str(e)}")

@api_router.post("/drift-check", response_model=DriftReport)
async def run_drift_check(reference_id: str, target_id: str):
    """Run drift detection between two datasets"""
    try:
        # Get reference dataset
        ref_doc = await db.datasets.find_one({"id": reference_id}, {"_id": 0})
        if not ref_doc:
            raise HTTPException(status_code=404, detail="Reference dataset not found")
        
        # Get target dataset
        target_doc = await db.datasets.find_one({"id": target_id}, {"_id": 0})
        if not target_doc:
            raise HTTPException(status_code=404, detail="Target dataset not found")
        
        # Load CSV data
        ref_df = pd.read_csv(io.StringIO(ref_doc.get('csv_data')))
        target_df = pd.read_csv(io.StringIO(target_doc.get('csv_data')))
        
        # Run drift detection
        drift_results = drift_detector.detect_drift(ref_df, target_df)
        
        # Create drift report
        report = DriftReport(
            reference_dataset_id=reference_id,
            target_dataset_id=target_id,
            drift_detected=drift_results['drift_detected'],
            column_drift=drift_results['column_drift'],
            overall_drift_score=drift_results['overall_drift_score'],
            test_results=drift_results['test_results']
        )
        
        # Store in MongoDB
        doc = report.model_dump()
        doc['report_date'] = doc['report_date'].isoformat()
        await db.drift_reports.insert_one(doc)
        
        return report
    except Exception as e:
        logging.error(f"Error in drift check: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in drift check: {str(e)}")

@api_router.get("/quality-reports/{dataset_id}", response_model=List[QualityReport])
async def get_quality_reports(dataset_id: str):
    """Get all quality reports for a dataset"""
    reports = await db.quality_reports.find({"dataset_id": dataset_id}, {"_id": 0}).to_list(100)
    
    for report in reports:
        if isinstance(report['report_date'], str):
            report['report_date'] = datetime.fromisoformat(report['report_date'])
    
    return reports

@api_router.get("/drift-reports", response_model=List[DriftReport])
async def get_drift_reports():
    """Get all drift reports"""
    reports = await db.drift_reports.find({}, {"_id": 0}).to_list(100)
    
    for report in reports:
        if isinstance(report['report_date'], str):
            report['report_date'] = datetime.fromisoformat(report['report_date'])
    
    return reports

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    spark_processor.stop()
    client.close()