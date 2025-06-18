"""
Data Processing Pipeline for Moli PWA Integration
Processes Excel files and prepares them for ML/Analytics integration
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd

class MoliDataProcessor:
    """Main class for processing Moli PWA data files"""
    
    def __init__(self, data_path: str = "/home/sky/Projects/Moli-PWA/data/raw"):
        self.data_path = Path(data_path)
        
        # Find the files dynamically to handle name variations
        files = list(self.data_path.glob("*.xlsx"))
        
        billing_candidates = [f for f in files if "Facturacion" in f.name or "molinos" in f.name.lower()]
        sales_candidates = [f for f in files if "Ventas" in f.name or "datos" in f.name.lower()]
        
        if not billing_candidates:
            print(f"Available files: {[f.name for f in files]}")
            raise FileNotFoundError(f"No billing file found in {self.data_path}")
        if not sales_candidates:
            print(f"Available files: {[f.name for f in files]}")
            raise FileNotFoundError(f"No sales file found in {self.data_path}")
            
        self.billing_file = billing_candidates[0]
        self.sales_file = sales_candidates[0]
        
        print(f"📁 Found billing file: {self.billing_file.name}")
        print(f"📁 Found sales file: {self.sales_file.name}")
        
    def process_billing_data(self):
        """Process the billing data with proper column mapping"""
        print("🔄 Processing billing data...")
        
        # Read with proper header row (row 2 contains the headers)
        df = pd.read_excel(self.billing_file, header=2) # type: ignore
        
        # Clean column names
        df.columns = [
            'tipo', 'comprobante', 'fecha', 'codigo_molino', 'razon_social', 
            'zona', 'producto', 'flete', 'unidades', 'envase_kg', 'total_kg', 'monto_ars'
        ]
        
        # Data cleaning and transformation
        df['fecha'] = pd.to_datetime(df['fecha'], errors='coerce') # type: ignore
        df['monto_ars'] = pd.to_numeric(df['monto_ars'], errors='coerce') # type: ignore
        df['total_kg'] = pd.to_numeric(df['total_kg'], errors='coerce') # type: ignore
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
        
        return df
    
    def process_geographic_data(self):
        """Process the geographic/postal code data"""
        print("\n🔄 Processing geographic data...")
        
        # Read raw data without header to understand structure
        df_raw = pd.read_excel(self.sales_file, header=None) # type: ignore
        
        # The structure appears to be: Province | CP | Ciudad repeated across columns
        # We need to reshape this data properly
        geographic_data = []
        
        # Process each set of 3 columns (province, postal_code, city)
        for col_start in range(1, df_raw.shape[1], 3):
            if col_start + 2 < df_raw.shape[1]:
                province_col = col_start
                cp_col = col_start + 1  
                city_col = col_start + 2
                
                # Get province name from first row
                province = df_raw.iloc[0, province_col]
                if pd.notna(province):
                    # Get data starting from row 2 (skip header rows)
                    for idx in range(2, len(df_raw)):
                        cp = df_raw.iloc[idx, cp_col]
                        city = df_raw.iloc[idx, city_col]
                        
                        if pd.notna(cp) and pd.notna(city):
                            geographic_data.append({ # type: ignore
                                'provincia': province,
                                'codigo_postal': str(cp).strip(),
                                'ciudad': str(city).strip()
                            })
        
        geo_df = pd.DataFrame(geographic_data)
        geo_df = geo_df.drop_duplicates()
        
        print(f"✅ Processed {len(geo_df):,} geographic records")
        print(f"🌍 Provinces: {geo_df['provincia'].nunique()}")
        print(f"🏘️  Cities: {geo_df['ciudad'].nunique()}")
        
        return geo_df
    
    def generate_ml_features(self, df: pd.DataFrame) -> dict[str, pd.DataFrame]:
        """Generate additional features for ML models"""
        print("\n🤖 Generating ML features...")
        
        # Customer behavior features
        customer_stats = df.groupby('razon_social').agg({ # type: ignore
            'monto_ars': ['sum', 'mean', 'count'], 
            'total_kg': ['sum', 'mean'],
            'precio_por_kg': 'mean',
            'flete_binario': 'mean'
        }).round(2) # type: ignore
        
        customer_stats.columns = ['_'.join(col).strip() for col in customer_stats.columns]
        customer_stats = customer_stats.reset_index()
        
        # Product performance features
        product_stats = df.groupby('producto_limpio').agg({ # type: ignore
            'monto_ars': ['sum', 'mean', 'count'],
            'total_kg': ['sum', 'mean'],
            'precio_por_kg': 'mean'
        }).round(2)
        
        product_stats.columns = ['_'.join(col).strip() for col in product_stats.columns]
        product_stats = product_stats.reset_index()
        
        # Zone performance features
        zone_stats = df.groupby('zona').agg({ # type: ignore
            'monto_ars': ['sum', 'mean', 'count'],
            'total_kg': ['sum', 'mean'],
            'flete_binario': 'mean'
        }).round(2)
        
        zone_stats.columns = ['_'.join(col).strip() for col in zone_stats.columns]
        zone_stats = zone_stats.reset_index()
        
        print(f"✅ Generated features for {len(customer_stats)} customers")
        print(f"✅ Generated features for {len(product_stats)} products")
        print(f"✅ Generated features for {len(zone_stats)} zones")
        
        return {
            'customer_features': customer_stats,
            'product_features': product_stats,
            'zone_features': zone_stats
        }
    
    def create_recommendation_matrices(self, df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """Create matrices for collaborative filtering"""
        print("\n🎯 Creating recommendation matrices...")
        
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
        
        print(f"✅ Customer-Product matrix: {str(customer_product_matrix.shape)}") # type: ignore
        print(f"✅ Customer-Zone matrix: {str(customer_zone_matrix.shape)}") # type: ignore
        
        return {
            'customer_product': customer_product_matrix,
            'customer_zone': customer_zone_matrix
        }
    
    def generate_business_insights(self, df: pd.DataFrame): # type: ignore
        """Generate key business insights for analytics dashboard"""
        print("\n📊 Generating business insights...")
        
        insights = { # type: ignore
            'overview': {
                'total_revenue': float(df['monto_ars'].sum()),
                'total_volume_kg': float(df['total_kg'].sum()),
                'total_transactions': int(len(df)),
                'unique_customers': int(df['razon_social'].nunique()),
                'unique_products': int(df['producto_limpio'].nunique()),
                'date_range': {
                    'start': df['fecha'].min().strftime('%Y-%m-%d'), # type: ignore
                    'end': df['fecha'].max().strftime('%Y-%m-%d') # type: ignore
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
            }
        }
        
        # Convert Period objects to strings for JSON serialization and handle non-numeric values safely
        insights['monthly_trends'] = {str(k): float(v) if isinstance(v, (int, float)) and pd.notnull(v) else None for k, v in insights['monthly_trends'].items()} # type: ignore
        
        print("✅ Business insights generated")
        return insights # type: ignore



def main() -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, pd.DataFrame], Dict[str, pd.DataFrame], Dict[str, Any]]: # type: ignore
    """Main processing pipeline"""
    print("🚀 STARTING MOLI PWA DATA INTEGRATION PIPELINE")
    print("=" * 60)
    
    processor = MoliDataProcessor()
    
    # Process both datasets
    billing_df = processor.process_billing_data()
    geo_df = processor.process_geographic_data()
    
    # Generate ML features
    ml_features = processor.generate_ml_features(billing_df)
    
    # Create recommendation matrices
    rec_matrices = processor.create_recommendation_matrices(billing_df) # type: ignore
    
    # Generate business insights
    insights = processor.generate_business_insights(billing_df) # type: ignore
    
    # Save processed data
    output_dir = Path("/home/sky/Projects/Moli-PWA/data/processed")
    output_dir.mkdir(exist_ok=True)
    
    # Save main datasets
    billing_df.to_parquet(output_dir / "billing_data_clean.parquet")
    geo_df.to_parquet(output_dir / "geographic_data.parquet")
    
    # Save ML features
    for name, df in ml_features.items():
        df.to_parquet(output_dir / f"{name}.parquet")
    
    # Save recommendation matrices
    for name, matrix in rec_matrices.items():
        matrix.to_parquet(output_dir / f"{name}_matrix.parquet")
    
    # Save business insights as JSON
    with open(output_dir / "business_insights.json", 'w') as f:
        json.dump(insights, f, indent=2, default=str)
    
    print(f"\n✅ ALL DATA PROCESSED AND SAVED TO: {output_dir}")
    print("\n📊 SUMMARY:")
    print(f"   • Billing records: {len(billing_df):,}")
    print(f"   • Geographic records: {len(geo_df):,}")
    print(f"   • Total revenue: ${insights['overview']['total_revenue']:,.2f}")
    print(f"   • Total volume: {insights['overview']['total_volume_kg']:,.2f} kg")
    print(f"   • Unique customers: {insights['overview']['unique_customers']:,}")
    
    return billing_df, geo_df, ml_features, rec_matrices, insights # type: ignore

if __name__ == "__main__":
    main()
