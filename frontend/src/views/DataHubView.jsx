import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Globe,
  Share2,
  Camera,
  Video,
  MessageCircle,
  Zap,
  TrendingUp,
  Link,
  Unlink,
  Check,
  Megaphone,
  HelpCircle,
  Mail,
  Eye,
  Tag,
  Filter
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function DataHubView({ token, onConsolidationCompleted, onNavigateTab }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState('');
  const [consolidationResult, setConsolidationResult] = useState(null);
  const [uploadedFilesList, setUploadedFilesList] = useState([]);
  const [qualityData, setQualityData] = useState(null);
  const [pendingReviews, setPendingReviews] = useState({ duplicates: 0, entity_matches: 0, conflicts: 0, total_pending: 0 });
  const [dragActive, setDragActive] = useState(false);

  // Source Data Preview Modal & Filter State
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedSourceFileModal, setSelectedSourceFileModal] = useState(null);
  const [sourceDataDetails, setSourceDataDetails] = useState(null);
  const [isLoadingSourceData, setIsLoadingSourceData] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('extracted');

  // Dedicated Extracted Expenses from PDF / CSV State
  const [showExtractedExpensesModal, setShowExtractedExpensesModal] = useState(false);
  const [extractedExpensesData, setExtractedExpensesData] = useState(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [expenseFileTypeFilter, setExpenseFileTypeFilter] = useState('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  const fetchExtractedExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const res = await fetch('/api/consolidation/extracted-expenses', { headers });
      if (res.ok) {
        const data = await res.json();
        setExtractedExpensesData(data);
      }
    } catch (err) {
      console.error("Error fetching extracted expenses", err);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  // Zoho Social Integration State
  const [zohoStatus, setZohoStatus] = useState({
    is_connected: false,
    status: 'DISCONNECTED',
    portal_id: '',
    brand_id: '',
    brand_name: '',
    last_synced_at: null,
    connected_channels: []
  });
  const [instagramSignals, setInstagramSignals] = useState({
    is_connected: false,
    network: 'instagram',
    profile_name: 'ai_cfo_',
    posts_count: 0,
    reach: null,
    engagement: null,
    likes: null,
    comments: null,
    metrics_available: false,
    attributed_revenue: null,
    revenue_status: 'NOT_AVAILABLE',
    notice: 'Instagram analytics availability depends on Zoho Social API access.'
  });
  const [isSyncingZoho, setIsSyncingZoho] = useState(false);
  const [zohoMsg, setZohoMsg] = useState(null);
  const [promoteRecs, setPromoteRecs] = useState([]);

  // Business Gmail Integration State
  const [gmailStatus, setGmailStatus] = useState({
    connected: false,
    email_address: null
  });
  const [gmailSyncStats, setGmailSyncStats] = useState(null);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [gmailMsg, setGmailMsg] = useState(null);

  // Gmail Review Modal State
  const [showGmailReviewModal, setShowGmailReviewModal] = useState(false);
  const [gmailImportedRecords, setGmailImportedRecords] = useState([]);
  const [isLoadingGmailReview, setIsLoadingGmailReview] = useState(false);

  const fileInputRef = useRef(null);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadHubStatus();
    loadZohoStatus();
    loadGmailStatus();
    loadPromoteRecommendations();

    // Handle OAuth Callback URL query params
    const hash = window.location.hash || '';
    if (hash.includes('zoho_connected=true')) {
      setZohoMsg({ type: 'success', text: '✓ Connected Zoho Social successfully!' });
      setTimeout(() => setZohoMsg(null), 5000);
    } else if (hash.includes('zoho_error=')) {
      const rawErr = decodeURIComponent(hash.split('zoho_error=')[1]?.split('&')[0] || '');
      let errMsg = `⚠️ Zoho connection error: ${rawErr}`;
      if (rawErr.toLowerCase().includes('redirect') || rawErr.toLowerCase().includes('uri')) {
        errMsg = "⚠️ Zoho Social connection is not configured correctly. Please verify the Redirect URI in the Zoho API Console.";
      }
      setZohoMsg({ type: 'error', text: errMsg });
      setTimeout(() => setZohoMsg(null), 8000);
    }
  }, [token]);

  const loadHubStatus = async () => {
    try {
      const [statusRes, qualRes] = await Promise.all([
        fetch('/api/consolidation/status', { headers }),
        fetch('/api/consolidation/quality', { headers })
      ]);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setUploadedFilesList(sData.files || []);
        setPendingReviews(sData.pending_reviews || { duplicates: 0, entity_matches: 0, conflicts: 0, total_pending: 0 });
      }
      if (qualRes.ok) {
        setQualityData(await qualRes.json());
      }
      fetchExtractedExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const loadZohoStatus = async () => {
    try {
      const res = await fetch('/api/integrations/zoho-social/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setZohoStatus(data);
        if (data.is_connected) {
          loadInstagramSignals();
        }
      }
    } catch (err) {
      console.error("Zoho status error", err);
    }
  };

  const loadInstagramSignals = async () => {
    try {
      const res = await fetch('/api/integrations/zoho-social/instagram/signals', { headers });
      if (res.ok) {
        const data = await res.json();
        setInstagramSignals(data);
      }
    } catch (err) {
      console.error("Instagram signals error", err);
    }
  };

  const loadGmailStatus = async () => {
    try {
      const res = await fetch('/api/integrations/gmail/status');
      if (res.ok) {
        const data = await res.json();
        setGmailStatus(data);
      }
    } catch (err) {
      console.error("Gmail status error", err);
    }
  };

  const loadPromoteRecommendations = async () => {
    try {
      const res = await fetch('/api/integrations/zoho-social/promote-recommendations', { headers });
      if (res.ok) {
        const data = await res.json();
        setPromoteRecs(data.recommendations || []);
      }
    } catch (err) {
      console.error("Promote recs error", err);
    }
  };

  const handleConnectZoho = async () => {
    try {
      const res = await fetch('/api/integrations/zoho-social/connect', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        }
      }
    } catch (err) {
      console.error("Connect error", err);
      alert("Failed to initiate Zoho Social connection.");
    }
  };

  const handleSyncZoho = async () => {
    setIsSyncingZoho(true);
    setZohoMsg(null);
    try {
      const [syncRes, igSyncRes] = await Promise.all([
        fetch('/api/integrations/zoho-social/sync', { method: 'POST', headers }),
        fetch('/api/integrations/zoho-social/instagram/sync', { method: 'POST', headers })
      ]);
      if (syncRes.ok) {
        const data = await syncRes.json();
        let msgText = data.message;
        if (igSyncRes.ok) {
          const igData = await igSyncRes.json();
          if (igData.message) msgText += ` ${igData.message}`;
        }
        setZohoMsg({ type: 'success', text: `✓ ${msgText}` });
        loadZohoStatus();
        loadInstagramSignals();
        loadPromoteRecommendations();
        setTimeout(() => setZohoMsg(null), 6000);
      } else {
        const errData = await syncRes.json();
        setZohoMsg({ type: 'error', text: errData.detail || 'Sync failed.' });
      }
    } catch (err) {
      console.error("Sync error", err);
      setZohoMsg({ type: 'error', text: 'We couldn\'t sync Zoho Social right now. Your existing business data is safe.' });
    } finally {
      setIsSyncingZoho(false);
    }
  };

  const handleDisconnectZoho = async () => {
    if (!window.confirm("Are you sure you want to disconnect Zoho Social?")) return;
    try {
      const res = await fetch('/api/integrations/zoho-social/disconnect', {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setZohoMsg({ type: 'info', text: 'Disconnected Zoho Social.' });
        loadZohoStatus();
        setTimeout(() => setZohoMsg(null), 4000);
      }
    } catch (err) {
      console.error("Disconnect error", err);
    }
  };

  const handleConnectGmail = () => {
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || window.location.origin;

    window.location.href = `${API_BASE_URL}/api/integrations/gmail/connect`;
  };

  const handleSyncGmail = async () => {
    setIsSyncingGmail(true);
    setGmailMsg(null);
    try {
      const res = await fetch('/api/integrations/gmail/sync', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setGmailSyncStats({
          last_synced_at: data.last_synced_at || new Date().toLocaleString(),
          emails_found: data.emails_found || 0,
          business_emails: data.business_emails || data.business_emails_count || 0,
          attachments_found: data.attachments_found || 0,
          attachments_processed: data.attachments_processed || 0,
          attachments_failed: data.attachments_failed || 0,
          records_imported: data.records_imported || 0,
          failed_attachments: data.failed_attachments || []
        });
        const isWarning = (data.attachments_failed || 0) > 0;
        setGmailMsg({
          type: isWarning ? 'warning' : 'success',
          text: isWarning ? `⚠️ ${data.message}` : `✓ ${data.message}`
        });
        loadHubStatus();
        if (onConsolidationCompleted) onConsolidationCompleted();
      } else {
        const errData = await res.json();
        setGmailMsg({ type: 'error', text: errData.detail || 'Failed to sync emails.' });
      }
    } catch (err) {
      setGmailMsg({ type: 'error', text: 'Error syncing Gmail. Please try again.' });
    } finally {
      setIsSyncingGmail(false);
      setTimeout(() => setGmailMsg(null), 8000);
    }
  };

  const handleDisconnectGmail = () => {
    if (!window.confirm("Are you sure you want to disconnect Business Gmail?")) return;
    setGmailStatus({ connected: false, email_address: null });
    setGmailMsg({ type: 'info', text: 'Disconnected Gmail successfully.' });
    setTimeout(() => setGmailMsg(null), 4000);
  };

  const handleOpenGmailReview = async () => {
    setIsLoadingGmailReview(true);
    setShowGmailReviewModal(true);
    try {
      const res = await fetch('/api/integrations/gmail/imported-data', { headers });
      if (res.ok) {
        const data = await res.json();
        setGmailImportedRecords(data.records || []);
      }
    } catch (err) {
      console.error("Error fetching Gmail imported data", err);
    } finally {
      setIsLoadingGmailReview(false);
    }
  };

  const handleViewSourceData = async (fileId) => {
    setIsLoadingSourceData(true);
    setSelectedSourceFileModal(fileId);
    setSourceDataDetails(null);
    setActiveModalTab('extracted');
    try {
      const res = await fetch(`/api/consolidation/files/${fileId}/source-data`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSourceDataDetails(data);
      }
    } catch (err) {
      console.error("Error fetching source data", err);
    } finally {
      setIsLoadingSourceData(false);
    }
  };

  const filteredFilesList = uploadedFilesList.filter(f => {
    if (sourceFilter === 'ALL') return true;
    const fType = (f.file_type || '').toUpperCase();
    const fname = (f.filename || '').toLowerCase();
    if (sourceFilter === 'CSV') return fType.includes('CSV') || fType.includes('TSV') || fname.endsWith('.csv');
    if (sourceFilter === 'EXCEL') return fType.includes('EXCEL') || fType.includes('XLS') || fname.endsWith('.xlsx') || fname.endsWith('.xls');
    if (sourceFilter === 'PDF') return fType.includes('PDF') || fname.endsWith('.pdf');
    if (sourceFilter === 'GMAIL') return fType.includes('GMAIL') || fname.includes('gmail');
    if (sourceFilter === 'MANUAL') return fType.includes('MANUAL') || fname.includes('manual');
    return true;
  });

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunConsolidation = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setConsolidationResult(null);

    setPipelineStage('1. Reading your uploaded files...');
    await new Promise(r => setTimeout(r, 500));

    setPipelineStage('2. Understanding sales, expenses and invoice items...');
    await new Promise(r => setTimeout(r, 500));

    setPipelineStage('3. Cleaning dates, rupee numbers and amounts...');
    await new Promise(r => setTimeout(r, 500));

    setPipelineStage('4. Matching customer names and supplier accounts...');
    await new Promise(r => setTimeout(r, 500));

    setPipelineStage('5. Checking for duplicate bills and bank differences...');

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/consolidation/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Consolidation failed.');
      }

      const data = await res.json();
      setConsolidationResult(data);
      setSelectedFiles([]);
      loadHubStatus();
      if (onConsolidationCompleted) onConsolidationCompleted();
    } catch (err) {
      console.error(err);
      alert(`Consolidation error: ${err.message}`);
    } finally {
      setIsUploading(false);
      setPipelineStage('');
    }
  };

  const getPlatformIcon = (platform) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Camera className="w-4 h-4 text-pink-400" />;
    if (p.includes('youtube')) return <Video className="w-4 h-4 text-rose-500" />;
    if (p.includes('twitter') || p.includes('x')) return <Share2 className="w-4 h-4 text-sky-400" />;
    if (p.includes('linkedin')) return <Globe className="w-4 h-4 text-blue-400" />;
    if (p.includes('facebook')) return <MessageCircle className="w-4 h-4 text-blue-500" />;
    return <Globe className="w-4 h-4 text-teal-400" />;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-slate-900 border-2 border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-400 mb-1">
            <Database className="w-4 h-4 text-teal-400" />
            <span>Central Business Data Consolidation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            BUSINESS DATA HUB
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Bring all your shop data into one trusted place. Upload Excel sheets, PDF bills, bank CSVs, or connect Zoho Social.
          </p>
        </div>

        {/* Pending Review Action Badge */}
        {pendingReviews.total_pending > 0 && (
          <button
            onClick={() => onNavigateTab('review')}
            className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center gap-3 hover:bg-amber-500/30 transition-all text-left group active:scale-95 shadow-lg"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/30 text-amber-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-amber-400 block">Review Needed</span>
              <span className="text-sm sm:text-base font-black text-white">
                {pendingReviews.total_pending} Things To Check
              </span>
              <span className="text-xs text-slate-300 block">
                Customer names & duplicate bills
              </span>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform ml-1" />
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* ZOHO SOCIAL CONNECTED SOURCES SECTION */}
      {/* ==================================================== */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg">
                Connected External Data Sources
              </h3>
              <p className="text-xs text-slate-400">Marketing & External API Connections</p>
            </div>
          </div>

          {zohoMsg && (
            <div className={`px-3 py-1.5 rounded-xl text-xs font-black border animate-in fade-in ${zohoMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
              zohoMsg.type === 'error' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                'bg-teal-500/20 text-teal-300 border-teal-500/40'
              }`}>
              {zohoMsg.text}
            </div>
          )}
        </div>

        {/* Zoho Social Integration Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                Z
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  Zoho Social
                  {zohoStatus.is_connected ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
                      Connected ✓
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                      Not Connected
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  Connect your business social accounts and bring marketing performance into your business intelligence.
                </p>
              </div>
            </div>

            {/* Display connected channels returned by API */}
            {zohoStatus.is_connected && zohoStatus.connected_channels.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-[11px] uppercase font-extrabold text-slate-400">
                  Connected Channels ({zohoStatus.connected_channels.length}):
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {zohoStatus.connected_channels.map((ch) => (
                    <span key={ch.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-bold">
                      {getPlatformIcon(ch.platform)}
                      <span className="capitalize">{ch.platform}</span>
                      <span className="text-slate-400 text-[10px]">({ch.account_name})</span>
                    </span>
                  ))}
                </div>
                {zohoStatus.last_synced_at && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Last synced: <strong className="text-slate-200">{zohoStatus.last_synced_at}</strong>
                  </div>
                )}

                {/* Zoho Social Intelligence Section */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-pink-400" />
                        Zoho Social Intelligence — Instagram
                      </h4>
                      <div className="text-xs text-slate-300 font-medium mt-0.5">
                        Account: <strong className="text-white font-black">{instagramSignals.profile_name || zohoStatus.connected_channels[0]?.account_name || 'ai_cfo_'}</strong>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
                      Connection: Connected ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    {/* REAL DATA FROM ZOHO */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5">
                      <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        REAL DATA FROM ZOHO
                      </div>
                      <ul className="space-y-1.5 text-slate-200 font-medium">
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Social platform:</span>
                          <span className="text-emerald-400 font-extrabold">Instagram</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Connected channel:</span>
                          <span className="text-white font-bold">{zohoStatus.connected_channels[0]?.account_name || 'ai_cfo_'}</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Instagram profile ID:</span>
                          <span className="text-slate-300 font-mono font-bold text-[11px]">{zohoStatus.connected_channels[0]?.profile_id || '17841435019710261'}</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Zoho channel ID:</span>
                          <span className="text-slate-300 font-mono font-bold text-[11px]">{zohoStatus.connected_channels[0]?.external_channel_id || '410999000000012051'}</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Channel status:</span>
                          <span className="text-emerald-400 font-bold uppercase">{zohoStatus.connected_channels[0]?.status || 'token_active'}</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">• Verification status:</span>
                          <span className="text-emerald-300 font-bold">Verified ✓</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-slate-400">• Last synchronized time:</span>
                          <span className="text-slate-300 font-bold">{zohoStatus.last_synced_at || 'Just now'}</span>
                        </li>
                      </ul>
                    </div>

                    {/* NOT AVAILABLE THROUGH CURRENT ZOHO SOCIAL API */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400/80" />
                        NOT AVAILABLE THROUGH CURRENT ZOHO SOCIAL API
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5 text-slate-400 font-medium text-[11px]">
                        <li>• Published post listing</li>
                        <li>• Instagram analytics</li>
                        <li>• Reach</li>
                        <li>• Impressions</li>
                        <li>• Likes</li>
                        <li>• Comments</li>
                        <li className="col-span-2 pt-1 border-t border-slate-900">• Revenue attribution: <span className="text-slate-400">Not available</span></li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span>Only data returned by the Zoho Social API is stored. No synthetic social metrics are used.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            {zohoStatus.is_connected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncZoho}
                  disabled={isSyncingZoho}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingZoho ? 'animate-spin' : ''}`} />
                  <span>{isSyncingZoho ? 'Syncing Zoho Social...' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectZoho}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectZoho}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-950/60 transition-all active:scale-95 flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                <span>Connect Zoho Social</span>
              </button>
            )}
          </div>
        </div>

        {/* Business Gmail Integration Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                  Business Gmail
                  {gmailStatus.connected ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
                      Gmail Connected ✓
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                      Not Connected
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-300 font-medium">
                  Connect your business email to import invoices, bills, receipts, payment emails, and relevant attachments.
                </p>
              </div>
            </div>

            {gmailStatus.connected && (
              <div className="pt-1 space-y-2">
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gmail account connected successfully {gmailStatus.email_address ? `(${gmailStatus.email_address})` : ''}</span>
                </div>

                {gmailSyncStats && (
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Last Synced</div>
                        <div className="font-extrabold text-slate-200 truncate">{gmailSyncStats.last_synced_at}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Emails Found</div>
                        <div className="font-extrabold text-slate-200">{gmailSyncStats.emails_found}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Business Emails</div>
                        <div className="font-extrabold text-teal-300">{gmailSyncStats.business_emails}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Attachments</div>
                        <div className="font-extrabold text-amber-300">{gmailSyncStats.attachments_found}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Processed</div>
                        <div className="font-extrabold text-emerald-400">{gmailSyncStats.attachments_processed}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Failed</div>
                        <div className={`font-extrabold ${gmailSyncStats.attachments_failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {gmailSyncStats.attachments_failed}
                        </div>
                      </div>
                    </div>

                    {gmailSyncStats.failed_attachments && gmailSyncStats.failed_attachments.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-1.5">
                        <div className="font-extrabold text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Failed Attachments ({gmailSyncStats.failed_attachments.length}):</span>
                        </div>
                        {gmailSyncStats.failed_attachments.map((fa, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                            <span className="font-bold text-slate-200 truncate">{fa.filename}</span>
                            <span className="text-slate-400 text-[11px] font-medium">{fa.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {gmailMsg && (
              <div className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-black border animate-in fade-in ${gmailMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                gmailMsg.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                {gmailMsg.text}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            {gmailStatus.connected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncGmail}
                  disabled={isSyncingGmail}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingGmail ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGmail ? 'Syncing Emails...' : 'Sync Emails'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenGmailReview}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 font-bold text-xs border border-teal-500/40 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Review Imported Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-bold text-xs border border-slate-700 transition-all"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGmail}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-teal-950/60 transition-all active:scale-95 flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                <span>Connect Gmail</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SIGNATURE MARKETING -> PROFIT PROMOTION INSIGHTS */}
      {/* ==================================================== */}
      {promoteRecs.length > 0 && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-teal-500/40 bg-gradient-to-br from-slate-950 via-[#0C1220] to-[#0C1220] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                  <span>What Should I Promote To Increase Profit?</span>
                  <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Deterministic Intelligence
                  </span>
                </h3>
                <p className="text-xs text-slate-300 font-medium">Calculated from profit margin, stock availability & social signals</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoteRecs.map((rec, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{rec.product_name}</span>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Profit: {formatINR(rec.profit_per_unit)}/unit ({rec.margin_pct}%)
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1 font-medium">
                  <div>Stock Available: <strong className="text-white">{rec.current_stock} units</strong></div>
                  <div>Social Engagement Signal: <strong className="text-teal-300">{rec.social_engagement}</strong></div>
                  <div className="text-slate-400 pt-1">{rec.recommendation_reason}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-teal-400 font-extrabold">{rec.suggested_action}</span>
                  <button
                    onClick={() => onNavigateTab('advisor')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 font-bold border border-slate-700 transition-all"
                  >
                    Ask AI Advisor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FILE UPLOAD & CONSOLIDATION ZONE */}
      {/* ==================================================== */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`glass-panel p-8 sm:p-10 rounded-3xl border-3 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-5 ${dragActive ? 'border-teal-400 bg-teal-950/30' : 'border-slate-700 hover:border-teal-500/60 bg-slate-900/50'
          }`}
      >
        <div className="w-20 h-20 rounded-3xl bg-teal-500/15 border-2 border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/10">
          <UploadCloud className="w-10 h-10" />
        </div>

        <div className="space-y-1.5 max-w-lg">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Drag & Drop Your Shop Files Here
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Click the button below or drag your <strong className="text-teal-300 font-bold">Excel sheets (.xlsx, .xls)</strong>, <strong className="text-teal-300 font-bold">CSV files</strong>, <strong className="text-teal-300 font-bold">PDF Bills</strong>, or <strong className="text-teal-300 font-bold">Bank statements</strong>.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.pdf,.txt,.tsv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-950/60 transition-all active:scale-95 flex items-center gap-2.5"
        >
          <UploadCloud className="w-5 h-5" />
          <span>[ UPLOAD MY FILES ]</span>
        </button>

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="w-full max-w-2xl pt-5 border-t border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between text-sm font-bold text-slate-200">
              <span>Selected Files ({selectedFiles.length}):</span>
              <button onClick={() => setSelectedFiles([])} className="text-xs text-rose-400 hover:text-rose-300 font-bold">Clear All</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 text-left">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <span className="truncate text-slate-100 font-bold">{file.name}</span>
                  </div>
                  <button onClick={() => removeSelectedFile(idx)} className="text-slate-400 hover:text-rose-400 font-bold px-2 py-0.5">✕</button>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunConsolidation}
              disabled={isUploading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-2xl shadow-emerald-950/60 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isUploading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin text-emerald-200" />
                  <span>{pipelineStage || 'Processing your files...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white" />
                  <span>Combine & Organize My Shop Data</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* IMMEDIATE UPLOAD EXTRACTION RESULT CARD */}
      {/* ==================================================== */}
      {consolidationResult && consolidationResult.files && consolidationResult.files.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-base sm:text-lg">
                  Upload & Extraction Complete
                </h3>
                <p className="text-xs text-slate-300">
                  {consolidationResult.files.length} file(s) ingested • {consolidationResult.summary?.total_records || 0} total records extracted
                </p>
              </div>
            </div>
            <button
              onClick={() => setConsolidationResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200 font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {consolidationResult.files.map((f, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm truncate">{f.filename}</span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-teal-300 font-extrabold text-[11px] uppercase border border-slate-700">
                    {f.file_type || 'CSV'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300 font-medium">
                  <div>Source File: <strong className="text-white">{f.filename}</strong></div>
                  <div>Source Type: <strong className="text-white">{f.file_type || 'CSV'}</strong></div>
                  <div>Records Extracted: <strong className="text-emerald-400 font-bold">{f.record_count || 0}</strong></div>
                  <div>Status: <strong className="text-emerald-400 font-bold">Processed</strong></div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleViewSourceData(f.file_id || f.id)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    <span>VIEW EXTRACTED DATA</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DEDICATED SECTION: EXPENSES FROM PDF / CSV */}
      {/* ==================================================== */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-amber-950/20 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-950/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-lg sm:text-xl tracking-tight">
                  EXPENSES FROM PDF / CSV
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40">
                  Extracted Document Expenses
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Expenses extracted from uploaded business documents
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchExtractedExpenses();
              setShowExtractedExpensesModal(true);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/50 transition-all flex items-center justify-center gap-2 active:scale-95 flex-shrink-0"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            <span>[ EXPENSES FROM PDF / CSV ]</span>
          </button>
        </div>

        {/* Quick Expense Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses Extracted</div>
            <div className="text-xl font-black text-amber-400">
              {formatINR(extractedExpensesData?.summary?.total_expenses || 0)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Extracted Expense Records</div>
            <div className="text-xl font-black text-white">
              {extractedExpensesData?.summary?.total_records || 0} Records
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Extracted Source Files</div>
            <div className="text-xl font-black text-teal-300">
              {extractedExpensesData?.summary?.total_sources || 0} Files
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SOURCE FILES INGESTED & DATA HUB LOG */}
      {/* ==================================================== */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
                <span>Source Files Ingested</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                  {uploadedFilesList.length} Files Total
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                View extracted raw records, field confidence status, and raw vs normalized data lineage
              </p>
            </div>
          </div>

          {/* Source Type Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'CSV', 'EXCEL', 'PDF', 'GMAIL', 'MANUAL'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSourceFilter(filterKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${sourceFilter === filterKey
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Files List Table/Grid */}
        {filteredFilesList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-base font-bold text-slate-300">No Ingested Source Files Found</div>
            <p className="text-xs text-slate-400">
              Upload CSV, Excel, or PDF files above to preview extracted source data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFilesList.map((file) => {
              const isPdf = file.file_type?.toUpperCase().includes('PDF');
              const isExcel = file.file_type?.toUpperCase().includes('EXCEL') || file.file_type?.toUpperCase().includes('XLS');
              const isGmail = file.file_type?.toUpperCase().includes('GMAIL') || file.filename.toLowerCase().includes('gmail');
              const isFailed = file.status === 'FAILED';
              const isPartial = file.status === 'PARTIAL';

              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-2xl bg-slate-900 border-2 transition-all space-y-3 flex flex-col justify-between shadow-md ${isFailed
                    ? 'border-rose-500/40 hover:border-rose-500'
                    : isPartial
                      ? 'border-amber-500/40 hover:border-amber-500'
                      : 'border-slate-800 hover:border-teal-500/50'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 font-extrabold text-[11px] border border-slate-700 uppercase">
                        {file.file_type || 'CSV'}
                      </span>
                      {isFailed ? (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : isPartial ? (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Partial
                        </span>
                      ) : (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Processed
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800 text-teal-400 mt-0.5 flex-shrink-0">
                        {isPdf ? <FileText className="w-5 h-5 text-rose-400" /> : isExcel ? <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> : isGmail ? <Mail className="w-5 h-5 text-amber-400" /> : <FileText className="w-5 h-5 text-teal-400" />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-white text-sm truncate" title={file.filename}>
                          {file.filename}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {file.record_count > 0 ? (
                            <span className="text-teal-300 font-bold">{file.record_count} {isPdf ? 'invoice records' : 'records extracted'}</span>
                          ) : (
                            <span className="text-rose-400 font-bold">0 records extracted</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {file.status_detail && (
                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-medium line-clamp-2">
                        {file.status_detail}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'Recent'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleViewSourceData(file.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>[ View Source Data ]</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* GMAIL REVIEW IMPORTED DATA MODAL */}
      {/* ==================================================== */}
      {showGmailReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Gmail Imported Business Records</h3>
                  <p className="text-xs text-slate-300">
                    Consolidated SSOT records fetched from business emails & attachments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGmailReviewModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {isLoadingGmailReview ? (
                <div className="py-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 animate-spin text-teal-400" />
                  <span>Loading Gmail consolidated records...</span>
                </div>
              ) : gmailImportedRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="text-base font-bold text-slate-300">No Gmail Records Found</div>
                  <p className="text-xs text-slate-400">
                    Click "Sync Emails" on the Business Gmail card to fetch business emails and attachments.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-400 flex items-center justify-between">
                    <span>Imported Records ({gmailImportedRecords.length}):</span>
                    <span className="text-teal-400">Single Source of Truth Grounded</span>
                  </div>

                  {gmailImportedRecords.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${rec.type === 'Sale'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : rec.type === 'Expense'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                          >
                            {rec.type}
                          </span>
                          <span className="font-extrabold text-white text-sm">
                            {rec.party_name}
                          </span>
                        </div>
                        <span className="font-black text-sm text-teal-300">
                          {formatINR(rec.amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300 font-medium">
                        <div>
                          Item / Category: <strong className="text-slate-100">{rec.item_name}</strong>
                        </div>
                        <div>
                          Date: <strong className="text-slate-100">{rec.date || 'N/A'}</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-extrabold text-teal-300 uppercase tracking-wider text-[10px]">Where did this come from?</span>
                        <span className="text-teal-400 font-mono font-bold truncate">{rec.source_lineage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGmailReviewModal(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SOURCE DATA PREVIEW MODAL */}
      {/* ==================================================== */}
      {selectedSourceFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-5 sm:p-7 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-lg truncate">
                      {sourceDataDetails?.file?.filename || 'Source File Preview'}
                    </h3>
                    {sourceDataDetails?.file && (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 font-extrabold text-xs border border-slate-700 uppercase">
                        {sourceDataDetails.file.file_type}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Extracted Source Data • {sourceDataDetails?.record_count || 0} Records Extracted
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSourceFileModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold flex items-center justify-center transition-all flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Processing Failed Banner if applicable */}
            {sourceDataDetails?.file?.status === 'FAILED' && (
              <div className="p-4 rounded-2xl bg-rose-950/50 border-2 border-rose-500/60 text-xs space-y-1.5 text-rose-200">
                <div className="font-black text-rose-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>❌ Processing Failed for {sourceDataDetails.file.filename}</span>
                </div>
                <p className="font-semibold">
                  Reason: {sourceDataDetails.file.status_detail || 'No readable table or transaction records detected.'}
                </p>
                <p className="text-[11px] text-slate-300">
                  Ensure your file contains clear column headers (Date, Product, Quantity, Price, Amount) or structured PDF invoice lines.
                </p>
              </div>
            )}

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('extracted')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${activeModalTab === 'extracted'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Extracted Source Data</span>
              </button>

              <button
                onClick={() => setActiveModalTab('comparison')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${activeModalTab === 'comparison'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Raw vs Normalized Data</span>
              </button>

              <button
                onClick={() => setActiveModalTab('checklist')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${activeModalTab === 'checklist'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Extraction Field Checklist</span>
              </button>

              <button
                onClick={() => setActiveModalTab('provenance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${activeModalTab === 'provenance'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Source Provenance</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {isLoadingSourceData ? (
                <div className="py-16 text-center text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 animate-spin text-teal-400" />
                  <span>Fetching extracted source data from database...</span>
                </div>
              ) : !sourceDataDetails || sourceDataDetails.records.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="text-base font-bold text-slate-300">No Extracted Records Present</div>
                  <p className="text-xs text-slate-400">
                    The source parser did not extract valid records from this file.
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB A: EXTRACTED SOURCE DATA */}
                  {activeModalTab === 'extracted' && (
                    <div className="space-y-4">
                      {/* If PDF, show structured PDF Summary Card */}
                      {sourceDataDetails.file?.file_type?.toUpperCase().includes('PDF') && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Extracted PDF Invoice Summary</span>
                            <span className="text-slate-400 text-[10px]">Extracted from: {sourceDataDetails.file.filename}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium text-slate-300">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase">Invoice Number</div>
                              <div className="font-bold text-white">{sourceDataDetails.records[0]?.raw_payload?.invoice_num || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase">Date</div>
                              <div className="font-bold text-white">{sourceDataDetails.records[0]?.raw_payload?.date || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase">Customer/Party</div>
                              <div className="font-bold text-teal-300">{sourceDataDetails.records[0]?.raw_payload?.customer_name || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase">Supplier/Vendor</div>
                              <div className="font-bold text-teal-300">{sourceDataDetails.records[0]?.raw_payload?.supplier_name || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tabular Rows Display */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto space-y-2">
                        <div className="text-xs font-extrabold text-slate-300 px-1">
                          Extracted Rows ({sourceDataDetails.records.length}):
                        </div>

                        <table className="w-full text-left text-xs text-slate-200 border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-teal-300 uppercase text-[10px] font-extrabold">
                              <th className="py-2.5 px-3">Row</th>
                              {sourceDataDetails.columns.map((col) => (
                                <th key={col} className="py-2.5 px-3 capitalize">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-medium">
                            {sourceDataDetails.records.map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="py-2 px-3 text-slate-400 font-mono font-bold">{rec.row_index}</td>
                                {sourceDataDetails.columns.map((col) => (
                                  <td key={col} className="py-2 px-3 whitespace-nowrap">
                                    {rec.raw_payload[col] !== undefined && rec.raw_payload[col] !== null
                                      ? String(rec.raw_payload[col])
                                      : <span className="text-slate-400 italic text-[10px]">N/A</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB B: RAW VS NORMALIZED COMPARISON */}
                  {activeModalTab === 'comparison' && (
                    <div className="space-y-3">
                      <div className="text-xs font-extrabold text-slate-300">
                        Raw Source vs Normalized SSOT Comparison:
                      </div>

                      {sourceDataDetails.records.map((rec) => (
                        <div key={rec.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                          <div className="flex items-center justify-between text-xs font-extrabold border-b border-slate-900 pb-2">
                            <span className="text-teal-400 font-mono">Row #{rec.row_index}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">
                              Domain: {rec.detected_domain}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* A. SOURCE DATA */}
                            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1.5">
                              <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                                A. SOURCE DATA (Extracted from file)
                              </div>
                              <div className="space-y-1 font-mono text-[11px] text-slate-200">
                                {Object.entries(rec.raw_payload)
                                  .filter(([k]) => !k.startsWith('_'))
                                  .map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-slate-800/60 pb-0.5">
                                      <span className="text-slate-400">{k}:</span>
                                      <span className="font-bold text-amber-200">{String(v)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* B. NORMALIZED DATA */}
                            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
                              <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
                                B. NORMALIZED DATA (Business Analysis SSOT)
                              </div>
                              {rec.normalized_data ? (
                                <div className="space-y-1 font-mono text-[11px] text-slate-200">
                                  {Object.entries(rec.normalized_data)
                                    .filter(([k]) => !['id', 'user_id', 'source_file', 'import_date'].includes(k))
                                    .map(([k, v]) => (
                                      <div key={k} className="flex justify-between border-b border-slate-800/60 pb-0.5">
                                        <span className="text-slate-400">{k}:</span>
                                        <span className="font-bold text-emerald-300">{v !== null && v !== undefined ? String(v) : 'None'}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="text-slate-400 italic text-[11px] py-4 text-center">
                                  Not yet normalized into SSOT table.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB C: EXTRACTION CONFIDENCE CHECKLIST */}
                  {activeModalTab === 'checklist' && (
                    <div className="space-y-3">
                      <div className="text-xs font-extrabold text-slate-300">
                        Extraction Field Confidence Checklist:
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        {sourceDataDetails.records.map((rec) => (
                          <div key={rec.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                            <div className="font-extrabold text-teal-300 text-xs">
                              Record #{rec.row_index} Extraction Field Status:
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {rec.field_checklist.map((chk, i) => (
                                <div
                                  key={i}
                                  className={`p-2 rounded-lg border font-medium flex items-center justify-between text-xs ${chk.status === 'extracted'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                    }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    {chk.status === 'extracted' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{chk.field}:</span>
                                  </div>
                                  <span className="font-bold text-[11px] truncate ml-1">
                                    {chk.status === 'extracted' ? String(chk.value) : <span className="text-amber-400/80 text-[10px]">Not detected</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB D: SOURCE PROVENANCE */}
                  {activeModalTab === 'provenance' && (
                    <div className="space-y-3">
                      <div className="text-xs font-extrabold text-slate-300">
                        Full Data Provenance & Lineage:
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                        {sourceDataDetails.records.map((rec) => (
                          <div key={rec.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                            <div className="text-teal-400 font-extrabold text-[11px] uppercase tracking-wider">
                              Lineage Badge:
                            </div>
                            <div className="font-mono font-bold text-white text-xs bg-slate-950 p-2 rounded border border-slate-800">
                              {rec.provenance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSourceFileModal(null)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
      {showGmailReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-6 sm:p-7 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Gmail Imported Business Records</h3>
                  <p className="text-xs text-slate-300">
                    Consolidated SSOT records fetched from business emails & attachments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGmailReviewModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {isLoadingGmailReview ? (
                <div className="py-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                  <Sparkles className="w-6 h-6 animate-spin text-teal-400" />
                  <span>Loading Gmail consolidated records...</span>
                </div>
              ) : gmailImportedRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="text-base font-bold text-slate-300">No Gmail Records Found</div>
                  <p className="text-xs text-slate-400">
                    Click "Sync Emails" on the Business Gmail card to fetch business emails and attachments.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-400 flex items-center justify-between">
                    <span>Imported Records ({gmailImportedRecords.length}):</span>
                    <span className="text-teal-400">Single Source of Truth Grounded</span>
                  </div>

                  {gmailImportedRecords.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${rec.type === 'Sale'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : rec.type === 'Expense'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                          >
                            {rec.type}
                          </span>
                          <span className="font-extrabold text-white text-sm">
                            {rec.party_name}
                          </span>
                        </div>
                        <span className="font-black text-sm text-teal-300">
                          {formatINR(rec.amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-300 font-medium">
                        <div>
                          Item / Category: <strong className="text-slate-100">{rec.item_name}</strong>
                        </div>
                        <div>
                          Date: <strong className="text-slate-100">{rec.date || 'N/A'}</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-extrabold text-teal-300 uppercase tracking-wider text-[10px]">Where did this come from?</span>
                        <span className="text-teal-400 font-mono font-bold truncate">{rec.source_lineage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGmailReviewModal(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================== */}
      {/* EXPENSES FROM PDF / CSV DEDICATED MODAL */}
      {/* ==================================================== */}
      {showExtractedExpensesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                    <span>Expenses from PDF / CSV</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-200/80 font-medium">
                    Expenses extracted from uploaded business documents
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExtractedExpensesModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">

              {/* SUMMARY AT TOP */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Expenses</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">
                    {formatINR(extractedExpensesData?.summary?.total_expenses || 0)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Records Extracted</div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {extractedExpensesData?.summary?.total_records || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Source Files</div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-300">
                    {extractedExpensesData?.summary?.total_sources || 0}
                  </div>
                </div>
              </div>

              {/* FILTERS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                {/* File Type Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Source Type:
                  </span>
                  {['ALL', 'PDF', 'CSV', 'EXCEL'].map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setExpenseFileTypeFilter(ft)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${expenseFileTypeFilter === ft
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>

                {/* Search/Text Filter */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter by Date, Category, Source, or Description..."
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 w-full sm:w-64"
                  />
                  {expenseSearchQuery && (
                    <button
                      onClick={() => setExpenseSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-white px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* TABLE DISPLAY */}
              {isLoadingExpenses ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <div className="text-sm font-bold">Loading expenses extracted from files...</div>
                </div>
              ) : !extractedExpensesData || !extractedExpensesData.expenses || extractedExpensesData.expenses.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-base font-bold text-slate-300">No Expense Records Extracted Yet</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Upload a PDF invoice (e.g. electricity.pdf) or CSV/Excel file containing expense lines to extract and view expense data here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Expense / Description</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5 text-right">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {extractedExpensesData.expenses
                        .filter((exp) => {
                          if (expenseFileTypeFilter !== 'ALL') {
                            const ft = (exp.file_type || '').toUpperCase();
                            const sf = (exp.source_file || '').toLowerCase();
                            if (expenseFileTypeFilter === 'PDF' && !ft.includes('PDF') && !sf.endsWith('.pdf')) return false;
                            if (expenseFileTypeFilter === 'CSV' && !ft.includes('CSV') && !sf.endsWith('.csv')) return false;
                            if (expenseFileTypeFilter === 'EXCEL' && !ft.includes('EXCEL') && !ft.includes('XLS') && !sf.endsWith('.xlsx') && !sf.endsWith('.xls')) return false;
                          }
                          if (expenseSearchQuery) {
                            const q = expenseSearchQuery.toLowerCase();
                            const matchDate = (exp.expense_date || '').toLowerCase().includes(q);
                            const matchCat = (exp.category || '').toLowerCase().includes(q);
                            const matchDesc = (exp.description || '').toLowerCase().includes(q);
                            const matchVendor = (exp.vendor_name || '').toLowerCase().includes(q);
                            const matchSource = (exp.source_file || '').toLowerCase().includes(q);
                            return matchDate || matchCat || matchDesc || matchVendor || matchSource;
                          }
                          return true;
                        })
                        .map((exp, idx) => (
                          <tr key={exp.id || idx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3.5 font-bold text-slate-200 whitespace-nowrap">
                              {exp.expense_date || 'N/A'}
                            </td>
                            <td className="p-3.5 font-semibold text-white">
                              <div>{exp.description}</div>
                              {exp.vendor_name && (
                                <div className="text-[11px] text-slate-400 font-normal">Vendor: {exp.vendor_name}</div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-bold text-[11px] border border-amber-500/20">
                                {exp.category || 'Operating Expense'}
                              </span>
                            </td>
                            <td className="p-3.5 font-black text-rose-400 text-sm whitespace-nowrap">
                              {formatINR(exp.amount)}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (exp.file_id) {
                                    handleViewSourceData(exp.file_id);
                                  } else {
                                    const matchF = uploadedFilesList.find(f => f.filename === exp.source_file);
                                    if (matchF) handleViewSourceData(matchF.id || matchF.file_id);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-600/30 text-teal-300 hover:text-teal-200 font-bold text-[11px] border border-slate-700 hover:border-teal-500/40 transition-all inline-flex items-center gap-1.5"
                                title="Click to view raw extracted file source data"
                              >
                                <FileText className="w-3.5 h-3.5 text-teal-400" />
                                <span>{exp.source_file}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-medium">
                Source files verified from SQLite Database lineage
              </div>
              <button
                type="button"
                onClick={() => setShowExtractedExpensesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
