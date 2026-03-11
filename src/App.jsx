import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Plus, Minus, QrCode, LogOut, Package, Search, FileText, ClipboardList,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle, History, ArrowDownToLine, 
  ArrowUpFromLine, CheckCircle2, Users, ShieldCheck, Download, MapPin, FileUp
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = import.meta.env.VITE_APP_API_URL || "/api/proxy";

// --- LOGIN COMPONENT WITH DROPDOWNS ---
const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState({ locations: [], users: [] });
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState(""); // Managed state for password
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [otp, setOtp] = useState("");

  useEffect(() => {
    fetch(`${API_URL}?action=getLoginData`)
      .then(res => res.json())
      .then(data => setSetupData(data));
  }, []);

  // STEP 1: Validate Password and Send OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Verify Password First
      const res = await fetch(`${API_URL}?action=login&user=${selectedUser}&pass=${password}&loc=${selectedLoc}`);
      const data = await res.json();

      if (data.authenticated) {
        // 1. Find the full user object from your setupData
        const userObj = setupData.users.find(u => u.username === selectedUser);

        if (!userObj || !userObj.email) {
        alert("Error: This user has no email registered in the system.");
        setLoading(false);
        return;
        }

        console.log("Sending OTP to:", userObj.email);

        // 2. FIX: Use userObj.username and userObj.email instead of selectedUser
        const otpRes = await fetch(
        `${API_URL}?action=sendOTP&user=${encodeURIComponent(userObj.username)}&email=${encodeURIComponent(userObj.email)}`
        );
    
        const otpData = await otpRes.json();
        console.log("Server Response:", otpData);

        if (otpData.success === true) {
          setStep(2); // Move to OTP entry
        } else {
          alert("Error: " + (otpData.message || "Failed to send security code. Check user email setup."));
        }
      } else {
        alert("Login failed: Invalid Password");
      }
    } catch (err) {
      alert("System error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Log In
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userObj = setupData.users.find(u => u.username === selectedUser);

    try {
      const res = await fetch(`${API_URL}?action=verifyOTP&email=${userObj.email}&otp=${otp}`);
      const data = await res.json();

      if (data.success) {
        // 1. Create a "Full User" object that has both 'username' and 'name'
        const fullUser = { 
          ...userObj, 
          name: userObj.username 
        };

        // 2. Use this 'fullUser' object instead of 'userObj'
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
        
        if(fullUser.role === 'Admin') navigate('/admin');
        else navigate(fullUser.role === 'Warehouse' ? '/warehouse' : '/clinic');
      } else {
        alert("Invalid or expired Security Code");
      }
    } catch (err) {
      alert("Verification error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-indigo-600 to-purple-700 p-6">
      <div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-[2.5rem] border border-white/30 shadow-2xl p-8 text-white">
        
        <div className="flex justify-center mb-6">
          <img src="/logo_PKPDKK.png" alt="PKPDKK Logo" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold mb-6 text-center text-slate-800">Sistem Inventori PKPDKK</h1>

        {step === 1 ? (
          /* STEP 1 FORM */
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-800 uppercase ml-1">Location</label>
              <select 
                className="w-full p-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white outline-none appearance-none shadow-lg"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                value={selectedLoc}
                onChange={(e) => { setSelectedLoc(e.target.value); setSelectedUser(""); }}
                required
                >
                <option value="" className="text-slate-900">Select Location...</option>
                {setupData.locations.map(l => <option key={l} value={l} className="text-slate-900">{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-800 uppercase ml-1">User</label>
              <select 
                className="w-full p-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white outline-none appearance-none shadow-lg disabled:opacity-50"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={!selectedLoc}
                required
                >
                <option value="" className='text-slate-900'>Select Staff...</option>
                {setupData.users.filter(u => u.location === selectedLoc).map(u => (
                  <option key={u.username} value={u.username} className="text-slate-900">{u.username}</option>
                ))}
              </select>
            </div>

            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-white/20 border border-white/30 rounded-2xl placeholder:text-white/70 text-white outline-none mb-4" 
              required 
            />
            
            <button type="submit" disabled={loading || !selectedUser} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg">
              {loading ? "Processing..." : "Get Security Code"}
            </button>
          </form>
        ) : (
          /* STEP 2 FORM: OTP */
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-sm text-slate-100">Verification code sent to email associated with <b>{selectedUser}</b></p>
            </div>
            
            <input 
              type="text" 
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-5 bg-white/20 border border-white/30 rounded-2xl text-white text-center text-3xl font-black tracking-[0.5em] outline-none"
              required 
              autoFocus
            />

            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition shadow-lg">
              {loading ? "Verifying..." : "Confirm & Login"}
            </button>

            <button type="button" onClick={() => setStep(1)} className="w-full text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white">
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- WAREHOUSE DASHBOARD (STOR) - CLEAN & COMPACT VERSION ---
const WarehouseDashboard = ({ user, logout }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLoc, setTargetLoc] = useState("KPH");
  const [showAlerts, setShowAlerts] = useState(false);

  const clinics = ["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];

  useEffect(() => { 
    fetch(`${API_URL}?action=getInventory`).then(res => res.json()).then(setInventory); 
  }, []);

  const clinicAlerts = (inventory || []).filter(item => 
    clinics.some(c => (Number(item[c]) || 0) < (item.MinStock || 0))
  );

  const addToCart = (item) => {
    const q = window.prompt(`Quantity for ${item.Item_Name}:`, "1");
    if (!q || isNaN(q) || q <= 0) return;
    setCart([...cart, { cartId: Math.random().toString(36).substr(2, 5), code: item.Code, name: item.Item_Name, qty: parseInt(q) }]);
  };

  const handleCheckout = async () => {
    if (!confirm(`Transfer to ${targetLoc}?`)) return;
    setLoading(true);
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'checkout', from: user.location, to: targetLoc, cart }) });
    const data = await res.json();
    setTxnId(data.txnId);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-5 py-3 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <img src="/logo_PKPDKK.png" alt="Logo" className="h-7 w-auto" />
            <h1 className="text-sm font-black tracking-tight text-slate-700 uppercase">STOR PKPDKK</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAlerts(!showAlerts)} 
              className={`relative p-2 rounded-lg transition-colors ${showAlerts ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <AlertTriangle size={16}/>
              {clinicAlerts.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white rounded-full"></span>}
            </button>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={16}/></button>
          </div>
        </header>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* COMPACT ALERTS BOX */}
          {showAlerts && clinicAlerts.length > 0 && (
            <div className="bg-white border-l-4 border-red-500 rounded-xl shadow-sm p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                   <AlertTriangle size={12}/> Clinic Shortages
                </span>
                <button onClick={() => setShowAlerts(false)} className="text-slate-300 hover:text-slate-500">×</button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {clinicAlerts.map(item => (
                   <div key={item.Code} className="min-w-45 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-slate-700 truncate mb-1">{item.Item_Name}</p>
                      <button 
                        onClick={() => { setTargetLoc(clinics.find(c => (Number(item[c])||0) < item.MinStock)); addToCart(item); }} 
                        className="w-full py-1 bg-red-600 text-white text-[9px] font-bold rounded uppercase tracking-tighter"
                      >Fulfill</button>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPACT SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              placeholder="Search category or item..." 
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 shadow-sm"
              onChange={e => setSearchTerm(e.target.value.toLowerCase())} 
            />
          </div>

          {/* GROUPED LIST VIEW */}
          <div className="space-y-3 pb-10">
            {(() => {
              const filtered = (inventory || []).filter(i => 
                i.Item_Name?.toLowerCase().includes(searchTerm) || 
                i.Category?.toLowerCase().includes(searchTerm) || 
                i.Code?.toString().includes(searchTerm)
              );

              // Group by category
              const groups = filtered.reduce((acc, item) => {
                const cat = item.Category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {});

              return Object.entries(groups).sort().map(([category, items]) => (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{category}</span>
                    <span className="text-[9px] font-bold text-slate-400">{items.length} items</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {items.map(item => {
                      const stock = Number(item[user.location]) || 0;
                      return (
                        <div key={item.Code} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors group">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold text-slate-400">#{item.Code}</span>
                              <h3 className="text-xs font-semibold text-slate-700 truncate">{item.Item_Name}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className={`text-xs font-black ${stock <= 0 ? 'text-red-500' : 'text-slate-700'}`}>{stock}</span>
                              <p className="text-[8px] font-bold text-slate-300 uppercase leading-none">In Stor</p>
                            </div>
                            <button 
                              onClick={() => addToCart(item)} 
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus size={14}/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* COMPACT CART SIDEBAR */}
      <div className="w-64 bg-white border-l shadow-2xl flex flex-col">
          <div className="p-3 border-b bg-slate-800 text-white text-xs font-black uppercase tracking-widest">Transfer Cart</div>
          <div className="p-3 bg-slate-50 border-b">
            <label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">Destination:</label>
            <select 
              value={targetLoc} 
              onChange={e => setTargetLoc(e.target.value)} 
              className="w-full border-slate-200 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              {clinics.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {cart.map(c => (
              <div key={c.cartId} className="text-[10px] p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group">
                <span className="truncate pr-2 font-medium">{c.name}</span>
                <div className="flex items-center gap-2">
                  <b className="text-blue-600">x{c.qty}</b>
                  <button onClick={()=>setCart(cart.filter(x=>x.cartId!==c.cartId))} className="text-slate-300 hover:text-red-500">×</button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-[10px] text-center text-slate-400 mt-10 italic">Cart is empty</p>}
          </div>
          <div className="p-3 border-t bg-slate-50">
            {txnId ? (
              <div className="text-center p-2 bg-white rounded-xl border shadow-inner">
                <QRCodeCanvas value={txnId} size={110} className="mx-auto" />
                <p className="mt-2 font-mono text-[10px] font-bold text-blue-600">{txnId}</p>
                <button onClick={()=>{setTxnId(null); setCart([]);}} className="text-[9px] font-black uppercase text-slate-400 mt-2 block w-full hover:text-slate-600">Clear</button>
              </div>
            ) : (
              <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || loading} 
                className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${cart.length === 0 ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95'}`}
              >
                {loading ? "..." : `Send to ${targetLoc}`}
              </button>
            )}
          </div>
      </div>
    </div>
  );
};

// ---  ADMIN DASHBOARD ---
const AdminDashboard = ({ user, logout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminHistory, setAdminHistory] = useState({ transfers: [], usage: [] });
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const fetchGlobalHistory = async () => {
    setReportLoading(true);
    try {
      // Ensure API_URL is defined in your scope
      const res = await fetch(`${API_URL}?action=getHistory&location=Admin`);
      const data = await res.json();
      // Ensure data has the expected structure
      setAdminHistory({
        transfers: data.transfers || [],
        usage: data.usage || []
      });
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}?action=getLoginData`)
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = {
      action: 'addUser',
      username: e.target.username.value,
      password: e.target.password.value,
      email: e.target.email.value,
      role: e.target.role.value,
      location: e.target.location.value
    };

    try {
      await fetch(API_URL, { method: 'POST', body: JSON.stringify(formData) });
      alert("User Added Successfully");
      e.target.reset();
      const res = await fetch(`${API_URL}?action=getLoginData`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      alert("Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const exportAdminPDF = (type) => {
    const doc = new jsPDF();
    const data = type === 'in' ? (adminHistory.transfers || []) : (adminHistory.usage || []);
    const title = type === 'in' ? "Global Incoming Stock Report" : "Global Usage Report";
    
    if (data.length === 0) return alert("No data available to export.");

    doc.setFontSize(18);
    doc.text(title, 14, 20);

    const headers = type === 'in' 
      ? [["Date", "ID", "From", "To", "Status"]] 
      : [["Date", "Location", "Item Name", "Qty"]];

    const rows = data.map(item => {
      const dateStr = item.CreatedAt || item.Timestamp;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : "N/A";
      
      return type === 'in' 
        ? [formattedDate, item.txnID, item.From, item.To, item.Status]
        : [formattedDate, item.Location, item.Item_Name, item.Qty];
    });

    doc.autoTable({ head: headers, body: rows, startY: 30 });

    // Page 2: Summary Logic
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Inventory Consumption Summary", 14, 20);
    
    const summaryMap = data.reduce((acc, curr) => {
      const key = curr.Item_Name || "Transfers";
      acc[key] = (acc[key] || 0) + (Number(curr.Qty || 1));
      return acc;
    }, {});

    const summaryRows = Object.entries(summaryMap).map(([name, total]) => [name, total]);

    doc.autoTable({ 
      head: [["Item Name / Category", "Total Volume"]], 
      body: summaryRows, 
      startY: 30,
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Global_Report_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <ShieldCheck className="text-blue-400" size={24}/> Admin
        </h2>
        <nav className="space-y-4">
          <div 
            onClick={() => setActiveTab('users')} 
            className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Users size={20}/> User Management
          </div>
          <div 
            onClick={() => { setActiveTab('reports'); fetchGlobalHistory(); }} 
            className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <FileText size={20}/> System Reports
          </div>
          
          <div className="pt-8 mt-8 border-t border-slate-800">
            <button onClick={logout} className="p-3 text-slate-400 flex items-center gap-2 hover:text-white hover:bg-red-500/10 rounded-xl transition-all w-full">
              <LogOut size={20}/> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold mb-8 text-slate-800">User Management</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Add User Form */}
              <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
                <h3 className="font-bold mb-6 text-slate-700">Add New System User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <input name="username" placeholder="Full Name" className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                  <input name="password" type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                  <input name="email" type="email" placeholder="Official Email" className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                  <div className="grid grid-cols-2 gap-4">
                    <select name="role" className="p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Clinic">Clinic</option>
                      <option value="STOR">STOR</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <select name="location" className="p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500">
                      {["STOR", "KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">
                    {loading ? "Registering..." : "Register User"}
                  </button>
                </form>
              </div>

              {/* User List */}
              <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
                <h3 className="font-bold mb-6 text-slate-700">Access Control List</h3>
                <div className="space-y-3 max-h-112.5 overflow-y-auto pr-2 custom-scrollbar">
                  {users.length > 0 ? users.map((u, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <p className="font-black text-sm text-slate-800">{u.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.role} • {u.location}</p>
                      </div>
                      <div className="bg-white px-3 py-1 rounded-lg text-[10px] font-black text-slate-300 border border-slate-100">ID: {i + 1}</div>
                    </div>
                  )) : (
                    <p className="text-center text-slate-400 text-sm py-10">No users found.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">System Reports</h1>
                <p className="text-slate-400 text-sm">Download aggregated data across all clinics</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => exportAdminPDF('in')} 
                  disabled={reportLoading}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-slate-800"
                >
                  <Download size={18}/> {reportLoading ? "Loading..." : "Incoming Report"}
                </button>
                <button 
                  onClick={() => exportAdminPDF('out')} 
                  disabled={reportLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-blue-700"
                >
                  <Download size={18}/> {reportLoading ? "Loading..." : "Usage Report"}
                </button>
              </div>
            </div>
            
            <div className="bg-white p-16 rounded-[3rem] border border-dashed border-slate-200 text-center">
              {reportLoading ? (
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              ) : (
                <FileText className="text-slate-200 mx-auto mb-4" size={64} />
              )}
              <h3 className="font-bold text-slate-800 text-lg">
                {reportLoading ? "Gathering Global Data..." : "Reporting Module Active"}
              </h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                Click the buttons above to generate a consolidated PDF of all transactions district-wide.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonItem = () => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-pulse mb-3">
    <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
  </div>
);

// --- CLINIC DASHBOARD ---
const ClinicDashboard = ({ user, logout }) => {
  const [view, setView] = useState('menu');
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState({ transfers: [], usage: [] });
  const [histTab, setHistTab] = useState('in');
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [txnId, setTxnId] = useState(null); 
  const [targetLoc, setTargetLoc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false); // ✅ Prevents modal from popping up repeatedly
  const [pdfItems, setPdfItems] = useState(null); // To store items found in PDF
  const [uploadingPDF, setUploadingPDF] = useState(false);

  const locKey = user.location;
  const allLocations = ["STOR", "KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];

  // Function to check and trigger alert
  const checkLowStock = (data) => {
    if (hasAlerted) return;
    const lowItems = data.filter(i => {
      const stock = Number(i[locKey]) || 0;
      const min = Number(i.MinStock) || 0;
      return min > 0 && stock < min;
    });
    if (lowItems.length > 0) {
      setTimeout(() => setShowLowStockModal(true), 1000);
      setHasAlerted(true);
    }
  };

  const refreshData = () => {
    setLoading(true);
    // If we are in 'history' view, we fetch logs. Otherwise, we fetch inventory.
    const fetchPath = view === 'history' 
      ? `${API_URL}?action=getHistory&location=${locKey}`
      : `${API_URL}?action=getInventory`;

    fetch(fetchPath)
      .then(r => r.json())
      .then(data => {
        if (view === 'history') {
          setHistory(data);
        } else {
          setInventory(data);
          checkLowStock(data); // ✅ Check for low stock immediately after load
        }
      })
      .catch(err => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  };

  // ✅ Trigger refresh on 'menu' so inventory loads for the alert
  useEffect(() => {
    setSearchTerm("");
    setSelectedTxn(null);
    setTxnId(null);
    if (['menu', 'stock', 'restock', 'usage', 'history', 'transfer_out'].includes(view)) {
      refreshData();
    }
  }, [view]);

  // ✅ FIX 1: Move getFilteredData to the top level so PDF export can see it
  const getFilteredData = () => {
    let data = histTab === 'in' ? (history.transfers || []) : (history.usage || []);
    if (!data) return [];
    return data.filter(item => {
      const itemDate = new Date(item.CreatedAt || item.Timestamp).toISOString().split('T')[0];
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  };

  // ✅ FIX 2: Fixed PDF Export to include Summary and proper data access
  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = histTab === 'in' ? "Incoming Stock Report" : "Clinic Usage Report";
    const dataToExport = getFilteredData();

    if (dataToExport.length === 0) return alert("No data to export for selected range.");

    // Page 1: Logs
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Location: ${user.location} | Period: ${startDate || 'Start'} to ${endDate || 'End'}`, 14, 28);
    
    const tableHeaders = histTab === 'in' 
      ? [["Date", "ID", "From", "Status"]] 
      : [["Date", "Item Name", "Qty", "User"]];

    const tableRows = dataToExport.map(item => histTab === 'in' 
      ? [new Date(item.CreatedAt).toLocaleDateString(), item.txnID, item.From, item.Status]
      : [new Date(item.Timestamp).toLocaleDateString(), item.Item_Name, item.Qty, item.User || 'Staff']
    );

    doc.autoTable({ 
      head: tableHeaders, 
      body: tableRows, 
      startY: 40, 
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] }
    });

    // Page 2: Summary
    doc.addPage();
    doc.setTextColor(0);
    doc.setFontSize(16);
    doc.text("Executive Summary", 14, 20);
    
    let summaryHeaders, summaryRows;
    if (histTab === 'out') {
      const totals = dataToExport.reduce((acc, curr) => {
        acc[curr.Item_Name] = (acc[curr.Item_Name] || 0) + Number(curr.Qty);
        return acc;
      }, {});
      summaryHeaders = [["Item Description", "Total Qty Used"]];
      summaryRows = Object.entries(totals).sort((a,b) => b[1] - a[1]).map(([name, qty]) => [name, qty]);
    } else {
      const stats = dataToExport.reduce((acc, curr) => {
        acc[curr.Status] = (acc[curr.Status] || 0) + 1;
        return acc;
      }, {});
      summaryHeaders = [["Transaction Status", "Count"]];
      summaryRows = Object.entries(stats).map(([status, count]) => [status, count]);
    }

    doc.autoTable({
      head: summaryHeaders,
      body: summaryRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`${histTab}_Report_${user.location}.pdf`);
  };
  
  useEffect(() => {
    if (view === 'scanner') {
      const s = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      s.render((t) => { s.clear(); handleReceive(t); });
      return () => s.clear().catch(()=>{});
    }
  }, [view]);

  const handleReceive = async (txnId) => {
    const recipientName = user.name; 
    setActionLoading(true);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'confirmReceipt',
          txnId: txnId,
          to: user.location,
          recipient: recipientName 
        })
      });
      const result = await resp.json();
      if (result.status === 'success') {
        alert(`Success! Confirmed by ${recipientName}`);
        refreshData();
        setView('menu');
      }
    } catch (e) {
      console.error("Confirmation failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUsageSubmit = async () => {
  if (cart.length === 0) return;
  if (!confirm("Deduct usage from your shelf?")) return;
  setActionLoading(true);
  
  // SANITIZE DATA: Ensure code is string and quantity is number
  const sanitizedCart = cart.map(item => ({
    name: item.name,
    code: String(item.code || item.Code).trim(), // Force to string
    qty: Number(item.qty)
  }));

  try {
    const response = await fetch(API_URL, { 
      method: 'POST', 
      body: JSON.stringify({ 
        action: 'recordUsage', 
        location: locKey, 
        cart: sanitizedCart, // Use the sanitized version
        user: user.name 
      }) 
    });
      const result = await response.json();
      if (result.status === 'success') {
        setCart([]); 
        setStatus({msg: 'Stock Deducted'});
        setTimeout(() => { setView('menu'); setStatus(null); refreshData(); }, 2000);
      }
    } catch (error) {
      alert("Error recording usage.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClinicTransfer = async () => {
  if (!targetLoc) return alert("Select destination clinic");
  if (cart.length === 0) return;
  setActionLoading(true);

  // SANITIZE DATA
  const sanitizedCart = cart.map(item => ({
    name: item.name,
    code: String(item.code || item.Code).trim(),
    qty: Number(item.qty)
  }));

  try {
    const res = await fetch(API_URL, { 
      method: 'POST', 
      body: JSON.stringify({ 
        action: 'checkout', // ✅ MUST be 'checkout' for transfers
        from: user.location, 
        to: targetLoc, 
        cart: sanitizedCart 
      }) 
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      setTxnId(data.txnId); // This triggers the QR code display
      setCart([]);
      setStatus({msg: 'Transfer Initiated'});
      refreshData();
      // Don't automatically switch view so the user can see/save the QR code
    } else {
      alert("Transfer failed: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    alert("Transfer failed. Check connection.");
  } finally {
    setActionLoading(false);
  }
};

const handleRefillRequest = async (items) => {
  setActionLoading(true);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'refillRequest',
        location: user.location,
        items: items.map(i => ({ name: i.Item_Name, stock: i[locKey] }))
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      alert("Refill request sent to STOR via email.");
      setShowLowStockModal(false);
    }
  } catch (err) {
    alert("Failed to send request.");
  } finally {
    setActionLoading(false);
  }
};
    
const handlePDFUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadingPDF(true);
  const formData = new FormData();
  formData.append('invoice', file);

  try {
    // 1. Send to your Node.js backend (server.cjs)
    const response = await fetch('/api/process-receipt', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();

    if (result.success && result.transferred.length > 0) {
      // ✅ FIX: Instead of window.confirm, we store the data in state.
      // This makes the "Review PDF Items" modal appear automatically.
      setPdfItems(result.transferred); 
    } else {
      alert("No items detected. Please ensure this is a standard KEW.PS-8 PDF.");
    }
  } catch (err) {
    console.error("PDF Upload Error:", err);
    alert("Server error processing PDF.");
  } finally {
    setUploadingPDF(false);
    // Clear the input so the user can upload the same file again if they cancel
    e.target.value = null; 
  }
};

const handleManualPDFSubmit = async (itemsToSubmit) => {
  if (!itemsToSubmit || itemsToSubmit.length === 0) return;
  
  setActionLoading(true);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'recordUsage',
        operation: 'add', // ⬅️ Tells GAS to add stock instead of subtract
        location: user.location,
        // Mapping the PDF items to the format GAS expects
        cart: itemsToSubmit.map(i => ({ 
          name: i.item, 
          qty: i.quantity, 
          code: String(i.item).trim() 
        })),
        user: user.name
      })
    });
    
    const data = await res.json();
    if (data.status === 'success') {
      alert("Stock successfully updated from PDF!");
      setPdfItems(null); // ✅ Clear state to close the modal
      refreshData();     // Update the inventory numbers on screen
      setView('menu');   // Go back to the main menu
    }
  } catch (err) {
    alert("Failed to update stock via PDF.");
  } finally {
    setActionLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col font-sans">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          {view !== 'menu' && (
            <button onClick={() => setView('menu')} className="p-2 bg-slate-100 rounded-full">
              <ChevronLeft size={18}/>
            </button>
          )}
          <img src="/logo_PKPDKK.png" alt="Logo" className="h-6 w-auto" />
          <div className="flex flex-col">
            <span className="font-bold text-sm truncate uppercase tracking-tight text-slate-800">
              {(user?.name || user?.username || "Staff").replace(/_/g, ' ')}
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-blue-600 truncate bg-blue-50 px-1.5 rounded w-fit">
              <MapPin size={12} className="mr-1" aria-hidden="true" />
              {user?.location?.replace(/_/g, ' ')}
            </span>
          </div>

        </div>
        <button onClick={logout} className="text-slate-400 p-2"><LogOut size={20}/></button>
      </header>

      <main className="p-4 flex-1 max-w-md mx-auto w-full">
        {status && (
          <div className="p-4 mb-4 bg-green-600 text-white rounded-xl text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
            <CheckCircle2 size={20} /> {status.msg}
          </div>
        )}

        {view === 'menu' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
          {/* Welcome & Stats Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 p-6 rounded-4xl text-white shadow-lg shadow-blue-200">
            <h2 className="text-xl font-bold">Hello, {(user?.name || user?.username || "Staff").replace(/_/g, ' ')}</h2>
            <p className="opacity-80 text-xs">Manage inventory for {user.location}</p>
      
            <div className="flex gap-4 mt-4">
              {/* Low Stock Card - Now Clickable */}
              <div 
                onClick={() => setShowLowStockModal(true)}
                className="bg-white/20 p-3 rounded-2xl flex-1 text-center backdrop-blur-sm cursor-pointer active:scale-95 transition hover:bg-white/30 border border-white/10"
                >
                <p className="text-[10px] uppercase font-bold opacity-70">Low Stock</p>
                <p className="text-xl font-black flex items-center justify-center gap-1">
                  {(() => {
                    const count = (inventory || []).filter(i => {
                      const stock = Number(i[locKey]) || 0;
                      const min = Number(i.MinStock) || 0;
                      return min > 0 && stock < min;
                    }).length;

                    return (
                    <>
                    {count}
                    {count > 0 && (
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    )}
                    </>
                    );
                  })()}
                </p>
              </div>

              <div className="bg-white/20 p-3 rounded-2xl flex-1 text-center backdrop-blur-sm">
                <p className="text-[10px] uppercase font-bold opacity-70">Today's Usage</p>
                <p className="text-xl font-black">{history.usage?.filter(u => new Date(u.Timestamp).toDateString() === new Date().toDateString()).length || 0}</p>
              </div>
            </div>
          </div>

          {/* Primary Actions Grid */}
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => setView('usage')} className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Minus size={24} strokeWidth={2.5}/>
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-800">Record Usage</h2>
                <p className="text-xs text-slate-400">Deduct items from your shelf</p>
              </div>
            </button>

            <button onClick={() => setView('transfer_out')} className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <ArrowUpFromLine size={24} strokeWidth={2.5}/>
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-800">Transfer Out</h2>
                <p className="text-xs text-slate-400">Send stock to another clinic</p>
              </div>
            </button>
          </div>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('scanner')} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:bg-slate-50">
              <QrCode size={24} className="text-green-600" />
              <span className="text-xs font-bold text-slate-700">Receive</span>
            </button>
            <button onClick={() => setView('history')} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:bg-slate-50">
              <History size={24} className="text-purple-600" />
              <span className="text-xs font-bold text-slate-700">History</span>
            </button>
          </div>

          {/* Footer Action */}
          <button onClick={() => setView('stock')} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-500 text-xs font-bold flex items-center justify-center gap-2 border border-dashed border-slate-300">
            <Package size={16} /> View Full Inventory List
          </button>
        </div>
        )}

        {/* --- LIST VIEWS WITH SKELETONS --- */}
        {view !== 'menu' && view !== 'scanner' && view !== 'usage_cart' && loading ? (
          <div className="space-y-3">
            <div className="h-12 bg-slate-200 rounded-xl mb-6 animate-pulse"></div>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
          ) : (
          <>
            {view === 'scanner' && (
  <div className="space-y-4 animate-in fade-in duration-500 pb-20">
    <div className="bg-white p-4 rounded-[2.5rem] shadow-xl border-2 border-blue-500 overflow-hidden">
      {/* 1. THE QR SCANNER */}
      <div id="reader" className="overflow-hidden rounded-2xl"></div>
      
      <div className="mt-6 space-y-6">
        {/* DIVIDER 1 */}
        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-slate-100"></div>
          <span className="shrink mx-4 text-[10px] font-black text-slate-300 uppercase">OR</span>
          <div className="grow border-t border-slate-100"></div>
        </div>

        {/* 2. MANUAL INPUT */}
        <div className="space-y-3">
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Option 2: Manual ID Entry
          </p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter TXN-XXXXXX"
              className="flex-1 p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold uppercase"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleReceive(e.target.value);
              }}
              id="manualTxnInput"
            />
            <button 
              onClick={() => handleReceive(document.getElementById('manualTxnInput').value)}
              className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-xs"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* DIVIDER 2 */}
        <div className="relative flex py-2 items-center">
          <div className="grow border-t border-slate-100"></div>
          <span className="shrink mx-4 text-[10px] font-black text-slate-300 uppercase">OR</span>
          <div className="grow border-t border-slate-100"></div>
        </div>

        {/* 3. PDF UPLOAD */}
        <div className="space-y-3">
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Option 3: Digital Receipt (KEW.PS-8)
          </p>
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-4xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              {uploadingPDF ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-tighter">Parsing Document...</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-100 rounded-2xl mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <FileUp size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Upload KEW.PS-8 PDF</p>
                  <p className="text-[10px] text-slate-400 mt-1">System will auto-detect items & quantities</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={handlePDFUpload} 
              disabled={uploadingPDF} 
            />
          </label>
        </div>
      </div>
    </div>
  </div>
)}

          {view === 'usage' && (
            <div className="space-y-3">
              <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input placeholder="Search Name, Category, ID.." className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
              <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-blue-600">{cart.length} items in cart</span><button onClick={()=>setView('usage_cart')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">Review Usage</button></div>
              {(inventory || [])
                .filter(i => {
                  const term = searchTerm.toLowerCase();
                  const hasStock = (i[locKey] || 0) > 0;

                  return hasStock && (
                    i.Item_Name?.toLowerCase().includes(term) ||
                    i.Category?.toLowerCase().includes(term) ||
                    i.Code?.toString().includes(term)
                  );
                })
                .map(i => (
                  <div key={i.Code} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono font-bold">#{i.Code} - {i.Category}</p>
                      <h3 className="text-sm font-bold text-slate-700">{i.Item_Name}</h3>
                      <p className="text-xs text-blue-500">Stock: {i[locKey] || 0}</p>
                    </div>
                    <button
                      onClick={() => {
                      const q = prompt("Qty used?");
                      if (q) setCart([...cart, { name: i.Item_Name, code: i.Code, qty: q }]);
                      }}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Plus size={20} />
                    </button>
                  </div>
              ))}
              </div>
          )}

          {view === 'usage_cart' && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg">Confirm Usage</h2>
                <div className="space-y-2">
                  {cart.map((c, idx) => <div key={idx} className="p-3 bg-white border rounded-xl flex justify-between text-sm"><span>{c.name}</span><div className="flex items-center gap-3"><b>x{c.qty}</b><button onClick={()=>setCart(cart.filter((_,i)=>i!==idx))} className="text-red-500 text-xl">×</button></div></div>)}
                </div>
                <button onClick={handleUsageSubmit} disabled={actionLoading || cart.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
                  {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Record Usage Now"}
                </button>
              </div>
            )
          }

          {/* --- TRANSFER OUT VIEW --- */}
          {view === 'transfer_out' && (
            <div className="space-y-4">
              {!txnId ? (
                <>
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Destination Clinic</label>
                  <select 
                    value={targetLoc} 
                    onChange={e => setTargetLoc(e.target.value)} 
                    className="w-full p-3 border rounded-xl font-bold text-blue-600 outline-none"
                  >
                    <option value="">Select Destination...</option>
                    {allLocations.filter(l => l !== locKey).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                  <input 
                  placeholder="Find items to send..." 
                  className="w-full pl-10 pr-4 py-3 border rounded-xl" 
                  onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
                </div>

                <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600">
                    {cart.length} items in transfer
                  </span>
                 <button 
                    onClick={() => setView('transfer_cart')} 
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                    Review Transfer
                  </button>
                </div>

                {(inventory || [])
                .filter(i => {
                  const term = searchTerm.toLowerCase();
                  return (
                    i.Item_Name?.toLowerCase().includes(term) ||
                    i.Category?.toLowerCase().includes(term) ||
                    i.Code?.toString().includes(term)
                    );
                  })
                .map(i => (
                  <div 
                    key={i.Code} 
                    className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">#{i.Code}</p>
                      <h3 className="text-sm font-bold">{i.Item_Name}</h3>
                      <p className="text-xs text-slate-500">Category: {i.Category}</p>
                      <p className="text-xs text-blue-500">Available: {i[locKey] || 0}</p>
                    </div>
                    <button onClick={() => { 
                      const q = prompt(`How many ${i.Item_Name} to send?`); 
                      if(q) setCart([...cart, { name: i.Item_Name, code: i.Code, qty: q }]); 
                      }} className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Plus size={20}/>
                    </button>
                  </div>
                  ))
                }
                </>
                ) : (
                <div className="bg-white p-8 rounded-3xl border shadow-xl text-center space-y-4">
                  <h3 className="font-bold text-lg">Transfer Ready</h3>
                  <QRCodeCanvas value={txnId} size={200} className="mx-auto p-2 border rounded-xl" />
                  <p className="font-mono font-bold text-blue-600">{txnId}</p>
                  <p className="text-xs text-slate-400">Ask the receiving clinic to scan this code.</p>
                  <button onClick={() => setView('menu')} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Done</button>
                </div>
                )
              }
            </div>
            )
          }

          {/* --- TRANSFER CART REVIEW --- */}
          {view === 'transfer_cart' && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg">Transfer to {targetLoc}</h2>
              <div className="space-y-2">
                {cart.map((c, idx) => <div key={idx} className="p-3 bg-white border rounded-xl flex justify-between text-sm"><span>{c.name}</span><div className="flex items-center gap-3"><b>x{c.qty}</b><button onClick={()=>setCart(cart.filter((_,i)=>i!==idx))} className="text-red-500">×</button></div></div>)}
              </div>
              <button onClick={handleClinicTransfer} disabled={actionLoading || cart.length === 0} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
                {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Confirm & Send Stock"}
              </button>
            </div>
            )
          }

          {view === 'stock' && (
            <div className="space-y-2">
              <input placeholder="Search all items..." className="w-full p-3 border rounded-xl mb-4 shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
              {(inventory || [])
                .filter(i => {
                  const term = searchTerm.toLowerCase();
                  return (
                    i.Item_Name?.toLowerCase().includes(term) ||
                    i.Category?.toLowerCase().includes(term) ||
                    i.Code?.toString().includes(term)
                  );
                })
                
                .map(i => (
                  <div key={i.Code} className="p-4 bg-white border rounded-xl flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono">#{i.Code}</p>
                      <span className="text-sm font-bold text-slate-700">{i.Item_Name}</span>
                      <p className="text-xs text-slate-500">Category: {i.Category}</p>
                    </div>
                    <span className={`font-bold px-3 py-1 rounded-lg ${
                      Number(i[locKey]) < i.MinStock
                      ? 'bg-red-100 text-red-600'
                      : 'bg-slate-100 text-slate-600'
                      }`} >
                      {i[locKey] || 0}
                    </span>
                  </div>
              ))}
            </div>
          )}

          {view === 'restock' && (inventory || []).filter(i => (Number(i[locKey]) || 0) < (i.MinStock || 0)).map(i => (
            <div key={i.Code} className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center mb-2">
              <div><p className="text-[9px] text-slate-400 font-mono">#{i.Code}</p><p className="text-sm font-bold">{i.Item_Name}</p></div>
              <div className="text-right"><p className="text-red-600 font-bold">{i[locKey] || 0}</p><p className="text-[9px] text-slate-400 uppercase">Min: {i.MinStock}</p></div>
            </div>
          ))}

          {view === 'history' && (
  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
    
    {/* 1. Header: Tab Switcher & PDF Export */}
    <div className="flex justify-between items-center gap-3">
      <div className="flex bg-slate-200 p-1.5 rounded-2xl flex-1 shadow-inner">
        <button 
          onClick={() => setHistTab('in')} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${histTab === 'in' ? 'bg-white shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
        >
          Received
        </button>
        <button 
          onClick={() => setHistTab('out')} 
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${histTab === 'out' ? 'bg-white shadow-md text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
        >
          Usage
        </button>
      </div>
      <button 
        onClick={exportToPDF} 
        className="p-3.5 bg-slate-900 text-white rounded-2xl active:scale-90 transition shadow-lg"
        title="Export PDF"
      >
        <Download size={20}/>
      </button>
    </div>

    {/* 2. Date Filters */}
    <div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm grid grid-cols-2 gap-3">
      <div className="col-span-2 flex justify-between items-center mb-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Date Range</span>
        {(startDate || endDate) && (
          <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">Reset</button>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[9px] text-slate-400 font-bold ml-1">START</p>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs p-3 border-0 bg-slate-50 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="space-y-1">
        <p className="text-[9px] text-slate-400 font-bold ml-1">END</p>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs p-3 border-0 bg-slate-50 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
    </div>

    {/* 3. The Grouped Data List */}
    <div className="space-y-6">
      {(() => {
        // --- DATA FILTERING ---
        const raw = histTab === 'in' ? (history?.transfers || []) : (history?.usage || []);
        
        const filtered = raw.filter(item => {
          const itemDate = new Date(item.CreatedAt || item.Timestamp).toISOString().split('T')[0];
          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });

        if (filtered.length === 0) return (
          <div className="text-center py-16 bg-white rounded-4xl border border-dashed border-slate-200">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-slate-300" size={24} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">No records found</p>
          </div>
        );

        // --- STEP 1: Group by Date (YYYY-MM-DD) ---
        const groupedByDate = filtered.reduce((acc, item) => {
          const date = new Date(item.CreatedAt || item.Timestamp).toISOString().split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(item);
          return acc;
        }, {});

        // Sort dates: latest first
        return Object.keys(groupedByDate).sort().reverse().map(date => (
          <div key={date} className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 drop-shadow-sm">
              {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </h3>
            
            {/* --- STEP 2: Group by User/Staff inside each date --- */}
            {(() => {
              const usersInDate = groupedByDate[date].reduce((acc, item) => {
                const user = item.User || item.From || item.Recipient || "Staff";
                if (!acc[user]) acc[user] = [];
                acc[user].push(item);
                return acc;
              }, {});

              return Object.entries(usersInDate).map(([user, items]) => (
                <div key={user} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-100">
                      {user[0].toUpperCase()}
                    </div>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{user}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => histTab === 'in' && setSelectedTxn(it)}
                        className={`group flex justify-between items-center text-sm py-2.5 border-t border-slate-50 first:border-0 transition-colors ${histTab === 'in' ? 'cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-xl' : ''}`}
                      >
                        <div className="flex-1 pr-4">
                          <p className="text-slate-700 font-bold text-xs leading-tight">
                            {it.Item_Name || it.ItemName || it.txnID || `TXN: ${it.Transfer_ID}`}
                          </p>
                          {histTab === 'in' && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Tap for details</p>
                              {it.Status && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${it.Status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{it.Status}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl text-xs">
                            x{it.Qty || it.qty || "1"}
                          </span>
                          {histTab === 'in' && <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ));
      })()}
    </div>

    {/* 4. DETAIL MODAL: For Unpacking Incoming JSON Items */}
    {selectedTxn && (
      <div className="fixed inset-0 bg-black/70 z-10000 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
        <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-black text-slate-900 text-xl tracking-tighter">Package Details</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">Ref: {selectedTxn.txnID}</p>
            </div>
            <button onClick={() => setSelectedTxn(null)} className="p-3 bg-slate-100 rounded-full text-slate-500 active:bg-slate-200">
              <LogOut size={20} className="rotate-180" />
            </button>
          </div>

          <div className="bg-slate-50 rounded-4xl p-5 mb-8 border border-slate-100">
            <div className="flex justify-between text-[10px] uppercase font-black text-slate-400 mb-4 tracking-widest px-2">
              <span>Item Description</span>
              <span>Qty</span>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {JSON.parse(selectedTxn.ItemsJSON || "[]").map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                  <span className="text-xs text-slate-800 font-bold leading-tight pr-4">{item.name || item.Item_Name}</span>
                  <span className="text-sm font-black text-blue-600">x{item.qty || item.Qty}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-100 rounded-2xl text-center">
              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">Status</p>
              <p className={`text-xs font-black ${selectedTxn.Status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>{selectedTxn.Status || 'Pending'}</p>
            </div>
            <div className="p-4 bg-slate-100 rounded-2xl text-center">
              <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">Origin</p>
              <p className="text-xs font-black text-slate-800">{selectedTxn.From || 'STOR'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedTxn(null)}
            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm active:scale-95 transition"
          >
            Close Details
          </button>
        </div>
      </div>
    )}
  </div>
)}

          </>
        )}
      
      </main>
      {/* --- LOW STOCK ALERT MODAL (PLACED OUTSIDE VIEWS) --- */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-4xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="font-extrabold text-xl">Stock Alerts</h3>
              </div>
              <button onClick={() => setShowLowStockModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">✕</button>
            </div>

            {/* List Area */}
            <div className="max-h-64 overflow-y-auto space-y-3 mb-6 pr-1">
              {(inventory || [])
                .filter(item => {
                  const stock = Number(item[locKey]) || 0;
                  const min = Number(item.MinStock) || 0;
                  return min > 0 && stock < min;
                })
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100">
                    <div className="flex-1 pr-2">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{item.Item_Name}</p>
                      <p className="text-[11px] text-red-500 font-semibold mt-1">Target: {item.MinStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{item[locKey] || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Left</p>
                    </div>
                  </div>
              ))}
            </div>

            {/* Action Buttons: Stacked for Mobile UX */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button onClick={() => setShowLowStockModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition">
                  Dismiss
                </button>
                <button 
                  onClick={() => handleRefillRequest(inventory.filter(i => (Number(i[locKey]) || 0) < (Number(i.MinStock) || 0)))}
                  disabled={actionLoading}
                  className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Request Refill"}
                </button>
              </div>
              <button 
                onClick={() => { setShowLowStockModal(false); setView('restock'); }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition"
                >
                <Plus size={18} /> View Restock List
              </button>
            </div>
          </div>
        </div>
      )}  
      
      {/* ✅ THIS IS WHERE pdfItems IS USED */}
{pdfItems && (
  <div className="fixed inset-0 bg-black/70 z-10001 flex items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <h3 className="font-black text-slate-900 text-lg mb-1">Confirm PDF Data</h3>
      <p className="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-widest">Parsed from KEW.PS-8</p>

      <div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-2">
        {/* ✅ READING the items from pdfItems here */}
        {pdfItems.map((item, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-800 truncate pr-4">{item.item}</span>
            <span className="text-sm font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm">x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => setPdfItems(null)} // ✅ RESET: This closes the modal
          className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition"
        >
          Cancel
        </button>
        <button 
          onClick={() => handleManualPDFSubmit(pdfItems)} // ✅ PASSING the data to the submission function
          className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition flex items-center justify-center gap-2"
        >
          {actionLoading ? "Updating..." : "Confirm & Add"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const logout = () => { setUser(null); localStorage.removeItem('user'); window.location.href="/"; };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login setUser={setUser} /> : 
          <Navigate to={user.role === 'Admin' ? '/admin' : user.role === 'Warehouse' ? '/warehouse' : '/clinic'} />} 
        />
        <Route path="/warehouse" element={user?.role === 'Warehouse' ? <WarehouseDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
        <Route path="/clinic" element={user?.role === 'Clinic' ? <ClinicDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'Admin' ? <AdminDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}