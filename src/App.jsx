import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, QrCode, LogOut, Package, Search, ChevronLeft, AlertTriangle, History, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API_URL = "https://script.google.com/macros/s/AKfycbz-4CQeSwi6OTD2tKN7--Drr6layauYyBjjEWtS3Fnn5WOoB-nfIQez1X6X9z_bNhb1/exec";

// --- LOGIN ---
const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const handleLogin = (e) => {
    e.preventDefault();
    const u = e.target.username.value.toLowerCase();
    const role = u.includes('stor') ? 'Warehouse' : 'Clinic';
    const loc = u.includes('stor') ? 'Stor PKPDKK' : u.toUpperCase();
    const userData = { name: u, role, location: loc };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate(role === 'Warehouse' ? '/warehouse' : '/clinic');
  };
  return (
    <div className="flex items-center justify-center h-screen bg-slate-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border">
        <div className="flex justify-center mb-6"><div className="bg-blue-600 p-3 rounded-xl"><Package className="text-white" size={32} /></div></div>
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Clinic Inventory</h1>
        <input name="username" placeholder="Username (stor, kph, etc.)" className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500" required />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Sign In</button>
      </form>
    </div>
  );
};

// --- WAREHOUSE ---
const WarehouseDashboard = ({ user, logout }) => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [txnId, setTxnId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLoc, setTargetLoc] = useState("KPH");

  useEffect(() => { fetch(`${API_URL}?action=getInventory`).then(res => res.json()).then(setInventory); }, []);

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
          <h1 className="text-xl font-bold">Warehouse ({user.location})</h1>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
        </header>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative mb-6"><Search className="absolute left-3 top-3 text-slate-400" size={20} /><input placeholder="Search name or category..." className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setSearchTerm(e.target.value.toLowerCase())} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm) || i.Category?.toLowerCase().includes(searchTerm)).map(item => {
              const stock = Number(item[user.location]) || 0;
              const low = stock <= item.MinStock && stock > 0;
              return (
                <div key={item.Code} className={`p-4 rounded-xl border bg-white ${stock <= 0 ? 'opacity-60' : low ? 'border-orange-300 bg-orange-50' : 'border-slate-100'}`}>
                  <div className="flex justify-between mb-2"><h3 className="font-bold text-sm truncate">{item.Item_Name}</h3><span className={`text-xs px-2 py-1 rounded font-bold ${stock <= 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'}`}>{stock}</span></div>
                  <button onClick={() => addToCart(item)} disabled={stock <= 0} className="w-full mt-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">Add Quantity</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-80 bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b bg-slate-50 font-bold flex justify-between">Cart {cart.length > 0 && <button onClick={() => setCart([])} className="text-red-500 text-xs">Clear</button>}</div>
        <div className="p-4 bg-white border-b"><label className="text-[10px] font-bold text-slate-400 block mb-1">Send to:</label><select value={targetLoc} onChange={e => setTargetLoc(e.target.value)} className="w-full border rounded p-2 text-sm font-bold"><option>KPH</option><option>KPKK</option><option>KPP</option><option>KPPR</option><option>KPSS</option><option>KPM</option></select></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">{cart.map(c => <div key={c.cartId} className="text-xs p-2 bg-slate-50 rounded border flex justify-between"><span>{c.name}</span><span className="font-bold">x{c.qty}</span></div>)}</div>
        <div className="p-4 border-t">{txnId ? <div className="text-center"><QRCodeCanvas value={txnId} size={120}/><p className="mt-2 font-mono text-sm">{txnId}</p><button onClick={()=>{setTxnId(null); setCart([]);}} className="text-xs underline mt-2">New</button></div> : <button onClick={handleCheckout} disabled={cart.length===0 || loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">{loading ? "..." : `Transfer to ${targetLoc}`}</button>}</div>
      </div>
    </div>
  );
};

// --- CLINIC ---
const ClinicDashboard = ({ user, logout }) => {
  const [view, setView] = useState('menu');
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState({ transfers: [], usage: [] });
  const [histTab, setHistTab] = useState('in');

  useEffect(() => {
    if (view === 'stock' || view === 'restock' || view === 'usage') fetch(`${API_URL}?action=getInventory`).then(r => r.json()).then(setInventory);
    if (view === 'history') fetch(`${API_URL}?action=getHistory&location=${user.location}`).then(r => r.json()).then(setHistory);
  }, [view]);

  useEffect(() => {
    if (view === 'scanner') {
      const s = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
      s.render((t) => { s.clear(); handleReceive(t); });
      return () => s.clear().catch(()=>{});
    }
  }, [view]);

  const handleReceive = (txnId) => {
    setStatus({msg: 'Confirming...'});
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'confirmReceipt', txnId, to: user.location }) }).then(() => { setStatus({msg: 'Received!'}); setView('menu'); });
  };

  const handleUsageSubmit = async () => {
    if (!confirm("Deduct usage from your stock?")) return;
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'recordUsage', location: user.location, cart }) });
    setCart([]); setView('menu'); setStatus({msg: 'Usage Recorded'});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">{view !== 'menu' && <button onClick={() => setView('menu')} className="p-2 bg-slate-100 rounded-full"><ChevronLeft size={18}/></button>}<h1 className="font-bold">{user.location}</h1></div>
        <button onClick={logout} className="text-slate-400"><LogOut size={20}/></button>
      </header>

      <div className="p-4 flex-1 max-w-md mx-auto w-full">
        {status && <div className="p-3 mb-4 bg-blue-600 text-white rounded-lg text-center font-bold">{status.msg}</div>}

        {view === 'menu' && (
          <div className="grid gap-3">
            <button onClick={() => setView('usage')} className="bg-blue-600 text-white p-5 rounded-xl flex items-center gap-4 shadow-lg"><Minus size={24}/><div><h2 className="font-bold text-left">Record Usage</h2><p className="text-[10px] opacity-70">Remove used items from shelf</p></div></button>
            <button onClick={() => setView('scanner')} className="bg-white p-5 rounded-xl border flex items-center gap-4"><QrCode size={24} className="text-green-600"/><div><h2 className="font-bold text-slate-700">Receive Stock</h2><p className="text-[10px] text-slate-400">Scan from Warehouse</p></div></button>
            <button onClick={() => setView('restock')} className="bg-white p-5 rounded-xl border flex items-center gap-4"><AlertTriangle size={24} className="text-orange-600"/><div><h2 className="font-bold text-slate-700">Restock List</h2><p className="text-[10px] text-slate-400">Items running low</p></div></button>
            <button onClick={() => setView('history')} className="bg-white p-5 rounded-xl border flex items-center gap-4"><History size={24} className="text-purple-600"/><div><h2 className="font-bold text-slate-700">History</h2><p className="text-[10px] text-slate-400">Past transactions</p></div></button>
          </div>
        )}

        {view === 'usage' && (
          <div className="space-y-2">
            <input placeholder="Search item..." className="w-full p-3 border rounded-xl mb-2" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg mb-4"><span>Items in list: {cart.length}</span><button onClick={()=>setView('usage_cart')} className="bg-blue-600 text-white px-4 py-1 rounded-md text-xs font-bold">Review</button></div>
            {inventory.filter(i => i.Item_Name?.toLowerCase().includes(searchTerm)).map(i => (
              <div key={i.Code} className="bg-white p-3 rounded-xl border flex justify-between items-center shadow-sm">
                <span className="text-sm font-medium">{i.Item_Name}</span>
                <button onClick={() => { const q = prompt("Qty used?"); if(q) setCart([...cart, {name:i.Item_Name, code:i.Code, qty:q}]) }} className="p-2 text-blue-600"><Plus/></button>
              </div>
            ))}
          </div>
        )}

        {view === 'usage_cart' && (
          <div className="space-y-3">
            <h2 className="font-bold">Confirm Usage List</h2>
            {cart.map((c, idx) => <div key={idx} className="p-3 bg-white border rounded-lg flex justify-between"><span>{c.name}</span><b>x{c.qty}</b></div>)}
            <button onClick={handleUsageSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4">Record Now</button>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-3">
            <div className="flex border rounded-lg overflow-hidden text-xs font-bold">
              <button onClick={()=>setHistTab('in')} className={`flex-1 py-2 ${histTab==='in' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>Incoming</button>
              <button onClick={()=>setHistTab('out')} className={`flex-1 py-2 ${histTab==='out' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>Usage</button>
            </div>
            {histTab === 'in' ? history.transfers.map((t, idx) => (
              <div key={idx} className="p-3 bg-white border rounded-lg flex items-center gap-3">
                <ArrowDownToLine className="text-green-500"/>
                <div><p className="text-xs font-bold">{t.TransferID}</p><p className="text-[10px] text-slate-400">From {t.From} • {t.Status}</p></div>
              </div>
            )) : history.usage.map((u, idx) => (
              <div key={idx} className="p-3 bg-white border rounded-lg flex items-center gap-3">
                <ArrowUpFromLine className="text-red-500"/>
                <div><p className="text-xs font-bold">{u.Item_Name}</p><p className="text-[10px] text-slate-400">{new Date(u.Timestamp).toLocaleDateString()} • Qty {u.Qty}</p></div>
              </div>
            ))}
          </div>
        )}

        {view === 'restock' && inventory.filter(i => (Number(i[user.location]) || 0) <= (i.MinStock || 0)).map(i => (
          <div key={i.Code} className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between mb-2">
            <span className="text-sm font-bold">{i.Item_Name}</span>
            <span className="text-red-600 font-bold">{i[user.location] || 0}</span>
          </div>
        ))}

        {view === 'scanner' && <div id="reader"></div>}
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