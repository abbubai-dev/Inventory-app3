import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, LogOut, Search, AlertTriangle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import "jspdf-autotable";

import { clinics } from "../utils/constants";

const WarehouseDashboard = ({ user, logout }) => {
	const [inventory, setInventory] = useState([]);
	const [cart, setCart] = useState([]);
	const [txnId, setTxnId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [targetLoc, setTargetLoc] = useState("KPH");
	const [showAlerts, setShowAlerts] = useState(false);

	const [loading, setLoading] = useState(false);

	const clinicAlerts = (inventory || []).filter((item) =>
		clinics.some((c) => (Number(item[c]) || 0) < (item.MinStock || 0)),
	);

	const addToCart = (item) => {
		const q = window.prompt(`Quantity for ${item.Item_Name}:`, "1");
		if (!q || Number.isNaN(q) || q <= 0) return;
		setCart([
			...cart,
			{
				cartId: Math.random().toString(36).substr(2, 5),
				code: item.Code,
				name: item.Item_Name,
				qty: parseInt(q, 10),
			},
		]);
	};

	const handleCheckout = async () => {
		if (!confirm(`Transfer to ${targetLoc}?`)) return;
		const token = localStorage.getItem("InventoryAppToken");

		try {
			setLoading(true);
			const { data: checkoutResponse } = await axios.post(
				"/api/checkout",
				{
					action: "checkout",
					from: user.location,
					to: targetLoc,
					cart,
				},
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			setTxnId(checkoutResponse.txnId);
		} catch (error) {
			console.error("Error fetching inventory data:", error);
			// logout();
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const getInventoryData = async () => {
			const token = localStorage.getItem("InventoryAppToken");

			try {
				const { data: inventoryData } = await axios.get("/api/getinventory", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				setInventory(inventoryData);
			} catch (error) {
				console.error("Error fetching inventory data:", error);
			}
		};

		getInventoryData();
	}, []);

	return (
		<div className="flex h-screen bg-slate-100 font-sans">
			<div className="flex-1 flex flex-col min-w-0">
				<header className="bg-white border-b px-5 py-3 flex justify-between items-center shadow-sm z-10">
					<div className="flex items-center gap-3">
						<img src="/logo_PKPDKK.png" alt="Logo" className="h-7 w-auto" />
						<h1 className="text-sm font-black tracking-tight text-slate-700 uppercase">
							STOR PKPDKK
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setShowAlerts(!showAlerts)}
							className={`relative p-2 rounded-lg transition-colors ${showAlerts ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
						>
							<AlertTriangle size={16} />
							{clinicAlerts.length > 0 && (
								<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white rounded-full"></span>
							)}
						</button>
						<button
							type="button"
							onClick={logout}
							className="p-2 text-slate-400 hover:text-red-500 transition-colors"
						>
							<LogOut size={16} />
						</button>
					</div>
				</header>

				<div className="p-4 overflow-y-auto flex-1 space-y-4">
					{/* COMPACT ALERTS BOX */}
					{showAlerts && clinicAlerts.length > 0 && (
						<div className="bg-white border-l-4 border-red-500 rounded-xl shadow-sm p-3">
							<div className="flex justify-between items-center mb-2">
								<span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
									<AlertTriangle size={12} /> Clinic Shortages
								</span>
								<button
									type="button"
									onClick={() => setShowAlerts(false)}
									className="text-slate-300 hover:text-slate-500"
								>
									×
								</button>
							</div>
							<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
								{clinicAlerts.map((item) => (
									<div
										key={item.Code}
										className="min-w-45 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col justify-between"
									>
										<p className="text-[10px] font-bold text-slate-700 truncate mb-1">
											{item.Item_Name}
										</p>
										<button
											type="button"
											onClick={() => {
												setTargetLoc(
													clinics.find(
														(c) => (Number(item[c]) || 0) < item.MinStock,
													),
												);
												addToCart(item);
											}}
											className="w-full py-1 bg-red-600 text-white text-[9px] font-bold rounded uppercase tracking-tighter"
										>
											Fulfill
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* COMPACT SEARCH */}
					<div className="relative">
						<Search
							className="absolute left-3 top-2.5 text-slate-400"
							size={16}
						/>
						<input
							placeholder="Search category or item..."
							className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 shadow-sm"
							onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
						/>
					</div>

					{/* GROUPED LIST VIEW */}
					<div className="space-y-3 pb-10">
						{(() => {
							const filtered = (inventory || []).filter(
								(i) =>
									i.Item_Name?.toLowerCase().includes(searchTerm) ||
									i.Category?.toLowerCase().includes(searchTerm) ||
									i.Code?.toString().includes(searchTerm),
							);

							// Group by category
							const groups = filtered.reduce((acc, item) => {
								const cat = item.Category || "Uncategorized";
								if (!acc[cat]) acc[cat] = [];
								acc[cat].push(item);
								return acc;
							}, {});

							return Object.entries(groups)
								.sort()
								.map(([category, items]) => (
									<div
										key={category}
										className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
									>
										<div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex justify-between items-center">
											<span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
												{category}
											</span>
											<span className="text-[9px] font-bold text-slate-400">
												{items.length} items
											</span>
										</div>
										<div className="divide-y divide-slate-50">
											{items.map((item) => {
												const stock = Number(item[user.location]) || 0;
												return (
													<div
														key={item.Code}
														className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors group"
													>
														<div className="flex-1 min-w-0 pr-4">
															<div className="flex items-center gap-2">
																<span className="text-[9px] font-mono font-bold text-slate-400">
																	#{item.Code}
																</span>
																<h3 className="text-xs font-semibold text-slate-700 truncate">
																	{item.Item_Name}
																</h3>
															</div>
														</div>
														<div className="flex items-center gap-4">
															<div className="text-right">
																<span
																	className={`text-xs font-black ${stock <= 0 ? "text-red-500" : "text-slate-700"}`}
																>
																	{stock}
																</span>
																<p className="text-[8px] font-bold text-slate-300 uppercase leading-none">
																	In Stor
																</p>
															</div>
															<button
																type="button"
																onClick={() => addToCart(item)}
																className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<Plus size={14} />
															</button>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								));
						})()}
					</div>
				</div>
			</div>

			{/* COMPACT CART SIDEBAR */}
			<div className="w-64 bg-white border-l shadow-2xl flex flex-col">
				<div className="p-3 border-b bg-slate-800 text-white text-xs font-black uppercase tracking-widest">
					Transfer Cart
				</div>
				<div className="p-3 bg-slate-50 border-b">
					{/** biome-ignore lint/a11y/noLabelWithoutControl: false positive */}
					<label className="text-[9px] font-black text-slate-400 block mb-1 uppercase">
						Destination:
					</label>
					<select
						value={targetLoc}
						onChange={(e) => setTargetLoc(e.target.value)}
						className="w-full border-slate-200 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-blue-500"
					>
						{clinics.map((l) => (
							<option key={l}>{l}</option>
						))}
					</select>
				</div>
				<div className="flex-1 overflow-y-auto p-3 space-y-1">
					{cart.map((c) => (
						<div
							key={c.cartId}
							className="text-[10px] p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group"
						>
							<span className="truncate pr-2 font-medium">{c.name}</span>
							<div className="flex items-center gap-2">
								<b className="text-blue-600">x{c.qty}</b>
								<button
									type="button"
									onClick={() =>
										setCart(cart.filter((x) => x.cartId !== c.cartId))
									}
									className="text-slate-300 hover:text-red-500"
								>
									×
								</button>
							</div>
						</div>
					))}
					{cart.length === 0 && (
						<p className="text-[10px] text-center text-slate-400 mt-10 italic">
							Cart is empty
						</p>
					)}
				</div>
				<div className="p-3 border-t bg-slate-50">
					{txnId ? (
						<div className="text-center p-2 bg-white rounded-xl border shadow-inner">
							<QRCodeCanvas value={txnId} size={110} className="mx-auto" />
							<p className="mt-2 font-mono text-[10px] font-bold text-blue-600">
								{txnId}
							</p>
							<button
								type="button"
								onClick={() => {
									setTxnId(null);
									setCart([]);
								}}
								className="text-[9px] font-black uppercase text-slate-400 mt-2 block w-full hover:text-slate-600"
							>
								Clear
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={handleCheckout}
							disabled={cart.length === 0 || loading}
							className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${cart.length === 0 ? "bg-slate-200 text-slate-400" : "bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95"}`}
						>
							{loading ? "..." : `Send to ${targetLoc}`}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default WarehouseDashboard;
