"""
Business Data Consolidation Engine
The Core Orchestrator for Multi-Source Ingestion, Smart Normalization,
Entity Resolution, Duplicate/Conflict Detection, and Single Source of Truth (SSOT) Creation.
"""

import json
from typing import Dict, Any, List, Tuple, Optional
from database import get_db
from data_ingestion import DataIngestionService
from data_normalizer import DataNormalizer
from entity_resolution import EntityResolutionService
from duplicate_detector import DuplicateDetector
from conflict_detector import ConflictDetector
from data_quality import DataQualityEngine


class ConsolidationEngine:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.ingestion_service = DataIngestionService()
        self.normalizer = DataNormalizer()
        self.entity_resolver = EntityResolutionService(user_id)
        self.duplicate_detector = DuplicateDetector(user_id)
        self.conflict_detector = ConflictDetector(user_id)
        self.quality_engine = DataQualityEngine(user_id)

    def process_files(self, files: List[Tuple[str, bytes]]) -> Dict[str, Any]:
        """
        Processes a batch of uploaded heterogeneous files through the complete
        8-stage consolidation pipeline and populates the unified business dataset.
        """
        conn = get_db()
        cursor = conn.cursor()

        all_raw_records = []
        all_normalized_records = []
        files_metadata = []

        # 1. Multi-Source Ingestion & Raw Record Logging
        for filename, content in files:
            try:
                raw_recs, domain, meta = self.ingestion_service.ingest_file(
                    filename, content)

                file_type = meta.get("file_type", "CSV")
                record_cnt = len(raw_recs)
                warnings = meta.get("warnings", [])
                status = "PROCESSED"
                status_detail = ""
                if record_cnt == 0:
                    status = "FAILED"
                    status_detail = "No readable transaction records or tabular data detected in file."
                elif warnings:
                    status = "PARTIAL"
                    status_detail = "; ".join(warnings)

                cursor.execute("""
                INSERT INTO uploaded_files (user_id, filename, file_type, file_size, record_count, detected_domain, status, status_detail)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (self.user_id, filename, file_type, meta.get("file_size", len(content)), record_cnt, domain, status, status_detail))
                file_id = cursor.lastrowid
                meta["file_id"] = file_id
                files_metadata.append(meta)

                # Store raw records for complete lineage
                for r in raw_recs:
                    cursor.execute("""
                    INSERT INTO raw_records (user_id, file_id, source_file, row_index, raw_payload_json, detected_domain)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (self.user_id, file_id, filename, r.get("_row_index", 1), json.dumps(r), domain))
                    all_raw_records.append((r, domain))
            except Exception as exc:
                file_ext = filename.split('.')[-1].upper() if '.' in filename else 'FILE'
                cursor.execute("""
                INSERT INTO uploaded_files (user_id, filename, file_type, file_size, record_count, detected_domain, status, status_detail)
                VALUES (?, ?, ?, ?, 0, 'UNKNOWN', 'FAILED', ?)
                """, (self.user_id, filename, file_ext, len(content), f"File processing failed: {str(exc)}"))

        conn.commit()

        # 2. Normalization & Entity Resolution
        categorized_normalized = {
            "SALES": [],
            "EXPENSES": [],
            "INVOICE": [],
            "BANK_STATEMENT": [],
            "INVENTORY": []
        }

        for raw_r, domain in all_raw_records:
            norm_r = self.normalizer.normalize_record(raw_r, domain)

            # Resolve Customer Name
            if norm_r.get("customer_name"):
                canon_cust, cust_id, m_type, conf, needs_rev = self.entity_resolver.resolve_entity(
                    norm_r["customer_name"], entity_type="CUSTOMER",
                    phone=norm_r.get("phone"), email=norm_r.get("email"),
                    source_file=norm_r["source_file"]
                )
                norm_r["customer_name"] = canon_cust
                norm_r["customer_id"] = cust_id

            # Resolve Supplier Name
            if norm_r.get("supplier_name"):
                canon_supp, supp_id, m_type, conf, needs_rev = self.entity_resolver.resolve_entity(
                    norm_r["supplier_name"], entity_type="SUPPLIER",
                    phone=norm_r.get("phone"), email=norm_r.get("email"),
                    source_file=norm_r["source_file"]
                )
                norm_r["supplier_name"] = canon_supp
                norm_r["supplier_id"] = supp_id

            # Resolve Product Name
            if norm_r.get("product_name"):
                canon_prod, prod_id, m_type, conf, needs_rev = self.entity_resolver.resolve_entity(
                    norm_r["product_name"], entity_type="PRODUCT",
                    source_file=norm_r["source_file"]
                )
                norm_r["product_name"] = canon_prod
                norm_r["product_id"] = prod_id

            all_normalized_records.append(norm_r)

            # Group for cross-source validation
            if domain in categorized_normalized:
                categorized_normalized[domain].append(norm_r)
            elif "sale" in domain.lower():
                categorized_normalized["SALES"].append(norm_r)
            elif "expense" in domain.lower():
                categorized_normalized["EXPENSES"].append(norm_r)
            else:
                categorized_normalized["SALES"].append(norm_r)

        # 3. Duplicate Detection
        all_duplicates = []
        for dom, rec_list in categorized_normalized.items():
            if len(rec_list) > 1:
                dups = self.duplicate_detector.scan_for_duplicates(
                    dom, rec_list)
                all_duplicates.extend(dups)

        # 4. Conflict Detection (Reconcile Invoices vs Bank Deposits)
        invoices = categorized_normalized.get(
            "INVOICE", []) + [r for r in categorized_normalized.get("SALES", []) if r.get("invoice_num")]
        bank_txns = categorized_normalized.get("BANK_STATEMENT", [])
        all_conflicts = self.conflict_detector.reconcile_invoices_vs_bank(
            invoices, bank_txns)

        # 5. Populate Unified Business Dataset (Single Source of Truth)
        for r in all_normalized_records:
            dom = r["detected_domain"]

            # Route to appropriate Unified Table with full lineage
            if dom in ["SALES", "GENERAL_BUSINESS_DATA"]:
                rev = r["amount"]
                cogs = r["unit_cost"] * r["quantity"]
                profit = rev - cogs
                cursor.execute("""
                INSERT INTO unified_sales (
                    user_id, source_file, source_row, sale_date, invoice_num,
                    customer_name, customer_id, product_name, product_id,
                    quantity, unit_price, unit_cost, total_revenue, cogs, profit, payment_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
                """, (
                    self.user_id, r["source_file"], r["source_row"], r["date"], r.get(
                        "invoice_num", ""),
                    r.get("customer_name") or "General Customer", r.get(
                        "customer_id"),
                    r.get("product_name") or "General Item", r.get(
                        "product_id"),
                    r["quantity"], r["unit_price"], r["unit_cost"], rev, cogs, profit
                ))

            elif dom == "EXPENSES":
                cursor.execute("""
                INSERT INTO unified_expenses (
                    user_id, source_file, source_row, expense_date, category,
                    vendor_name, vendor_id, amount, description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    self.user_id, r["source_file"], r["source_row"], r["date"],
                    r.get("category") or "Operating Overhead", r.get(
                        "supplier_name") or "",
                    r.get("supplier_id"), r["amount"], r.get(
                        "description") or ""
                ))

            elif dom == "INVOICE":
                cursor.execute("""
                INSERT INTO unified_invoices (
                    user_id, source_file, source_row, invoice_num, invoice_date,
                    party_name, party_type, total_amount, balance_due, status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'CUSTOMER', ?, ?, 'PENDING')
                """, (
                    self.user_id, r["source_file"], r["source_row"], r.get(
                        "invoice_num") or "INV",
                    r["date"], r.get(
                        "customer_name") or "Client", r["amount"], r["amount"]
                ))

            elif dom == "INVENTORY":
                cursor.execute("""
                INSERT INTO unified_inventory (
                    user_id, source_file, source_row, product_name, product_id,
                    category, unit_cost, unit_price, current_stock, supplier_name
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    self.user_id, r["source_file"], r["source_row"], r.get(
                        "product_name") or "Product SKU",
                    r.get("product_id"), r.get(
                        "category") or "General", r["unit_cost"], r["unit_price"],
                    r["quantity"], r.get("supplier_name") or ""
                ))

            elif dom == "BANK_STATEMENT":
                txn_type = "CREDIT" if r["amount"] >= 0 else "DEBIT"
                cursor.execute("""
                INSERT INTO unified_transactions (
                    user_id, source_file, source_row, txn_date, txn_type,
                    amount, reference_num, party_name, description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    self.user_id, r["source_file"], r["source_row"], r["date"],
                    txn_type, abs(r["amount"]), r.get("invoice_num") or "",
                    r.get("customer_name") or r.get(
                        "supplier_name") or "", r.get("description") or ""
                ))

        conn.commit()

        # Count pending entity review items
        cursor.execute(
            "SELECT COUNT(*) FROM entity_matches WHERE user_id = ? AND status = 'PENDING'", (self.user_id,))
        pending_entity_matches = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM duplicate_candidates WHERE user_id = ? AND status = 'PENDING'", (self.user_id,))
        pending_duplicates = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM data_conflicts WHERE user_id = ? AND status = 'PENDING'", (self.user_id,))
        pending_conflicts = cursor.fetchone()[0]

        # 6. Data Quality Evaluation
        quality_res = self.quality_engine.evaluate_quality(
            total_records=len(all_normalized_records),
            normalized_records=all_normalized_records,
            duplicates_count=len(all_duplicates),
            conflicts_count=len(all_conflicts),
            entity_matches_count=pending_entity_matches
        )

        # Log Import Job
        cursor.execute("""
        INSERT INTO import_jobs (
            user_id, total_files, total_records, normalized_count,
            duplicate_count, entity_match_count, conflict_count, quality_score, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
        """, (
            self.user_id, len(files), len(
                all_raw_records), len(all_normalized_records),
            len(all_duplicates), pending_entity_matches, len(
                all_conflicts), quality_res["overall_score"]
        ))
        job_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "status": "success",
            "message": "Business data successfully consolidated into unified single source of truth.",
            "import_job_id": job_id,
            "summary": {
                "files_processed": len(files),
                "total_records": len(all_raw_records),
                "records_normalized": len(all_normalized_records),
                "potential_duplicates": len(all_duplicates),
                "potential_entity_matches": pending_entity_matches,
                "conflicts_detected": len(all_conflicts),
                "records_requiring_review": pending_duplicates + pending_entity_matches + pending_conflicts,
                "data_quality_score": quality_res["overall_score"],
                "data_quality_status": quality_res["status_label"]
            },
            "files": files_metadata,
            "quality": quality_res
        }

    def get_unified_dataset(self) -> Dict[str, Any]:
        """Retrieves consolidated SSOT dataset with lineage metadata."""
        conn = get_db()
        sales = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_sales WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        expenses = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_expenses WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        invoices = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_invoices WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        inventory = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_inventory WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        transactions = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_transactions WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        entities = [dict(r) for r in conn.execute(
            "SELECT * FROM unified_entities WHERE user_id = ? ORDER BY id DESC", (self.user_id,)).fetchall()]
        conn.close()

        return {
            "sales_count": len(sales),
            "expenses_count": len(expenses),
            "invoices_count": len(invoices),
            "inventory_count": len(inventory),
            "transactions_count": len(transactions),
            "entities_count": len(entities),
            "sales": sales,
            "expenses": expenses,
            "invoices": invoices,
            "inventory": inventory,
            "transactions": transactions,
            "entities": entities
        }

    def resolve_duplicate(self, candidate_id: int, action: str) -> Dict[str, Any]:
        """Handles duplicate review: 'MERGE', 'KEEP_BOTH', 'IGNORE'."""
        conn = get_db()
        conn.execute("UPDATE duplicate_candidates SET status = ? WHERE id = ? AND user_id = ?",
                     (action.upper(), candidate_id, self.user_id))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Duplicate candidate marked as {action}."}

    def resolve_entity_match(self, match_id: int, action: str) -> Dict[str, Any]:
        """Handles entity match review: 'CONFIRMED' (Merge alias) or 'REJECTED'."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM entity_matches WHERE id = ? AND user_id = ?", (match_id, self.user_id))
        row = cursor.fetchone()
        if row and action.upper() == 'CONFIRMED':
            # Add alias
            self.entity_resolver._add_alias_to_entity(
                row["matched_entity_id"], row["raw_name"])
            cursor.execute(
                "UPDATE entity_matches SET status = 'CONFIRMED' WHERE id = ?", (match_id,))
        elif row:
            cursor.execute(
                "UPDATE entity_matches SET status = 'REJECTED' WHERE id = ?", (match_id,))
        conn.commit()
        conn.close()
        return {"status": "success", "message": f"Entity match marked as {action}."}

    def resolve_conflict(self, conflict_id: int, choice: str) -> Dict[str, Any]:
        """Handles conflict resolution: 'CHOOSE_A', 'CHOOSE_B', 'RESOLVED'."""
        conn = get_db()
        conn.execute("UPDATE data_conflicts SET status = 'RESOLVED', resolution_choice = ? WHERE id = ? AND user_id = ?",
                     (choice, conflict_id, self.user_id))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Conflict resolved successfully."}
