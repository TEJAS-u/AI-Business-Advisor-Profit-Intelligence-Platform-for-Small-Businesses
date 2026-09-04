"""
Entity Resolution & Master Data Matching Service
Resolves Customer, Supplier, and Product entities across disparate files.
Performs text normalization, legal suffix stripping, token similarity, and generates reviewable matches.
"""

import re
import json
import difflib
from typing import Dict, Any, List, Optional, Tuple
from database import get_db

LEGAL_SUFFIXES = [
    r'\bpvt\.?\s*ltd\.?\b',
    r'\bprivate\s+limited\b',
    r'\bltd\.?\b',
    r'\blimited\b',
    r'\bllp\b',
    r'\bllc\b',
    r'\binc\.?\b',
    r'\bcorp\.?\b',
    r'\bcorporation\b',
    r'\bco\.?\b',
    r'\bcompany\b',
    r'\benterprises?\b',
    r'\btraders?\b',
    r'\btrading\s*co\.?\b',
    r'\bstores?\b',
    r'\bindustries\b',
    r'\bagencies\b',
    r'\bassociates\b',
    r'\bgroup\b'
]


class EntityResolutionService:
    def __init__(self, user_id: int):
        self.user_id = user_id

    def clean_name_for_matching(self, name: str) -> str:
        """Strips legal entity suffixes, punctuation and collapses whitespace for clean matching."""
        if not name:
            return ""
        s = str(name).lower().strip()

        # Remove dots between acronyms: A.B.C -> ABC
        s = re.sub(r'\b([a-z])\.(?=[a-z]\b)', r'\1', s)

        # Remove legal suffixes
        for pattern in LEGAL_SUFFIXES:
            s = re.sub(pattern, '', s, flags=re.IGNORECASE)

        # Remove special characters
        s = re.sub(r'[^a-z0-9\s]', ' ', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    def resolve_entity(
        self,
        raw_name: str,
        entity_type: str = "CUSTOMER",
        phone: Optional[str] = None,
        email: Optional[str] = None,
        source_file: str = "unknown"
    ) -> Tuple[str, Optional[int], str, float, bool]:
        """
        Matches raw name against existing unified entities for the user.
        Returns: (canonical_name, entity_id, match_type, confidence_score, needs_review)
        """
        if not raw_name or not raw_name.strip():
            return "General / Walk-in", None, "DEFAULT", 1.0, False

        clean_raw = self.clean_name_for_matching(raw_name)
        conn = get_db()
        cursor = conn.cursor()

        # Load existing entities of this type for the user
        cursor.execute("""
        SELECT id, canonical_name, aliases_json, contact_phone, contact_email
        FROM unified_entities
        WHERE user_id = ? AND entity_type = ?
        """, (self.user_id, entity_type))
        existing_entities = [dict(r) for r in cursor.fetchall()]

        best_entity = None
        best_score = 0.0
        best_match_type = "NEW_ENTITY"

        for ent in existing_entities:
            canon = ent["canonical_name"]
            aliases = json.loads(ent.get("aliases_json") or "[]")
            all_names = [canon] + aliases

            # 1. Exact string match (100%)
            if raw_name.strip().lower() == canon.lower() or any(raw_name.strip().lower() == a.lower() for a in aliases):
                conn.close()
                return canon, ent["id"], "EXACT_MATCH", 1.0, False

            # 2. Exact Phone / Email Match (100%)
            if phone and ent.get("contact_phone") and phone.strip() == ent["contact_phone"].strip():
                self._add_alias_to_entity(ent["id"], raw_name)
                conn.close()
                return canon, ent["id"], "PHONE_MATCH", 1.0, False

            if email and ent.get("contact_email") and email.strip().lower() == ent["contact_email"].strip().lower():
                self._add_alias_to_entity(ent["id"], raw_name)
                conn.close()
                return canon, ent["id"], "EMAIL_MATCH", 1.0, False

            # 3. Cleaned Suffix Match
            for n in all_names:
                clean_target = self.clean_name_for_matching(n)
                if clean_raw == clean_target and len(clean_raw) > 2:
                    score = 0.95
                    match_type = "SUFFIX_NORMALIZED_MATCH"
                else:
                    # Fuzzy similarity ratio
                    ratio = difflib.SequenceMatcher(
                        None, clean_raw, clean_target).ratio()
                    # Token sort bonus: check if tokens match regardless of order
                    raw_tokens = set(clean_raw.split())
                    target_tokens = set(clean_target.split())
                    if raw_tokens and target_tokens:
                        jaccard = len(raw_tokens & target_tokens) / \
                            len(raw_tokens | target_tokens)
                        combined_score = max(ratio, jaccard)
                    else:
                        combined_score = ratio

                    score = combined_score
                    match_type = "FUZZY_TOKEN_MATCH"

                if score > best_score:
                    best_score = score
                    best_entity = ent
                    best_match_type = match_type

        # Evaluate match thresholds
        if best_score >= 0.88 and best_entity:
            # High confidence automatic merge
            self._add_alias_to_entity(best_entity["id"], raw_name)
            conn.close()
            return best_entity["canonical_name"], best_entity["id"], best_match_type, round(best_score, 2), False

        elif best_score >= 0.60 and best_entity:
            # Moderate confidence -> Suggest merge, record in entity_matches for User Review
            cursor.execute("""
            INSERT INTO entity_matches (user_id, entity_type, raw_name, matched_canonical_name, matched_entity_id, match_type, confidence_score, source_file, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            """, (self.user_id, entity_type, raw_name, best_entity["canonical_name"], best_entity["id"], best_match_type, round(best_score, 2), source_file))
            conn.commit()
            conn.close()
            return best_entity["canonical_name"], best_entity["id"], "POSSIBLE_MATCH", round(best_score, 2), True

        else:
            # New Entity -> Register canonical entry
            cursor.execute("""
            INSERT INTO unified_entities (user_id, entity_type, canonical_name, aliases_json, contact_phone, contact_email)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (self.user_id, entity_type, raw_name.strip(), json.dumps([raw_name.strip()]), phone or "", email or ""))
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return raw_name.strip(), new_id, "NEW_ENTITY", 1.0, False

    def _add_alias_to_entity(self, entity_id: int, new_alias: str):
        """Adds a new alias to an existing canonical entity."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT aliases_json FROM unified_entities WHERE id = ?", (entity_id,))
        row = cursor.fetchone()
        if row:
            aliases = json.loads(row["aliases_json"] or "[]")
            if new_alias.strip() not in aliases:
                aliases.append(new_alias.strip())
                cursor.execute("""
                UPDATE unified_entities
                SET aliases_json = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (json.dumps(aliases), entity_id))
                conn.commit()
        conn.close()
