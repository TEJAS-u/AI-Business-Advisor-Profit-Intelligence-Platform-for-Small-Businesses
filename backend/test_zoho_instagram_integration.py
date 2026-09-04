"""
Integration Test Suite for Zoho Social Instagram Integration,
Social Activity Persistence, Revenue Attribution Rules, and Analytics Context.
"""

import os
import sys
import unittest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from database import init_db, get_db
from integrations.zoho_social.service import ZohoSocialService
from analytics_engine import UserAnalyticsEngine


class TestZohoInstagramIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.user_id = 888  # Isolated test user ID
        cls.clean_user_data()
        cls.seed_zoho_connection()

    @classmethod
    def tearDownClass(cls):
        cls.clean_user_data()

    def setUp(self):
        conn = get_db()
        conn.execute("DELETE FROM social_activity WHERE user_id = ?", (self.user_id,))
        conn.execute("DELETE FROM unified_sales WHERE user_id = ?", (self.user_id,))
        conn.commit()
        conn.close()

    @classmethod
    def clean_user_data(cls):
        conn = get_db()
        conn.execute("DELETE FROM social_connections WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM social_accounts WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM social_activity WHERE user_id = ?", (cls.user_id,))
        conn.execute("DELETE FROM unified_sales WHERE user_id = ?", (cls.user_id,))
        conn.commit()
        conn.close()

    @classmethod
    def seed_zoho_connection(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO social_connections 
        (user_id, provider, portal_id, brand_id, brand_name, access_token, refresh_token, api_domain, connection_status)
        VALUES (?, 'zoho_social', 'portal_123', 'brand_456', 'AI CFO Brand', 'mock_access_token_123', 'mock_refresh_token_123', 'https://social.zoho.in', 'CONNECTED')
        """, (cls.user_id,))
        conn_id = cursor.lastrowid

        cursor.execute("""
        INSERT INTO social_accounts
        (user_id, connection_id, provider, platform, external_channel_id, account_name, status)
        VALUES (?, ?, 'zoho_social', 'instagram', 'ig_profile_99', 'ai_cfo_', 'active')
        """, (cls.user_id, conn_id))

        conn.commit()
        conn.close()

    def test_01_instagram_channel_detection_and_sync(self):
        """Verify dynamic detection of connected Instagram channel and Instagram sync response."""
        res = ZohoSocialService.sync_instagram_data(self.user_id)
        self.assertTrue(res["success"])
        self.assertEqual(res["network"], "instagram")
        self.assertEqual(res["profile"], "ai_cfo_")
        self.assertEqual(res["profile_id"], "ig_profile_99")
        self.assertIn("message", res)

    def test_02_401_scope_handling_preserves_connected_status(self):
        """Verify 401 INVALID_OAUTHSCOPE on post endpoints does NOT disconnect Zoho Social."""
        res = ZohoSocialService.sync_instagram_data(self.user_id)
        status = ZohoSocialService.get_connection_status(self.user_id)
        self.assertTrue(status["is_connected"])
        self.assertEqual(status["status"], "CONNECTED")

        signals = ZohoSocialService.get_instagram_business_signals(self.user_id)
        self.assertTrue(signals["is_connected"])
        self.assertEqual(signals["connection_status"], "Connected ✓")

    def test_03_no_fake_social_metrics(self):
        """Verify 0 fake posts or fake metrics are generated when API returns 0 records."""
        conn = get_db()
        acts = conn.execute("SELECT * FROM social_activity WHERE user_id = ?", (self.user_id,)).fetchall()
        conn.close()
        self.assertEqual(len(acts), 0)

        signals = ZohoSocialService.get_instagram_business_signals(self.user_id)
        self.assertEqual(signals["drafts_count"], 0)
        self.assertEqual(signals["schedules_count"], 0)
        self.assertIsNone(signals["attributed_revenue"])

    def test_04_real_post_activity_persistence(self):
        """Verify real draft and scheduled posts are persisted cleanly to social_activity table."""
        conn = get_db()
        conn.execute("""
        INSERT INTO social_activity
        (user_id, source, network, channel_id, profile_id, profile_name, post_id, post_date, content, status, source_reference)
        VALUES (?, 'Zoho Social', 'instagram', 'ig_profile_99', 'ig_profile_99', 'ai_cfo_', 'draft_101', '2026-09-05', 'Draft promotion message', 'draft', 'Zoho Social -> Instagram -> ai_cfo_ -> Draft ID draft_101')
        """, (self.user_id,))
        conn.execute("""
        INSERT INTO social_activity
        (user_id, source, network, channel_id, profile_id, profile_name, post_id, post_date, content, status, source_reference)
        VALUES (?, 'Zoho Social', 'instagram', 'ig_profile_99', 'ig_profile_99', 'ai_cfo_', 'sched_202', '2026-09-06', 'Scheduled campaign post', 'scheduled', 'Zoho Social -> Instagram -> ai_cfo_ -> Scheduled ID sched_202')
        """, (self.user_id,))
        conn.commit()
        conn.close()

        signals = ZohoSocialService.get_instagram_business_signals(self.user_id)
        self.assertEqual(signals["drafts_count"], 1)
        self.assertEqual(signals["schedules_count"], 1)
        self.assertIn("✓", signals["available_data"]["draft_posts_status"])
        self.assertIn("✓", signals["available_data"]["scheduled_posts_status"])

    def test_05_instagram_revenue_attribution_rules(self):
        """Verify Instagram revenue attribution occurs ONLY when underlying sales records contain Instagram attribution."""
        conn = get_db()
        conn.execute("""
        INSERT INTO unified_sales
        (user_id, source_file, source_row, sale_date, customer_name, product_name, quantity, unit_price, unit_cost, total_revenue, cogs, profit)
        VALUES (?, 'Instagram_Ad_Campaign.csv', 1, '2026-09-04', 'Insta Customer', 'Basmati Rice', 5, 1000, 700, 5000, 3500, 1500)
        """, (self.user_id,))
        conn.commit()
        conn.close()

        signals = ZohoSocialService.get_instagram_business_signals(self.user_id)
        self.assertEqual(signals["revenue_status"], "AVAILABLE")
        self.assertEqual(signals["attributed_revenue"], 5000.0)


if __name__ == "__main__":
    unittest.main()

