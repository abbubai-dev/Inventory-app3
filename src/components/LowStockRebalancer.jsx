import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, ArrowRightLeft, Building2 } from 'lucide-react';

export function LowStockRebalancer({ onInitiateTransfer }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const token = localStorage.getItem("InventoryAppToken");
      try {
        const { data } = await axios.get("/api/clinic/low-stock-suggestions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(data);
      } catch (err) {
        console.error("Failed to load suggestions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 text-base">Low Stock Alert & Rebalancing Suggestions</h3>
          <p className="text-xs text-amber-700">Tap neighboring clinic surplus while waiting for STOR replenishment.</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.item_code} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <p className="text-xs font-mono font-bold text-amber-600">{item.item_code}</p>
              <h4 className="font-bold text-slate-800 text-sm">{item.item_name}</h4>
              <p className="text-xs text-red-500 font-semibold mt-0.5">
                Current Stock: {item.clinic_qty} (Min Threshold: {item.min_stock})
              </p>
            </div>

            {/* Available at neighboring clinics */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available at:</span>
              {item.available_at.map((loc) => (
                <span key={loc.location} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-xl font-medium border border-slate-200">
                  <Building2 size={12} className="text-slate-400" />
                  <b>{loc.location}</b> ({loc.qty} units)
                </span>
              ))}

              <button
                onClick={() => onInitiateTransfer && onInitiateTransfer(item)}
                className="ml-2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-1 shadow-xs active:scale-95"
              >
                <ArrowRightLeft size={14} /> Request Transfer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LowStockRebalancer;