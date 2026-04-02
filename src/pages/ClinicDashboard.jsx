import { useState, useEffect } from "react";
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
	History,
	ArrowUpFromLine,
	CheckCircle2,
	Download,
	MapPin,
	FileUp,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { allLocations } from "../utils/constants";

import SkeletonItem from "../components/SkeletonItem";

const ClinicDashboard = ({ user, logout }) => {
	const [view, setView] = useState("menu");
	const [inventory, setInventory] = useState([]);
	const [cart, setCart] = useState([]);
	const [status, setStatus] = useState(null);
	const [history, setHistory] = useState({ transfers: [], usage: [] });
	const [histTab, setHistTab] = useState("in");
	const [searchTerm, setSearchTerm] = useState("");
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

	const [loading, setLoading] = useState(false);

	const checkLowStock = (data) => {
		if (hasAlerted) return;
		const lowItems = data.filter((i) => {
			const stock = Number(i[user.location]) || 0;
			const min = Number(i.MinStock) || 0;
			return min > 0 && stock < min;
		});
		if (lowItems.length > 0) {
			setTimeout(() => setShowLowStockModal(true), 1000);
			setHasAlerted(true);
		}
	};

	const refreshData = async () => {
		const fetchPath = view === "history" ? "/api/history" : "/api/getinventory";
		const token = localStorage.getItem("InventoryAppToken");

		try {
			setLoading(true);
			const { data } = await axios.get(fetchPath, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (view === "history") {
				setHistory({
					transfers: Array.isArray(data.transfers) ? data.transfers : [],
					usage: Array.isArray(data.usage) ? data.usage : [],
				});
			} else {
				setInventory(Array.isArray(data) ? data : []);
				if (Array.isArray(data)) checkLowStock(data);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	};

	const getFilteredData = () => {
		const data =
			histTab === "in" ? history.transfers || [] : history.usage || [];
		if (!data) return [];
		return data.filter((item) => {
			const itemDate = new Date(item.CreatedAt || item.Timestamp)
				.toISOString()
				.split("T")[0];
			if (startDate && itemDate < startDate) return false;
			if (endDate && itemDate > endDate) return false;
			return true;
		});
	};

	const exportToPDF = () => {
		const doc = new jsPDF();
		const title =
			histTab === "in" ? "Incoming Stock Report" : "Clinic Usage Report";
		const dataToExport = getFilteredData();

		if (dataToExport.length === 0)
			return alert("No data to export for selected range.");

		// Page 1: Logs
		doc.setFontSize(18);
		doc.text(title, 14, 20);
		doc.setFontSize(10);
		doc.setTextColor(100);
		doc.text(
			`Location: ${user.location} | Period: ${startDate || "Start"} to ${endDate || "End"}`,
			14,
			28,
		);

		const tableHeaders =
			histTab === "in"
				? [["Date", "ID", "From", "Status"]]
				: [["Date", "Item Name", "Qty", "User"]];

		const tableRows = dataToExport.map((item) =>
			histTab === "in"
				? [
						new Date(item.CreatedAt || item.Timestamp).toLocaleDateString(),
						item.TransferID || item.transferID || "N/A",
						item.From,
						item.Status,
					]
				: [
						new Date(item.Timestamp).toLocaleDateString(),
						item.Item_Name,
						item.Qty,
						item.User || "Staff",
					],
		);

		doc.autoTable({
			head: tableHeaders,
			body: tableRows,
			startY: 40,
			theme: "striped",
			headStyles: { fillColor: [51, 65, 85] },
		});

		// Page 2: Summary
		doc.addPage();
		doc.setTextColor(0);
		doc.setFontSize(16);
		doc.text("Executive Summary", 14, 20);

		let summaryHeaders, summaryRows;
		if (histTab === "out") {
			const totals = dataToExport.reduce((acc, curr) => {
				acc[curr.Item_Name] = (acc[curr.Item_Name] || 0) + Number(curr.Qty);
				return acc;
			}, {});
			summaryHeaders = [["Item Description", "Total Qty Used"]];
			summaryRows = Object.entries(totals)
				.sort((a, b) => b[1] - a[1])
				.map(([name, qty]) => [name, qty]);
		} else {
			const stats = dataToExport.reduce((acc, curr) => {
				acc[curr.Status] = (acc[curr.Status] || 0) + 1;
				return acc;
			}, {});
			summaryHeaders = [["Transaction Status", "Count"]];
			summaryRows = Object.entries(stats).map(([status, count]) => [
				status,
				count,
			]);
		}

		doc.autoTable({
			head: summaryHeaders,
			body: summaryRows,
			startY: 30,
			theme: "grid",
			headStyles: { fillColor: [37, 99, 235] },
		});

		doc.save(`${histTab}_Report_${user.location}.pdf`);
	};

	const handleConfirmReceipt = async (scannedId) => {
		if (!scannedId) return;

		const token = localStorage.getItem("InventoryAppToken");

		try {
			setActionLoading(true);
			await axios.post(
				"/api/clinicaction",
				{
					action: "confirmReceipt",
					txnId: scannedId.trim(),
					to: user.location,
					recipient: user.name,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			alert(`Stock Received & Verified!`);
			refreshData();
			setView("menu");
		} catch (error) {
			console.error("Error confirming receipt:", error);
			alert("Error confirming receipt. Try again.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleRecordUsage = async () => {
		if (cart.length === 0) return;
		if (!confirm("Deduct usage from your shelf?")) return;

		// ✅ SANITIZATION: Force types to match GAS requirements
		const sanitizedCart = cart.map((item) => ({
			name: String(item.name || "").trim(),
			code: String(item.code || item.Code || "").trim(), // Force code to String
			qty: Number(item.qty) || 0,
		}));

		const token = localStorage.getItem("InventoryAppToken");

		try {
			setActionLoading(true);
			await axios.post(
				"/api/clinicaction",
				{
					action: "recordUsage",
					location: String(user.location).trim(), // Match sheet header exactly
					cart: sanitizedCart,
					user: String(user.name).trim(),
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			setCart([]);
			setStatus({ msg: "Stock Deducted" });
			setTimeout(() => {
				setView("menu");
				setStatus(null);
				refreshData();
			}, 2000);
		} catch (error) {
			console.error("Failed to deduct stock:", error);
			alert(
				"Error: " +
					(error.message || "Failed to deduct stock. Check GAS Logs."),
			);
		} finally {
			setActionLoading(false);
		}
	};

	const handleClinicTransfer = async () => {
    	if (!targetLoc) return alert("Please select a destination clinic.");
    	if (cart.length === 0) return alert("Your transfer cart is empty.");

    	// ✅ SANITIZATION: Ensure data types are consistent
    	const sanitizedCart = cart.map((item) => ({
        	name: String(item.name || "").trim(),
        	code: String(item.code || item.Code || "").trim(),
        	qty: Number(item.qty) || 0,
    	}));

    	const token = localStorage.getItem("InventoryAppToken");

    	try {
        	setActionLoading(true);
        	const { data: checkoutResponse } = await axios.post(
            	"/api/clinicactions", // ✅ Plural endpoint as synced with server.js
            	{
                	action: "checkout",
                	from: String(user.location).trim(),
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
        	console.error("Transfer failed:", error);
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
					location: user.location,
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

		try {
			setActionLoading(true);
			await axios.post(
				"/api/clinicaction",
				{
					action: "recordUsage",
					operation: "add", // ⬅️ Tells GAS to add stock instead of subtract
					location: user.location,
					// Mapping the PDF items to the format GAS expects
					cart: itemsToSubmit.map((i) => ({
						name: i.item,
						qty: i.quantity,
						code: String(i.item).trim(),
					})),
					user: user.name,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			alert("Stock successfully updated from PDF!");
			setPdfItems(null); // ✅ Clear state to close the modal
			refreshData(); // Update the inventory numbers on screen
			setView("menu"); // Go back to the main menu
		} catch (error) {
			console.error("Failed to update stock:", error);
			alert("Failed to update stock via PDF.");
		} finally {
			setActionLoading(false);
		}
	};

	// ✅ Trigger refresh on 'menu' so inventory loads for the alert
	// biome-ignore lint/correctness/useExhaustiveDependencies: false postitive
	useEffect(() => {
		setSearchTerm("");
		setSelectedTxn(null);
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
					<img src="/logo_PKPDKK.png" alt="Logo" className="h-6 w-auto" />
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
				<button type="button" onClick={logout} className="text-slate-400 p-2">
					<LogOut size={20} />
				</button>
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

							<div className="flex gap-4 mt-4">
								{/* Low Stock Card - Now Clickable */}
								{/** biome-ignore lint/a11y/noStaticElementInteractions: false postitive */}
								{/** biome-ignore lint/a11y/useKeyWithClickEvents: false postitive */}
								<div
									onClick={() => setShowLowStockModal(true)}
									className="bg-white/20 p-3 rounded-2xl flex-1 text-center backdrop-blur-sm cursor-pointer active:scale-95 transition hover:bg-white/30 border border-white/10"
								>
									<p className="text-[10px] uppercase font-bold opacity-70">
										Low Stock
									</p>
									<p className="text-xl font-black flex items-center justify-center gap-1">
										{(() => {
											const count = (inventory || []).filter((i) => {
												const stock = Number(i[user.location]) || 0;
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
									<p className="text-[10px] uppercase font-bold opacity-70">
										Today's Usage
									</p>
									<p className="text-xl font-black">
										{history.usage?.filter(
											(u) =>
												new Date(u.Timestamp).toDateString() ===
												new Date().toDateString(),
										).length || 0}
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

						{view === "usage" && (
							<div className="space-y-3">
								<div className="relative">
									<Search
										className="absolute left-3 top-3 text-slate-400"
										size={18}
									/>
									<input
										placeholder="Search Name, Category, ID.."
										className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm"
										onChange={(e) =>
											setSearchTerm(e.target.value.toLowerCase())
										}
									/>
								</div>
								<div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center">
									<span className="text-xs font-bold text-blue-600">
										{cart.length} items in cart
									</span>
									<button
										type="button"
										onClick={() => setView("usage_cart")}
										className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md"
									>
										Review Usage
									</button>
								</div>
								{(inventory || [])
									.filter((i) => {
										const term = searchTerm.toLowerCase();
										const hasStock = (i[user.location] || 0) > 0;

										return (
											hasStock &&
											(i.Item_Name?.toLowerCase().includes(term) ||
												i.Category?.toLowerCase().includes(term) ||
												i.Code?.toString().includes(term))
										);
									})
									.map((i) => (
										<div
											key={i.Code}
											className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm"
										>
											<div>
												<p className="text-[10px] text-slate-400 font-mono font-bold">
													#{i.Code} - {i.Category}
												</p>
												<h3 className="text-sm font-bold text-slate-700">
													{i.Item_Name}
												</h3>
												<p className="text-xs text-blue-500">
													Stock: {i[user.location] || 0}
												</p>
											</div>
											<button
												type="button"
												onClick={() => {
													const q = prompt("Qty used?");
													if (q)
														setCart([
															...cart,
															{ name: i.Item_Name, code: i.Code, qty: q },
														]);
												}}
												className="p-3 bg-blue-50 text-blue-600 rounded-xl"
											>
												<Plus size={20} />
											</button>
										</div>
									))}
							</div>
						)}

						{view === "usage_cart" && (
							<div className="space-y-4">
								<h2 className="font-bold text-lg">Confirm Usage</h2>
								<div className="space-y-2">
									{cart.map((cartItem, cartIdx) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: false postitive
											key={cartIdx}
											className="p-3 bg-white border rounded-xl flex justify-between text-sm"
										>
											<span>{cartItem.name}</span>
											<div className="flex items-center gap-3">
												<b>x{cartItem.qty}</b>
												<button
													type="button"
													onClick={() =>
														setCart(
															cart.filter(
																(_, tempCartIdx) => tempCartIdx !== cartIdx,
															),
														)
													}
													className="text-red-500 text-xl"
												>
													×
												</button>
											</div>
										</div>
									))}
								</div>
								<button
									type="button"
									onClick={handleRecordUsage}
									disabled={actionLoading || cart.length === 0}
									className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
								>
									{actionLoading ? (
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									) : (
										"Record Usage Now"
									)}
								</button>
							</div>
						)}

						{/* --- TRANSFER OUT VIEW --- */}
						{view === "transfer_out" && (
							<div className="space-y-4">
								{!txnId ? (
									<>
										<div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
											{/** biome-ignore lint/a11y/noLabelWithoutControl: false postitive */}
											<label className="text-[10px] font-bold text-slate-400 uppercase">
												Destination Clinic
											</label>
											<select
												value={targetLoc}
												onChange={(e) => setTargetLoc(e.target.value)}
												className="w-full p-3 border rounded-xl font-bold text-blue-600 outline-none"
											>
												<option value="">Select Destination...</option>
												{allLocations
													.filter((l) => l !== user.location)
													.map((l) => (
														<option key={l} value={l}>
															{l}
														</option>
													))}
											</select>
										</div>

										<div className="relative">
											<Search
												className="absolute left-3 top-3 text-slate-400"
												size={18}
											/>
											<input
												placeholder="Find items to send..."
												className="w-full pl-10 pr-4 py-3 border rounded-xl"
												onChange={(e) =>
													setSearchTerm(e.target.value.toLowerCase())
												}
											/>
										</div>

										<div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center">
											<span className="text-xs font-bold text-blue-600">
												{cart.length} items in transfer
											</span>
											<button
												type="button"
												onClick={() => setView("transfer_cart")}
												className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
											>
												Review Transfer
											</button>
										</div>

										{(inventory || [])
											.filter((i) => {
												const term = searchTerm.toLowerCase();
												return (
													i.Item_Name?.toLowerCase().includes(term) ||
													i.Category?.toLowerCase().includes(term) ||
													i.Code?.toString().includes(term)
												);
											})
											.map((i) => (
												<div
													key={i.Code}
													className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm"
												>
													<div>
														<p className="text-[9px] text-slate-400 font-mono font-bold">
															#{i.Code}
														</p>
														<h3 className="text-sm font-bold">{i.Item_Name}</h3>
														<p className="text-xs text-slate-500">
															Category: {i.Category}
														</p>
														<p className="text-xs text-blue-500">
															Available: {i[user.location] || 0}
														</p>
													</div>
													<button
														type="button"
														onClick={() => {
															const q = prompt(
																`How many ${i.Item_Name} to send?`,
															);
															if (q)
																setCart([
																	...cart,
																	{ name: i.Item_Name, code: i.Code, qty: q },
																]);
														}}
														className="p-3 bg-blue-50 text-blue-600 rounded-xl"
													>
														<Plus size={20} />
													</button>
												</div>
											))}
									</>
								) : (
									<div className="bg-white p-8 rounded-3xl border shadow-xl text-center space-y-4">
										<h3 className="font-bold text-lg">Transfer Ready</h3>
										<QRCodeCanvas
											value={txnId}
											size={200}
											className="mx-auto p-2 border rounded-xl"
										/>
										<p className="font-mono font-bold text-blue-600">{txnId}</p>
										<p className="text-xs text-slate-400">
											Ask the receiving clinic to scan this code.
										</p>
										<button
											type="button"
											onClick={() => setView("menu")}
											className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold"
										>
											Done
										</button>
									</div>
								)}
							</div>
						)}

						{/* --- TRANSFER CART REVIEW --- */}
						{view === "transfer_cart" && (
							<div className="space-y-4">
								<h2 className="font-bold text-lg">Transfer to {targetLoc}</h2>
								<div className="space-y-2">
									{cart.map((cartItem, cartIdx) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: false postitive
											key={cartIdx}
											className="p-3 bg-white border rounded-xl flex justify-between text-sm"
										>
											<span>{cartItem.name}</span>
											<div className="flex items-center gap-3">
												<b>x{cartItem.qty}</b>
												<button
													type="button"
													onClick={() =>
														setCart(
															cart.filter(
																(_, tempCartIdx) => tempCartIdx !== cartIdx,
															),
														)
													}
													className="text-red-500"
												>
													×
												</button>
											</div>
										</div>
									))}
								</div>
								<button
									type="button"
									onClick={handleClinicTransfer}
									disabled={actionLoading || cart.length === 0}
									className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
								>
									{actionLoading ? (
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									) : (
										"Confirm & Send Stock"
									)}
								</button>
							</div>
						)}

						{view === "stock" && (
							<div className="space-y-2">
								<input
									placeholder="Search all items..."
									className="w-full p-3 border rounded-xl mb-4 shadow-sm"
									onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
								/>
								{(inventory || [])
									.filter((i) => {
										const term = searchTerm.toLowerCase();
										return (
											i.Item_Name?.toLowerCase().includes(term) ||
											i.Category?.toLowerCase().includes(term) ||
											i.Code?.toString().includes(term)
										);
									})

									.map((i) => (
										<div
											key={i.Code}
											className="p-4 bg-white border rounded-xl flex justify-between items-center shadow-sm"
										>
											<div>
												<p className="text-[9px] text-slate-400 font-mono">
													#{i.Code}
												</p>
												<span className="text-sm font-bold text-slate-700">
													{i.Item_Name}
												</span>
												<p className="text-xs text-slate-500">
													Category: {i.Category}
												</p>
											</div>
											<span
												className={`font-bold px-3 py-1 rounded-lg ${
													Number(i[user.location]) < i.MinStock
														? "bg-red-100 text-red-600"
														: "bg-slate-100 text-slate-600"
												}`}
											>
												{i[user.location] || 0}
											</span>
										</div>
									))}
							</div>
						)}

						{view === "restock" &&
							(inventory || [])
								.filter(
									(i) => (Number(i[user.location]) || 0) < (i.MinStock || 0),
								)
								.map((i) => (
									<div
										key={i.Code}
										className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center mb-2"
									>
										<div>
											<p className="text-[9px] text-slate-400 font-mono">
												#{i.Code}
											</p>
											<p className="text-sm font-bold">{i.Item_Name}</p>
										</div>
										<div className="text-right">
											<p className="text-red-600 font-bold">
												{i[user.location] || 0}
											</p>
											<p className="text-[9px] text-slate-400 uppercase">
												Min: {i.MinStock}
											</p>
										</div>
									</div>
								))}

						{view === "history" && (
							<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
								{/* 1. Header: Tab Switcher & PDF Export */}
								<div className="flex justify-between items-center gap-3">
									<div className="flex bg-slate-200 p-1.5 rounded-2xl flex-1 shadow-inner">
										<button
											type="button"
											onClick={() => setHistTab("in")}
											className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${histTab === "in" ? "bg-white shadow-md text-blue-600 scale-[1.02]" : "text-slate-500"}`}
										>
											Received
										</button>
										<button
											type="button"
											onClick={() => setHistTab("out")}
											className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${histTab === "out" ? "bg-white shadow-md text-blue-600 scale-[1.02]" : "text-slate-500"}`}
										>
											Usage
										</button>
									</div>
									<button
										type="button"
										onClick={exportToPDF}
										className="p-3.5 bg-slate-900 text-white rounded-2xl active:scale-90 transition shadow-lg"
										title="Export PDF"
									>
										<Download size={20} />
									</button>
								</div>

								{/* 2. Date Filters */}
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

								{/* 3. The Grouped Data List */}
								<div className="space-y-6">
									{(() => {
										// --- DATA FILTERING ---
										const raw =
											histTab === "in"
												? history?.transfers || []
												: history?.usage || [];

										const filtered = raw.filter((item) => {
											const itemDate = new Date(
												item.CreatedAt || item.Timestamp,
											)
												.toISOString()
												.split("T")[0];
											if (startDate && itemDate < startDate) return false;
											if (endDate && itemDate > endDate) return false;
											return true;
										});

										if (filtered.length === 0)
											return (
												<div className="text-center py-16 bg-white rounded-4xl border border-dashed border-slate-200">
													<div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
														<FileText className="text-slate-300" size={24} />
													</div>
													<p className="text-slate-400 text-xs font-bold uppercase tracking-tight">
														No records found
													</p>
												</div>
											);

										// --- STEP 1: Group by Date (YYYY-MM-DD) ---
										const groupedByDate = filtered.reduce((acc, item) => {
											const date = new Date(item.CreatedAt || item.Timestamp)
												.toISOString()
												.split("T")[0];
											if (!acc[date]) acc[date] = [];
											acc[date].push(item);
											return acc;
										}, {});

										// Sort dates: latest first
										return Object.keys(groupedByDate)
											.sort()
											.reverse()
											.map((date) => (
												<div key={date} className="space-y-3">
													<h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 drop-shadow-sm">
														{new Date(date).toLocaleDateString("en-GB", {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</h3>

													{/* --- STEP 2: Group by User/Staff inside each date --- */}
													{(() => {
														const usersInDate = groupedByDate[date].reduce(
															(acc, item) => {
																const user =
																	item.User ||
																	item.From ||
																	item.Recipient ||
																	"Staff";
																if (!acc[user]) acc[user] = [];
																acc[user].push(item);
																return acc;
															},
															{},
														);

														return Object.entries(usersInDate).map(
															([user, items]) => (
																<div
																	key={user}
																	className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md"
																>
																	<div className="flex items-center gap-2.5 mb-4">
																		<div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg shadow-blue-100">
																			{user[0].toUpperCase()}
																		</div>
																		<span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">
																			{user}
																		</span>
																	</div>

																	<div className="space-y-2">
																		{items.map((item, idx) => (
																			// biome-ignore lint/a11y/noStaticElementInteractions: false postitive
																			// biome-ignore lint/a11y/useKeyWithClickEvents: false postitive
																			<div
																				// biome-ignore lint/suspicious/noArrayIndexKey: false postitive
																				key={idx}
																				onClick={() =>
																					histTab === "in" &&
																					setSelectedTxn(item)
																				}
																				className={`group flex justify-between items-center text-sm py-2.5 border-t border-slate-50 first:border-0 transition-colors ${histTab === "in" ? "cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-xl" : ""}`}
																			>
																				<div className="flex-1 pr-4">
																					<p className="text-slate-700 font-bold text-xs leading-tight">
																						{item.Item_Name ||
																							item.ItemName ||
																							item.TransferID ||
																							item.transferID ||
																							item.txnID ||
																							"Unknown Transfer"}
																					</p>
																					{histTab === "in" && (
																						<div className="flex items-center gap-2 mt-1">
																							<p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">
																								Tap for details
																							</p>
																							{item.Status && (
																								<span
																									className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${item.Status === "Completed" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
																								>
																									{item.Status}
																								</span>
																							)}
																						</div>
																					)}
																				</div>
																				<div className="flex items-center gap-2">
																					<span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl text-xs">
																						x{item.Qty || item.qty || "1"}
																					</span>
																					{histTab === "in" && (
																						<ChevronRight
																							size={16}
																							className="text-slate-300 group-hover:text-blue-500 transition-colors"
																						/>
																					)}
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															),
														);
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
													<h3 className="font-black text-slate-900 text-xl tracking-tighter">
														Package Details
													</h3>
													<p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1">
														Ref:{" "}
														{selectedTxn.TransferID ||
															selectedTxn.transferID ||
															"No ID"}
													</p>
												</div>
												<button
													type="button"
													onClick={() => setSelectedTxn(null)}
													className="p-3 bg-slate-100 rounded-full text-slate-500 active:bg-slate-200"
												>
													<LogOut size={20} className="rotate-180" />
												</button>
											</div>

											<div className="bg-slate-50 rounded-4xl p-5 mb-8 border border-slate-100">
												<div className="flex justify-between text-[10px] uppercase font-black text-slate-400 mb-4 tracking-widest px-2">
													<span>Item Description</span>
													<span>Qty</span>
												</div>
												<div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
													{selectedTxn &&
														JSON.parse(selectedTxn.ItemsJSON || "[]").map(
															(item) => (
																<div
																	key={item.name || item.ItemName}
																	className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-50"
																>
																	<span className="text-xs text-slate-800 font-bold leading-tight pr-4">
																		{item.name ||
																			item.ItemName ||
																			"Unknown Item"}
																	</span>
																	<span className="text-sm font-black text-blue-600">
																		x{item.qty || item.Qty}
																	</span>
																</div>
															),
														)}
												</div>
											</div>

											<div className="grid grid-cols-2 gap-3">
												<div className="p-4 bg-slate-100 rounded-2xl text-center">
													<p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">
														Status
													</p>
													<p
														className={`text-xs font-black ${selectedTxn.Status === "Completed" ? "text-green-600" : "text-orange-600"}`}
													>
														{selectedTxn.Status || "Pending"}
													</p>
												</div>
												<div className="p-4 bg-slate-100 rounded-2xl text-center">
													<p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">
														Origin
													</p>
													<p className="text-xs font-black text-slate-800">
														{selectedTxn.From || "STOR"}
													</p>
												</div>
											</div>

											<button
												type="button"
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
							<button
								type="button"
								onClick={() => setShowLowStockModal(false)}
								className="p-2 bg-slate-100 rounded-full text-slate-500"
							>
								✕
							</button>
						</div>

						{/* List Area */}
						<div className="max-h-64 overflow-y-auto space-y-3 mb-6 pr-1">
							{(inventory || [])
								.filter((item) => {
									const stock = Number(item[user.location]) || 0;
									const min = Number(item.MinStock) || 0;
									return min > 0 && stock < min;
								})
								.map((item) => (
									<div
										key={item.Item_Name}
										className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100"
									>
										<div className="flex-1 pr-2">
											<p className="text-sm font-bold text-slate-900 leading-tight">
												{item.Item_Name}
											</p>
											<p className="text-[11px] text-red-500 font-semibold mt-1">
												Target: {item.MinStock}
											</p>
										</div>
										<div className="text-right">
											<p className="text-lg font-black text-red-600">
												{item[user.location] || 0}
											</p>
											<p className="text-[10px] text-slate-500 uppercase font-bold">
												Left
											</p>
										</div>
									</div>
								))}
						</div>

						{/* Action Buttons: Stacked for Mobile UX */}
						<div className="space-y-3">
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setShowLowStockModal(false)}
									className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition"
								>
									Dismiss
								</button>
								<button
									type="button"
									onClick={() =>
										handleRefillRequest(
											inventory.filter(
												(i) =>
													(Number(i[user.location]) || 0) <
													(Number(i.MinStock) || 0),
											),
										)
									}
									disabled={actionLoading}
									className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2"
								>
									{actionLoading ? (
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									) : (
										"Request Refill"
									)}
								</button>
							</div>
							<button
								type="button"
								onClick={() => {
									setShowLowStockModal(false);
									setView("restock");
								}}
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
						<h3 className="font-black text-slate-900 text-lg mb-1">
							Confirm PDF Data
						</h3>
						<p className="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-widest">
							Parsed from KEW.PS-8
						</p>

						<div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-2">
							{/* ✅ READING the items from pdfItems here */}
							{pdfItems.map((item) => (
								<div
									key={item.item}
									className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100"
								>
									<span className="text-xs font-bold text-slate-800 truncate pr-4">
										{item.item}
									</span>
									<span className="text-sm font-black text-blue-600 bg-white px-3 py-1 rounded-xl shadow-sm">
										x{item.quantity}
									</span>
								</div>
							))}
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setPdfItems(null)} // ✅ RESET: This closes the modal
								className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition"
							>
								Cancel
							</button>
							<button
								type="button"
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

export default ClinicDashboard;
