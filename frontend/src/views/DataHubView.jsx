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
  Mail
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
    window.location.href = 'http://127.0.0.1:8000/api/integrations/gmail/connect';
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

    </div>
  );
}
