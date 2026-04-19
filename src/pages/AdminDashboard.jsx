import { useState, useEffect } from "react";
import axios from "axios";
import { LogOut, FileText, Users, ShieldCheck, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { locations, roles } from "../utils/constants";

const AdminDashboard = ({ logout }) => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [adminHistory, setAdminHistory] = useState({ transfers: [], usage: [], });
	const [reportLoading, setReportLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("users");
	// ✅ New state for Master List
    const [masterList, setMasterList] = useState([]);
    const [masterLoading, setMasterLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

	// Trigger data fetch based on tab
    useEffect(() => {
        if (activeTab === "users") getAllUsers();
        if (activeTab === "master") fetchMasterList();
        if (activeTab === "reports") fetchHistory();
    }, [activeTab]);

	const fetchMasterList = async () => {
        const token = localStorage.getItem("InventoryAppToken");
        try {
            setMasterLoading(true);
            const { data } = await axios.get("/api/getinventory", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMasterList(data);
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
				headers: {
					Authorization: `Bearer ${token}`,
				},
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
			const { data: historyData } = await axios.get("/api/getreports", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			setAdminHistory({
				transfers: historyData.transfers,
				usage: historyData.usage,
			});
		} catch (err) {
			console.error("Failed to fetch reports", err);
		} finally {
			setReportLoading(false);
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
					action: "addUser",
					username: e.target.username.value,
					password: e.target.password.value,
					email: e.target.email.value,
					role: e.target.role.value,
					location: e.target.location.value,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			alert("User Added Successfully");
			e.target.reset();
			await getAllUsers();
		} catch (err) {
			console.error("Error adding user", err);
			alert("Failed to add user");
		} finally {
			setLoading(false);
		}
	};

	const exportAdminPDF = (type) => {
		const doc = new jsPDF();
		const data = type === "in" ? adminHistory.transfers : adminHistory.usage;
		const title =
			type === "in" ? "Global Incoming Stock Report" : "Global Usage Report";

		if (data.length === 0) return alert("No data available to export.");

		doc.setFontSize(18);
		doc.text(title, 14, 20);

		const headers =
			type === "in"
				? [["Date", "ID", "From", "To", "Status"]]
				: [["Date", "Location", "Item Name", "Qty"]];

		const rows = data.map((item) => {
			const dateStr = item.CreatedAt || item.Timestamp;
			const formattedDate = dateStr
				? new Date(dateStr).toLocaleDateString("en-GB")
				: "N/A";

			return type === "in"
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
			acc[key] = (acc[key] || 0) + Number(curr.Qty || 1);
			return acc;
		}, {});

		const summaryRows = Object.entries(summaryMap).map(([name, total]) => [
			name,
			total,
		]);

		doc.autoTable({
			head: [["Item Name / Category", "Total Volume"]],
			body: summaryRows,
			startY: 30,
			headStyles: { fillColor: [37, 99, 235] },
		});

		doc.save(`Global_Report_${type}_${new Date().toLocaleDateString()}.pdf`);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: false positive
	useEffect(() => {
		getAllUsers();
	}, []);

	return (
		<div className="min-h-screen bg-slate-50 flex">
			{/* Sidebar */}
			<div className="w-64 bg-slate-900 text-white p-6 shadow-xl">
				<h2 className="text-xl font-bold mb-8 flex items-center gap-2">
					<ShieldCheck className="text-blue-400" size={24} /> Admin
				</h2>
				<nav className="space-y-4">
					{/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: false positive */}
					<div
						onClick={() => setActiveTab("users")}
						className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "users" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800"}`}
					>
						<Users size={20} /> User Management
					</div>
					{/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: false positive */}
					<div
						onClick={() => {
							setActiveTab("master");
							fetchMasterList();
						}}
						className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "master" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800"}`}
					>
						<FileText size={20} /> Master Item List
					</div>
					{/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
					{/** biome-ignore lint/a11y/useKeyWithClickEvents: false positive */}
					<div
						onClick={() => {
							setActiveTab("reports");
							fetchHistory();
						}}
						className={`p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${activeTab === "reports" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-slate-800"}`}
					>
						<FileText size={20} /> System Reports
					</div>

					<div className="pt-8 mt-8 border-t border-slate-800">
						<button
							type="button"
							onClick={logout}
							className="p-3 text-slate-400 flex items-center gap-2 hover:text-white hover:bg-red-500/10 rounded-xl transition-all w-full"
						>
							<LogOut size={20} /> Logout
						</button>
					</div>
				</nav>
			</div>

			{/* Main Content */}
			<div className="flex-1 p-8 overflow-y-auto">
				
				{activeTab === "users" && (
					<div className="animate-in fade-in duration-500">
						<h1 className="text-2xl font-bold mb-8 text-slate-800">
							User Management
						</h1>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Add User Form */}
							<div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
								<h3 className="font-bold mb-6 text-slate-700">
									Add New System User
								</h3>
								<form onSubmit={handleAddUser} className="space-y-4">
									<input
										name="username"
										placeholder="Full Name"
										className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
										required
									/>
									<input
										name="password"
										type="password"
										placeholder="Password"
										className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
										required
									/>
									<input
										name="email"
										type="email"
										placeholder="Official Email"
										className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
										required
									/>
									<div className="grid grid-cols-2 gap-4">
										<select
											name="role"
											className="p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
										>
											{roles.map((r) => (
												<option key={r} value={r}>
													{r}
												</option>
											))}
										</select>
										<select
											name="location"
											className="p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
										>
											{locations.map((l) => (
												<option key={l} value={l}>
													{l}
												</option>
											))}
										</select>
									</div>
									<button
										type="button"
										disabled={loading}
										className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
									>
										{loading ? "Registering..." : "Register User"}
									</button>
								</form>
							</div>

							{/* User List */}
							<div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100">
								<h3 className="font-bold mb-6 text-slate-700">
									Access Control List
								</h3>
								<div className="space-y-3 max-h-112.5 overflow-y-auto pr-2 custom-scrollbar">
									{users.length > 0 ? (
										users.map((u, i) => (
											<div
												key={`${i}-${u.username}`}
												className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all"
											>
												<div>
													<p className="font-black text-sm text-slate-800">
														{u.username}
													</p>
													<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
														{u.role} • {u.location}
													</p>
												</div>
												<div className="bg-white px-3 py-1 rounded-lg text-[10px] font-black text-slate-300 border border-slate-100">
													ID: {i + 1}
												</div>
											</div>
										))
									) : (
										<p className="text-center text-slate-400 text-sm py-10">
											No users found.
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === "master" && (
					<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
						<div className="flex justify-between items-end">
							<div>
								<h1 className="text-2xl font-black text-slate-900 tracking-tighter">Master Item List</h1>
								<p className="text-xs text-slate-400 font-bold">Standardize SPPA Codes & Multipliers</p>
							</div>
						</div>

						<input 
							type="text"
							placeholder="Search by Name, Code, or Alias..."
							className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>

						<div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
							<table className="w-full text-left border-collapse">
								<thead className="bg-slate-50">
									<tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
										<th className="p-5">SPPA Code</th>
										<th className="p-5">Item Name</th>
										<th className="p-5">Alias</th>
										<th className="p-5 text-center">Unit</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-50">
									{masterList
										.filter(item => 
											item.Item_Name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
											item.Item_Code?.includes(searchTerm) ||
											item.Alias?.includes(searchTerm)
										)
										.map((item, idx) => (
											<tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
												<td className="p-5 text-xs font-mono font-bold text-blue-600">
													{item.Item_Code || <span className="text-red-400 italic">No Code</span>}
												</td>
												<td className="p-5">
													<p className="text-xs font-black text-slate-800">{item.Item_Name}</p>
												</td>
												<td className="p-5 text-[10px] text-slate-400 italic max-w-xs truncate">
													{item.Alias || "-"}
												</td>
												<td className="p-5 text-center">
													<span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-lg">
														x{item.Unit || 1}
													</span>
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === "reports" && (
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
						<div className="flex justify-between items-center mb-8">
							<div>
								<h1 className="text-2xl font-bold text-slate-800">
									System Reports
								</h1>
								<p className="text-slate-400 text-sm">
									Download aggregated data across all clinics
								</p>
							</div>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => exportAdminPDF("in")}
									disabled={reportLoading}
									className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-slate-800"
								>
									<Download size={18} />{" "}
									{reportLoading ? "Loading..." : "Incoming Report"}
								</button>
								<button
									type="button"
									onClick={() => exportAdminPDF("out")}
									disabled={reportLoading}
									className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition hover:bg-blue-700"
								>
									<Download size={18} />{" "}
									{reportLoading ? "Loading..." : "Usage Report"}
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
								{reportLoading
									? "Gathering Global Data..."
									: "Reporting Module Active"}
							</h3>
							<p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
								Click the buttons above to generate a consolidated PDF of all
								transactions district-wide.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminDashboard;
