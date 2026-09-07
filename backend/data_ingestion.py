"""
Data Ingestion Service for AI CFO Platform
Multi-Source File Parser for CSV, Excel (.xlsx/.xls), PDF Invoices/Reports, and Bank Statements.
Auto-detects file type, column structures, and business domains.
Includes robust multi-tier fallback parsing for malformed or messy CSV files.
"""

import io
import os
import re
import csv
import json
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import pypdf


class DataIngestionService:
    def __init__(self):
        pass

    def ingest_file(self, filename: str, content: bytes) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        """
        Parses uploaded file content and returns:
        (raw_records, detected_domain, file_metadata)
        """
        ext = os.path.splitext(filename)[1].lower()

        if ext in ['.csv', '.tsv', '.txt']:
            return self._parse_csv(filename, content)
        elif ext in ['.xlsx', '.xls']:
            return self._parse_excel(filename, content)
        elif ext == '.pdf':
            return self._parse_pdf(filename, content)
        else:
            raise ValueError(
                f"Unsupported file format '{ext}'. Please upload CSV, Excel (.xlsx/.xls), or PDF.")

    def _parse_csv(self, filename: str, content: bytes) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        """Parses CSV with automatic encoding, delimiter detection, multi-tier bad line recovery, and text key-value fallback."""
        # Try multiple encodings (handling BOM and Windows encodings)
        text = None
        for enc in ['utf-8-sig', 'utf-8', 'latin1', 'cp1252', 'iso-8859-1']:
            try:
                text = content.decode(enc)
                break
            except Exception:
                continue

        if text is None:
            text = content.decode('utf-8', errors='ignore')

        # If file is explicitly .txt or does not look like standard CSV, attempt key-value / pattern text parsing first
        if filename.endswith('.txt'):
            txt_recs, txt_dom, txt_meta = self._parse_text(filename, content)
            if txt_recs:
                return txt_recs, txt_dom, txt_meta

        # Detect delimiter using csv.Sniffer
        sample = text[:4096]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ','

        df = None
        parse_warnings = []

        # Attempt 1: Standard pandas read_csv
        try:
            df = pd.read_csv(io.StringIO(text), delimiter=delimiter)
        except Exception as e1:
            parse_warnings.append(f"Standard parse warning: {str(e1)}")
            # Attempt 2: read_csv with on_bad_lines='skip' and python engine
            try:
                df = pd.read_csv(io.StringIO(text), delimiter=delimiter, on_bad_lines='skip', engine='python')
            except Exception as e2:
                parse_warnings.append(f"Python engine parse warning: {str(e2)}")
                # Attempt 3: Custom row-by-row csv.reader with auto-padding
                try:
                    lines = text.splitlines()
                    reader = csv.reader(lines, delimiter=delimiter)
                    raw_rows = []
                    header = None
                    for idx, row in enumerate(reader):
                        if not row or not any(str(cell).strip() for cell in row):
                            continue
                        if header is None:
                            header = [str(c).strip() for c in row]
                        else:
                            # Pad or trim row to match header length
                            if len(row) < len(header):
                                row = row + [''] * (len(header) - len(row))
                            elif len(row) > len(header):
                                row = row[:len(header)]
                            raw_rows.append(row)
                    if header and raw_rows:
                        df = pd.DataFrame(raw_rows, columns=header)
                except Exception as e3:
                    parse_warnings.append(f"Row-by-row parse warning: {str(e3)}")

        if df is None or df.empty:
            # Fallback to key-value / text pattern parsing before returning empty
            return self._parse_text(filename, content)

        # Drop fully empty rows
        df = df.dropna(how='all')

        records, domain = self._dataframe_to_records(df, filename)

        # If dataframe parsing resulted in 0 records or unhelpful single-column dataframe, try text parsing fallback
        if not records or len(df.columns) <= 1:
            txt_recs, txt_dom, txt_meta = self._parse_text(filename, content)
            if txt_recs:
                return txt_recs, txt_dom, txt_meta

        metadata = {
            "filename": filename,
            "file_type": "CSV",
            "file_size": len(content),
            "record_count": len(records),
            "detected_domain": domain,
            "columns": [str(c) for c in df.columns],
            "warnings": parse_warnings
        }
        return records, domain, metadata

    def _parse_text(self, filename: str, content: bytes) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        """
        Parses plain text email bodies or text files using key-value line extraction
        and transaction patterns. If financial facts (amount/quantities) cannot be
        confidently identified, returns 0 records to prevent inventing fake transactions.
        """
        text = content.decode('utf-8', errors='ignore')
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        kv_pairs = {}
        for line in lines:
            m = re.match(r'^([A-Za-z0-9\s_\-]{2,30})\s*[:=]\s*(.+)$', line)
            if m:
                k = m.group(1).strip().lower().replace(' ', '_')
                v = m.group(2).strip()
                kv_pairs[k] = v

        records = []
        domain = "UNKNOWN"

        customer = kv_pairs.get('customer') or kv_pairs.get('customer_name') or kv_pairs.get('client') or kv_pairs.get('party')
        vendor = kv_pairs.get('vendor') or kv_pairs.get('supplier') or kv_pairs.get('vendor_name') or kv_pairs.get('supplier_name')
        product = kv_pairs.get('product') or kv_pairs.get('product_name') or kv_pairs.get('item')
        category = kv_pairs.get('category') or kv_pairs.get('expense_category')
        invoice_num = kv_pairs.get('invoice') or kv_pairs.get('invoice_no') or kv_pairs.get('invoice_num') or kv_pairs.get('invoice_number') or kv_pairs.get('bill_no')
        date_val = kv_pairs.get('date') or kv_pairs.get('payment_date') or kv_pairs.get('invoice_date') or kv_pairs.get('expense_date') or kv_pairs.get('received_date') or ""

        amt_str = kv_pairs.get('total_amount') or kv_pairs.get('amount') or kv_pairs.get('amount_received') or kv_pairs.get('selling_price') or kv_pairs.get('unit_price') or kv_pairs.get('bill_amount')
        qty_str = kv_pairs.get('quantity') or kv_pairs.get('qty')
        price_str = kv_pairs.get('selling_price') or kv_pairs.get('unit_price') or kv_pairs.get('price')

        def clean_num(val_str):
            if not val_str:
                return None
            m = re.search(r'[\d\.\,]+', val_str)
            if m:
                try:
                    return float(m.group(0).replace(',', ''))
                except ValueError:
                    return None
            return None

        total_amt = clean_num(amt_str)
        qty = clean_num(qty_str)
        price = clean_num(price_str)

        if total_amt is None and qty is not None and price is not None:
            total_amt = qty * price

        if total_amt is not None and total_amt > 0:
            rec = {
                "source_file": filename,
                "_row_index": 1,
                "amount": total_amt,
                "total_amount": total_amt,
                "date": date_val,
                "invoice_num": invoice_num or ""
            }
            if customer or product:
                domain = "SALES"
                rec["customer_name"] = customer or "General Customer"
                rec["product_name"] = product or "General Product"
                rec["quantity"] = qty if qty is not None else 1.0
                rec["selling_price"] = price if price is not None else total_amt
                records.append(rec)
            elif vendor or category or "rent" in text.lower() or "expense" in text.lower() or "bill" in text.lower():
                domain = "EXPENSES"
                rec["supplier_name"] = vendor or "General Supplier"
                rec["category"] = category or "Operating Expense"
                rec["description"] = f"{category or 'Expense'} - {vendor or ''}".strip(" -")
                records.append(rec)
            elif invoice_num:
                domain = "INVOICE"
                rec["customer_name"] = customer or "General Customer"
                records.append(rec)
            else:
                domain = "SALES"
                rec["customer_name"] = "General Customer"
                rec["product_name"] = "General Item"
                rec["quantity"] = 1.0
                rec["selling_price"] = total_amt
                records.append(rec)
        else:
            for idx, line in enumerate(lines):
                m_prod = re.search(r'([A-Za-z0-9\s\-\.\/]+?)\s+(\d+)\s+(?:₹|INR|Rs\.?|\$)\s*([\d\.\,]+)\s+(?:₹|INR|Rs\.?|\$)\s*([\d\.\,]+)', line)
                if m_prod:
                    pname, q, pr, tot = m_prod.groups()
                    domain = "SALES"
                    records.append({
                        "product_name": pname.strip(),
                        "quantity": float(q),
                        "selling_price": float(pr.replace(',', '')),
                        "total_amount": float(tot.replace(',', '')),
                        "source_file": filename,
                        "_row_index": idx + 1
                    })
                else:
                    m_exp = re.search(r'(Rent|Electricity|Salary|Shipping|Transport|Vendor|Supplier|Bill|Invoice|GST)\w*\s+.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})?.*?(?:₹|INR|Rs\.?|\$)\s*([\d\.\,]{2,})', line, re.IGNORECASE)
                    if m_exp:
                        cat, dt, amt = m_exp.groups()
                        domain = "EXPENSES"
                        records.append({
                            "category": cat.strip().title(),
                            "amount": float(amt.replace(',', '')),
                            "expense_date": dt if dt else "",
                            "description": line,
                            "source_file": filename,
                            "_row_index": idx + 1
                        })

        metadata = {
            "filename": filename,
            "file_type": "TEXT",
            "file_size": len(content),
            "record_count": len(records),
            "detected_domain": domain,
            "columns": list(records[0].keys()) if records else []
        }
        return records, domain, metadata

    def _parse_excel(self, filename: str, content: bytes) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        """Parses Excel spreadsheets (.xlsx, .xls) handling all sheets."""
        excel_file = pd.ExcelFile(io.BytesIO(content))
        all_dfs = []
        for sheet_name in excel_file.sheet_names:
            df = excel_file.parse(sheet_name)
            df = df.dropna(how='all')
            if not df.empty:
                df["_sheet_name"] = sheet_name
                all_dfs.append(df)

        if not all_dfs:
            return [], "UNKNOWN", {"filename": filename, "file_type": "EXCEL", "record_count": 0}

        combined_df = pd.concat(all_dfs, ignore_index=True)
        records, domain = self._dataframe_to_records(combined_df, filename)
        metadata = {
            "filename": filename,
            "file_type": "EXCEL",
            "file_size": len(content),
            "record_count": len(records),
            "detected_domain": domain,
            "columns": [str(c) for c in combined_df.columns if str(c) != "_sheet_name"]
        }
        return records, domain, metadata

    def _parse_pdf(self, filename: str, content: bytes) -> Tuple[List[Dict[str, Any]], str, Dict[str, Any]]:
        """Extracts structured invoice & transaction lines from PDF files."""
        reader = pypdf.PdfReader(io.BytesIO(content))
        full_text = ""
        for page in reader.pages:
            full_text += (page.extract_text() or "") + "\n"

        lines = [line.strip()
                 for line in full_text.split('\n') if line.strip()]

        # Extract document-level key-value pairs (Invoice Number, Date, Customer, Vendor, Cost, etc.)
        doc_kv = {}
        for line in lines:
            m = re.match(r'^([A-Za-z0-9\s_\-]{2,30})\s*[:=]\s*(.+)$', line)
            if m:
                k = m.group(1).strip().lower().replace(' ', '_')
                v = m.group(2).strip()
                doc_kv[k] = v

        invoice_num = doc_kv.get('invoice_number') or doc_kv.get('invoice_num') or doc_kv.get('invoice') or doc_kv.get('bill_no')
        cust_name = doc_kv.get('customer_name') or doc_kv.get('customer') or doc_kv.get('client') or doc_kv.get('party')
        supp_name = doc_kv.get('supplier_name') or doc_kv.get('supplier') or doc_kv.get('vendor') or doc_kv.get('vendor_name')
        date_str = doc_kv.get('date') or doc_kv.get('invoice_date') or doc_kv.get('payment_date')
        cost_val = doc_kv.get('purchase_cost') or doc_kv.get('unit_cost') or doc_kv.get('cost')

        records = []
        for idx, line in enumerate(lines):
            # Regex patterns for tabular invoice rows: Product/desc + Qty + Price + Total
            match = re.search(r'([A-Za-z0-9\s\-\.\/]+?)\s+(\d+)\s+(?:₹|INR|Rs\.?|\$)?\s*([\d\.\,]+)\s+(?:₹|INR|Rs\.?|\$)?\s*([\d\.\,]+)', line)
            if match:
                pname, qty, price, total = match.groups()
                rec = {
                    "product_name": pname.strip(),
                    "quantity": float(qty),
                    "selling_price": float(price.replace(',', '')),
                    "total_amount": float(total.replace(',', '')),
                    "source_file": filename,
                    "_row_index": idx + 1
                }
                if invoice_num: rec["invoice_num"] = invoice_num
                if cust_name: rec["customer_name"] = cust_name
                if supp_name: rec["supplier_name"] = supp_name
                if date_str: rec["date"] = date_str
                if cost_val:
                    try:
                        rec["unit_cost"] = float(re.search(r'[\d\.\,]+', cost_val).group(0).replace(',', ''))
                    except Exception:
                        pass
                records.append(rec)
            else:
                # Regex for Expense/Invoice total line: Category/Party + Date + Amount
                match_exp = re.search(r'(Rent|Electricity|Salary|Shipping|Transport|Vendor|Supplier|Bill|Invoice|GST)\w*\s+.*?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})?.*?(?:₹|INR|Rs\.?|\$)?\s*([\d\.\,]{3,})', line, re.IGNORECASE)
                if match_exp:
                    cat, dt, amt = match_exp.groups()
                    rec = {
                        "category": cat.strip().title(),
                        "amount": float(amt.replace(',', '')),
                        "expense_date": dt if dt else (date_str or ""),
                        "description": line,
                        "source_file": filename,
                        "_row_index": idx + 1
                    }
                    if supp_name: rec["supplier_name"] = supp_name
                    if invoice_num: rec["invoice_num"] = invoice_num
                    records.append(rec)

        domain = "INVOICE" if any("invoice" in r for r in records) else "SALES" if records else "UNKNOWN"
        # Fallback if no tabular/line records matched: try text key-value parsing
        if not records and full_text.strip():
            txt_recs, txt_dom, txt_meta = self._parse_text(filename, full_text.encode('utf-8'))
            if txt_recs:
                return txt_recs, txt_dom, {"filename": filename, "file_type": "PDF", "file_size": len(content), "record_count": len(txt_recs), "detected_domain": txt_dom, "columns": list(txt_recs[0].keys())}

        domain = "INVOICE" if (invoice_num or any("invoice" in str(r).lower() for r in records)) else "SALES" if records else "UNKNOWN"
        cols = list(set([k for r in records for k in r.keys() if not k.startswith("_")])) if records else ["product_name", "quantity", "selling_price", "total_amount"]

        metadata = {
            "filename": filename,
            "file_type": "PDF",
            "file_size": len(content),
            "record_count": len(records),
            "detected_domain": domain,
            "columns": cols
        }
        return records, domain, metadata

    def _dataframe_to_records(self, df: pd.DataFrame, filename: str) -> Tuple[List[Dict[str, Any]], str]:
        """Maps DataFrame rows to raw record dicts and detects domain."""
        records = []
        cols_lower = [str(c).lower() for c in df.columns]

        # Check if columns match recognized business field synonyms
        known_business_terms = {
            'customer', 'customer_name', 'client', 'buyer', 'party', 'sale_price', 'selling_price',
            'supplier', 'vendor', 'expense', 'category', 'bill_amount', 'purchase_cost', 'cost',
            'invoice', 'invoice_num', 'invoice_number', 'due_amount', 'balance_due',
            'stock', 'current_stock', 'quantity_in_hand', 'sku', 'product', 'item', 'quantity', 'qty',
            'amount', 'total', 'revenue', 'price', 'unit_price', 'unit_cost', 'rate', 'value', 'date'
        }

        has_business_col = any(
            any(term in c for term in known_business_terms)
            for c in cols_lower
        )

        if not has_business_col:
            return [], "UNKNOWN"

        # Domain Detection Rules
        if any(c in cols_lower for c in ['customer', 'customer_name', 'client', 'buyer', 'sale_price', 'selling_price']):
            domain = "SALES"
        elif any(c in cols_lower for c in ['supplier', 'vendor', 'expense', 'category', 'bill_amount', 'purchase_cost', 'cost']):
            domain = "EXPENSES"
        elif any(c in cols_lower for c in ['invoice', 'invoice_num', 'invoice_number', 'due_amount', 'balance_due']):
            domain = "INVOICE"
        elif any(c in cols_lower for c in ['stock', 'current_stock', 'quantity_in_hand', 'sku']):
            domain = "INVENTORY"
        else:
            domain = "SALES"

        for idx, row in df.iterrows():
            r_dict = {}
            for col in df.columns:
                val = row[col]
                if pd.notna(val):
                    r_dict[str(col).strip()] = val
            r_dict["source_file"] = filename
            r_dict["_row_index"] = idx + 1
            records.append(r_dict)

        return records, domain
