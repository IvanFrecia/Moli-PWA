"""
Data Processing Pipeline for Moli PWA Integration
Processes Excel files and prepares them for ML/Analytics integration
"""

import pandas as pd
from pathlib import Path
import json

from typing import Tuple, Dict
import pandas as pd

def process_billing_data() -> Tuple[pd.DataFrame, Dict[str, object], pd.DataFrame, pd.DataFrame]:
    """Process the billing data and generate insights"""
    
    print("🚀 PROCESSING MOLI PWA BILLING DATA")
    print("=" * 50)
    
    # Read billing data from backend directory
    data_path = Path("/home/sky/Projects/Moli-PWA/backend/data/raw")
    billing_file = data_path / "Listado_de_Facturacion_de_Molinos.xlsx"
    
    print(f"📁 Reading file: {billing_file}")
    
    # Read with proper header row (row 2 contains the headers)
    df = pd.read_excel(billing_file, header=2) # type: ignore
    
    print(f"📊 Initial shape: {df.shape}")
    print(f"🏗️  Columns: {list(df.columns)}")
    
    # Clean column names
    df.columns = [
        'tipo', 'comprobante', 'fecha', 'codigo_molino', 'razon_social', 
        'zona', 'producto', 'flete', 'unidades', 'envase_kg', 'total_kg', 'monto_ars'
    ]
    
    # Data cleaning and transformation
    df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')                # type: ignore
    df['monto_ars'] = pd.to_numeric(df['monto_ars'], errors='coerce')         # type: ignore
    df['total_kg'] = pd.to_numeric(df['total_kg'], errors='coerce')           # type: ignore
    df['codigo_molino'] = pd.to_numeric(df['codigo_molino'], errors='coerce') # type: ignore
    
    # Remove rows with null dates (header rows, etc.)
    df = df.dropna(subset=['fecha']) # type: ignore
    
    # Add derived features for ML
    df['year'] = df['fecha'].dt.year
    df['month'] = df['fecha'].dt.month
    df['quarter'] = df['fecha'].dt.quarter
    df['weekday'] = df['fecha'].dt.dayofweek
    df['precio_por_kg'] = df['monto_ars'] / df['total_kg']
    df['flete_binario'] = (df['flete'] == 'Si').astype(int)
    
    # Clean product names
    df['producto_limpio'] = df['producto'].str.strip() # type: ignore
    
    print(f"✅ Processed {len(df):,} billing records")
    print(f"📅 Date range: {df['fecha'].min()} to {df['fecha'].max()}")
    print(f"🏭 Unique mills: {df['codigo_molino'].nunique()}")
    print(f"📦 Unique products: {df['producto_limpio'].nunique()}")
    print(f"🌍 Unique zones: {df['zona'].nunique()}")
    
    # Generate business insights
    insights = { # type: ignore
        'overview': {
            'total_revenue': float(df['monto_ars'].sum()),
            'total_volume_kg': float(df['total_kg'].sum()),
            'total_transactions': int(len(df)),
            'unique_customers': int(df['razon_social'].nunique()),
            'unique_products': int(df['producto_limpio'].nunique()),
            'unique_mills': int(df['codigo_molino'].nunique()),
            'unique_zones': int(df['zona'].nunique()),
            'date_range': {
                'start': df['fecha'].min().strftime('%Y-%m-%d'), # type: ignore
                'end': df['fecha'].max().strftime('%Y-%m-%d')    # type: ignore
            }
        },
        'top_customers': df.groupby('razon_social')['monto_ars'].sum().nlargest(10).to_dict(), # type: ignore
        'top_products': df.groupby('producto_limpio')['monto_ars'].sum().nlargest(10).to_dict(), # type: ignore
        'top_zones': df.groupby('zona')['monto_ars'].sum().nlargest(10).to_dict(), # type: ignore
        'monthly_trends': df.groupby(df['fecha'].dt.to_period('M'))['monto_ars'].sum().to_dict(), # type: ignore
        'freight_analysis': {
            'with_freight': float(df[df['flete'] == 'Si']['monto_ars'].sum()),
            'without_freight': float(df[df['flete'] == 'No']['monto_ars'].sum()),
            'freight_percentage': float((df['flete'] == 'Si').mean() * 100)
        },
        'mill_analysis': df.groupby('codigo_molino').agg({ # type: ignore
            'monto_ars': 'sum',
            'total_kg': 'sum',
            'razon_social': 'first'
        }).round(2).to_dict('index')
    }
    
    # Convert Period objects to strings for JSON serialization
    insights['monthly_trends'] = {str(k): float(v) for k, v in insights['monthly_trends'].items()} # type: ignore
    
    # Generate recommendation matrices for ML
    print("\n🤖 Generating ML features...")
    
    # Customer-Product interaction matrix
    customer_product_matrix = df.pivot_table( # type: ignore
        index='razon_social',
        columns='producto_limpio',
        values='monto_ars',
        aggfunc='sum',
        fill_value=0
    )
    
    # Customer-Zone interaction matrix
    customer_zone_matrix = df.pivot_table( # type: ignore
        index='razon_social',
        columns='zona',
        values='monto_ars',
        aggfunc='sum',
        fill_value=0
    )
    
    print(f"✅ Customer-Product matrix: {customer_product_matrix.shape}")
    print(f"✅ Customer-Zone matrix: {customer_zone_matrix.shape}")
    
    # Save processed data
    output_dir = Path("/home/sky/Projects/Moli-PWA/backend/data/processed")
    output_dir.mkdir(exist_ok=True)
    
    # Save main dataset
    df.to_parquet(output_dir / "billing_data_clean.parquet")
    
    # Save recommendation matrices
    customer_product_matrix.to_parquet(output_dir / "customer_product_matrix.parquet")
    customer_zone_matrix.to_parquet(output_dir / "customer_zone_matrix.parquet")
    
    # Save business insights as JSON
    with open(output_dir / "business_insights.json", 'w') as f:
        json.dump(insights, f, indent=2, default=str)
    
    print(f"\n✅ DATA SAVED TO: {output_dir}")
    print("\n📊 BUSINESS INSIGHTS:")
    print(f"   💰 Total revenue: ${insights['overview']['total_revenue']:,.2f}")
    print(f"   📦 Total volume: {insights['overview']['total_volume_kg']:,.2f} kg")
    print(f"   📊 Total transactions: {insights['overview']['total_transactions']:,}")
    print(f"   🏭 Unique customers: {insights['overview']['unique_customers']:,}")
    print(f"   🏗️  Unique mills: {insights['overview']['unique_mills']:,}")
    
    print(f"\n🏆 TOP CUSTOMERS:")
    for customer, revenue in list(insights['top_customers'].items())[:5]: # type: ignore
        print(f"   • {customer}: ${revenue:,.2f}")
    
    print(f"\n📦 TOP PRODUCTS:")
    for product, revenue in insights['top_products'].items():             # type: ignore
        print(f"   • {product}: ${revenue:,.2f}")
    
    print(f"\n🌍 TOP ZONES:")
    for zone, revenue in list(insights['top_zones'].items())[:5]:         # type: ignore
        print(f"   • {zone}: ${revenue:,.2f}")
    
    print(f"\n🚛 FREIGHT ANALYSIS:")
    print(f"   • With freight: ${insights['freight_analysis']['with_freight']:,.2f}")
    print(f"   • Without freight: ${insights['freight_analysis']['without_freight']:,.2f}")
    print(f"   • Freight percentage: {insights['freight_analysis']['freight_percentage']:.1f}%")
    
    return df, insights, customer_product_matrix, customer_zone_matrix # type: ignore

if __name__ == "__main__":
    df, insights, customer_product_matrix, customer_zone_matrix = process_billing_data()
