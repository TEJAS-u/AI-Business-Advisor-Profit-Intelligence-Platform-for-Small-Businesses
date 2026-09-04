"""
SQLite Database Manager for AI CFO Platform
Stores Users, Shop Profiles, Uploaded Files, Import Jobs, Raw Records,
Unified Business Data (SSOT), Entity Resolutions, Duplicates, Conflicts, and Data Quality Logs.
"""

import os
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_cfo.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=30000;")
    except Exception:
        pass
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        shop_name TEXT NOT NULL,
        shop_type TEXT NOT NULL,
        location TEXT NOT NULL,
        employees INTEGER DEFAULT 1,
        currency TEXT DEFAULT '₹',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Uploaded Files Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS uploaded_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        record_count INTEGER DEFAULT 0,
        detected_domain TEXT DEFAULT 'UNKNOWN',
        status TEXT DEFAULT 'PROCESSED',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 3. Import Jobs (Consolidation Pipeline Runs)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS import_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_files INTEGER DEFAULT 0,
        total_records INTEGER DEFAULT 0,
        normalized_count INTEGER DEFAULT 0,
        duplicate_count INTEGER DEFAULT 0,
        entity_match_count INTEGER DEFAULT 0,
        conflict_count INTEGER DEFAULT 0,
        quality_score REAL DEFAULT 100.0,
        status TEXT DEFAULT 'COMPLETED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 4. Raw Records (With Source Lineage)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS raw_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        row_index INTEGER NOT NULL,
        raw_payload_json TEXT NOT NULL,
        detected_domain TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (file_id) REFERENCES uploaded_files (id)
    )
    """)

    # 5. Master Unified Entities (Customers, Suppliers, Products)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        entity_type TEXT NOT NULL, -- 'CUSTOMER', 'SUPPLIER', 'PRODUCT'
        canonical_name TEXT NOT NULL,
        aliases_json TEXT DEFAULT '[]',
        contact_phone TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        metadata_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 6. Unified Sales Transactions (Single Source of Truth)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        sale_date TEXT NOT NULL,
        invoice_num TEXT DEFAULT '',
        customer_name TEXT NOT NULL,
        customer_id INTEGER,
        product_name TEXT NOT NULL,
        product_id INTEGER,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        unit_cost REAL NOT NULL DEFAULT 0,
        total_revenue REAL NOT NULL,
        cogs REAL NOT NULL DEFAULT 0,
        profit REAL NOT NULL DEFAULT 0,
        payment_status TEXT DEFAULT 'PAID', -- 'PAID', 'PENDING', 'OVERDUE'
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 7. Unified Operating Expenses (Single Source of Truth)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        vendor_name TEXT DEFAULT '',
        vendor_id INTEGER,
        amount REAL NOT NULL,
        description TEXT DEFAULT '',
        payment_method TEXT DEFAULT 'BANK_TRANSFER',
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 8. Unified Invoices (Payables & Receivables)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        invoice_num TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        due_date TEXT DEFAULT '',
        party_name TEXT NOT NULL,
        party_type TEXT NOT NULL, -- 'CUSTOMER' (Receivable), 'SUPPLIER' (Payable)
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        balance_due REAL NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PAID', 'PARTIAL', 'OVERDUE'
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 9. Unified Inventory & Products Catalog
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_id INTEGER,
        sku TEXT DEFAULT '',
        category TEXT DEFAULT 'General',
        unit_cost REAL NOT NULL,
        unit_price REAL NOT NULL,
        current_stock INTEGER DEFAULT 0,
        supplier_name TEXT DEFAULT '',
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 10. Unified Bank & Payment Transactions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unified_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_file TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        txn_date TEXT NOT NULL,
        txn_type TEXT NOT NULL, -- 'CREDIT', 'DEBIT'
        amount REAL NOT NULL,
        reference_num TEXT DEFAULT '',
        party_name TEXT DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Uncategorized',
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 11. Duplicate Candidates (Cross-Source Review)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS duplicate_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        record_type TEXT NOT NULL, -- 'SALE', 'EXPENSE', 'INVOICE', 'TRANSACTION'
        record_a_id INTEGER NOT NULL,
        record_a_source TEXT NOT NULL,
        record_b_id INTEGER NOT NULL,
        record_b_source TEXT NOT NULL,
        record_data_json TEXT NOT NULL,
        match_reason TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'MERGED', 'KEPT_BOTH', 'IGNORED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 12. Entity Matches (Fuzzy Name Resolution Review)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS entity_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        entity_type TEXT NOT NULL, -- 'CUSTOMER', 'SUPPLIER', 'PRODUCT'
        raw_name TEXT NOT NULL,
        matched_canonical_name TEXT NOT NULL,
        matched_entity_id INTEGER,
        match_type TEXT NOT NULL, -- 'EXACT_MATCH', 'FUZZY_TOKEN_MATCH', 'PHONE_MATCH'
        confidence_score REAL NOT NULL,
        source_file TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'REJECTED'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 13. Data Conflicts (Cross-Source Inconsistencies)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conflict_type TEXT NOT NULL, -- 'INVOICE_VS_PAYMENT', 'PRICE_MISMATCH', 'DATE_DISCREPANCY'
        entity_name TEXT NOT NULL,
        source_a TEXT NOT NULL,
        value_a TEXT NOT NULL,
        source_b TEXT NOT NULL,
        value_b TEXT NOT NULL,
        difference REAL DEFAULT 0,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED'
        resolution_choice TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 14. Data Quality Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_quality_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        overall_score REAL NOT NULL,
        completeness_score REAL NOT NULL,
        consistency_score REAL NOT NULL,
        duplicate_rate REAL NOT NULL,
        conflict_rate REAL NOT NULL,
        format_validity_score REAL NOT NULL,
        entity_matching_confidence REAL NOT NULL,
        warnings_json TEXT DEFAULT '[]',
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # Legacy fallback tables (Preserving backward compatibility)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit_cost REAL NOT NULL,
        unit_price REAL NOT NULL,
        stock_on_hand INTEGER DEFAULT 0,
        supplier_name TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        unit_cost REAL NOT NULL,
        revenue REAL NOT NULL,
        cogs REAL NOT NULL,
        profit REAL NOT NULL,
        customer_name TEXT DEFAULT 'Walk-in Customer',
        sale_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        vendor TEXT DEFAULT '',
        description TEXT DEFAULT '',
        expense_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS receivables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        pending_amount REAL NOT NULL,
        days_overdue INTEGER DEFAULT 0,
        due_date TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        invoice_ref TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS estimates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        monthly_revenue REAL NOT NULL,
        margin_pct REAL NOT NULL,
        rent REAL DEFAULT 0,
        salaries REAL DEFAULT 0,
        utilities REAL DEFAULT 0,
        transport REAL DEFAULT 0,
        marketing REAL DEFAULT 0,
        other_opex REAL DEFAULT 0,
        total_receivables REAL DEFAULT 0,
        overdue_receivables REAL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        expected_outcome TEXT NOT NULL,
        decision_date TEXT NOT NULL,
        result_status TEXT DEFAULT 'ACTIVE / EVALUATING',
        ai_learning TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 15. Social Connections (OAuth Token & Account State)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL DEFAULT 'zoho_social',
        portal_id TEXT DEFAULT '',
        brand_id TEXT DEFAULT '',
        brand_name TEXT DEFAULT '',
        access_token TEXT DEFAULT '',
        refresh_token TEXT DEFAULT '',
        expires_at TIMESTAMP,
        api_domain TEXT DEFAULT 'https://social.zoho.com',
        connection_status TEXT DEFAULT 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'EXPIRED'
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    # 16. Social Accounts / Channels (Instagram, YouTube, X, LinkedIn, Facebook)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        connection_id INTEGER NOT NULL,
        provider TEXT NOT NULL DEFAULT 'zoho_social',
        platform TEXT NOT NULL, -- 'instagram', 'youtube', 'x', 'linkedin', 'facebook'
        external_channel_id TEXT NOT NULL,
        account_name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        raw_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (connection_id) REFERENCES social_connections (id),
        UNIQUE(user_id, provider, external_channel_id)
    )
    """)

    # 17. Social Posts (Published social content & optional product tag)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        social_account_id INTEGER NOT NULL,
        external_post_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        caption TEXT DEFAULT '',
        published_at TIMESTAMP,
        post_status TEXT DEFAULT 'published',
        mapped_product_id INTEGER,
        raw_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (social_account_id) REFERENCES social_accounts (id),
        FOREIGN KEY (mapped_product_id) REFERENCES products (id),
        UNIQUE(user_id, platform, external_post_id)
    )
    """)

    # 18. Social Metrics (Likes, Comments, Shares, Reach, Views)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        social_post_id INTEGER NOT NULL,
        metric_name TEXT NOT NULL, -- 'likes', 'comments', 'shares', 'views', 'reach', 'impressions'
        metric_value REAL DEFAULT 0,
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (social_post_id) REFERENCES social_posts (id)
    )
    """)

    # 19. Social Sync Runs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_sync_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        connection_id INTEGER NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        status TEXT DEFAULT 'COMPLETED',
        records_received INTEGER DEFAULT 0,
        records_created INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        error_summary TEXT DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (connection_id) REFERENCES social_connections (id)
    )
    """)

    # 20. Social Activity (Instagram / Social network posts & activity)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS social_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source TEXT DEFAULT 'Zoho Social',
        network TEXT DEFAULT 'instagram',
        channel_id TEXT,
        profile_id TEXT,
        profile_name TEXT,
        post_id TEXT,
        post_date TEXT,
        content TEXT,
        post_type TEXT,
        status TEXT,
        likes INTEGER,
        comments INTEGER,
        saves INTEGER,
        reach INTEGER,
        impressions INTEGER,
        views INTEGER,
        engagement INTEGER,
        source_reference TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """)

    conn.commit()
    conn.close()


init_db()
