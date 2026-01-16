import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Plus, Minus, QrCode, LogOut, Package, Search, 
  ChevronLeft, ChevronUp, ChevronDown, AlertTriangle, History, ArrowDownToLine, 
  ArrowUpFromLine, CheckCircle2, Users, ShieldCheck, Download, MapPin
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = "/.netlify/functions/inventory-proxy";

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
        // 2. Password correct, now trigger OTP
        const userObj = setupData.users.find(u => u.username === selectedUser);
        console.log("Sending OTP to:", userObj.email); // IS THIS PRINTING A REAL EMAIL?
        const otpRes = await fetch(`${API_URL}?action=sendOTP&email=${userObj.email}`);
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

// ---WAREHOUSE DASHBOARD WITH CLINIC ALERTS ---
const WarehouseDashboard = ({ user, logout }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLoc, setTargetLoc] = useState("KPH");
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => { 
    fetch(`${API_URL}?action=getInventory`).then(res => res.json()).then(setInventory); 
  }, []);

  // Filter items that are low in ANY clinic
  const clinicAlerts = inventory.filter(item => {
    const clinics = ["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];
    return clinics.some(c => (Number(item[c]) || 0) < (item.MinStock || 0));
  });

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
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo_PKPDKK.png" alt="Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold">STOR PKPDKK</h1>
          </div>
          <div className="flex gap-4">
            <button 
                onClick={() => setShowAlerts(!showAlerts)} 
                className={`relative p-2 rounded-full transition ${showAlerts ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}
              >
                <AlertTriangle size={20}/>
                {clinicAlerts.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto flex-1">
          {showAlerts && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4">
              <h2 className="text-red-700 font-bold flex items-center gap-2 mb-4"><AlertTriangle size={18}/> Clinic Stock Alerts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clinicAlerts.map(item => (
                   <div key={item.Code} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-xs">{item.Item_Name}</p>
                        <p className="text-[10px] text-slate-400">Critical at: {["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].filter(c => (Number(item[c])||0) < item.MinStock).join(", ")}</p>
                      </div>
                      <button onClick={() => { setTargetLoc("KPH"); addToCart(item); }} className="p-1 px-3 bg-red-600 text-white text-[10px] font-bold rounded-lg">Fulfill</button>
                   </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input placeholder="Search Category, Items, ID..." className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Category?.toLowerCase().includes(searchTerm) || i.Code?.toString().toLowerCase().includes(searchTerm)).map(item => {
              const stock = Number(item[user.location]) || 0;
              const low = stock < item.MinStock && stock > 0;
              return (
                <div key={item.Code} className={`p-4 rounded-xl border bg-white ${stock <= 0 ? 'opacity-60' : low ? 'border-orange-300 bg-orange-50' : 'border-slate-100'}`}>
                  <div className="flex justify-between mb-2">
                    <div className="truncate pr-2">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-[9px] text-blue-500 font-bold uppercase bg-blue-50 px-1 rounded">{item.Category}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">#{item.Code}</span>
                      </div>
                      <h3 className="font-bold text-sm truncate">{item.Item_Name}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold h-fit ${stock <= 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'}`}>{stock}</span>
                  </div>

                  <button onClick={() => addToCart(item)} className="w-full mt-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">Add to Transfer</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Sidebar remains same */}
      <div className="w-80 bg-white border-l shadow-xl flex flex-col">
          <div className="p-4 border-b bg-slate-50 font-bold">Transfer Cart</div>
          <div className="p-4 bg-white border-b">
            <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Destination Clinic:</label>
            <select value={targetLoc} onChange={e => setTargetLoc(e.target.value)} className="w-full border rounded p-2 text-sm font-bold">
              {["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.map(c => <div key={c.cartId} className="text-xs p-2 bg-slate-50 rounded border flex justify-between items-center">
              <span>{c.name}</span><div className="flex items-center gap-2"><b>x{c.qty}</b><button onClick={()=>setCart(cart.filter(x=>x.cartId!==c.cartId))} className="text-red-400">×</button></div>
            </div>)}
          </div>
          <div className="p-4 border-t">
            {txnId ? (
              <div className="text-center">
                <QRCodeCanvas value={txnId} size={140} className="mx-auto border p-2 rounded" />
                <p className="mt-2 font-mono text-xs font-bold text-green-600">{txnId}</p>
                <button onClick={()=>{setTxnId(null); setCart([]);}} className="text-xs underline mt-2 text-slate-400">Next Transfer</button>
              </div>
            ) : (
              <button onClick={handleCheckout} disabled={cart.length === 0 || loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
                {loading ? "Processing..." : `Transfer to ${targetLoc}`}
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

  useEffect(() => {
    fetch(`${API_URL}?action=getLoginData`)
      .then(res => res.json())
      .then(data => setUsers(data.users));
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

    await fetch(API_URL, { method: 'POST', body: JSON.stringify(formData) });
    alert("User Added Successfully");
    e.target.reset();
    setLoading(false);
    // Refresh list
    fetch(`${API_URL}?action=getLoginData`).then(res => res.json()).then(data => setUsers(data.users));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><ShieldCheck/> Admin</h2>
        <nav className="space-y-4">
          <div className="p-3 bg-blue-600 rounded-lg flex items-center gap-2 cursor-pointer"><Users size={20}/> User Management</div>
          <button onClick={logout} className="p-3 text-slate-400 flex items-center gap-2 hover:text-white w-full"><LogOut size={20}/> Logout</button>
        </nav>
      </div>

      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-8">User Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add User Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input name="username" placeholder="Full Name / Username" className="w-full p-3 border rounded-xl" required />
              <input name="password" type="password" placeholder="Password" className="w-full p-3 border rounded-xl" required />
              {/* NEW: Email Field */}
              <input name="email" type="email" placeholder="Staff Email (for notifications)" className="w-full p-3 border rounded-xl" required />
              <div className="grid grid-cols-2 gap-4">
                <select name="role" className="p-3 border rounded-xl">
                  <option>Clinic</option>
                </select>
                <select name="location" className="p-3 border rounded-xl">
                  {["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                {loading ? "Adding..." : "Register User"}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-bold mb-4">Current Users</h3>
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {users.map((u, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-sm">{u.username}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{u.role} • {u.location}</p>
                  </div>
                  <div className="text-slate-300">ID: {i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
  const [expandedMonths, setExpandedMonths] = useState({});
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const locKey = user.location;
  const allLocations = ["STOR", "KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];

  // ✅ FIX 1: Move getFilteredData to the top level so PDF export can see it
  const getFilteredData = () => {
    let data = histTab === 'in' ? history.transfers : history.usage;
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
      ? [new Date(item.CreatedAt).toLocaleDateString(), item.TransactionID, item.From, item.Status]
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

  const refreshData = () => {
    setLoading(true);
    const fetchPath = view === 'history' 
      ? `${API_URL}?action=getHistory&location=${locKey}`
      : `${API_URL}?action=getInventory`;

    fetch(fetchPath)
      .then(r => r.json())
      .then(data => {
        if (view === 'history') setHistory(data);
        else setInventory(data);
      })
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSearchTerm("");
    setSelectedTxn(null);
    setTxnId(null);
    if (['stock', 'restock', 'usage', 'history', 'transfer_out'].includes(view)) {
      refreshData();
    }
  }, [view]);

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
    try {
      const response = await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ 
          action: 'recordUsage', 
          location: locKey, 
          cart: cart,
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
    try {
      const res = await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ 
          action: 'checkout', 
          from: user.location, 
          to: targetLoc, 
          cart: cart 
        }) 
      });
      const data = await res.json();
      setTxnId(data.txnId); 
      setCart([]);
      refreshData();
    } catch (err) {
      alert("Transfer failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-orange-400 via-pink-500 to-purple-600 flex flex-col font-sans">
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
                  {inventory.filter(i => (Number(i[locKey]) || 0) < (i.MinStock || 0)).length}
                  {inventory.filter(i => (Number(i[locKey]) || 0) < (i.MinStock || 0)).length > 0 && 
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  }
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
              <div className="space-y-4">
                 <div className="bg-white p-4 rounded-3xl shadow-xl border-2 border-blue-500 overflow-hidden">
                    <div id="reader"></div>
                    <div className="mt-4 pt-4 border-t border-dashed">
                       <p className="text-center text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-widest">Or Manual Transaction Entry</p>
                       <form onSubmit={(e) => {
                          e.preventDefault();
                          const val = e.target.txn.value.toUpperCase().trim();
                          if(val) handleReceive(val);
                       }} className="flex gap-2">
                          <input name="txn" placeholder="TXN-XXXXXX" className="flex-1 p-3 border rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" required />
                          <button type="submit" disabled={actionLoading} className="bg-blue-600 text-white px-4 rounded-xl font-bold min-w-25 flex items-center justify-center">
                            {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Confirm"}
                          </button>
                       </form>
                    </div>
                 </div>
              </div>
            )}

          {view === 'usage' && (
            <div className="space-y-3">
              <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input placeholder="Search Name, Category, ID.." className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
              <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-blue-600">{cart.length} items in cart</span><button onClick={()=>setView('usage_cart')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">Review Usage</button></div>
              {inventory
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

                {inventory
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
              {inventory
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

          {view === 'restock' && inventory.filter(i => (Number(i[locKey]) || 0) < (i.MinStock || 0)).map(i => (
            <div key={i.Code} className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center mb-2">
              <div><p className="text-[9px] text-slate-400 font-mono">#{i.Code}</p><p className="text-sm font-bold">{i.Item_Name}</p></div>
              <div className="text-right"><p className="text-red-600 font-bold">{i[locKey] || 0}</p><p className="text-[9px] text-slate-400 uppercase">Min: {i.MinStock}</p></div>
            </div>
          ))}

          {view === 'history' && (
            <div className="space-y-4">

            {/* ---------- HELPERS ---------- */}
            {/*
                Timezone-safe date formatter
                  Returns YYYY-MM-DD
            */}
            {(() => {})()}
    
            {/* Tab Switcher */}
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button
                  onClick={() => setHistTab('in')}
                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  histTab === 'in'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-slate-500'
                  }`}
                  >
                  Incoming
                </button>
                <button
                  onClick={() => setHistTab('out')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  histTab === 'out'
                  ? 'bg-white shadow text-blue-600'
                  : 'text-slate-500'
                  }`}
                  >
                  Usage
                </button>
              </div>

              {/* ---------- DATE FILTER & PDF ---------- */}
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Filter & Export
                  </h3>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      }}
                      className="text-[10px] text-red-500 font-bold">
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-slate-400 ml-1">Start Date</p>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-slate-50"
                    />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 ml-1">End Date</p>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs p-2 border rounded-lg bg-slate-50"
                    />
                  </div>
                </div>

                {/* ---------- PDF EXPORT ---------- */}
                <button
                  onClick={() => {
                    const toLocalDate = (date) =>
                    new Date(date).toLocaleDateString('en-CA');

                    const doc = new jsPDF();
                    const title =
                    histTab === 'in'
                    ? 'Incoming Stock Report'
                    : 'Clinic Usage Report';

                    const rawData =
                    histTab === 'in'
                    ? history.transfers || []
                    : history.usage || [];

                    const dataToExport = rawData.filter((item) => {
                      const d = toLocalDate(item.CreatedAt || item.Timestamp);
                      return (!startDate || d >= startDate) &&
                      (!endDate || d <= endDate);
                    });

                    if (!dataToExport.length) {
                      alert('No data to export for selected range.');
                      return;
                    }

                    doc.setFontSize(18);
                    doc.text(title, 14, 20);
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(
                      `Location: ${user.location} | Period: ${startDate || 'Start'} to ${endDate || 'End'}`,
                      14,
                      28
                    );
                    doc.text(`Generated by: ${user.name}`, 14, 33);

                    const tableHeaders =
                    histTab === 'in'
                    ? [['Date', 'ID', 'From', 'Status']]
                    : [['Date', 'Item Name', 'Qty', 'User']];

                    const tableRows = dataToExport.map((item) =>
                      histTab === 'in'
                      ? [
                      toLocalDate(item.CreatedAt),
                      item.TransactionID,
                      item.From,
                      item.Status,
                      ]
                      : [
                      toLocalDate(item.Timestamp),
                      item.Item_Name,
                      item.Qty,
                      item.User || 'Staff',
                      ]
                    );

                    doc.autoTable({
                      head: tableHeaders,
                      body: tableRows,
                      startY: 40,
                      theme: 'striped',
                      headStyles: { fillColor: [51, 65, 85] },
                    });

          // ---------- SUMMARY PAGE ----------
          doc.addPage();
          doc.setFontSize(16);
          doc.text('Executive Summary', 14, 20);

          let summaryHeaders = [];
          let summaryRows = [];

          if (histTab === 'out') {
            const totals = dataToExport.reduce((acc, cur) => {
              acc[cur.Item_Name] =
                (acc[cur.Item_Name] || 0) + Number(cur.Qty);
              return acc;
            }, {});
            summaryHeaders = [['Item Description', 'Total Qty Used']];
            summaryRows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
          } else {
            const stats = dataToExport.reduce((acc, cur) => {
              acc[cur.Status] = (acc[cur.Status] || 0) + 1;
              return acc;
            }, {});
            summaryHeaders = [['Transaction Status', 'Count']];
            summaryRows = Object.entries(stats);
          }

          doc.autoTable({
            head: summaryHeaders,
            body: summaryRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
          });

          const pageHeight = doc.internal.pageSize.height;
          const y = Math.min(
            doc.lastAutoTable.finalY + 10,
            pageHeight - 10
          );

          doc.setFontSize(9);
          doc.setTextColor(150);
          doc.text('End of Official Report', 105, y, {
            align: 'center',
          });

          doc.save(
            `${histTab}_Report_${user.location}_${toLocalDate(
              new Date()
            )}.pdf`
          );
        }}
        className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold"
      >
        Download PDF with Summary
      </button>
    </div>

    {/* ---------- GROUPED HISTORY ---------- */}
    <div className="space-y-6">
      {(() => {
        const toLocalDate = (date) =>
          new Date(date).toLocaleDateString('en-CA');

        const raw =
          histTab === 'in'
            ? history.transfers || []
            : history.usage || [];

        const filtered = raw.filter((item) => {
          const d = toLocalDate(item.CreatedAt || item.Timestamp);
          return (!startDate || d >= startDate) &&
                 (!endDate || d <= endDate);
        });

        if (!filtered.length) {
          return (
            <p className="text-center text-slate-400 text-xs py-10">
              No records found for this period.
            </p>
          );
        }

        const grouped = filtered.reduce((acc, item) => {
          const date = new Date(item.CreatedAt || item.Timestamp);
          const key = date.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          });
          acc[key] = acc[key] || [];
          acc[key].push(item);
          return acc;
        }, {});

        const sortedMonths = Object.keys(grouped).sort(
          (a, b) =>
            Math.max(
              ...grouped[b].map((i) =>
                new Date(i.CreatedAt || i.Timestamp)
              )
            ) -
            Math.max(
              ...grouped[a].map((i) =>
                new Date(i.CreatedAt || i.Timestamp)
              )
            )
        );

        return sortedMonths.map((month) => {
          const isExpanded = expandedMonths[month] ?? true;

          return (
            <div key={month} className="border-b pb-2">
              <button
                onClick={() =>
                  setExpandedMonths((p) => ({
                    ...p,
                    [month]: !isExpanded,
                  }))
                }
                className="w-full flex justify-between py-3"
              >
                <span className="text-[11px] font-black text-slate-500">
                  {month}
                </span>
                <span className="text-[10px] font-black bg-slate-100 px-2 rounded-full">
                  {grouped[month].length}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-3 mt-2">
                  {(() => {
                  // 1. If we are looking at INCOMING, show the simple ID cards
                  if (histTab === 'in') {
                    return grouped[month].map((item) => (
                    <div
                      key={`${item.TransactionID}-${item.CreatedAt}`}
                      onClick={() => setSelectedTxn(item)}
                      className="p-4 bg-white border rounded-2xl cursor-pointer hover:border-blue-300 transition shadow-sm"
                      >
                      <div className="flex justify-between items-center">
                        <b className="text-slate-700">{item.TransactionID}</b>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.Status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.Status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(item.CreatedAt).toLocaleDateString()} • From: {item.From}
                      </p>
                    </div>
                    ));
                    } 

                    // 2. If we are looking at USAGE, group items by TIMESTAMP
                    else {
                    // This magic block groups items that share the same timestamp
                    const usageByTimestamp = grouped[month].reduce((acc, item) => {
                      const timeKey = item.Timestamp; 
                      if (!acc[timeKey]) acc[timeKey] = [];
                      acc[timeKey].push(item);
                      return acc;
                      },
                     {});

                      // Now we turn that group into the UI cards
                      return Object.entries(usageByTimestamp)
                      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Newest time first
                      .map(([timestamp, items], tIdx) => (
                       <div key={tIdx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        {/* Header of the Card: Time and User */}
                        <div className="flex justify-between items-center mb-2 border-b border-slate-50 pb-2">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">
                            {items[0].User || 'Staff'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* List of all items used at this exact time */}
                        <div className="space-y-1">
                          {items.map((item, iIdx) => (
                            <div key={iIdx} className="flex justify-between text-xs">
                              <span className="text-slate-600">{item.Item_Name}</span>
                              <span className="font-bold text-slate-800">x{item.Qty}</span>
                            </div>
                          ))}
                        </div>
                        </div>
                        ));
                      }
                    })()}
                  </div>
                )}

              </div>
            );
          });
        })()}
      </div>

    {/* ---------- MODAL ---------- */}
    {selectedTxn && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm">
          <h3 className="font-bold">{selectedTxn.TransactionID}</h3>

          {(() => {
            let items = [];
            try {
              items = JSON.parse(selectedTxn.ItemsJSON || '[]');
            } catch {
              items = [];
            }
            return items.map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{i.name}</span>
                <span>x{i.qty}</span>
              </div>
            ));
          })()}

          <button
            onClick={() => setSelectedTxn(null)}
            className="mt-4 w-full bg-slate-800 text-slate-400 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    )}

    {/* --- LOW STOCK ALERT MODAL --- */}
{showLowStockModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle size={20} />
          <h3 className="font-bold text-lg">Stock Alerts</h3>
        </div>
        <button onClick={() => setShowLowStockModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-1">
        {inventory
          .filter(item => (Number(item[locKey]) || 0) < (item.MinStock || 0))
          .sort((a, b) => (Number(a[locKey]) || 0) - (Number(b[locKey]) || 0))
          .map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
              <div>
                <p className="text-xs font-bold text-slate-800">{item.Item_Name}</p>
                <p className="text-[10px] text-red-500 font-medium">Min: {item.MinStock} units required</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-red-600">{item[locKey] || 0}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold">In Stock</p>
              </div>
            </div>
          ))}
      </div>

      <button 
        onClick={() => { setShowLowStockModal(false); setView('restock'); }}
        className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold active:scale-95 transition flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Request Restock
      </button>
    </div>
  </div>
  )}
  </div>
)}

          </>
        )}
      </main>
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