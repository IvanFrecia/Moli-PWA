import pandas as pd
import numpy as np
import os
from pathlib import Path

def analyze_excel_files():
    """Analyze the structure and content of the Excel files"""
    
    base_path = Path("/home/sky/Projects/Moli-PWA/backend/data/raw")
    
    # File paths (handling exact names with spaces)
    billing_file = base_path / "Listado_de_Facturación_de_Molinos.xlsx"
    sales_file = base_path / "Datos_Basicos_Ventas.xlsx"
    
    # Verify files exist
    if not billing_file.exists():
        print(f"❌ Billing file not found: {billing_file}")
        print(f"📁 Contents of {base_path}:")
        for f in base_path.iterdir():
            print(f"   • {f.name}")
    
    if not sales_file.exists():
        print(f"❌ Sales file not found: {sales_file}")
        print(f"📁 Contents of {base_path}:")
        for f in base_path.iterdir():
            print(f"   • {f.name}")
    
    print("=" * 80)
    print("DATA ANALYSIS REPORT - MOLI PWA INTEGRATION")
    print("=" * 80)
    
    # Analyze Billing Data
    print("\n📊 BILLING DATA ANALYSIS (Listado de Facturación de Molinos)")
    print("-" * 60)
    
    try:
        # Read billing data
        billing_df = pd.read_excel(billing_file)
        
        print(f"📈 Shape: {billing_df.shape[0]:,} rows × {billing_df.shape[1]} columns")
        print(f"📅 Date Range: {billing_df.columns}")
        print(f"🏗️  Columns: {list(billing_df.columns)}")
        print(f"📊 Data Types:")
        for col, dtype in billing_df.dtypes.items():
            print(f"   • {col}: {dtype}")
        
        print(f"\n📋 First 5 rows preview:")
        print(billing_df.head())
        
        print(f"\n📊 Basic Statistics:")
        print(billing_df.describe(include='all'))
        
        # Check for missing values
        print(f"\n❌ Missing Values:")
        missing = billing_df.isnull().sum()
        for col, count in missing.items():
            if count > 0:
                print(f"   • {col}: {count} ({count/len(billing_df)*100:.1f}%)")
        
    except Exception as e:
        print(f"❌ Error reading billing file: {e}")
    
    # Analyze Sales Data
    print("\n\n📊 SALES DATA ANALYSIS (Datos Basicos Ventas)")
    print("-" * 60)
    
    try:
        # Read sales data
        sales_df = pd.read_excel(sales_file)
        
        print(f"📈 Shape: {sales_df.shape[0]:,} rows × {sales_df.shape[1]} columns")
        print(f"🏗️  Columns: {list(sales_df.columns)}")
        print(f"📊 Data Types:")
        for col, dtype in sales_df.dtypes.items():
            print(f"   • {col}: {dtype}")
        
        print(f"\n📋 First 5 rows preview:")
        print(sales_df.head())
        
        print(f"\n📊 Basic Statistics:")
        print(sales_df.describe(include='all'))
        
        # Check for missing values
        print(f"\n❌ Missing Values:")
        missing = sales_df.isnull().sum()
        for col, count in missing.items():
            if count > 0:
                print(f"   • {col}: {count} ({count/len(sales_df)*100:.1f}%)")
        
    except Exception as e:
        print(f"❌ Error reading sales file: {e}")
    
    print("\n" + "=" * 80)
    print("🎯 RECOMMENDATIONS FOR INTEGRATION")
    print("=" * 80)
    
    # Basic recommendations based on data structure
    print("\n🗄️  DATABASE DESIGN RECOMMENDATIONS:")
    print("   • Use PostgreSQL for OLTP operations")
    print("   • Consider BigQuery for analytics and ML workloads")
    print("   • Implement proper indexing on date and ID columns")
    
    print("\n🤖 ML/RECOMMENDER SYSTEM OPPORTUNITIES:")
    print("   • Product recommendation based on purchase history")
    print("   • Mill performance analysis and optimization")
    print("   • Freight cost optimization")
    print("   • Seasonal demand forecasting")
    
    print("\n📊 ANALYTICS DASHBOARD FEATURES:")
    print("   • Real-time sales metrics")
    print("   • Mill performance KPIs")
    print("   • Geographic sales distribution")
    print("   • Product performance analysis")

if __name__ == "__main__":
    analyze_excel_files()
