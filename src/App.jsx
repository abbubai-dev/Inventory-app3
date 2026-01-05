import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Plus, Minus, QrCode, LogOut, Package, Search, 
  ChevronLeft, AlertTriangle, History, ArrowDownToLine, 
  ArrowUpFromLine, CheckCircle2, Users, ShieldCheck, MapPin
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API_URL = import.meta.env.VITE_APP_API_URL;

// --- NEW: LOGIN COMPONENT WITH DROPDOWNS ---
const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState({ locations: [], users: [] });
  const [selectedLoc, setSelectedLoc] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // Fetch locations and users on load
  useEffect(() => {
    fetch(`${API_URL}?action=getLoginData`)
      .then(res => res.json())
      .then(data => {
        setSetupData(data);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const p = e.target.password.value;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}?action=login&user=${selectedUser}&pass=${p}&loc=${selectedLoc}`);
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        if(data.user.role === 'Admin') navigate('/admin');
        else navigate(data.user.role === 'Warehouse' ? '/warehouse' : '/clinic');
      } else {
        alert("Login failed: Invalid Password");
      }
    } catch (err) {
      alert("System error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border">
        <div className="flex justify-center mb-6">
          <img src="/logo_PKPDKK.png" alt="PKPDKK Logo" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold mb-6 text-center text-slate-800">Sistem Inventori PKPDKK</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Location</label>
            <select 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedLoc}
              onChange={(e) => { setSelectedLoc(e.target.value); setSelectedUser(""); }}
              required
            >
              <option value="">Select Location...</option>
              {setupData.locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">User</label>
            <select 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={!selectedLoc}
              required
            >
              <option value="">Select Staff...</option>
              {setupData.users.filter(u => u.location === selectedLoc).map(u => (
                <option key={u.username} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          <input name="password" type="password" placeholder="Password" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />
          
          <button type="submit" disabled={loading || !selectedUser} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- UPDATED WAREHOUSE DASHBOARD WITH CLINIC ALERTS ---
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
    return clinics.some(c => (Number(item[c]) || 0) <= (item.MinStock || 0));
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
            <h1 className="text-xl font-bold">Warehouse</h1>
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
                        <p className="text-[10px] text-slate-400">Critical at: {["KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].filter(c => (Number(item[c])||0) <= item.MinStock).join(", ")}</p>
                      </div>
                      <button onClick={() => { setTargetLoc("KPH"); addToCart(item); }} className="p-1 px-3 bg-red-600 text-white text-[10px] font-bold rounded-lg">Fulfill</button>
                   </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input placeholder="Search Warehouse Inventory..." className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm)).map(item => {
              const stock = Number(item[user.location]) || 0;
              return (
                <div key={item.Code} className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-sm truncate">{item.Item_Name}</h3>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">{stock}</span>
                  </div>
                  <button onClick={() => addToCart(item)} className="w-full mt-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">Add to Transfer</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cart Sidebar remains same as your original code */}
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

// --- NEW: ADMIN DASHBOARD COMPONENT ---
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
              <div className="grid grid-cols-2 gap-4">
                <select name="role" className="p-3 border rounded-xl">
                  <option>Clinic</option>
                </select>
                <select name="location" className="p-3 border rounded-xl">
                  {["Stor", "KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"].map(l => <option key={l}>{l}</option>)}
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
  
  // ✅ FIX 1: Added missing states for Transfer Out
  const [txnId, setTxnId] = useState(null); 
  const [targetLoc, setTargetLoc] = useState("");
  
  const locKey = user.location;

  // ✅ FIX 2: Added missing Location List (Matches your Google Sheet Headers)
  const allLocations = ["STOR", "KPH", "KPKK", "KPP", "KPPR", "KPSS", "KPM"];

  // ✅ FIX 3: Added refreshData function to update inventory/history
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
    setTxnId(null); // Reset QR code when changing views
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
        refreshData(); // Now this function exists!
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
      setTxnId(data.txnId); // Display QR code
      setCart([]);
      refreshData();
    } catch (err) {
      alert("Transfer failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          {view !== 'menu' && <button onClick={() => setView('menu')} className="p-2 bg-slate-100 rounded-full"><ChevronLeft size={18}/></button>}
          <img src="/logo_PKPDKK.png" alt="Logo" className="h-6 w-auto" />
          <h1 className="font-bold text-sm truncate">{user.location.replace(/_/g, ' ')}</h1>
        </div>
        <button onClick={logout} className="text-slate-400"><LogOut size={20}/></button>
      </header>

      <div className="p-4 flex-1 max-w-md mx-auto w-full">
        {status && (
          <div className="p-4 mb-4 bg-green-600 text-white rounded-xl text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
            <CheckCircle2 size={20} /> {status.msg}
          </div>
        )}

        {view === 'menu' && (
          <div className="grid gap-3">
            <button onClick={() => setView('usage')} className="bg-blue-600 text-white p-6 rounded-2xl flex items-center gap-4 shadow-xl active:scale-95 transition">
              <Minus size={28}/> <div className="text-left"><h2 className="font-bold">Record Usage</h2><p className="text-[10px] opacity-70 italic tracking-wider">Deduct items from inventory</p></div>
            </button>
            <button onClick={() => setView('scanner')} className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm active:scale-95 transition">
              <QrCode size={28} className="text-green-600"/> <div className="text-left"><h2 className="font-bold text-slate-700">Receive Stock</h2><p className="text-[10px] text-slate-400">Scan QR or enter TXN ID</p></div>
            </button>
            <button onClick={() => setView('transfer_out')} className="bg-orange-600 text-white p-6 rounded-2xl flex items-center gap-4 shadow-xl active:scale-95 transition">
      <ArrowUpFromLine size={28}/> 
      <div className="text-left">
        <h2 className="font-bold">Transfer Out</h2>
        <p className="text-[10px] opacity-70 italic tracking-wider">Send stock to another clinic</p>
      </div>
    </button>
            <button onClick={() => setView('restock')} className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm">
              <AlertTriangle size={28} className="text-orange-500"/> <div className="text-left"><h2 className="font-bold text-slate-700">Restock List</h2><p className="text-[10px] text-slate-400">Items below minimum stock</p></div>
            </button>
            <button onClick={() => setView('history')} className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm">
              <History size={28} className="text-purple-600"/> <div className="text-left"><h2 className="font-bold text-slate-700">Activity History</h2><p className="text-[10px] text-slate-400">View logs</p></div>
            </button>
            <button onClick={() => setView('stock')} className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm">
              <Package size={28} className="text-slate-500"/> <div className="text-left"><h2 className="font-bold text-slate-700">Full Inventory</h2><p className="text-[10px] text-slate-400">Check all item levels</p></div>
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
                <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input placeholder="Search Name or SKU..." className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
                <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-blue-600">{cart.length} items in cart</span><button onClick={()=>setView('usage_cart')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">Review Usage</button></div>
                {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Code?.toString().includes(searchTerm)).map(i => (
                  <div key={i.Code} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <div><p className="text-[9px] text-slate-400 font-mono font-bold">#{i.Code}</p><h3 className="text-sm font-bold text-slate-700">{i.Item_Name}</h3><p className="text-xs text-blue-500">Stock: {i[locKey] || 0}</p></div>
                    <button onClick={() => { const q = prompt("Qty used?"); if(q) setCart([...cart, {name:i.Item_Name, code:i.Code, qty:q}]) }} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Plus size={20}/></button>
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
            )}

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
                
                <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input placeholder="Find items to send..." className="w-full pl-10 pr-4 py-3 border rounded-xl" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
                
                <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-blue-600">{cart.length} items in transfer</span><button onClick={()=>setView('transfer_cart')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Review Transfer</button></div>

                {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm)).map(i => (
                  <div key={i.Code} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <div><h3 className="text-sm font-bold">{i.Item_Name}</h3><p className="text-xs text-blue-500">Available: {i[locKey] || 0}</p></div>
                    <button onClick={() => { const q = prompt(`How many ${i.Item_Name} to send?`); if(q) setCart([...cart, {name:i.Item_Name, code:i.Code, qty:q}]) }} className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Plus size={20}/></button>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-white p-8 rounded-3xl border shadow-xl text-center space-y-4">
                <h3 className="font-bold text-lg">Transfer Ready</h3>
                <QRCodeCanvas value={txnId} size={200} className="mx-auto p-2 border rounded-xl" />
                <p className="font-mono font-bold text-blue-600">{txnId}</p>
                <p className="text-xs text-slate-400">Ask the receiving clinic to scan this code.</p>
                <button onClick={() => setView('menu')} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Done</button>
              </div>
            )}
          </div>
        )}

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
        )}

            {view === 'stock' && (
              <div className="space-y-2">
                <input placeholder="Search all items..." className="w-full p-3 border rounded-xl mb-4 shadow-sm" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
                {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Code?.toString().includes(searchTerm)).map(i => (
                  <div key={i.Code} className="p-4 bg-white border rounded-xl flex justify-between items-center shadow-sm">
                    <div><p className="text-[9px] text-slate-400 font-mono">#{i.Code}</p><span className="text-sm font-bold text-slate-700">{i.Item_Name}</span></div>
                    <span className={`font-bold px-3 py-1 rounded-lg ${Number(i[locKey]) <= i.MinStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{i[locKey] || 0}</span>
                  </div>
                ))}
              </div>
            )}

            {view === 'restock' && inventory.filter(i => (Number(i[locKey]) || 0) <= (i.MinStock || 0)).map(i => (
              <div key={i.Code} className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center mb-2">
                <div><p className="text-[9px] text-slate-400 font-mono">#{i.Code}</p><p className="text-sm font-bold">{i.Item_Name}</p></div>
                <div className="text-right"><p className="text-red-600 font-bold">{i[locKey] || 0}</p><p className="text-[9px] text-slate-400 uppercase">Min: {i.MinStock}</p></div>
              </div>
            ))}

            {view === 'history' && (
              <div className="space-y-4">
    {/* Tab Switcher */}
    <div className="flex bg-slate-200 p-1 rounded-xl">
      <button onClick={() => setHistTab('in')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${histTab === 'in' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Incoming</button>
      <button onClick={() => setHistTab('out')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${histTab === 'out' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Usage</button>
    </div>

    <div className="space-y-2">
      {histTab === 'in' ? (
        history.transfers?.map((t, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedTxn(t)} // Click to open details
            className="p-4 bg-white border rounded-xl flex items-center justify-between hover:border-blue-300 cursor-pointer transition shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${t.Status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                <ArrowDownToLine size={18} />
              </div>
              <div className="text-xs">
                <b className="text-slate-700">{t.TransactionID}</b>
                <p className="text-[10px] text-slate-400">From: {t.From.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${t.Status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {t.Status}
              </span>
              <p className="text-[9px] text-slate-400 mt-1">{t.CreatedAt ? new Date(t.CreatedAt).toLocaleDateString() : ''}</p>
            </div>
          </div>
        ))
      ) : (
        history.usage?.map((u, idx) => (
          <div key={idx} className="p-4 bg-white border rounded-xl flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-red-50 text-red-600 rounded-full"><ArrowUpFromLine size={18} /></div>
            <div className="text-xs">
              <b className="text-slate-700">{u.Item_Name}</b>
              <p className="text-[10px] text-slate-400">{new Date(u.Timestamp).toLocaleString()} • Qty: {u.Qty}</p>
            </div>
          </div>
        ))
      )}
    </div>

    {/* --- TRANSACTION DETAILS MODAL --- */}
    {selectedTxn && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">{selectedTxn.TransactionID}</h3>
              <p className="text-xs text-slate-400">Transaction Details</p>
            </div>
            <button onClick={() => setSelectedTxn(null)} className="p-2 bg-slate-100 rounded-full text-slate-400">✕</button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px]">Recipient</p>
                <p className="text-slate-700">{selectedTxn.RecipientName || 'Pending'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[9px]">Received At</p>
                <p className="text-slate-700">
                  {selectedTxn.ReceivedAt ? new Date(selectedTxn.ReceivedAt).toLocaleString() : 'Not received'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-bold uppercase text-[9px] mb-2 px-1">Items Included</p>
              <div className="max-h-40 overflow-y-auto border rounded-xl divide-y">
                {JSON.parse(selectedTxn.ItemsJSON || "[]").map((item, i) => (
                  <div key={i} className="p-3 flex justify-between items-center text-sm">
                    <span className="text-slate-700 font-medium">{item.name}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold text-xs">x{item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => setSelectedTxn(null)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold active:scale-95 transition">
            Close Details
          </button>
        </div>
      </div>
    )}
  </div>
)}
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user')));
  const logout = () => { setUser(null); sessionStorage.removeItem('user'); window.location.href="/"; };

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