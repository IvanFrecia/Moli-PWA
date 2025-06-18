"""
Quick processing to save the billing data and continue with ML integration
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

def process_billing_only():
    """Process just the billing data and save it"""
    
    print("🚀 PROCESSING BILLING DATA FOR MOLI PWA")
    print("=" * 50)
    
    # Read billing data
    data_path = "/home/sky/Projects/Moli-PWA/data/raw"
    billing_file = f"{data_path}/Listado_de_Facturación_de_Molinos .xlsx"
    
    # Read with proper header row (row 2 contains the headers)
    df = pd.read_excel(billing_file, header=2)
    
    # Clean column names
    df.columns = [
        'tipo', 'comprobante', 'fecha', 'codigo_molino', 'razon_social', 
        'zona', 'producto', 'flete', 'unidades', 'envase_kg', 'total_kg', 'monto_ars'
    ]
    
    # Data cleaning and transformation
    df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce')
    df['monto_ars'] = pd.to_numeric(df['monto_ars'], errors='coerce')
    df['total_kg'] = pd.to_numeric(df['total_kg'], errors='coerce')
    df['codigo_molino'] = pd.to_numeric(df['codigo_molino'], errors='coerce')
    
    # Remove rows with null dates (header rows, etc.)
    df = df.dropna(subset=['fecha'])
    
    # Add derived features for ML
    df['year'] = df['fecha'].dt.year
    df['month'] = df['fecha'].dt.month
    df['quarter'] = df['fecha'].dt.quarter
    df['weekday'] = df['fecha'].dt.dayofweek
    df['precio_por_kg'] = df['monto_ars'] / df['total_kg']
    df['flete_binario'] = (df['flete'] == 'Si').astype(int)
    
    # Clean product names
    df['producto_limpio'] = df['producto'].str.strip()
    
    print(f"✅ Processed {len(df):,} billing records")
    print(f"📅 Date range: {df['fecha'].min()} to {df['fecha'].max()}")
    print(f"🏭 Unique mills: {df['codigo_molino'].nunique()}")
    print(f"📦 Unique products: {df['producto_limpio'].nunique()}")
    print(f"🌍 Unique zones: {df['zona'].nunique()}")
    
    # Generate business insights
    insights = {
        'overview': {
            'total_revenue': float(df['monto_ars'].sum()),
            'total_volume_kg': float(df['total_kg'].sum()),
            'total_transactions': int(len(df)),
            'unique_customers': int(df['razon_social'].nunique()),
            'unique_products': int(df['producto_limpio'].nunique()),
            'date_range': {
                'start': df['fecha'].min().strftime('%Y-%m-%d'),
                'end': df['fecha'].max().strftime('%Y-%m-%d')
            }
        },
        'top_customers': df.groupby('razon_social')['monto_ars'].sum().nlargest(10).to_dict(),
        'top_products': df.groupby('producto_limpio')['monto_ars'].sum().nlargest(10).to_dict(),
        'top_zones': df.groupby('zona')['monto_ars'].sum().nlargest(10).to_dict(),
        'monthly_trends': df.groupby(df['fecha'].dt.to_period('M'))['monto_ars'].sum().to_dict(),
        'freight_analysis': {
            'with_freight': float(df[df['flete'] == 'Si']['monto_ars'].sum()),
            'without_freight': float(df[df['flete'] == 'No']['monto_ars'].sum()),
            'freight_percentage': float((df['flete'] == 'Si').mean() * 100)
        }
    }
    
    # Convert Period objects to strings for JSON serialization
    insights['monthly_trends'] = {str(k): float(v) for k, v in insights['monthly_trends'].items()}
    
    # Save processed data
    output_dir = Path("/home/sky/Projects/Moli-PWA/data/processed")
    output_dir.mkdir(exist_ok=True)
    
    # Save main dataset
    df.to_parquet(output_dir / "billing_data_clean.parquet")
    
    # Save business insights as JSON
    with open(output_dir / "business_insights.json", 'w') as f:
        json.dump(insights, f, indent=2, default=str)
    
    print(f"\n✅ DATA SAVED TO: {output_dir}")
    print("\n📊 BUSINESS INSIGHTS:")
    print(f"   💰 Total revenue: ${insights['overview']['total_revenue']:,.2f}")
    print(f"   📦 Total volume: {insights['overview']['total_volume_kg']:,.2f} kg")
    print(f"   📊 Total transactions: {insights['overview']['total_transactions']:,}")
    print(f"   🏭 Unique customers: {insights['overview']['unique_customers']:,}")
    
    print(f"\n🏆 TOP CUSTOMERS:")
    for customer, revenue in list(insights['top_customers'].items())[:5]:
        print(f"   • {customer}: ${revenue:,.2f}")
    
    print(f"\n📦 TOP PRODUCTS:")
    for product, revenue in insights['top_products'].items():
        print(f"   • {product}: ${revenue:,.2f}")
    
    print(f"\n🌍 TOP ZONES:")
    for zone, revenue in list(insights['top_zones'].items())[:5]:
        print(f"   • {zone}: ${revenue:,.2f}")
    
    return df, insights

if __name__ == "__main__":
    df, insights = process_billing_only()
