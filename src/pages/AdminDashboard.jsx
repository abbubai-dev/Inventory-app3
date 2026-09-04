import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
    LogOut, FileText, Users, ShieldCheck, Download, 
    Bell, AlertTriangle, Trash2, Edit3, X, Save 
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { locations, roles } from "../utils/constants";

const AdminDashboard = ({ logout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adminHistory, setAdminHistory] = useState({ transfers: [], usage: [] });
    const [reportLoading, setReportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("users");
    const [masterList, setMasterList] = useState([]);
    const [masterLoading, setMasterLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // 🎯 USER MANAGEMENT MODAL STATE
    const [editingUser, setEditingUser] = useState(null);

    const chartRef = useRef(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (activeTab === "users") getAllUsers();
        if (activeTab === "master") fetchMasterList();
        if (activeTab === "reports" || activeTab === "approvals") {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchMasterList = async () => {
        const token = localStorage.getItem("InventoryAppToken");
        try {
            setMasterLoading(true);
            const { data } = await axios.get("/api/masteritems", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMasterList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch master list", err);
        } finally {
            setMasterLoading(false);
        }
    };

    const getAllUsers = async () => {
        const token = localStorage.getItem("InventoryAppToken");
        try {
            const { data: fullUsers } = await axios.get("/api/getfullusers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(fullUsers);
        } catch (error) {
            console.error("Error fetching all users", error);
        }
    };

    const fetchHistory = async () => {
        const token = localStorage.getItem("InventoryAppToken");
        try {
            setReportLoading(true);
            const { data: historyData } = await axios.get("/api/history", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setAdminHistory({
                transfers: Array.isArray(historyData.transfers) ? historyData.transfers : [],
                usage: Array.isArray(historyData.usage) ? historyData.usage : [],
            });
        } catch (err) {
            console.error("Failed to fetch reports", err);
        } finally {
            setReportLoading(false);
        }
    };

    const handleResolveDelete = async (txnId, resolution) => {
        const actionType = resolution === "Approve" ? "approveDelete" : "rejectDelete";
        
        if (!confirm(`Are you sure you want to ${resolution.toUpperCase()} this deletion request?`)) return;

        const token = localStorage.getItem("InventoryAppToken");
        try {
            setActionLoading(true);
            const { data } = await axios.post("/api/adminaction", {
                action: actionType,
                txnId: txnId
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (data.status === "success") {
                setAdminHistory((prev) => ({
                    ...prev,
                    usage: prev.usage.filter((item) => item.TxnID !== txnId)
                }));
                fetchHistory();
            }
        } catch (error) {
            alert(error.response?.data?.error || "Failed to process request. Check connection.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("InventoryAppToken");

        try {
            setLoading(true);
            await axios.post(
                "/api/adduser",
                {
                    username: e.target.username.value,
                    password: e.target.password.value,
                    email: e.target.email.value,
                    role: e.target.role.value,
                    location: e.target.location.value,
                },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            alert("User Added Successfully");
            e.target.reset();
            await getAllUsers();
        } catch (err) {
            console.error("Error adding user", err);
            alert(err.response?.data?.error || "Failed to add user");
        } finally {
            setLoading(false);
        }
    };

    // 🎯 EDIT USER HANDLER
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("InventoryAppToken");
        try {
            setActionLoading(true);
            await axios.put(
                `/api/admin/users/${editingUser.id}`,
                {
                    email: editingUser.email,
                    location: editingUser.location,
                    role: editingUser.role
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("User updated successfully");
            setEditingUser(null);
            await getAllUsers();
        } catch (err) {
            console.error("Error updating user", err);
            alert(err.response?.data?.error || "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    // 🎯 DELETE USER HANDLER
    const handleDeleteUser = async (userId, username) => {
        if (!confirm(`Are you sure you want to remove user "${username}"?`)) return;

        const token = localStorage.getItem("InventoryAppToken");
        try {
            setActionLoading(true);
            await axios.delete(`/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(prev => prev.filter(u => u.id !== userId));
            await getAllUsers();
        } catch (err) {
            console.error("Error deleting user", err);
            alert(err.response?.data?.error || "Failed to delete user");
        } finally {
            setActionLoading(false);
        }
    };

    const exportAdminPDF = (type) => {
        const doc = new jsPDF();
        const data = type === "in" ? adminHistory.transfers : adminHistory.usage;
        const title = type === "in" ? "Global Incoming Stock Report" : "Global Usage Report";

        if (!data || data.length === 0) return alert("No data available to export.");

        if (chartRef.current) {
            const chartImageBase64 = chartRef.current.toBase64Image();
            doc.addImage(chartImageBase64, "PNG", 14, 25, 180, 75);
        }

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, 15);

        const headers = type === "in"
            ? [["Date", "ID", "From", "To", "Status"]]
            : [["Date", "Location", "Item Name", "Qty"]];

        const rows = data.map((item) => {
            const dateStr = item.Timestamp || item.CreatedAt;
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("en-GB") : "N/A";

            return type === "in"
                ? [formattedDate, item.TxnID, item.Location_From || "External Intake", item.Location_To, item.Status]
                : [formattedDate, item.Location_To, item.Item_Name, item.Total_Items];
        });

        doc.autoTable({ 
            head: headers, 
            body: rows, 
            startY: chartRef.current ? 110 : 30,
            theme: "striped"
        });

        doc.addPage();
        doc.setFontSize(16);
        doc.text("Inventory Consumption Summary", 14, 20);

        const summaryMap = data.reduce((acc, curr) => {
            const key = curr.Item_Name || "Transfers";
            acc[key] = (acc[key] || 0) + Number(curr.Total_Items || 1);
            return acc;
        }, {});

        const summaryRows = Object.entries(summaryMap).map(([name, total]) => [name, total]);

        doc.autoTable({
            head: [["Item Name / Category", "Total Volume"]],
            body: summaryRows,
            startY: 30,
            headStyles: { fillColor: [37, 99, 235] },
        });

        doc.save(`Global_Report_${type}_${new Date().toLocaleDateString()}.pdf`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar View */}
            <div className="w-64 bg-slate-900 text-white p-6 shadow-xl flex flex-col">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" size={24} /> Admin
                </h2>
                
                <nav className="space-y-4 flex-1">
                    <div
                        onClick={() => setActiveTab("users")}
                        className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "users" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    >
                        <Users size={20} /> User Management
                    </div>
                    
                    <div
                        onClick={() => setActiveTab("master")}
                        className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "master" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    >
                        <FileText size={20} /> Master Item List
                    </div>

                    <div
                        onClick={() => setActiveTab("approvals")}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${activeTab === "approvals" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Bell size={20} />
                                {(adminHistory?.usage || []).filter(log => log.Status === "Pending Delete").length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-slate-900 ${activeTab === "approvals" ? "bg-white border-blue-600" : "bg-red-500"}`}></span>
                                    </span>
                                )}
                            </div>
                            Review Tasks
                        </div>
                        
                        {(adminHistory?.usage || []).filter(log => log.Status === "Pending Delete").length > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === "approvals" ? "bg-white text-blue-600" : "bg-red-500 text-white"}`}>
                                {(adminHistory?.usage || []).filter(log => log.Status === "Pending Delete").length}
                            </span>
                        )}
                    </div>

                    <div
                        onClick={() => setActiveTab("reports")}
                        className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "reports" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                    >
                        <FileText size={20} /> System Reports
                    </div>
                </nav>

                <div className="pt-8 mt-8 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={logout}
                        className="p-3 text-slate-400 flex items-center gap-2 hover:text-white hover:bg-red-500/10 rounded-xl transition-all w-full"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Workspace Frame */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === "users" && (
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
                                            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <select name="location" className="p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500">
                                            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Registering..." : "Register User"}
                                    </button>
                                </form>
                            </div>

                            {/* Access Control List with Interactive Edit & Delete Actions */}
                            <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
                                <h3 className="font-bold mb-6 text-slate-700">Access Control List</h3>
                                <div className="space-y-3 max-h-112.5 overflow-y-auto pr-2 custom-scrollbar">
                                    {users.length > 0 ? (
                                        users.map((u) => (
                                            <div key={u.id || u.username} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                                <div>
                                                    <p className="font-black text-sm text-slate-800">{u.username}</p>
                                                    <p className="text-xs text-slate-500">{u.email || "No email"}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                        {u.role} • {u.location}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingUser(u)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Edit User"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Remove User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-400 text-sm py-10">No users found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🎯 EDIT USER MODAL */}
                {editingUser && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg">Edit Staff Details</h3>
                                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                                    <input value={editingUser.username} disabled className="w-full p-3 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold mt-1" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Email</label>
                                    <input
                                        type="email"
                                        value={editingUser.email || ""}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</label>
                                        <select
                                            value={editingUser.role}
                                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                                        >
                                            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                                        <select
                                            value={editingUser.location}
                                            onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                                        >
                                            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-200 transition flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "master" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Master Item List</h1>
                            <p className="text-xs text-slate-400 font-bold">Standardize SPPA Codes & Multipliers</p>
                        </div>

                        <input 
                            type="text"
                            placeholder="Search by Name, Code, or Alias..."
                            className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            {masterLoading ? (
                                <div className="p-20 text-center text-sm font-bold text-slate-400">Loading Master Catalog...</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    {/* Table Header */}
                                    <thead className="bg-slate-50">
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="p-5">SPPA Code</th>
                                            <th className="p-5">Item Name</th>
                                            <th className="p-5">Alias</th>
                                            <th className="p-5 text-center">Unit</th>
                                            <th className="p-5 text-center">Min Stock Threshold</th>
                                        </tr>
                                    </thead>

                                    {/* Table Body Row */}
                                    <tbody className="divide-y divide-slate-50">
                                        {masterList
                                            .filter(item => 
                                                item.Item_Name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                item.Item_Code?.toString().includes(searchTerm) ||
                                                item.Alias?.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-5 text-xs font-mono font-bold text-blue-600">{item.Item_Code}</td>
                                                    <td className="p-5"><p className="text-xs font-black text-slate-800">{item.Item_Name}</p></td>
                                                    <td className="p-5 text-[10px] text-slate-400 italic max-w-xs truncate">{item.Alias || "-"}</td>
                                                    <td className="p-5 text-center">
                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg">x{item.Unit || 1}</span>
                                                    </td>
                                                    
                                                    {/* EDITABLE MIN STOCK INPUT */}
                                                    <td className="p-5 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            defaultValue={item.MinStock || 5}
                                                            onBlur={async (e) => {
                                                                const newMin = Number(e.target.value);
                                                                if (newMin === item.MinStock) return;
                                                                const token = localStorage.getItem("InventoryAppToken");
                                                                try {
                                                                    await axios.put("/api/admin/masteritems/minstock", {
                                                                        item_code: item.Item_Code,
                                                                        min_stock: newMin
                                                                    }, { headers: { Authorization: `Bearer ${token}` } });
                                                                } catch (err) {
                                                                    alert("Failed to update min stock threshold");
                                                                }
                                                            }}
                                                            className="w-16 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "approvals" && (
                    <div className="animate-in fade-in duration-500 max-w-3xl">
                        <h1 className="text-2xl font-bold mb-8 text-slate-800">Action Center</h1>
                        <div className="bg-white p-6 rounded-4xl border border-red-100 shadow-sm mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                                    <AlertTriangle size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Deletion Requests</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requires Approval</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(adminHistory.usage || []).filter(log => log.Status === "Pending Delete").map(log => (
                                    <div key={log.TxnID} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{log.Location_From}</p>
                                            <h4 className="text-sm font-black text-slate-800">{log.Item_Name}</h4>
                                            <p className="text-xs font-bold text-red-500 mt-1">Requested to refund {log.Total_Items} items</p>
                                            <p className="text-[9px] text-slate-400 mt-1">ID: {log.TxnID} • By: {log.User}</p>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => handleResolveDelete(log.TxnID, "Reject")}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase active:scale-95 transition hover:bg-slate-300"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleResolveDelete(log.TxnID, "Approve")}
                                                disabled={actionLoading}
                                                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-red-200 active:scale-95 transition hover:bg-red-600"
                                            >
                                                Approve Refund
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {(adminHistory.usage || []).filter(log => log.Status === "Pending Delete").length === 0 && (
                                    <p className="text-center text-xs font-bold text-slate-400 py-8">No pending deletion requests. You're all caught up!</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "reports" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">System Reports & Analytics</h1>
                                <p className="text-slate-400 text-sm">Real-time district consumption trends</p>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => exportAdminPDF("in")} disabled={reportLoading} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-slate-800 disabled:opacity-50">
                                    <Download size={18} /> Export Incoming PDF
                                </button>
                                <button type="button" onClick={() => exportAdminPDF("out")} disabled={reportLoading} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-blue-700 disabled:opacity-50">
                                    <Download size={18} /> Export Usage PDF
                                </button>
                            </div>
                        </div>

                        <AnalyticsDashboard />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;