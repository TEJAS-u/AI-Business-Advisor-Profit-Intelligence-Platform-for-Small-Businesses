import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  DollarSign,
  TrendingDown,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Phone,
  Layers,
  Search,
  Edit3,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  User,
  Users,
  CreditCard,
  History,
  AlertTriangle
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function ShopDataEntryView({ token, onDataChanged, onOpenReminder, initialSubTab = 'sales' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Data lists
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // ----------------------------------------------------
  // 1. PRODUCT FORM & SEARCH STATE
  // ----------------------------------------------------
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [autoFillProductMsg, setAutoFillProductMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Grocery');
  const [pCost, setPCost] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('10');
  const [pSupplier, setPSupplier] = useState('');

  // Catalog search filter
  const [catalogSearch, setCatalogSearch] = useState('');

  // ----------------------------------------------------
  // 2. SALE FORM & SEARCH STATE
  // ----------------------------------------------------
  const [saleSearchQuery, setSaleSearchQuery] = useState('');
  const [showSaleDropdown, setShowSaleDropdown] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState(null);

  const [sProduct, setSProduct] = useState('');
  const [sQty, setSQty] = useState('1');
  const [sPrice, setSPrice] = useState('');
  const [sCost, setSCost] = useState('');
  const [sCategory, setSCategory] = useState('General');

  // Customer & Payment Type
  const [sCustomer, setSCustomer] = useState('Walk-in Customer');
  const [sCustomerPhone, setSCustomerPhone] = useState('');
  const [sPaymentType, setSPaymentType] = useState('Paid'); // 'Paid' | 'Udhaar'
  const [showNewCustomerFields, setShowNewCustomerFields] = useState(false);
  const [sDate, setSDate] = useState(new Date().toISOString().split('T')[0]);

  // ----------------------------------------------------
  // 3. EXPENSE FORM STATE
  // ----------------------------------------------------
  const [eCategory, setECategory] = useState('Shop Rent');
  const [eAmount, setEAmount] = useState('');
  const [eVendor, setEVendor] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eDate, setEDate] = useState(new Date().toISOString().split('T')[0]);

  // ----------------------------------------------------
  // 4. CUSTOMER UDHAAR & PAYMENT RECORDING STATE
  // ----------------------------------------------------
  const [paymentModalCustomer, setPaymentModalCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const [rCustomer, setRCustomer] = useState('');
  const [rTotal, setRTotal] = useState('');
  const [rPending, setRPending] = useState('');
  const [rDays, setRDays] = useState('30');
  const [rPhone, setRPhone] = useState('');

  const productSearchRef = useRef(null);
  const saleSearchRef = useRef(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadAllRecords();
  }, [token]);

  const loadAllRecords = async () => {
    setIsLoading(true);
    try {
      const [pRes, sRes, eRes, rRes, cRes] = await Promise.all([
        fetch('/api/shop/products', { headers }),
        fetch('/api/shop/sales', { headers }),
        fetch('/api/shop/expenses', { headers }),
        fetch('/api/shop/receivables', { headers }),
        fetch('/api/shop/customers', { headers })
      ]);
      if (pRes.ok) setProducts((await pRes.json()).products || []);
      if (sRes.ok) setSales((await sRes.json()).sales || []);
      if (eRes.ok) setExpenses((await eRes.json()).expenses || []);
      if (rRes.ok) setReceivables((await rRes.json()).receivables || []);
      if (cRes.ok) setCustomers((await cRes.json()).customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Close search dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
      if (saleSearchRef.current && !saleSearchRef.current.contains(e.target)) {
        setShowSaleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----------------------------------------------------
  // SMART PRODUCT SEARCH & AUTO-FILL HANDLERS
  // ----------------------------------------------------
  const filteredProductsForAdd = productSearchQuery.trim()
    ? products.filter(p => p.product_name.toLowerCase().includes(productSearchQuery.toLowerCase().trim()))
    : [];

  const filteredProductsForSale = saleSearchQuery.trim()
    ? products.filter(p => p.product_name.toLowerCase().includes(saleSearchQuery.toLowerCase().trim()))
    : products.slice(0, 10);

  const handleSelectProductForAdd = (product) => {
    setPName(product.product_name);
    setPCost(product.unit_cost);
    setPPrice(product.unit_price);
    setPStock(product.stock_on_hand);
    setPCategory(product.category || 'General');
    setPSupplier(product.supplier_name || '');
    setIsEditingProduct(true);
    setEditingProductId(product.id);
    setProductSearchQuery(product.product_name);
    setShowProductDropdown(false);
    setDuplicateWarning(null);
    setAutoFillProductMsg(`✓ Product found — details filled automatically`);
    setTimeout(() => setAutoFillProductMsg(null), 4000);
  };

  const handleSelectProductForSale = (product) => {
    setSelectedProductForSale(product);
    setSProduct(product.product_name);
    setSPrice(product.unit_price);
    setSCost(product.unit_cost);
    setSCategory(product.category || 'General');
    setSQty('1');
    setSaleSearchQuery(product.product_name);
    setShowSaleDropdown(false);
  };

  const handleResetProductForm = () => {
    setPName('');
    setPCost('');
    setPPrice('');
    setPStock('10');
    setPCategory('Grocery');
    setPSupplier('');
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductSearchQuery('');
    setDuplicateWarning(null);
    setAutoFillProductMsg(null);
  };

  const handleProductNameChange = (val) => {
    setPName(val);
    if (!isEditingProduct && val.trim().length > 2) {
      const cleanInput = val.trim().toLowerCase();
      const existing = products.find(p => p.product_name.toLowerCase() === cleanInput);
      if (existing) {
        setDuplicateWarning(existing);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // ----------------------------------------------------
  // FORM SUBMISSION HANDLERS
  // ----------------------------------------------------

  // 1. Add / Update Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!pName || !pCost || !pPrice) return;

    try {
      if (isEditingProduct && editingProductId) {
        // UPDATE EXISTING PRODUCT (PUT)
        const res = await fetch(`/api/shop/products/${editingProductId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            product_name: pName.trim(),
            category: pCategory.trim(),
            unit_cost: Number(pCost),
            unit_price: Number(pPrice),
            stock_on_hand: Number(pStock || 0),
            supplier_name: pSupplier.trim()
          })
        });
        if (res.ok) {
          handleResetProductForm();
          setMsg({ type: 'success', text: `Product updated successfully.` });
          setTimeout(() => setMsg(null), 3000);
          loadAllRecords();
          if (onDataChanged) onDataChanged();
        }
      } else {
        // CREATE NEW PRODUCT (POST)
        const res = await fetch('/api/shop/products', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_name: pName.trim(),
            category: pCategory.trim(),
            unit_cost: Number(pCost),
            unit_price: Number(pPrice),
            stock_on_hand: Number(pStock || 0),
            supplier_name: pSupplier.trim()
          })
        });
        if (res.ok) {
          handleResetProductForm();
          setMsg({ type: 'success', text: `✓ Product saved successfully and is now searchable.` });
          setTimeout(() => setMsg(null), 3000);
          loadAllRecords();
          if (onDataChanged) onDataChanged();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Add Sale Transaction with Stock Limit Check & Udhaar
  const handleSaveSale = async (e) => {
    e.preventDefault();
    if (!sProduct || !sPrice || sCost === '') return;
    const quantity = Number(sQty || 1);
    if (quantity <= 0) return;

    // Stock check if product is selected
    if (selectedProductForSale && selectedProductForSale.stock_on_hand > 0) {
      if (quantity > selectedProductForSale.stock_on_hand) {
        alert(`⚠️ Only ${selectedProductForSale.stock_on_hand} items are available in stock.`);
        return;
      }
    }

    try {
      const res = await fetch('/api/shop/sales', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_name: sProduct.trim(),
          category: sCategory,
          quantity: quantity,
          unit_price: Number(sPrice),
          unit_cost: Number(sCost),
          customer_name: sCustomer.trim() || 'Walk-in Customer',
          customer_phone: sCustomerPhone.trim(),
          payment_type: sPaymentType,
          sale_date: sDate
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSProduct('');
        setSPrice('');
        setSCost('');
        setSQty('1');
        setSelectedProductForSale(null);
        setSaleSearchQuery('');
        setMsg({ type: 'success', text: data.message || `✓ Sale recorded. Stock updated automatically!` });
        setTimeout(() => setMsg(null), 4000);
        loadAllRecords();
        if (onDataChanged) onDataChanged();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Error recording sale");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!eCategory || !eAmount) return;
    try {
      const res = await fetch('/api/shop/expenses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: eCategory,
          amount: Number(eAmount),
          vendor: eVendor.trim(),
          description: eDesc.trim(),
          expense_date: eDate
        })
      });
      if (res.ok) {
        setEAmount(''); setEVendor(''); setEDesc('');
        setMsg({ type: 'success', text: 'Expense recorded.' });
        setTimeout(() => setMsg(null), 2500);
        loadAllRecords();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Record Customer Payment (e.g. pay ₹50 -> due 120 -> 70)
  const handleRecordCustomerPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalCustomer || !payAmount || Number(payAmount) <= 0) return;

    try {
      const recId = paymentModalCustomer.receivable_id || paymentModalCustomer.id;
      if (!recId) {
        alert("No active due record ID found for this customer.");
        return;
      }

      const res = await fetch(`/api/shop/receivables/${recId}/payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount_paid: Number(payAmount)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentModalCustomer(null);
        setPayAmount('');
        setMsg({ type: 'success', text: data.message || "Payment recorded successfully!" });
        setTimeout(() => setMsg(null), 3500);
        loadAllRecords();
        if (onDataChanged) onDataChanged();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Error recording payment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Add Manual Customer Receivable
  const handleAddReceivable = async (e) => {
    e.preventDefault();
    if (!rCustomer || !rPending) return;
    try {
      const res = await fetch('/api/shop/receivables', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_name: rCustomer.trim(),
          total_amount: Number(rTotal || rPending),
          pending_amount: Number(rPending),
          days_overdue: Number(rDays || 0),
          phone: rPhone.trim()
        })
      });
      if (res.ok) {
        setRCustomer(''); setRTotal(''); setRPending(''); setRPhone('');
        setMsg({ type: 'success', text: 'Customer due recorded.' });
        setTimeout(() => setMsg(null), 2500);
        loadAllRecords();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Handler
  const handleDelete = async (endpoint, id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/shop/${endpoint}/${id}`, { method: 'DELETE', headers });
      loadAllRecords();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations for Add Sale form
  const totalSaleAmount = (Number(sQty || 0) * Number(sPrice || 0));
  const totalSaleCost = (Number(sQty || 0) * Number(sCost || 0));
  const estimatedProfit = totalSaleAmount - totalSaleCost;
  const currentStock = selectedProductForSale ? Number(selectedProductForSale.stock_on_hand || 0) : null;
  const isOverStock = currentStock !== null && currentStock > 0 && Number(sQty || 0) > currentStock;
  const remainingStock = currentStock !== null ? Math.max(0, currentStock - Number(sQty || 0)) : null;

  // Filter products for Catalog table
  const filteredCatalog = products.filter(p =>
    p.product_name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-300">

      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-950/50 via-slate-900 to-slate-900 border-2 border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-teal-400 mb-1">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Fast Everyday Shop Bookkeeping</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Type Daily Records
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Record sales in seconds with instant product search, auto-filled prices, Udhaar tracking, and stock reduction.
          </p>
        </div>

        {msg && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-200 text-sm font-black animate-in fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}
      </div>

      {/* 4 Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 flex-wrap">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${activeSubTab === 'sales' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>➕ 1. Record Sale ({sales.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${activeSubTab === 'products' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 2. Products & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${activeSubTab === 'expenses' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>📉 3. Shop Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receivables')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${activeSubTab === 'receivables' ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' : 'text-slate-300 hover:text-white'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>🤝 4. Customer Udhaar & Dues ({receivables.length})</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. SALES TAB (SMART SEARCH, AUTO-FILL & UDHAAR) */}
      {/* ==================================================== */}
      {activeSubTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Add Sale Form Card */}
          <form onSubmit={handleSaveSale} className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                Record Sale Transaction
              </h3>
              <span className="text-xs text-teal-400 font-bold uppercase">Quick Entry</span>
            </div>

            {/* Smart Product Search Box */}
            <div className="space-y-1 relative" ref={saleSearchRef}>
              <label className="block text-slate-200 text-sm font-bold">
                🔎 Search Product:
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Type product name (e.g. rice, bulb, oil)..."
                  value={saleSearchQuery}
                  onFocus={() => setShowSaleDropdown(true)}
                  onChange={(e) => {
                    setSaleSearchQuery(e.target.value);
                    setShowSaleDropdown(true);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-white font-semibold focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Search Suggestions Dropdown */}
              {showSaleDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#0C1220] border-2 border-teal-500/50 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredProductsForSale.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">
                        Select Product from Shop Catalog:
                      </div>
                      {filteredProductsForSale.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProductForSale(p)}
                          className="p-3 rounded-xl hover:bg-teal-500/20 hover:border-teal-500/40 border border-transparent cursor-pointer transition-all flex items-center justify-between gap-3 text-sm group"
                        >
                          <div>
                            <div className="font-extrabold text-white group-hover:text-teal-300">{p.product_name}</div>
                            <div className="text-xs text-slate-400 font-medium">{p.category} • Cost: ₹{p.unit_cost}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-400 text-sm">₹{p.unit_price}</div>
                            <div className="text-xs font-semibold">
                              Stock: <span className={p.stock_on_hand <= 0 ? 'text-rose-400 font-bold' : p.stock_on_hand <= 5 ? 'text-amber-400 font-bold' : 'text-teal-300 font-bold'}>
                                {p.stock_on_hand} {p.stock_on_hand <= 0 ? '(Out of Stock)' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center space-y-2.5">
                      <div className="text-sm text-slate-300 font-medium">
                        No product found matching "{saleSearchQuery}"
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPName(saleSearchQuery);
                          setActiveSubTab('products');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
                      >
                        + Add New Product "{saleSearchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Product Banner */}
            {sProduct && (
              <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 space-y-1 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-teal-300 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Selected: {sProduct}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSProduct('');
                      setSelectedProductForSale(null);
                      setSaleSearchQuery('');
                    }}
                    className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                  >
                    Change
                  </button>
                </div>
                {currentStock !== null && (
                  <div className="text-xs text-slate-300">
                    Available in shop stock: <strong className={currentStock <= 0 ? 'text-rose-400 font-bold' : 'text-white font-bold'}>{currentStock} units</strong>
                  </div>
                )}
              </div>
            )}

            {/* If user types manual product without picking from search */}
            {!sProduct && (
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Or Enter Product Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice 5kg / LED Bulb 9W"
                  value={sProduct}
                  onChange={(e) => setSProduct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            {/* Quantity and Prices */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-200 text-xs font-extrabold mb-1">
                  How many sold?
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={sQty}
                  onChange={(e) => setSQty(e.target.value)}
                  className={`w-full bg-slate-950 border-2 ${isOverStock ? 'border-rose-500' : 'border-teal-500/60'} focus:border-teal-400 rounded-xl px-3 py-2.5 text-base font-black text-white focus:outline-none text-center`}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1">
                  Price per unit (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="60"
                  value={sPrice}
                  onChange={(e) => setSPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">
                  Cost per unit (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50"
                  value={sCost}
                  onChange={(e) => setSCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-teal-500 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Overstock Warning */}
            {isOverStock && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>⚠️ Only {currentStock} items are available in stock. Cannot sell {sQty}.</span>
              </div>
            )}

            {/* Customer Name & Phone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 text-xs font-bold">
                  👤 Customer / Client:
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerFields(!showNewCustomerFields)}
                  className="text-xs text-teal-400 font-bold hover:underline"
                >
                  {showNewCustomerFields ? "Select Existing" : "+ New Customer"}
                </button>
              </div>

              {!showNewCustomerFields && customers.length > 0 ? (
                <select
                  value={sCustomer}
                  onChange={(e) => {
                    setSCustomer(e.target.value);
                    const found = customers.find(c => c.customer_name === e.target.value);
                    if (found) setSCustomerPhone(found.phone || '');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Walk-in Customer">Walk-in Customer</option>
                  {customers.filter(c => c.customer_name !== 'Walk-in Customer').map((c, i) => (
                    <option key={i} value={c.customer_name}>
                      {c.customer_name} {c.total_due > 0 ? `(Pending Due: ₹${c.total_due})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Ramesh)"
                    value={sCustomer}
                    onChange={(e) => setSCustomer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone (Optional)"
                    value={sCustomerPhone}
                    onChange={(e) => setSCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}
            </div>

            {/* Payment Type: Paid vs Udhaar */}
            <div>
              <label className="block text-slate-200 text-xs font-bold mb-1.5">
                Payment Type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSPaymentType('Paid')}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${sPaymentType === 'Paid'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>🟢 Paid (Cash / UPI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSPaymentType('Udhaar')}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${sPaymentType === 'Udhaar'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>🟡 Udhaar / Credit</span>
                </button>
              </div>

              {sPaymentType === 'Udhaar' && (
                <p className="text-[11px] text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠️ Will add {formatINR(totalSaleAmount)} to {sCustomer}'s pending Udhaar book.</span>
                </p>
              )}
            </div>

            {/* Automatic Total & Stock Calculation Card */}
            {Number(sQty || 0) > 0 && Number(sPrice || 0) > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold text-slate-400">Total Sale Amount:</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {formatINR(totalSaleAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-300">
                  <span>Product Cost: <strong className="text-white">{formatINR(totalSaleCost)}</strong></span>
                  <span>Gross Profit: <strong className="text-teal-300">{formatINR(estimatedProfit)}</strong></span>
                </div>

                {remainingStock !== null && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 text-slate-300">
                    <span>Stock after saving:</span>
                    <span className="font-bold text-white">{currentStock} → <strong className="text-amber-400 font-extrabold">{remainingStock} units</strong></span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isOverStock}
              className={`w-full py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isOverStock
                  ? 'bg-slate-800 cursor-not-allowed text-slate-500'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-950/60'
                }`}
            >
              <Plus className="w-5 h-5" />
              <span>Save Sale & Update Stock</span>
            </button>
          </form>

          {/* Sales List Table */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base sm:text-lg">
                Recorded Sales ({sales.length} Bills)
              </h3>
              <span className="text-xs text-slate-400">Recent Transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase font-extrabold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Profit</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/50">
                      <td className="py-3 text-slate-400 text-xs font-mono">{s.sale_date}</td>
                      <td className="py-3 font-bold text-white">
                        {s.product_name}
                        <span className="block text-xs text-slate-400 font-normal">{s.customer_name}</span>
                      </td>
                      <td className="py-3 text-slate-200 font-bold">{s.quantity}</td>
                      <td className="py-3 text-emerald-400 font-black">{formatINR(s.revenue)}</td>
                      <td className="py-3 text-teal-300 font-bold">{formatINR(s.profit)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete('sales', s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sales.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">
                  No sales recorded yet. Use the form on the left to record your first sale.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. PRODUCTS & STOCK TAB (INVENTORY & STATUS BADGES) */}
      {/* ==================================================== */}
      {activeSubTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Add / Edit Product Form Card */}
          <form onSubmit={handleSaveProduct} className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2">
                {isEditingProduct ? (
                  <>
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    <span>✏️ Edit Product Details</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-teal-400" />
                    <span>Add Product SKU (Save Once)</span>
                  </>
                )}
              </h3>
              {isEditingProduct && (
                <button
                  type="button"
                  onClick={handleResetProductForm}
                  className="text-xs text-slate-400 hover:text-white underline font-bold"
                >
                  + Add New Instead
                </button>
              )}
            </div>

            {/* Search Box at Top of Add Product Form */}
            <div className="space-y-1 relative" ref={productSearchRef}>
              <label className="block text-slate-200 text-sm font-bold">
                🔎 Search Existing Product (To Auto-Fill or Edit):
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Type product name (e.g. rice, oil)..."
                  value={productSearchQuery}
                  onFocus={() => setShowProductDropdown(true)}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-teal-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showProductDropdown && productSearchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#0C1220] border-2 border-teal-500/50 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredProductsForAdd.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">
                        Click to Auto-Fill & Edit:
                      </div>
                      {filteredProductsForAdd.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProductForAdd(p)}
                          className="p-3 rounded-xl hover:bg-teal-500/20 hover:border-teal-500/40 border border-transparent cursor-pointer transition-all flex items-center justify-between gap-3 text-sm group"
                        >
                          <div>
                            <div className="font-extrabold text-white group-hover:text-teal-300">{p.product_name}</div>
                            <div className="text-xs text-slate-400 font-medium">Cost: ₹{p.unit_cost} • Price: ₹{p.unit_price}</div>
                          </div>
                          <span className="text-xs font-bold text-teal-300 px-2.5 py-1 rounded-lg bg-teal-500/20">
                            Stock: {p.stock_on_hand}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 text-center text-xs text-slate-400">
                      No saved product matching "{productSearchQuery}". You can create it below!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto-Fill Confirmation Notification */}
            {autoFillProductMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{autoFillProductMsg}</span>
              </div>
            )}

            {/* Duplicate Product Alert */}
            {duplicateWarning && (
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 text-xs sm:text-sm space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>"{duplicateWarning.product_name}" already exists:</span>
                </div>
                <div className="font-bold text-white">
                  Selling Price: ₹{duplicateWarning.unit_price}, Stock: {duplicateWarning.stock_on_hand}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectProductForAdd(duplicateWarning)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md"
                  >
                    Use Existing Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                  >
                    Create Separate Product
                  </button>
                </div>
              </div>
            )}

            {/* Product Name Input */}
            <div>
              <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">
                Product Name:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rice / LED Bulb 9W"
                value={pName}
                onChange={(e) => handleProductNameChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Purchase Cost and Selling Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">
                  Purchase Cost (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 56"
                  value={pCost}
                  onChange={(e) => setPCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">
                  Selling Price (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 60"
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Margin Preview */}
            {Number(pPrice || 0) > 0 && Number(pCost || 0) > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-400">Profit Margin per unit:</span>
                <span className="font-extrabold text-emerald-400">
                  ₹{(Number(pPrice) - Number(pCost)).toFixed(2)} ({(((Number(pPrice) - Number(pCost)) / Number(pPrice)) * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            {/* Stock on hand and Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">
                  Opening Stock:
                </label>
                <input
                  type="number"
                  placeholder="10"
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">
                  Category:
                </label>
                <input
                  type="text"
                  placeholder="Grocery / Electronics"
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Supplier Name (Optional):</label>
              <input
                type="text"
                placeholder="e.g. City Wholesalers Ltd"
                value={pSupplier}
                onChange={(e) => setPSupplier(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isEditingProduct
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/60'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/60'
                  }`}
              >
                {isEditingProduct ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Update Product Details</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Save Product SKU</span>
                  </>
                )}
              </button>

              {isEditingProduct && (
                <button
                  type="button"
                  onClick={handleResetProductForm}
                  className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Product Catalog List Table with Stock Status Badges */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-white text-base sm:text-lg">
                  Product Inventory & Catalog ({products.length} Items)
                </h3>
                <p className="text-xs text-slate-400">Master Stock & Pricing Records</p>
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter catalog..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase font-extrabold">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Cost</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCatalog.map((p) => {
                    const margin = p.unit_price > 0 ? (((p.unit_price - p.unit_cost) / p.unit_price) * 100).toFixed(1) : 0;
                    const stock = Number(p.stock_on_hand || 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="py-3 font-bold text-white">
                          {p.product_name}
                          <span className="block text-xs text-slate-400 font-normal">{p.category}</span>
                        </td>
                        <td className="py-3 text-white font-bold">₹{p.unit_price}</td>
                        <td className="py-3 text-slate-300 font-semibold">₹{p.unit_cost}</td>
                        <td className="py-3 font-black text-white">{stock}</td>
                        <td className="py-3">
                          {stock === 0 ? (
                            <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🔴 Out of Stock
                            </span>
                          ) : stock <= 5 ? (
                            <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🟡 Low Stock
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🟢 Available
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSelectProductForAdd(p)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all"
                              title="Edit product details & stock"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete('products', p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCatalog.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">
                  No products found. Add your first product using the form on the left.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* 3. EXPENSES TAB */}
      {/* ==================================================== */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAddExpense} className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-teal-400" />
              Record Shop Expense
            </h3>

            <div>
              <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">Expense Type / Head:</label>
              <select
                value={eCategory}
                onChange={(e) => setECategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Shop Rent">Shop Rent</option>
                <option value="Staff Salaries & Wages">Staff Salaries & Wages</option>
                <option value="Electricity & Power">Electricity & Power</option>
                <option value="Transport & Freight Logistics">Transport & Logistics</option>
                <option value="Marketing & Advertising">Marketing & Advertising</option>
                <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                <option value="Internet & Phone">Internet & Phone</option>
                <option value="Packaging & Bags">Packaging & Bags</option>
                <option value="Other Operating Expenses">Other Operating Expenses</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">Amount (₹):</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 25000"
                value={eAmount}
                onChange={(e) => setEAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Paid To / Vendor (Optional):</label>
              <input
                type="text"
                placeholder="Landlord / Utility Provider"
                value={eVendor}
                onChange={(e) => setEVendor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Expense Date:</label>
              <input
                type="date"
                value={eDate}
                onChange={(e) => setEDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button type="submit" className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm sm:text-base shadow-xl active:scale-95">
              Save Expense
            </button>
          </form>

          {/* Expenses List Table */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-black text-white text-base sm:text-lg border-b border-slate-800 pb-3">
              Operating Overhead ({expenses.length} Entries)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase font-extrabold">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Paid To</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/50">
                      <td className="py-3 text-slate-400 text-xs font-mono">{e.expense_date}</td>
                      <td className="py-3 font-bold text-white">{e.category}</td>
                      <td className="py-3 text-slate-300">{e.vendor || '-'}</td>
                      <td className="py-3 text-rose-400 font-black">{formatINR(e.amount)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete('expenses', e.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">No expenses recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. CUSTOMER UDHAAR & DUES TRACKING TAB */}
      {/* ==================================================== */}
      {activeSubTab === 'receivables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Add Manual Due Form Card */}
          <form onSubmit={handleAddReceivable} className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-black text-white text-lg sm:text-xl flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-5 h-5 text-teal-400" />
              Add Customer Udhaar Entry
            </h3>

            <div>
              <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">Customer / Client Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh / Suresh Hotels"
                value={rCustomer}
                onChange={(e) => setRCustomer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-1">Pending Due (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={rPending}
                  onChange={(e) => setRPending(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Days Overdue:</label>
                <input
                  type="number"
                  placeholder="30"
                  value={rDays}
                  onChange={(e) => setRDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1">Phone Number (Optional):</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={rPhone}
                onChange={(e) => setRPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button type="submit" className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm sm:text-base shadow-xl active:scale-95">
              Save Customer Due
            </button>
          </form>

          {/* Customers Udhaar Ledger Table */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-3xl border-2 border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base sm:text-lg">
                Customer Udhaar Book ({customers.length} Customers)
              </h3>
              <span className="text-xs text-slate-400">Total Purchase & Pending Dues</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-xs uppercase font-extrabold">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total Purchase</th>
                    <th className="pb-3">Paid</th>
                    <th className="pb-3">Pending Due</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-3 font-bold text-white">
                        {c.customer_name}
                        {c.phone && <span className="block text-xs text-slate-400 font-normal">{c.phone}</span>}
                      </td>
                      <td className="py-3 text-slate-300 font-semibold">{formatINR(c.total_purchases)}</td>
                      <td className="py-3 text-emerald-400 font-semibold">{formatINR(c.total_paid)}</td>
                      <td className="py-3 font-black text-rose-400">
                        {c.total_due > 0 ? (
                          <span>{formatINR(c.total_due)}</span>
                        ) : (
                          <span className="text-emerald-400 text-xs">All Cleared ✅</span>
                        )}
                      </td>
                      <td className="py-3 text-right flex items-center justify-end gap-1.5">
                        {c.total_due > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalCustomer(c);
                              setPayAmount('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                            title="Record payment received from customer"
                          >
                            💰 Record Payment
                          </button>
                        )}
                        {c.transactions?.length > 0 && (
                          <button
                            onClick={() => setHistoryCustomer(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                            title="View purchase history"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        {c.receivable_id && (
                          <button
                            onClick={() => handleDelete('receivables', c.receivable_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete due record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">
                  No customer records or pending dues yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. RECORD PAYMENT MODAL */}
      {/* ---------------------------------------------------- */}
      {paymentModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C1220] border-2 border-emerald-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                💰 Record Customer Payment
              </h3>
              <button onClick={() => setPaymentModalCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-sm">
              <div className="text-slate-400">Customer: <strong className="text-white">{paymentModalCustomer.customer_name}</strong></div>
              <div className="text-slate-400">Current Outstanding Due: <strong className="text-rose-400 font-black">{formatINR(paymentModalCustomer.total_due)}</strong></div>
            </div>

            <form onSubmit={handleRecordCustomerPayment} className="space-y-4">
              <div>
                <label className="block text-slate-200 text-sm font-bold mb-1">
                  Amount Received (₹):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-emerald-500 rounded-xl px-4 py-3 text-lg font-black text-white focus:outline-none"
                />
              </div>

              {Number(payAmount) > 0 && (
                <div className="text-xs text-slate-300">
                  Remaining Due After Payment: <strong className="text-teal-300 font-bold">{formatINR(Math.max(0, paymentModalCustomer.total_due - Number(payAmount)))}</strong>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md"
                >
                  Confirm Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModalCustomer(null)}
                  className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. CUSTOMER PURCHASE HISTORY MODAL */}
      {/* ---------------------------------------------------- */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C1220] border-2 border-teal-500/50 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-400" />
                  Purchase History: {historyCustomer.customer_name}
                </h3>
                <p className="text-xs text-slate-400">Total Purchases: {formatINR(historyCustomer.total_purchases)} | Pending Due: {formatINR(historyCustomer.total_due)}</p>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 text-sm pr-1">
              {historyCustomer.transactions?.map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{t.product_name} (x{t.quantity})</div>
                    <div className="text-xs text-slate-400">{t.sale_date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-400">{formatINR(t.revenue)}</div>
                    <div className="text-[10px] text-slate-400">Profit: ₹{t.profit}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-sm"
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
