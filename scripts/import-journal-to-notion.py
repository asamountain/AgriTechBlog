#!/usr/bin/env python3
"""
Bulk Import Markdown Journal Entries to Notion

This script recursively searches for Markdown files in a local folder structure
(e.g., Journal/2024/**/*.md), parses YAML frontmatter, and imports them into
a Notion database.

Usage:
    python scripts/import-journal-to-notion.py

Environment Variables Required:
    - NOTION_TOKEN: Your Notion integration token
    - NOTION_JOURNAL_DB_ID: The ID of your Notion "Journal.db" database

File Format Expected:
    ---
    title: Entry Title
    tags: tag1, tag2
    date: 2024-02-14
    ---
    Body content goes here...
"""

import os
import re
import glob
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import frontmatter
from notion_client import Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_JOURNAL_DB_ID = os.getenv("NOTION_JOURNAL_DB_ID")
JOURNAL_ROOT_PATH = os.getenv("JOURNAL_ROOT_PATH", "./Journal")

# Validate required environment variables
if not NOTION_TOKEN:
    print("❌ Missing required environment variable: NOTION_TOKEN")
    print("\nPlease set this in your .env file:")
    print("  NOTION_TOKEN=secret_...")
    exit(1)

if not NOTION_JOURNAL_DB_ID:
    print("❌ Missing required environment variable: NOTION_JOURNAL_DB_ID")
    print("\nPlease set this in your .env file:")
    print("  NOTION_JOURNAL_DB_ID=your-database-id")
    exit(1)

# Initialize Notion client
notion = Client(auth=NOTION_TOKEN)

# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def find_markdown_files(root_path: str) -> List[Path]:
    """
    Recursively find all Markdown files in the given directory.
    
    Args:
        root_path: Root directory to search
        
    Returns:
        List of Path objects for all .md files found
    """
    pattern = os.path.join(root_path, "**", "*.md")
    files = glob.glob(pattern, recursive=True)
    return [Path(f) for f in sorted(files)]


def parse_markdown_file(file_path: Path) -> Optional[Dict[str, Any]]:
    """
    Parse a Markdown file with YAML frontmatter.
    
    Args:
        file_path: Path to the Markdown file
        
    Returns:
        Dictionary with 'metadata' and 'content' keys, or None if parsing fails
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
            
        return {
            'metadata': dict(post.metadata),
            'content': post.content,
            'file_path': str(file_path)
        }
    except Exception as e:
        print(f"⚠️  Failed to parse {file_path}: {e}")
        return None


def parse_tags(tags_value: Any) -> List[str]:
    """
    Parse tags from various formats (string, list, comma-separated).
    
    Args:
        tags_value: Tags value from frontmatter (can be string or list)
        
    Returns:
        List of tag strings
    """
    if not tags_value:
        return []
    
    if isinstance(tags_value, list):
        return [str(tag).strip() for tag in tags_value]
    
    if isinstance(tags_value, str):
        # Split by comma and clean up
        return [tag.strip() for tag in tags_value.split(',') if tag.strip()]
    
    return []


def parse_date(date_value: Any) -> Optional[str]:
    """
    Parse date from various formats and return ISO format string.
    
    Args:
        date_value: Date value from frontmatter
        
    Returns:
        ISO format date string (YYYY-MM-DD) or None
    """
    if not date_value:
        return None
    
    # If already a datetime object
    if isinstance(date_value, datetime):
        return date_value.strftime('%Y-%m-%d')
    
    # If string, try to parse it
    if isinstance(date_value, str):
        try:
            # Try parsing common formats
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y']:
                try:
                    dt = datetime.strptime(date_value, fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except Exception:
            pass
    
    return None


def content_to_notion_blocks(content: str, max_block_size: int = 2000) -> List[Dict]:
    """
    Convert Markdown content to Notion blocks.
    
    Args:
        content: Markdown content string
        max_block_size: Maximum characters per block (Notion limit is 2000)
        
    Returns:
        List of Notion block objects
    """
    blocks = []
    
    if not content or not content.strip():
        return blocks
    
    # Split content into paragraphs
    paragraphs = content.split('\n\n')
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # Check if it's a heading
        if para.startswith('#'):
            heading_match = re.match(r'^(#{1,3})\s+(.+)$', para)
            if heading_match:
                level = len(heading_match.group(1))
                text = heading_match.group(2)
                
                heading_type = f"heading_{min(level, 3)}"
                blocks.append({
                    "object": "block",
                    "type": heading_type,
                    heading_type: {
                        "rich_text": [{"type": "text", "text": {"content": text[:2000]}}]
                    }
                })
                continue
        
        # Check if it's a bullet list
        if para.startswith('- ') or para.startswith('* '):
            lines = para.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('- ') or line.startswith('* '):
                    text = line[2:].strip()
                    blocks.append({
                        "object": "block",
                        "type": "bulleted_list_item",
                        "bulleted_list_item": {
                            "rich_text": [{"type": "text", "text": {"content": text[:2000]}}]
                        }
                    })
            continue
        
        # Check if it's a numbered list
        if re.match(r'^\d+\.\s', para):
            lines = para.split('\n')
            for line in lines:
                line = line.strip()
                match = re.match(r'^\d+\.\s+(.+)$', line)
                if match:
                    text = match.group(1)
                    blocks.append({
                        "object": "block",
                        "type": "numbered_list_item",
                        "numbered_list_item": {
                            "rich_text": [{"type": "text", "text": {"content": text[:2000]}}]
                        }
                    })
            continue
        
        # Default: treat as paragraph
        # Split long paragraphs into multiple blocks
        if len(para) > max_block_size:
            chunks = [para[i:i+max_block_size] for i in range(0, len(para), max_block_size)]
            for chunk in chunks:
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": chunk}}]
                    }
                })
        else:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": para}}]
                }
            })
    
    return blocks


def create_notion_page(database_id: str, title: str, tags: List[str], 
                       date: Optional[str], content: str, file_path: str) -> bool:
    """
    Create a page in the Notion database.
    
    Args:
        database_id: Notion database ID
        title: Page title
        tags: List of tags
        date: Date string (YYYY-MM-DD)
        content: Page content
        file_path: Original file path (for reference)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Prepare properties
        properties = {
            "Name": {  # Assuming the title property is named "Name"
                "title": [
                    {
                        "type": "text",
                        "text": {"content": title}
                    }
                ]
            }
        }
        
        # Add tags if present
        if tags:
            properties["Tags"] = {
                "multi_select": [{"name": tag} for tag in tags]
            }
        
        # Add date if present
        if date:
            properties["Date"] = {
                "date": {"start": date}
            }
        
        # Convert content to Notion blocks
        children = content_to_notion_blocks(content)
        
        # Limit to 100 blocks (Notion API limit for initial creation)
        if len(children) > 100:
            print(f"   ⚠️  Content has {len(children)} blocks, truncating to 100")
            children = children[:100]
        
        # Create the page
        response = notion.pages.create(
            parent={"database_id": database_id},
            properties=properties,
            children=children
        )
        
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create page: {e}")
        return False


