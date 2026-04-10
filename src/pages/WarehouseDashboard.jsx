import { useState, useEffect } from "react";
import { LogOut, Search, ShieldCheck, FileText } from "lucide-react";
import "jspdf-autotable";

import { clinics as clinicsConstanst } from "../utils/constants";

const WarehouseDashboard = ({ logout }) => {
  const [view, setView] = useState('alerts');
  const [inventory, setInventory] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [clinicFilter, setClinicFilter] = useState("ALL"); // Shared for Alerts & Audit
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDistrictData();
  }, []);

  const fetchDistrictData = async () => {
    setLoading(true);
    const token = localStorage.getItem("InventoryAppToken");

    try {
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Syncing with server.js endpoints
        const [invRes, histRes] = await Promise.all([
            fetch(`/api/getinventory`, { headers }),
            fetch(`/api/history`, { headers }) 
        ]);

        const invData = await invRes.json();
        const histData = await histRes.json();

        if (invRes.status === 401 || invRes.status === 403) return logout();

        // Use imported locations instead of extracting from inventory
        setClinics(clinicsConstanst);

        setInventory(invData || []);
        // Match the "Status" header we discussed
        setAuditLog((histData.usage || []).filter(u => u.Status === "Receipt"));
        
    } catch (err) {
        console.error("Sync Error:", err);
    } finally {
        setLoading(false);
    }
};

  // --- LOGIC: Grouped Alerts ---
  const getGroupedAlerts = () => {
    	let grouped = [];
    
    	inventory.forEach(item => {
      		let clinicShortages = [];
      		const targetClinics = clinicFilter === "ALL" ? clinics : [clinicFilter];
      
      		targetClinics.forEach(loc => {
        		const stock = Number(item[loc]) || 0;
        		const min = Number(item.MinStock) || 0;
        		if (min > 0 && stock < min) {
          			clinicShortages.push({ loc, stock });
        		}
      		});

      		if (clinicShortages.length > 0) {
        		grouped.push({
          			name: item.Item_Name,
          			code: item.Code,
          			min: item.MinStock,
          			shortages: clinicShortages
        		});
      		}
    	});
    	return grouped;
	};

  	// --- LOGIC: Filtered Audit ---
  	const getFilteredAudit = () => {
    	if (clinicFilter === "ALL") return auditLog;
    	return auditLog.filter(log => log.Location === clinicFilter);
  	};

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
      		<header className="bg-white p-6 border-b sticky top-0 z-20 flex justify-between items-center shadow-sm">
        		<div>
          			<h1 className="text-xl font-black text-slate-900 tracking-tight italic">KAWALAN INVENTORI</h1>
          			<p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Stor dan Klinik</p>
        		</div>
        		<button onClick={logout} className="p-3 bg-slate-100 rounded-full text-slate-400 active:scale-90 transition">
          			<LogOut size={20} />
        		</button>
      		</header>

      		<main className="p-4 space-y-4">
        		{/* Tab Switcher */}
        		<div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
          			{['alerts', 'audit'].map((t) => (
            			<button
              				key={t}
              				onClick={() => setView(t)}
              				className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${view === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
            			>
              				{t === 'alerts' ? 'LOW STOCK' : 'RECEIPTS'}
            			</button>
          			))}
				</div>

				{/* Global Clinic Filter */}
				<div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
					<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Focus Location</label>
					<select 
            			value={clinicFilter}
            			onChange={(e) => setClinicFilter(e.target.value)}
            			className="w-full mt-2 p-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-800 outline-none"
          			>
            			<option value="ALL">ALL CLINICS (DISTRICT)</option>
            			{clinics.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          			</select>
				</div>

        		{/* --- VIEW: GROUPED ALERTS --- */}
        		{view === 'alerts' && (
          			<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            			{
							getGroupedAlerts().length === 0 ? (
              					<div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                					<ShieldCheck size={48} className="mx-auto text-green-400 mb-4 opacity-20" />
                					<p className="text-slate-400 text-xs font-black uppercase">Inventory Healthy</p>
								</div>
            				) : (
							getGroupedAlerts().map((item, i) => (
								<div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
									<div className="p-5 bg-slate-50/50 border-b border-slate-50">
										<p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ITEM CODE: {item.code}</p>
										<h3 className="text-sm font-black text-slate-800">{item.name}</h3>
										<p className="text-[10px] font-bold text-red-500 mt-1">Min. Requirement: {item.min}</p>
									</div>
									<div className="p-4 space-y-2">
										{item.shortages.map((s, idx) => (
											<div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-50 shadow-xs">
												<span className="text-xs font-black text-slate-600 uppercase">{s.loc}</span>
												<div className="flex items-center gap-2">
													<span className="text-xs font-black text-red-600">{s.stock}</span>
													<div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
												</div>
											</div>
										))}
									</div>
								</div>
              				))
						)}
					</div>
				)}

        		{/* --- VIEW: AUDIT RECEIPTS --- */}
        		{view === 'audit' && (
          			<div className="space-y-3 animate-in fade-in">
             			{
							getFilteredAudit().map((log, i) => (
								<div key={i} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4">
									<div className="p-3 bg-green-50 text-green-600 rounded-2xl"><FileText size={20} /></div>
									<div className="flex-1">
										<div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
											<span>{log.Location}</span>
											<span>{new Date(log.Date || log.Timestamp).toLocaleDateString()}</span>
										</div>
										<h4 className="text-xs font-black text-slate-700">{log.Item_Name}</h4>
										<div className="flex justify-between items-center mt-3 bg-green-50/50 p-2 px-3 rounded-xl border border-green-100">
											<span className="text-[10px] font-black text-green-700">+ {log.Qty} RECV</span>
											<span className="text-[10px] font-bold text-slate-400">BY {log.User}</span>
										</div>
									</div>
								</div>
						))}
					</div>
				)}
			</main>

      		{/* Footer Nav / Quick Refresh */}
      		<footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 px-8 flex justify-between items-center shadow-2xl z-30">
				<div className="flex flex-col">
					<p className="text-[9px] font-black text-slate-400 uppercase leading-none">Status</p>
					<p className="text-xs font-bold text-green-600 flex items-center gap-1">Live <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span></p>
				</div>
				<button 
          			onClick={fetchDistrictData}
          			className={`p-4 bg-slate-900 text-white rounded-2xl active:scale-95 transition-all shadow-lg ${loading ? 'animate-spin' : ''}`}
        		>
          			<Search size={20} />
        		</button>
			</footer>
    	</div>
	);
};

export default WarehouseDashboard;
