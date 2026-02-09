#!/usr/bin/env python3
"""
Validate Journal Import Setup

This script checks if your environment is properly configured for journal import.
Run this before attempting to import your journal entries.

Usage:
    python3 scripts/validate-journal-setup.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def print_header(text):
    print("\n" + "═" * 60)
    print(f"  {text}")
    print("═" * 60)

def check_mark(passed):
    return "✅" if passed else "❌"

def main():
    print("╔════════════════════════════════════════════════════════╗")
    print("║     🔍 Journal Import Setup Validator 🔍              ║")
    print("╚════════════════════════════════════════════════════════╝")
    
    all_checks_passed = True
    
    # ─────────────────────────────────────────────────────────────
    # Check 1: Python Dependencies
    # ─────────────────────────────────────────────────────────────
    print_header("1. Python Dependencies")
    
    required_packages = {
        'notion_client': 'notion-client',
        'frontmatter': 'python-frontmatter',
        'dotenv': 'python-dotenv'
    }
    
    for module_name, package_name in required_packages.items():
        try:
            __import__(module_name)
            print(f"  ✅ {package_name} is installed")
        except ImportError:
            print(f"  ❌ {package_name} is NOT installed")
            print(f"     Install with: pip3 install {package_name}")
            all_checks_passed = False
    
    # ─────────────────────────────────────────────────────────────
    # Check 2: Environment Variables
    # ─────────────────────────────────────────────────────────────
    print_header("2. Environment Variables")
    
    notion_token = os.getenv("NOTION_TOKEN")
    notion_db_id = os.getenv("NOTION_JOURNAL_DB_ID")
    journal_path = os.getenv("JOURNAL_ROOT_PATH", "./Journal")
    
    # Check NOTION_TOKEN
    if notion_token:
        masked_token = notion_token[:10] + "..." + notion_token[-4:] if len(notion_token) > 14 else "***"
        print(f"  ✅ NOTION_TOKEN is set: {masked_token}")
        if not notion_token.startswith("secret_"):
            print(f"  ⚠️  Warning: Token should start with 'secret_'")
            all_checks_passed = False
    else:
        print(f"  ❌ NOTION_TOKEN is NOT set")
        print(f"     Add to .env: NOTION_TOKEN=secret_your_token_here")
        all_checks_passed = False
    
    # Check NOTION_JOURNAL_DB_ID
    if notion_db_id:
        print(f"  ✅ NOTION_JOURNAL_DB_ID is set: {notion_db_id}")
        if len(notion_db_id.replace("-", "")) != 32:
            print(f"  ⚠️  Warning: Database ID should be 32 characters (without dashes)")
    else:
        print(f"  ❌ NOTION_JOURNAL_DB_ID is NOT set")
        print(f"     Add to .env: NOTION_JOURNAL_DB_ID=your_database_id")
        all_checks_passed = False
    
    # Check JOURNAL_ROOT_PATH
    print(f"  ℹ️  JOURNAL_ROOT_PATH: {journal_path}")
    
    # ─────────────────────────────────────────────────────────────
    # Check 3: Journal Directory
    # ─────────────────────────────────────────────────────────────
    print_header("3. Journal Directory")
    
    if os.path.exists(journal_path):
        print(f"  ✅ Journal directory exists: {journal_path}")
        
        # Count markdown files
        md_files = list(Path(journal_path).rglob("*.md"))
        if md_files:
            print(f"  ✅ Found {len(md_files)} Markdown file(s)")
            print(f"     Sample files:")
            for f in md_files[:3]:
                print(f"       - {f.name}")
            if len(md_files) > 3:
                print(f"       ... and {len(md_files) - 3} more")
        else:
            print(f"  ⚠️  No Markdown files found in {journal_path}")
            print(f"     Make sure your journal entries have .md extension")
    else:
        print(f"  ❌ Journal directory NOT found: {journal_path}")
        print(f"     Update JOURNAL_ROOT_PATH in .env or create the directory")
        all_checks_passed = False
    
    # ─────────────────────────────────────────────────────────────
    # Check 4: Notion Connection (if dependencies are installed)
    # ─────────────────────────────────────────────────────────────
    if notion_token and notion_db_id:
        print_header("4. Notion Connection")
        
        try:
            from notion_client import Client
            
            notion = Client(auth=notion_token)
            
            # Try to retrieve the database
            try:
                database = notion.databases.retrieve(database_id=notion_db_id)
                print(f"  ✅ Successfully connected to Notion database")
                print(f"     Database title: {database.get('title', [{}])[0].get('plain_text', 'Untitled')}")
                
                # Check properties
                properties = database.get('properties', {})
                print(f"  ℹ️  Database properties:")
                for prop_name, prop_data in properties.items():
                    prop_type = prop_data.get('type', 'unknown')
                    print(f"       - {prop_name} ({prop_type})")
                
                # Check for required properties
                has_title = any(p.get('type') == 'title' for p in properties.values())
                if has_title:
                    print(f"  ✅ Database has a title property")
                else:
                    print(f"  ❌ Database missing title property")
                    all_checks_passed = False
                
            except Exception as e:
                print(f"  ❌ Failed to connect to Notion database")
                print(f"     Error: {str(e)}")
                print(f"     Make sure:")
                print(f"       1. Database ID is correct")
                print(f"       2. Integration has access to the database")
                all_checks_passed = False
                
        except ImportError:
            print(f"  ⏭️  Skipping Notion connection test (notion-client not installed)")
    
    # ─────────────────────────────────────────────────────────────
    # Final Summary
    # ─────────────────────────────────────────────────────────────
    print_header("Summary")
    
    if all_checks_passed:
        print("\n  🎉 All checks passed! You're ready to import your journal entries.")
        print("\n  Run the import with:")
        print("    npm run notion:import-journal")
        print("  or")
        print("    python3 scripts/import-journal-to-notion.py")
        print()
        return 0
    else:
        print("\n  ⚠️  Some checks failed. Please fix the issues above before importing.")
        print("\n  For help, see:")
        print("    - JOURNAL_IMPORT_QUICK_START.md")
        print("    - scripts/JOURNAL_IMPORT_README.md")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
