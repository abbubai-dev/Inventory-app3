import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Plus, Minus, QrCode, LogOut, Package, Search, 
  ChevronLeft, AlertTriangle, History, ArrowDownToLine, 
  ArrowUpFromLine, CheckCircle2 
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ⚠️ REPLACE WITH YOUR DEPLOYED GOOGLE SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbz-4CQeSwi6OTD2tKN7--Drr6layauYyBjjEWtS3Fnn5WOoB-nfIQez1X6X9z_bNhb1/exec";

// --- LOGIN COMPONENT ---
const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const u = e.target.username.value;
    const p = e.target.password.value;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}?action=login&user=${u}&pass=${p}`);
      const data = await res.json();

      if (data.authenticated) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(data.user.role === 'Warehouse' ? '/warehouse' : '/clinic');
      } else {
        alert("Login failed: " + (data.message || "Invalid username or password"));
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
        <h1 className="text-2xl font-bold mb-2 text-center text-slate-800">Sistem Inventori PKPDKK</h1>
        <p className="text-center text-slate-500 mb-6 text-sm">Sign in to continue</p>
        
        <div className="space-y-4">
          <input name="username" placeholder="Username" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />
          <input name="password" type="password" placeholder="Password" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- WAREHOUSE DASHBOARD ---
const WarehouseDashboard = ({ user, logout }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLoc, setTargetLoc] = useState("KPH");

  useEffect(() => { 
    fetch(`${API_URL}?action=getInventory`).then(res => res.json()).then(setInventory); 
  }, []);

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
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
        </header>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input placeholder="Search Name, SKU, or Category..." className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Category?.toLowerCase().includes(searchTerm) || i.Code?.toString().toLowerCase().includes(searchTerm)).map(item => {
              const stock = Number(item[user.location]) || 0;
              const low = stock <= item.MinStock && stock > 0;
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
                  <button onClick={() => addToCart(item)} disabled={stock <= 0} className="w-full mt-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">Add to Transfer</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-80 bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b bg-slate-50 font-bold flex justify-between">Cart {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-500 text-xs">Clear</button>}</div>
        <div className="p-4 bg-white border-b">
          <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Send to Clinic:</label>
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
              <p className="mt-2 font-mono text-xs font-bold text-green-600 uppercase tracking-widest">{txnId}</p>
              <button onClick={()=>{setTxnId(null); setCart([]);}} className="text-xs underline mt-2 text-slate-400">Next Transfer</button>
            </div>
          ) : (
            <button onClick={handleCheckout} disabled={cart.length === 0 || loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : `Transfer to ${targetLoc}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

  const locKey = user.location;

  useEffect(() => {
    if (['stock', 'restock', 'usage'].includes(view)) fetch(`${API_URL}?action=getInventory`).then(r => r.json()).then(setInventory);
    if (view === 'history') fetch(`${API_URL}?action=getHistory&location=${locKey}`).then(r => r.json()).then(setHistory);
  }, [view]);

  useEffect(() => {
    if (view === 'scanner') {
      const s = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      s.render((t) => { s.clear(); handleReceive(t); });
      return () => s.clear().catch(()=>{});
    }
  }, [view]);

  const handleReceive = (id) => {
    setLoading(true);
    setStatus({msg: 'Verifying Transaction...'});
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'confirmReceipt', txnId: id, to: locKey }) })
      .then(res => res.json()).then((data) => {
        if(data.status === 'success') {
          setStatus({msg: 'Success: Stock Added!'});
          setTimeout(() => { setView('menu'); setStatus(null); }, 2000);
        } else {
          alert(data.message || "Invalid Transaction ID");
          setStatus(null);
        }
        setLoading(false);
      });
  };

  const handleUsageSubmit = async () => {
    if (!confirm("Deduct usage from your shelf?")) return;
    setLoading(true);
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'recordUsage', location: locKey, cart }) });
    setCart([]); setStatus({msg: 'Stock Deducted'});
    setTimeout(() => { setView('menu'); setStatus(null); }, 2000);
    setLoading(false);
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
        {status && <div className="p-4 mb-4 bg-green-600 text-white rounded-xl text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <CheckCircle2 size={20} /> {status.msg}
        </div>}

        {view === 'menu' && (
          <div className="grid gap-3">
            <button onClick={() => setView('usage')} className="bg-blue-600 text-white p-6 rounded-2xl flex items-center gap-4 shadow-xl active:scale-95 transition">
              <Minus size={28}/> <div className="text-left"><h2 className="font-bold">Record Usage</h2><p className="text-[10px] opacity-70 italic tracking-wider">Deduct items from inventory</p></div>
            </button>
            <button onClick={() => setView('scanner')} className="bg-white p-6 rounded-2xl border flex items-center gap-4 shadow-sm active:scale-95 transition">
              <QrCode size={28} className="text-green-600"/> <div className="text-left"><h2 className="font-bold text-slate-700">Receive Stock</h2><p className="text-[10px] text-slate-400">Scan QR or enter TXN ID</p></div>
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
                      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 rounded-xl font-bold">Confirm</button>
                   </form>
                </div>
             </div>
          </div>
        )}

        {view === 'usage' && (
          <div className="space-y-3">
            <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input placeholder="Search Name or SKU..." className="w-full pl-10 pr-4 py-3 border rounded-xl" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
            <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center"><span className="text-xs font-bold text-blue-600">{cart.length} items in cart</span><button onClick={()=>setView('usage_cart')} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Review Usage</button></div>
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
            <button onClick={handleUsageSubmit} disabled={loading || cart.length === 0} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">
              {loading ? "Updating..." : "Record Usage Now"}
            </button>
          </div>
        )}

        {view === 'stock' && (
          <div className="space-y-2">
            <input placeholder="Search all items..." className="w-full p-3 border rounded-xl mb-4" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Code?.toString().includes(searchTerm)).map(i => (
              <div key={i.Code} className="p-4 bg-white border rounded-xl flex justify-between items-center">
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
              <div className="flex bg-slate-200 p-1 rounded-xl">
                 <button onClick={()=>setHistTab('in')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${histTab==='in'?'bg-white shadow':'text-slate-500'}`}>Incoming</button>
                 <button onClick={()=>setHistTab('out')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${histTab==='out'?'bg-white shadow':'text-slate-500'}`}>Usage</button>
              </div>
              <div className="space-y-2">
                 {histTab === 'in' ? history.transfers?.map((t, idx) => (
                    <div key={idx} className="p-4 bg-white border rounded-xl flex items-center gap-3"><ArrowDownToLine className="text-green-500"/><div className="text-xs"><b>{t.TransferID}</b><p className="text-[10px] text-slate-400">From {t.From.replace(/_/g,' ')} • {t.Status}</p></div></div>
                 )) : history.usage?.map((u, idx) => (
                    <div key={idx} className="p-4 bg-white border rounded-xl flex items-center gap-3"><ArrowUpFromLine className="text-red-500"/><div className="text-xs"><b>{u.Item_Name}</b><p className="text-[10px] text-slate-400">{new Date(u.Timestamp).toLocaleDateString()} • Qty {u.Qty}</p></div></div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const logout = () => { setUser(null); localStorage.removeItem('user'); };
  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login setUser={setUser} /> : <Navigate to={user.role === 'Warehouse' ? '/warehouse' : '/clinic'} />} />
        <Route path="/warehouse" element={user?.role === 'Warehouse' ? <WarehouseDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
        <Route path="/clinic" element={user?.role === 'Clinic' ? <ClinicDashboard user={user} logout={logout} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}