def check_if_page_exists(database_id: str, title: str) -> bool:
    """
    Check if a page with the given title already exists in the database.
    
    Args:
        database_id: Notion database ID
        title: Page title to search for
        
    Returns:
        True if page exists, False otherwise
    """
    try:
        results = notion.databases.query(
            database_id=database_id,
            filter={
                "property": "Name",
                "title": {
                    "equals": title
                }
            }
        )
        return len(results.get("results", [])) > 0
    except Exception as e:
        print(f"   ⚠️  Failed to check for existing page: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Main Function
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("╔════════════════════════════════════════════════════════╗")
    print("║     📓 Bulk Import Journal Entries to Notion 📓        ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    
    # Check if journal root path exists
    if not os.path.exists(JOURNAL_ROOT_PATH):
        print(f"❌ Journal root path not found: {JOURNAL_ROOT_PATH}")
        print("\nPlease set the correct path in your .env file:")
        print("  JOURNAL_ROOT_PATH=./Journal")
        return
    
    print(f"📁 Searching for Markdown files in: {JOURNAL_ROOT_PATH}")
    
    # Find all Markdown files
    md_files = find_markdown_files(JOURNAL_ROOT_PATH)
    
    if not md_files:
        print(f"⚠️  No Markdown files found in {JOURNAL_ROOT_PATH}")
        return
    
    print(f"✅ Found {len(md_files)} Markdown file(s)\n")
    
    # Statistics
    imported_count = 0
    skipped_count = 0
    failed_count = 0
    
    # Process each file
    for i, file_path in enumerate(md_files, 1):
        print(f"[{i}/{len(md_files)}] Processing: {file_path.name}")
        
        # Parse the file
        parsed = parse_markdown_file(file_path)
        if not parsed:
            failed_count += 1
            continue
        
        metadata = parsed['metadata']
        content = parsed['content']
        
        # Extract required fields
        title = metadata.get('title', file_path.stem)
        tags = parse_tags(metadata.get('tags'))
        date = parse_date(metadata.get('date'))
        
        print(f"   Title: {title}")
        print(f"   Tags: {', '.join(tags) if tags else 'None'}")
        print(f"   Date: {date if date else 'None'}")
        
        # Check if page already exists
        if check_if_page_exists(NOTION_JOURNAL_DB_ID, title):
            print(f"   ⏭️  Skipped (already exists)")
            skipped_count += 1
            continue
        
        # Create the Notion page
        success = create_notion_page(
            database_id=NOTION_JOURNAL_DB_ID,
            title=title,
            tags=tags,
            date=date,
            content=content,
            file_path=str(file_path)
        )
        
        if success:
            print(f"   ✅ Imported successfully")
            imported_count += 1
        else:
            failed_count += 1
        
        print()
    
    # Print summary
    print("═" * 56)
    print("📊 Import Summary")
    print(f"   ✅ Imported: {imported_count}")
    print(f"   ⏭️  Skipped: {skipped_count}")
    print(f"   ❌ Failed: {failed_count}")
    print(f"   📝 Total: {len(md_files)}")
    print("═" * 56)
    print()
    
    if imported_count > 0:
        print("🎉 Import completed successfully!")
    elif skipped_count == len(md_files):
        print("ℹ️  All entries already exist in Notion.")
    else:
        print("⚠️  Import completed with some issues.")


if __name__ == "__main__":
    main()
