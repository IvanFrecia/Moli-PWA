import pandas as pd
from pathlib import Path

def analyze_excel_files():
    """Analyze the structure and content of the Excel files"""

    base_path = Path("/home/sky/Projects/Moli-PWA/backend/data/raw")

    print("=" * 80)
    print("DATA ANALYSIS REPORT - MOLI PWA INTEGRATION")
    print("=" * 80)
    
    # List all files in the directory
    print(f"\n📁 Files in {base_path}:")
    files = list(base_path.iterdir())
    for f in files:
        print(f"   • '{f.name}' (size: {f.stat().st_size:,} bytes)")
    
    # Try to read each Excel file
    for file_path in files:
        if file_path.suffix.lower() == '.xlsx':
            analyze_single_file(file_path)

def analyze_single_file(file_path: Path):
    """Analyze a single Excel file"""
    
    print(f"\n📊 ANALYZING: {file_path.name}")
    print("-" * 80)
    
    try:
        # Try reading with different parameters to handle complex Excel files
        df = pd.read_excel(file_path, header=0) # type: ignore
        
        print(f"📈 Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
        print(f"🏗️  Columns: {list(df.columns)}")
        
        # Show first few rows
        print(f"\n📋 First 5 rows:")
        print(df.head())
        
        # If this looks like it has a header row issue, try different approaches
        if 'Unnamed' in str(df.columns) or df.iloc[0].notna().sum() > df.iloc[1].notna().sum():
            print(f"\n🔄 Trying alternative header parsing...")
            
            # Try reading without header first to see raw structure
            df_raw = pd.read_excel(file_path, header=None) # type: ignore
            print(f"📋 Raw first 10 rows:")
            print(df_raw.head(10))
            
            # Look for the actual header row
            for i in range(min(10, len(df_raw))):
                row = df_raw.iloc[i] # type: ignore
                non_null_count = row.notna().sum()
                print(f"Row {i}: {non_null_count} non-null values - {list(row[:10])}") # type: ignore
        
        # Basic statistics
        print(f"\n📊 Basic Info:")
        print(f"   • Memory usage: {df.memory_usage(deep=True).sum():,} bytes") # type: ignore
        print(f"   • Non-null values per column (top 10):")
        non_null_counts = df.count().sort_values(ascending=False) # type: ignore
        for col, count in non_null_counts.head(10).items(): # type: ignore
            print(f"     - {col}: {count:,} ({count/len(df)*100:.1f}%)")
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        print(f"   File path: {file_path}")
        print(f"   File exists: {file_path.exists()}")
        print(f"   File size: {file_path.stat().st_size if file_path.exists() else 'N/A'}")

if __name__ == "__main__":
    analyze_excel_files()
