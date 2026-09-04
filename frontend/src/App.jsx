import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Views
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import DataHubView from './views/DataHubView';
import DataReviewView from './views/DataReviewView';
import UnifiedDataView from './views/UnifiedDataView';
import ShopDataEntryView from './views/ShopDataEntryView';
import ShopEstimateView from './views/ShopEstimateView';
import AiCfoView from './views/AiCfoView';
import ProfitLeaksView from './views/ProfitLeaksView';
import SimulatorView from './views/SimulatorView';
import BusinessHealthView from './views/BusinessHealthView';
import ActionPlanView from './views/ActionPlanView';
import BusinessMemoryView from './views/BusinessMemoryView';
import FindMoneyView from './views/FindMoneyView';
import SettingsView from './views/SettingsView';

// Modals
import WhyModal from './components/WhyModal';
import RescueModal from './components/RescueModal';
import FindMoneyModal from './components/FindMoneyModal';
import DailyBriefModal from './components/DailyBriefModal';
import PaymentReminderModal from './components/PaymentReminderModal';
import LineageModal from './components/LineageModal';

import { Sparkles } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('ai_cfo_token') || '');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [whyData, setWhyData] = useState(null);
  const [isWhyLoading, setIsWhyLoading] = useState(false);

  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [isFindMoneyOpen, setIsFindMoneyOpen] = useState(false);
  const [isDailyBriefOpen, setIsDailyBriefOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [selectedLineage, setSelectedLineage] = useState(null);

  const [cfoQuestion, setCfoQuestion] = useState('');

  useEffect(() => {
    if (token) {
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const [userRes, dashRes, statusRes] = await Promise.all([
        fetch('/api/auth/me', { headers }),
        fetch('/api/shop/dashboard', { headers }),
        fetch('/api/consolidation/status', { headers })
      ]);

      if (userRes.ok) {
        setUser(await userRes.json());
      } else {
        localStorage.removeItem('ai_cfo_token');
        setToken('');
        setUser(null);
        return;
      }

      if (dashRes.ok) {
        setDashboardData(await dashRes.json());
      }

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setPendingReviewsCount(sData.pending_reviews?.total_pending || 0);
      }
    } catch (err) {
      console.error("Failed to load user session", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ai_cfo_token');
    setToken('');
    setUser(null);
    setDashboardData(null);
  };

  const handleWhyClick = async (targetId, question) => {
    setIsWhyOpen(true);
    setIsWhyLoading(true);
    setWhyData(null);

    try {
      const res = await fetch('/api/shop/why', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_id: targetId, question: question })
      });
      if (res.ok) {
        setWhyData(await res.json());
      }
    } catch (err) {
      console.error("Why engine error", err);
    } finally {
      setIsWhyLoading(false);
    }
  };

  const handleOpenReminder = (debtor) => {
    setSelectedDebtor(debtor || {
      customerName: "Customer Account",
      amountDue: 15000,
      daysOverdue: 35,
      invoiceRef: "INV-01"
    });
    setIsReminderOpen(true);
  };

  const handleInspectLineage = (record) => {
    setSelectedLineage(record);
    setIsLineageOpen(true);
  };

  // If user is not authenticated, show Login & Registration screen
  if (!token || !user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">

      {/* Top Header */}
      <Header
        user={user}
        healthScore={dashboardData?.health_score}
        leaksCount={dashboardData?.profit_leaks?.length || 0}
        onLogout={handleLogout}
        onOpenRescue={() => setIsRescueOpen(true)}
        onOpenFindMoney={() => setIsFindMoneyOpen(true)}
        onOpenDailyBrief={() => setIsDailyBriefOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-8">

        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leaksCount={dashboardData?.profit_leaks?.length || 0}
          weakestArea={dashboardData?.health_score?.weakest_area}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-teal-400 animate-spin" />
              <div className="text-base font-bold text-slate-200">
                Loading Consolidated Business Data...
              </div>
              <p className="text-xs text-slate-500">
                Running deterministic calculations across single source of truth
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  dashboardData={dashboardData}
                  onWhyClick={handleWhyClick}
                  onNavigateTab={setActiveTab}
                  onOpenRescue={() => setIsRescueOpen(true)}
                  onOpenFindMoney={() => setIsFindMoneyOpen(true)}
                />
              )}

              {activeTab === 'datahub' && (
                <DataHubView
                  token={token}
                  onConsolidationCompleted={loadUserData}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'review' && (
                <DataReviewView
                  token={token}
                  onReviewResolved={loadUserData}
                />
              )}

              {activeTab === 'unified' && (
                <UnifiedDataView
                  token={token}
                  onInspectLineage={handleInspectLineage}
                />
              )}

              {(activeTab === 'dataentry' || activeTab === 'sales') && (
                <ShopDataEntryView
                  token={token}
                  onDataChanged={loadUserData}
                  onOpenReminder={handleOpenReminder}
                  initialSubTab="sales"
                />
              )}

              {activeTab === 'products' && (
                <ShopDataEntryView
                  token={token}
                  onDataChanged={loadUserData}
                  onOpenReminder={handleOpenReminder}
                  initialSubTab="products"
                />
              )}

              {activeTab === 'expenses' && (
                <ShopDataEntryView
                  token={token}
                  onDataChanged={loadUserData}
                  onOpenReminder={handleOpenReminder}
                  initialSubTab="expenses"
                />
              )}

              {activeTab === 'receivables' && (
                <ShopDataEntryView
                  token={token}
                  onDataChanged={loadUserData}
                  onOpenReminder={handleOpenReminder}
                  initialSubTab="receivables"
                />
              )}

              {activeTab === 'estimate' && (
                <ShopEstimateView
                  token={token}
                  onEstimateSaved={loadUserData}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'advisor' && (
                <AiCfoView
                  token={token}
                  dashboardData={dashboardData}
                  onWhyClick={handleWhyClick}
                  initialQuestion={cfoQuestion}
                />
              )}

              {activeTab === 'leaks' && (
                <ProfitLeaksView
                  leaksData={dashboardData?.profit_leaks}
                  onWhyClick={handleWhyClick}
                />
              )}

              {activeTab === 'simulator' && (
                <SimulatorView
                  token={token}
                  dashboardData={dashboardData}
                />
              )}

              {activeTab === 'health' && (
                <BusinessHealthView
                  healthScore={dashboardData?.health_score}
                  onWhyClick={handleWhyClick}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'actions' && (
                <ActionPlanView
                  token={token}
                  onOpenReminder={handleOpenReminder}
                  onNavigateTab={setActiveTab}
                />
              )}

              {activeTab === 'memory' && (
                <BusinessMemoryView token={token} />
              )}

              {activeTab === 'findmoney' && (
                <FindMoneyView
                  token={token}
                  onNavigateTab={setActiveTab}
                  onOpenReminder={handleOpenReminder}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={user}
                  token={token}
                  onUpdateProfile={(updatedUser) => {
                    setUser(updatedUser);
                    loadUserData();
                  }}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* 1. AI Why Engine Modal */}
      <WhyModal
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        whyData={whyData}
        isLoading={isWhyLoading}
        onAskCfo={(title) => {
          setCfoQuestion(`Can you explain the mathematical cause of: ${title}?`);
          setActiveTab('advisor');
        }}
      />

      {/* 2. Profit Rescue Mode Hero Modal */}
      <RescueModal
        isOpen={isRescueOpen}
        onClose={() => setIsRescueOpen(false)}
        onOpenReminder={() => handleOpenReminder(null)}
        onNavigateTab={setActiveTab}
      />

      {/* 3. Find My Money Modal */}
      <FindMoneyModal
        isOpen={isFindMoneyOpen}
        onClose={() => setIsFindMoneyOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* 4. Daily Business Briefing Modal */}
      <DailyBriefModal
        isOpen={isDailyBriefOpen}
        onClose={() => setIsDailyBriefOpen(false)}
      />

      {/* 5. 1-Click Debtor Payment Reminder Modal */}
      <PaymentReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        debtorInfo={selectedDebtor}
      />

      {/* 6. Data Lineage Inspector Modal */}
      <LineageModal
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        lineageData={selectedLineage}
      />

    </div>
  );
}
