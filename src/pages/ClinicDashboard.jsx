import { useState, useEffect, useMemo, } from "react";
import axios from "axios";
import {
	Plus,
	Minus,
	QrCode,
	LogOut,
	Package,
	Search,
	FileText,
	ChevronLeft,
	ChevronRight,
	AlertTriangle,
	AlertCircle,
	History,
	ArrowUpFromLine,
	CheckCircle2,
	Download,
	MapPin,
	FileUp,
	ArrowDownLeft,
	ArrowUpRight,
	Activity,
	Clock,
	Trash2,
	Mail,
	CheckCircle,
	User,
	Check,
	PackageCheck,
	Bell,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";

import { allLocations } from "../utils/constants";

import SkeletonItem from "../components/SkeletonItem";

const ClinicDashboard = ({ user, logout }) => {
	const [view, setView] = useState("menu");
	const [inventory, setInventory] = useState([]);
	const [cart, setCart] = useState([]);
	const [status, setStatus] = useState(null);
	const [history, setHistory] = useState({ transfers: [], usage: [] });
	const [activeTab, setActiveTab] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [actionLoading, setActionLoading] = useState(false);
	const [txnId, setTxnId] = useState(null);
	const [targetLoc, setTargetLoc] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [showLowStockModal, setShowLowStockModal] = useState(false);
	const [hasAlerted, setHasAlerted] = useState(false); // Prevents modal from popping up repeatedly
	const [pdfItems, setPdfItems] = useState(null); // To store items found in PDF
	const [uploadingPDF, setUploadingPDF] = useState(false);
	const [lowStockItems, setLowStockItems] = useState([]); // Store the actual items

	const [loading, setLoading] = useState(false);

	const checkLowStock = (data) => {
		// If we've already alerted in this session, don't interrupt the user again (Lean: avoid over-processing)
		if (hasAlerted) return;

		const lowItems = data.filter((item) => {
			const stock = Number(item[user.location]) || 0;
			const min = Number(item.MinStock) || 0;
			// Logic: MinStock must be set (>0) and current stock must be equal or less
			return min > 0 && stock < min;
		}).map(item => ({
			name: item.Item_Name,
			current: item[user.location],
			min: item.MinStock
		}));

		if (lowItems.length > 0) {
			setLowStockItems(lowItems); // Save the list for the Modal to display
			setHasAlerted(true);        // Mark as alerted
			setTimeout(() => setShowLowStockModal(true), 800);
		}
	};

	const refreshData = async () => {
		const token = localStorage.getItem("InventoryAppToken");
		const headers = { Authorization: `Bearer ${token}` };

		try {
			setLoading(true);

			// Fetch Inventory (Always needed for Stock Check/Usage)
			const invRes = await axios.get("/api/getinventory", { headers });
			const invData = Array.isArray(invRes.data) ? invRes.data : [];
			setInventory(invData);

			// Fetch History (Needed for the History View and "Pending" notifications)
			const histRes = await axios.get("/api/history", { headers });
			const histData = histRes.data || { transfers: [], usage: [] };
			
			setHistory({
				transfers: Array.isArray(histData.transfers) ? histData.transfers : [],
				usage: Array.isArray(histData.usage) ? histData.usage : [],
			});

			// Run the Andon check (Low Stock Alert)
			checkLowStock(invData);

		} catch (error) {
			console.error("Master Sync Failed", error);
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmReceipt = async (input) => {
		// 1. POKA-YOKE: If we are already processing, stop immediately.
		// This prevents the "Success then Error" double-request.
		if (actionLoading) return;

		// Determine if input is a raw string (ID) or a log object
		const txnId = typeof input === "string" ? input.trim() : input.TxnID;
		
		if (!txnId) return;

		const token = localStorage.getItem("InventoryAppToken");

		try {
			setActionLoading(true);
			
			// 2. Perform the request
			const { data: response } = await axios.post(
				"/api/clinicaction",
				{
					action: "confirmReceipt",
					txnId: txnId,
					to: user.location,
					recipient: user.username,
					itemCode: input.Item_Code || null,
					totalItems: input.Total_Items || null
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			// 3. Handle Success vs Logic Errors
			if (response.status === "success") {
				// Use our status state for a smoother UX than a blocking alert
				setStatus({ msg: `Stock Verified & Added to ${user.location}!`, type: "success" });
				
				// Re-fetch data immediately
				await refreshData(); 
				
				// Give the user 1.5 seconds to see the success before moving views
				setTimeout(() => {
					setView("history");
					setStatus(null);
				}, 1500);
			} else {
				// If GAS returns an error (like "Already Confirmed")
				setStatus({ msg: response.message || "Transaction already processed.", type: "error" });
				setTimeout(() => setStatus(null), 3000);
			}

		} catch (error) {
			console.error("Error confirming receipt", error);
			// Only alert if it's a real connection error
			setStatus({ msg: "Connection error. Please check your internet.", type: "error" });
		} finally {
			// 4. Reset loading state
			setActionLoading(false);
		}
	};

	const handleRecordUsage = async () => {
		if (cart.length === 0) return;
		if (!confirm(`Deduct ${cart.length} items from your shelf?`)) return;

		const sanitizedCart = cart.map((item) => ({
			name: item.Item_Name || item.name,
			code: item.Item_Code || item.code, // ✅ Matches new header
			qty: Number(item.qty) || 0,
		}));

		const token = localStorage.getItem("InventoryAppToken");
		try {
			setActionLoading(true);
			await axios.post("/api/clinicaction", {
				action: "recordUsage",
				location: user.location,
				cart: sanitizedCart,
				user: user.username,
			}, { headers: { Authorization: `Bearer ${token}` } });

			setCart([]);
			setStatus({ msg: "Stock Updated" });

			// ✅ Signal OFF after 3 seconds
			setTimeout(() => {
				setStatus(null); 
				setView("menu");
				refreshData();
			}, 3000);
		} catch (error) {
			alert("Usage recording failed. Check connection.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleClinicTransfer = async () => {
    	if (!targetLoc) return alert("Please select a destination clinic.");
    	if (cart.length === 0) return alert("Your transfer cart is empty.");

    	// SANITIZATION: Ensure data types are consistent
    	const sanitizedCart = cart.map((item) => ({
        	name: String(item.name || "").trim(),
        	code: String(item.code || item.Code || "").trim(),
        	qty: Number(item.qty) || 0,
    	}));

    	const token = localStorage.getItem("InventoryAppToken");

    	try {
        	setActionLoading(true);
        	const { data: checkoutResponse } = await axios.post(
            	"/api/clinicaction", // Previous is Plural. remove 's'
            	{
                	action: "checkout",
                	from: String(user?.location || "").trim(),
                	to: String(targetLoc).trim(),
                	cart: sanitizedCart,
            	},
            	{
                	headers: {
                    	Authorization: `Bearer ${token}`,
                	},
            	},
        	);

        	if (checkoutResponse.status === 'success') {
            	setTxnId(checkoutResponse.txnId); // Display the QR Code
            	setCart([]);
            	setStatus({ msg: "Transfer Initiated" });
            
            	// Clear everything and go home after 2 seconds
            	setTimeout(() => {
                	setStatus(null);
                	setTxnId(null);   // Clear the transaction ID to hide QR
                	setTargetLoc(""); // Clear the destination dropdown
                	setView('menu');  // Go back to the main Dashboard menu
                	refreshData();    // Refresh the inventory numbers
            	}, 2000);

        	} else {
            	alert("Transfer failed: " + (checkoutResponse.message || "Action not recognized by server."));
        	}

    	} catch (error) {
        	console.log("Transfer failed:", error);
        	alert(
            	"Transfer failed: " +
                (error.response?.data?.error || error.message || "Connection Error")
        	);
    	} finally {
        	setActionLoading(false);
    	}
	};

	const handleRefillRequest = async (items) => {
		const token = localStorage.getItem("InventoryAppToken");

		try {
			setActionLoading(true);
			await axios.post(
				"/api/clinicaction",
				{
					action: "refillRequest",
					location: String(user?.location || "").trim(),
					items: items.map((i) => ({
						name: i.Item_Name,
						stock: i[user.location],
					})),
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			alert("Refill request sent to STOR via email.");
			setShowLowStockModal(false);
		} catch (error) {
			console.error("Request failed:", error);
			alert("Failed to send request.");
		} finally {
			setActionLoading(false);
		}
	};

	const handlePDFSubmit = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setUploadingPDF(true);
		const formData = new FormData();
		formData.append("invoice", file);

		const token = localStorage.getItem("InventoryAppToken");

		try {
			const { data: uploadResponse } = await axios.post(
				"/api/processreceipt",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (uploadResponse.success && uploadResponse.transferred.length > 0) {
				setPdfItems(uploadResponse.transferred);
			} else {
				alert(
					"No items detected. Please ensure this is a standard KEW.PS-8 PDF.",
				);
			}
		} catch (err) {
			console.error("PDF upload failed:", err);
			alert("Failed to process PDF.");
		} finally {
			setUploadingPDF(false);
			e.target.value = null;
		}
	};

	const handleManualPDFSubmit = async (itemsToSubmit) => {
		if (!itemsToSubmit || itemsToSubmit.length === 0) return;
		const token = localStorage.getItem("InventoryAppToken");

		// SANITIZATION: Ensure clean data reaches the Sheet
		const sanitizedCart = itemsToSubmit
			.map((i) => ({
				name: String(i.name || "").replace(/\n/g, ' ').trim(),
				code: String(i.code || "").trim(),
				qty: Number(i.quantity) || 0,
				unit: Number(i.unit) || 1 // We pass the unit found in the PDF
			}))
			.filter((i) => i.code !== "" && i.qty > 0);

		try {
			setActionLoading(true);
			const { data: response } = await axios.post("/api/clinicaction", {
				action: "processReceipt", // ✅ Correct action for PDF arrivals
				location: user.location,
				cart: sanitizedCart,
				user: user.username
			}, { headers: { Authorization: `Bearer ${token}` } });

			if (response.status === 'success') {
				alert("Stock successfully landed and multiplied!");
				setPdfItems(null);
				setView("menu");
				refreshData();
			}
		} catch (error) {
			alert("Failed to process receipt.");
		} finally {
			setActionLoading(false);
		}
	};

	// HELPER Configuration status to keep the UI logic clean
	const getStatusConfig = (status, log) => {
		const iAmSender = String(log.Location_From || log.From) === String(user.location);
		switch (status) {
			case "TransferIn":
            // This is where we solve your problem!
            return {
                icon: iAmSender ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />,
                color: iAmSender ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-100",
                label: iAmSender ? "Stock Sent" : "Stock Received", // ✅ Perspective Shift
                context: iAmSender ? `Confirmed by ${log.Location_To}` : `Verified by ${log.User}`
            };
			case "Add":
			return {
				icon: <CheckCircle size={18} />,
                color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                label: "Stock Added",
                context: "Restocked from Store"
			};
			case "TransferOut":
			return {
				icon: <ArrowUpRight size={18} />,
				color: "bg-blue-50 text-blue-600 border-blue-100",
				label: `Sent to ${log.Location_To}`,
				context: "Clinic Transfer"
			};
			case "Used":
			return {
				icon: <Activity size={18} />,
				color: "bg-orange-50 text-orange-600 border-orange-100",
				label: "Used in Clinic",
				context: "Patient Care"
			};
			case "Pending":
			return {
                icon: <Clock size={18} />,
                color: "bg-slate-100 text-slate-500 border-slate-200",
                label: iAmSender ? `Sent to ${log.Location_To || log.To}` : `Incoming from ${log.Location_From || log.From}`,
                context: iAmSender ? "Awaiting Confirmation" : "Action Required"
            };
			default:
			return {
				icon: <Package size={18} />,
				color: "bg-slate-50 text-slate-400 border-slate-100",
				label: "Transaction",
				context: status
			};
		}
	};

	// HELPER for search
	const getFilteredInventory = () => {
		const term = searchTerm.toLowerCase();
		return (inventory || []).filter((i) => {
			// Only show items that actually have stock for Usage/Transfer
			const hasStock = (Number(i[user.location]) || 0) > 0;
			
			const matchesName = i.Item_Name?.toLowerCase().includes(term);
			const matchesCode = i.Item_Code?.toString().includes(term);
			const matchesAlias = i.Alias?.toLowerCase().includes(term); // ✅ Search by old names!

			return hasStock && (matchesName || matchesCode || matchesAlias);
		});
	};

	// --- CALCULATE GROUPED HISTORY ---
	const groupedHistory = (() => {
		// 1. Combine all logs
		const allLogs = [...(history.transfers || []), ...(history.usage || [])];

		// 2. Filter by Tab, Location, and Date
		const filtered = allLogs.filter((log) => {
			const from = log.Location_From || log.From || "";
			const to = log.Location_To || log.To || "";
			const iAmSender = String(from) === String(user.location);
			const iAmReceiver = String(to) === String(user.location);

			// Security Guard
			if (!(iAmSender || iAmReceiver)) return false;

			// ✅ TAB FILTER (The logic that simplifies our data)
			if (activeTab === "usage" && log.Status !== "Used") return false;
			if (activeTab === "receipts" && log.Status !== "Add") return false;
			if (activeTab === "transfers" && !["Pending", "TransferIn", "TransferOut"].includes(log.Status)) return false;

			// Date Filter
			const itemDate = new Date(log.Timestamp || log.CreatedAt).toISOString().split("T")[0];
			if (startDate && itemDate < startDate) return false;
			if (endDate && itemDate > endDate) return false;

			return true;
		});

		// 3. ✅ THE FIX: Group by Date into an ARRAY
		return filtered.reduce((acc, log) => {
			const dateKey = new Date(log.Timestamp || log.CreatedAt).toISOString().split("T")[0];
			if (!acc[dateKey]) acc[dateKey] = []; // Initialize as Array
			acc[dateKey].push(log);
			return acc;
		}, {});
	})();

	// Trigger refresh on 'menu' so inventory loads for the alert
	// biome-ignore lint/correctness/useExhaustiveDependencies: false postitive
	useEffect(() => {
		setSearchTerm("");
		setTxnId(null);
		if (
			["menu", "stock", "restock", "usage", "history", "transfer_out"].includes(
				view,
			)
		) {
			refreshData();
		} else if (view === "scanner") {
			const s = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
			s.render((t) => {
				s.clear();
				handleConfirmReceipt(t);
			});

			return () => s.clear().catch(() => {});
		}
	}, [view]);

	const hasInboundPending = useMemo(() => {
		// 1. Combine everything, just like your History View does
		const allLogs = [
			...(history?.transfers || []),
			...(history?.usage || []),
			...(history?.transactions || []) // Added this as a safety net
		];

		if (allLogs.length === 0) return false;

		// 2. Look for any row that is: Pending AND meant for ME
		return allLogs.some(log => {
			const dest = (log.Location_To || log.To || "").toString().trim().toUpperCase();
			const status = (log.Status || "").toString().trim();
			const myLoc = String(user.location || "").trim().toUpperCase();

			return dest === myLoc && status === "Pending";
		});
	}, [history, user.location]); // Watch the WHOLE history object

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col font-sans">
			<header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
				<div className="flex items-center gap-2">
					{view !== "menu" && (
						<button
							type="button"
							onClick={() => setView("menu")}
							className="p-2 bg-slate-100 rounded-full"
						>
							<ChevronLeft size={18} />
						</button>
					)}
					<img src="/LOGO-K-DIP.png" alt="Logo" className="h-12 w-auto" />
					<div className="flex flex-col">
						<span className="font-bold text-sm truncate uppercase tracking-tight text-slate-800">
							{(user?.name || user?.username || "Staff").replace(/_/g, " ")}
						</span>
						<span className="inline-flex items-center text-[10px] font-bold text-blue-600 truncate bg-blue-50 px-1.5 rounded w-fit">
							<MapPin size={12} className="mr-1" aria-hidden="true" />
							{user?.location?.replace(/_/g, " ")}
						</span>
					</div>
				</div>
				{/* Right side: Bell + Logout grouped together */}
				<div className="flex items-center gap-3">
					<div className="relative">
					<button
						onClick={() => {
						setActiveTab("transfers");
						setView("history");
						}}
						className={`p-3 rounded-2xl transition-all ${
						hasInboundPending ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
						}`}
					>
						<Bell size={20} strokeWidth={hasInboundPending ? 2.5 : 2} />
						{hasInboundPending && (
							<span className="absolute -top-1 -right-1 flex h-4 w-4">
								{/* We use a brighter color here to ensure visibility */}
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
							</span>
						)}
					</button>
					</div>

					<button type="button" onClick={logout} className="text-slate-400 p-2">
					<LogOut size={20} />
					</button>
				</div>
			</header>

			<main className="p-4 flex-1 max-w-md mx-auto w-full">
				{status && (
					<div className="p-4 mb-4 bg-green-600 text-white rounded-xl text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
						<CheckCircle2 size={20} /> {status.msg}
					</div>
				)}

				{view === "menu" && (
					<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
						{/* Welcome & Stats Header */}
						<div className="bg-linear-to-r from-blue-600 to-indigo-700 p-6 rounded-4xl text-white shadow-lg shadow-blue-200">
							<h2 className="text-xl font-bold">
								Hello,{" "}
								{(user?.name || user?.username || "Staff").replace(/_/g, " ")}
							</h2>
							<p className="opacity-80 text-xs">
								Manage inventory for {user.location}
							</p>

							<div className="flex gap-4 mt-6">
								{/* --- 1. LOW STOCK CARD --- */}
								<div
									onClick={() => lowStockItems.length > 0 && setShowLowStockModal(true)}
									className={`p-4 rounded-4xl flex-1 text-center border transition-all active:scale-95 cursor-pointer ${
										lowStockItems.length > 0 
										? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-100/50" 
										: "bg-white border-slate-100 opacity-60"
									}`}
								>
									<p className={`text-[10px] uppercase font-black tracking-widest ${lowStockItems.length > 0 ? "text-red-100" : "text-slate-400"}`}>
										Low Stock
									</p>
									<p className="text-2xl font-black mt-1 flex items-center justify-center gap-2">
										{lowStockItems.length}
										{lowStockItems.length > 0 && <AlertTriangle size={18} className="animate-pulse" />}
									</p>
								</div>

								{/* --- 2. TODAY'S USAGE CARD  --- */}
								<div className="bg-white/20 p-3 rounded-4xl flex-1 text-center backdrop-blur-sm">
									<p className="text-[10px] uppercase font-black tracking-widest opacity-70">
										Used Today
									</p>
									<p className="text-2xl font-black">
										{(() => {
											const today = new Date().toDateString();
											return (history.usage || [])
												.filter(u => new Date(u.Timestamp).toDateString() === today && u.Status === "Used")
												.reduce((sum, curr) => sum + (Number(curr.Total_Items) || 0), 0);
										})()}
									</p>
								</div>
							</div>
						</div>

						{/* Primary Actions Grid */}
						<div className="grid grid-cols-1 gap-4">
							<button
								type="button"
								onClick={() => setView("usage")}
								className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]"
							>
								<div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
									<Minus size={24} strokeWidth={2.5} />
								</div>
								<div className="text-left">
									<h2 className="font-bold text-slate-800">Record Usage</h2>
									<p className="text-xs text-slate-400">
										Deduct items from your shelf
									</p>
								</div>
							</button>

							<button
								type="button"
								onClick={() => setView("transfer_out")}
								className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]"
							>
								<div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
									<ArrowUpFromLine size={24} strokeWidth={2.5} />
								</div>
								<div className="text-left">
									<h2 className="font-bold text-slate-800">Transfer Out</h2>
									<p className="text-xs text-slate-400">
										Send stock to another clinic
									</p>
								</div>
							</button>
						</div>

						{/* Secondary Actions Row */}
						<div className="grid grid-cols-2 gap-4">
							<button
								type="button"
								onClick={() => setView("scanner")}
								className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:bg-slate-50"
							>
								<QrCode size={24} className="text-green-600" />
								<span className="text-xs font-bold text-slate-700">
									Receive
								</span>
							</button>
							<button
								type="button"
								onClick={() => setView("history")}
								className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:bg-slate-50"
							>
								<History size={24} className="text-purple-600" />
								<span className="text-xs font-bold text-slate-700">
									History
								</span>
							</button>
						</div>

						{/* Footer Action */}
						<button
							type="button"
							onClick={() => setView("stock")}
							className="w-full p-4 bg-slate-100 rounded-2xl text-slate-500 text-xs font-bold flex items-center justify-center gap-2 border border-dashed border-slate-300"
						>
							<Package size={16} /> View Full Inventory List
						</button>
					</div>
				)}

				{/* --- LIST VIEWS WITH SKELETONS --- */}
				{view !== "menu" &&
				view !== "scanner" &&
				view !== "usage_cart" &&
				loading ? (
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
						{view === "scanner" && (
							<div className="space-y-4 animate-in fade-in duration-500 pb-20">
								<div className="bg-white p-4 rounded-[2.5rem] shadow-xl border-2 border-blue-500 overflow-hidden">
									{/* 1. THE QR SCANNER */}
									<div
										id="reader"
										className="overflow-hidden rounded-2xl"
									></div>

									<div className="mt-6 space-y-6">
										{/* DIVIDER 1 */}
										<div className="relative flex py-2 items-center">
											<div className="grow border-t border-slate-100"></div>
											<span className="shrink mx-4 text-[10px] font-black text-slate-300 uppercase">
												OR
											</span>
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
														if (e.key === "Enter")
															handleConfirmReceipt(e.target.value);
													}}
													id="manualTxnInput"
												/>
												<button
													type="button"
													onClick={() =>
														handleConfirmReceipt(
															document.getElementById("manualTxnInput").value,
														)
													}
													className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-xs"
												>
													Confirm
												</button>
											</div>
										</div>

										{/* DIVIDER 2 */}
										<div className="relative flex py-2 items-center">
											<div className="grow border-t border-slate-100"></div>
											<span className="shrink mx-4 text-[10px] font-black text-slate-300 uppercase">
												OR
											</span>
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
															<p className="text-xs font-bold text-blue-600 uppercase tracking-tighter">
																Parsing Document...
															</p>
														</div>
													) : (
														<>
															<div className="p-3 bg-slate-100 rounded-2xl mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
																<FileUp size={24} />
															</div>
															<p className="text-xs font-bold text-slate-700">
																Upload KEW.PS-8 PDF
															</p>
															<p className="text-[10px] text-slate-400 mt-1">
																System will auto-detect items & quantities
															</p>
														</>
													)}
												</div>
												<input
													type="file"
													accept="application/pdf"
													className="hidden"
													onChange={handlePDFSubmit}
													disabled={uploadingPDF}
												/>
											</label>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* --- USAGE VIEW --- */}
						{view === "usage" && (
							<div className="space-y-4 animate-in fade-in duration-300">
								<div className="relative group">
									<Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
									<input
										placeholder="Search Name, Alias, or Code..."
										className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>

								{cart.length > 0 && (
									<div className="bg-blue-600 p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-blue-200">
										<div className="text-white">
											<p className="text-[10px] font-black uppercase tracking-widest opacity-80">Current Cart</p>
											<p className="text-sm font-bold">{cart.length} Items Selected</p>
										</div>
										<button
											onClick={() => setView("usage_cart")}
											className="bg-white text-blue-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm active:scale-95 transition"
										>
											Review & Confirm
										</button>
									</div>
								)}

								<div className="space-y-3 pb-20">
									{getFilteredInventory().map((i) => (
										<div key={i.Item_Code} className="bg-white p-4 rounded-3xl border border-slate-50 flex justify-between items-center shadow-sm">
											<div className="min-w-0 flex-1">
												<p className="text-[9px] font-mono font-bold text-slate-400 uppercase">#{i.Item_Code}</p>
												<h3 className="text-sm font-black text-slate-800 truncate">{i.Item_Name}</h3>
												<p className="text-[10px] font-bold text-blue-500 mt-0.5">Shelf Stock: {i[user.location] || 0}</p>
											</div>
											<button
												type="button"
												onClick={() => {
													const q = prompt(`How many ${i.Item_Name} used?`);
													if (q && !isNaN(q)) {
														setCart([...cart, { name: i.Item_Name, code: i.Item_Code, qty: Number(q) }]);
													}
												}}
												className="ml-4 p-4 bg-slate-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
											>
												<Plus size={20} strokeWidth={3} />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* --- USAGE CART REVIEW --- */}
						{view === "usage_cart" && (
							<div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
								<div className="flex justify-between items-end px-2">
									<div>
										<h2 className="text-xl font-black text-slate-900 tracking-tighter">Confirm Usage</h2>
										<p className="text-xs text-slate-400 font-bold uppercase">Deducting from {user.location}</p>
									</div>
									<button onClick={() => setView("usage")} className="text-xs font-bold text-blue-600 uppercase">Add More</button>
								</div>

								<div className="space-y-2">
									{cart.map((item, idx) => (
										<div key={idx} className="p-4 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm">
											<div className="min-w-0 flex-1">
												<p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
												<p className="text-[10px] font-bold text-slate-400">Code: {item.code}</p>
											</div>
											<div className="flex items-center gap-4">
												<b className="text-sm font-black text-slate-900">x{item.qty}</b>
												<button
													onClick={() => setCart(cart.filter((_, i) => i !== idx))}
													className="p-2 bg-red-50 text-red-500 rounded-xl active:scale-90 transition"
												>
													<Trash2 size={16} />
												</button>
											</div>
										</div>
									))}
								</div>

								<button
									onClick={handleRecordUsage}
									disabled={actionLoading || cart.length === 0}
									className="w-full bg-slate-900 text-white py-5 rounded-4xl font-black text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
								>
									{actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Finalize Deduction"}
								</button>
							</div>
						)}

						{/* --- TRANSFER OUT VIEW --- */}
						{view === "transfer_out" && (
							<div className="space-y-5">
								{!txnId ? (
									<>
										<div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
											<div className="space-y-1">
												<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Clinic</label>
												<select
													value={targetLoc}
													onChange={(e) => setTargetLoc(e.target.value)}
													className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-blue-600 outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all appearance-none"
												>
													<option value="">Select Receiver...</option>
													{allLocations.filter(l => l !== user.location).map(l => (
														<option key={l} value={l}>{l}</option>
													))}
												</select>
											</div>

											<div className="relative">
												<Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
												<input
													placeholder="Find items to transfer..."
													className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
													onChange={(e) => setSearchTerm(e.target.value)}
												/>
											</div>
										</div>

										<div className="space-y-3 pb-24">
											{getFilteredInventory().map((i) => (
												<div key={i.Item_Code} className="bg-white p-4 rounded-3xl border border-slate-50 flex justify-between items-center shadow-sm">
													<div className="flex-1 min-w-0">
														<h3 className="text-sm font-black text-slate-800 truncate">{i.Item_Name}</h3>
														<p className="text-[10px] font-bold text-orange-500">Available: {i[user.location] || 0}</p>
													</div>
													<button
														onClick={() => {
															const q = prompt(`How many ${i.Item_Name} to send?`);
															if (q && !isNaN(q)) setCart([...cart, { name: i.Item_Name, code: i.Item_Code, qty: Number(q) }]);
														}}
														className="p-4 bg-orange-50 text-orange-600 rounded-2xl active:scale-90"
													>
														<Plus size={20} />
													</button>
												</div>
											))}
										</div>

										{/* Sticky Review Button */}
										{cart.length > 0 && targetLoc && (
											<div className="fixed bottom-8 left-6 right-6">
												<button
													onClick={() => setView("transfer_cart")}
													className="w-full bg-orange-600 text-white py-5 rounded-4xl font-black shadow-2xl shadow-orange-200 flex justify-between px-8"
												>
													<span>REVIEW TRANSFER</span>
													<span>{cart.length} ITEMS</span>
												</button>
											</div>
										)}
									</>
								) : (
									/* QR CODE SUCCESS STATE */
									<div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300">
										<div className="space-y-1">
											<h3 className="font-black text-xl text-slate-900 tracking-tighter">Transfer Ready</h3>
											<p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Transaction ID: {txnId}</p>
										</div>
										
										<div className="bg-slate-50 p-4 rounded-3xl inline-block border-4 border-white shadow-inner">
											<QRCodeCanvas value={txnId} size={220} />
										</div>

										<div className="bg-blue-50 p-4 rounded-2xl">
											<p className="text-[10px] font-bold text-blue-600 uppercase leading-relaxed">
												Show this QR to the receiving staff.<br/>They must scan this to confirm the stock.
											</p>
										</div>

										<button
											onClick={() => { setTxnId(null); setView("menu"); }}
											className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition"
										>
											Return to Home
										</button>
									</div>
								)}
							</div>
						)}

						{/* --- TRANSFER CART REVIEW --- */}
						{view === "transfer_cart" && (
							<div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 pb-24">
								{/* Header with Breadcrumb-style info */}
								<div className="px-2 space-y-1">
									<div className="flex justify-between items-center">
										<h2 className="text-2xl font-black text-slate-900 tracking-tighter">Review Transfer</h2>
										<button 
											onClick={() => setView("transfer_out")} 
											className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase tracking-widest"
										>
											+ Add Items
										</button>
									</div>
									
									{/* Destination Highlight (Poka-Yoke) */}
									<div className="flex items-center gap-2 mt-2 py-2 px-4 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-100">
										<div className="shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
											<ArrowUpRight size={16} strokeWidth={3} />
										</div>
										<div className="flex-1">
											<p className="text-[8px] font-black uppercase tracking-widest opacity-80">Destination</p>
											<p className="text-sm font-black uppercase tracking-tight">{targetLoc}</p>
										</div>
									</div>
								</div>

								{/* Item List */}
								<div className="space-y-3">
									{cart.map((item, idx) => (
										<div 
											key={idx} 
											className="p-4 bg-white border border-slate-100 rounded-4xl flex justify-between items-center shadow-sm"
										>
											<div className="min-w-0 flex-1">
												<p className="text-[9px] font-mono font-bold text-slate-400 uppercase">#{item.code}</p>
												<h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
											</div>
											
											<div className="flex items-center gap-4">
												<div className="text-right">
													<span className="text-sm font-black text-slate-900 block">x{item.qty}</span>
													<span className="text-[8px] font-bold text-slate-300 uppercase">Qty</span>
												</div>
												
												<button
													onClick={() => setCart(cart.filter((_, i) => i !== idx))}
													className="p-3 bg-red-50 text-red-500 rounded-2xl active:scale-90 transition-all"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</div>
									))}
								</div>

								{/* Action Button Container */}
								<div className="fixed bottom-8 left-6 right-6 space-y-3">
									<button
										onClick={handleClinicTransfer}
										disabled={actionLoading || cart.length === 0}
										className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
									>
										{actionLoading ? (
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										) : (
											<>
												<QrCode size={20} />
												GENERATE QR & SEND
											</>
										)}
									</button>
									
									<button 
										onClick={() => { setCart([]); setView("menu"); }}
										className="w-full text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition"
									>
										Cancel & Clear Cart
									</button>
								</div>
							</div>
						)}

						{view === "stock" && (
							<div className="space-y-4 animate-in fade-in duration-300">
								{/* Search Header */}
								<div className="relative group">
									<Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
									<input
										placeholder="Search inventory, aliases, or codes..."
										className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>

								{/* Inventory List */}
								<div className="space-y-2 pb-24">
									{(inventory || [])
										.filter((i) => {
											const term = searchTerm.toLowerCase();
											return (
												i.Item_Name?.toLowerCase().includes(term) ||
												i.Item_Code?.toString().includes(term) ||
												i.Alias?.toLowerCase().includes(term) // ✅ Search by Alias
											);
										})
										.map((i) => {
											const current = Number(i[user.location]) || 0;
											const min = Number(i.MinStock) || 0;
											const isLow = min > 0 && current <= min;

											return (
												<div
													key={i.Item_Code}
													className={`p-4 rounded-3xl border flex justify-between items-center transition-all ${
														isLow ? "bg-red-50 border-red-100 shadow-sm" : "bg-white border-slate-50"
													}`}
												>
													<div className="min-w-0 flex-1">
														<p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
															#{i.Item_Code}
														</p>
														<h3 className={`text-sm font-black truncate ${isLow ? "text-red-700" : "text-slate-800"}`}>
															{i.Item_Name}
														</h3>
														{i.Alias && (
															<p className="text-[9px] text-slate-400 italic truncate">aka: {i.Alias}</p>
														)}
													</div>
													
													<div className="text-right ml-4 shrink-0">
														<span className={`text-sm font-black px-4 py-1.5 rounded-xl block ${
															isLow ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
														}`}>
															{current}
														</span>
														<p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">
															{isLow ? "CRITICAL" : "ON SHELF"}
														</p>
													</div>
												</div>
											);
										})}
								</div>
							</div>
						)}

						{view === "restock" && (
							<div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
								<div className="px-2">
									<h2 className="text-2xl font-black text-slate-900 tracking-tighter">Restock List</h2>
									<p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Items below safety level</p>
								</div>

								{/* Filtered Low Stock List */}
								<div className="space-y-3 pb-32">
									{(inventory || [])
										.filter((i) => {
											const stock = Number(i[user.location]) || 0;
											const min = Number(i.MinStock) || 0;
											return min > 0 && stock <= min;
										})
										.map((i) => {
											const stock = Number(i[user.location]) || 0;
											const gap = i.MinStock - stock;

											return (
												<div key={i.Item_Code} className="p-5 bg-white border border-red-100 rounded-[2.5rem] shadow-sm flex items-center gap-4">
													<div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
														<AlertTriangle size={24} />
													</div>
													
													<div className="flex-1 min-w-0">
														<h4 className="text-sm font-black text-slate-800 truncate">{i.Item_Name}</h4>
														<div className="flex gap-3 mt-1">
															<span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
																Stock: {stock}
															</span>
															<span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
																Min: {i.MinStock}
															</span>
														</div>
													</div>

													<div className="text-right shrink-0">
														<p className="text-xs font-black text-slate-900">-{gap}</p>
														<p className="text-[8px] font-black text-slate-300 uppercase">Gap</p>
													</div>
												</div>
											);
										})}

									{/* If list is empty */}
									{inventory.filter(i => (Number(i[user.location]) || 0) < (i.MinStock || 0)).length === 0 && (
										<div className="text-center py-20">
											<div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
												<Check size={32} />
											</div>
											<p className="text-sm font-black text-slate-800">All Levels Normal</p>
											<p className="text-xs text-slate-400">Inventory is above minimum safety levels.</p>
										</div>
									)}
								</div>

								{/* Floating Action Button for Stor Keeper */}
								{inventory.filter(i => (Number(i[user.location]) || 0) < (i.MinStock || 0)).length > 0 && (
									<div className="fixed bottom-8 left-6 right-6">
										<button
											onClick={() => handleRefillRequest(inventory.filter(i => (Number(i[user.location]) || 0) < (i.MinStock || 0)))}
											disabled={actionLoading}
											className="w-full bg-blue-600 text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
										>
											<Mail size={20} />
											{actionLoading ? "SENDING..." : "EMAIL REFILL REQUEST TO STOR"}
										</button>
									</div>
								)}
							</div>
						)}

						{view === "history" && (
							<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
								
								{/* 1. Date Filters */}
								<div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm grid grid-cols-2 gap-3">
									<div className="col-span-2 flex justify-between items-center mb-1">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
											Filter by Date Range
										</span>
										{(startDate || endDate) && (
											<button
												type="button"
												onClick={() => {
													setStartDate("");
													setEndDate("");
												}}
												className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg"
											>
												Reset
											</button>
										)}
									</div>
									<div className="space-y-1">
										<p className="text-[9px] text-slate-400 font-bold ml-1">
											START
										</p>
										<input
											type="date"
											value={startDate}
											onChange={(e) => setStartDate(e.target.value)}
											className="text-xs p-3 border-0 bg-slate-50 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none"
										/>
									</div>
									<div className="space-y-1">
										<p className="text-[9px] text-slate-400 font-bold ml-1">
											END
										</p>
										<input
											type="date"
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
											className="text-xs p-3 border-0 bg-slate-50 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none"
										/>
									</div>
								</div>

								<div className="space-y-6 pb-24">
									{/* --- TAB NAVIGATION --- */}
									<div className="flex p-1 rounded-3xl sticky top-0 z-20 backdrop-blur-md bg-slate-100/80 border border-slate-200 shadow-sm">
										{["all", "usage", "transfers", "receipts"].map((tab) => (
											<button
												key={tab}
												onClick={() => setActiveTab(tab)}
												className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
													activeTab === tab 
													? "bg-white text-blue-600 shadow-sm" 
													: "text-slate-400 hover:text-slate-600"
												}`}
											>
												{tab}
											</button>
										))}
									</div>

									{/* --- LIST VIEW --- */}
									{Object.keys(groupedHistory).length === 0 ? (
										<div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
											<div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
												<Search size={24} className="text-slate-300" />
											</div>
											<p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No {activeTab} records found</p>
										</div>
									) : (
										Object.keys(groupedHistory).sort().reverse().map((date) => (
											<div key={date} className="space-y-4">
												{/* DATE HEADER */}
												<h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4 pt-4">
													{new Date(date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
												</h3>

												<div className="space-y-3">
													{groupedHistory[date].map((log, idx) => {
														const config = getStatusConfig(log.Status, log);
														return (
															<div key={idx} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
																{/* CARD CONTENT (Icon, Name, Qty logic remains same) */}
																<div className="flex items-center gap-4">
																	<div className={`p-3 rounded-2xl border ${config.color} shrink-0`}>
																		{config.icon}
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="flex justify-between items-start mb-1">
																			<p className="text-[10px] font-black text-slate-400 uppercase truncate">
																				{config.label}
																			</p>
																			<span className="text-[9px] font-bold text-slate-300">
																				{new Date(log.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
																			</span>
																		</div>
																		<h4 className="text-sm font-black text-slate-800 leading-tight">
																			{log.Item_Name}
																		</h4>
																		<p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1">
																			<User size={10} /> {log.User?.split(' ')[0]} • {config.context}
																		</p>
																	</div>
																	<div className="text-right shrink-0">
																		<p className={`text-base font-black ${String(log.Location_From) === String(user.location) ? "text-red-500" : "text-green-600"}`}>
																			{String(log.Location_From) === String(user.location) ? "-" : "+"}
																			{log.Total_Items}
																		</p>
																	</div>
																</div>

																{/* PENDING ACTION */}
																{log.Status === "Pending" && String(log.Location_To) === String(user.location) && (
																	<button 
																		onClick={() => handleConfirmReceipt(log)}
																		className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-blue-100"
																	>
																		Confirm Receipt
																	</button>
																)}
															</div>
														);
													})}
												</div>
											</div>
										))
									)}
								</div>
							</div>
						)}
					</>
				)}
			</main>
			{/* --- LOW STOCK ALERT MODAL (JIDOKA SYSTEM) PLACED OUTSIDE VIEW--- */}
			{showLowStockModal && (
				<div className="fixed inset-0 bg-slate-900/60 z-9999 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
					<div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-red-50">
						
						{/* Header: Clear Visual Management */}
						<div className="flex flex-col items-center text-center mb-6">
							<div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-inner">
								<AlertCircle size={32} strokeWidth={3} />
							</div>
							<h3 className="font-black text-2xl text-slate-900 tracking-tighter">Stock Alerts</h3>
							<p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
								Attention Required
							</p>
						</div>

						{/* List Area: Optimized for Clarity */}
						<div className="max-h-60 overflow-y-auto space-y-2 mb-8 pr-1 custom-scrollbar">
							{lowStockItems.length > 0 ? (
								lowStockItems.map((item, idx) => (
									<div
										key={idx}
										className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors"
									>
										<div className="flex-1 min-w-0 pr-3">
											<p className="text-xs font-black text-slate-800 truncate leading-tight">
												{item.name}
											</p>
											<p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
												Target: {item.min}
											</p>
										</div>
										<div className="text-right shrink-0">
											<p className="text-sm font-black text-red-600">
												{item.current}
											</p>
											<p className="text-[8px] text-slate-300 uppercase font-black">
												Left
											</p>
										</div>
									</div>
								))
							) : (
								<p className="text-center text-xs text-slate-400 py-4 italic">No items below safety level.</p>
							)}
						</div>

						{/* Action Buttons: Hierarchical Priority */}
						<div className="space-y-3">
							<button
								type="button"
								onClick={() => handleRefillRequest(lowStockItems)}
								disabled={actionLoading || lowStockItems.length === 0}
								className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
							>
								{actionLoading ? (
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<>
										<Mail size={18} />
										Request Refill from STOR
									</>
								)}
							</button>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setShowLowStockModal(false);
										setView("restock");
									}}
									className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition"
								>
									View Full List
								</button>
								<button
									type="button"
									onClick={() => setShowLowStockModal(false)}
									className="flex-1 py-3 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition"
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ✅ PDF VERIFICATION MODAL (PLACED OUTSIDE VIEW*/}
			{pdfItems && (
				<div className="fixed inset-0 bg-slate-900/70 z-10001 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
					<div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-blue-50">
						{/* Header: Clarity of Purpose */}
						<div className="mb-6">
							<h3 className="font-black text-slate-900 text-2xl tracking-tighter">Verify Receipt</h3>
							<p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1">
								Extracted from KEW.PS-8
							</p>
						</div>

						{/* List Area: High Scannability */}
						<div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
							{pdfItems.map((item, idx) => (
								<div 
									key={idx} 
									className="p-4 bg-slate-50 rounded-4xl border border-slate-100 flex justify-between items-center gap-4 group hover:border-blue-200 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<h4 className="text-xs font-black text-slate-800 truncate leading-tight">
											{item.name}
										</h4>
										<p className="text-[9px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider">
											Code: {item.code}
										</p>
									</div>
									
									{/* Editable Quantity Block: Visual Priority */}
									<div className="flex flex-col items-end shrink-0">
										<label className="text-[8px] font-black text-blue-400 uppercase mb-1 mr-1">
											Qty Recv
										</label>
										<div className="relative">
											<input
												type="number"
												value={item.quantity}
												onChange={(e) => {
													const newItems = [...pdfItems];
													newItems[idx].quantity = Math.max(0, parseInt(e.target.value) || 0);
													setPdfItems(newItems);
												}}
												className="w-20 p-3 bg-white border-2 border-blue-100 rounded-2xl text-center text-sm font-black text-blue-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
											/>
											{/* Small visual hint that this value will be processed */}
											<div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Action Footer: Standardized Flow */}
						<div className="space-y-3">
							<button 
								onClick={() => handleManualPDFSubmit(pdfItems)} 
								disabled={actionLoading}
								className="w-full py-5 bg-blue-600 text-white rounded-4xl font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-50"
							>
								{actionLoading ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<>
										<CheckCircle size={20} />
										CONFIRM & ADD TO SHELF
									</>
								)}
							</button>
							
							<button 
								onClick={() => setPdfItems(null)} 
								className="w-full py-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition"
							>
								Discard Extract
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ClinicDashboard;
