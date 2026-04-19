import { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import axios from "axios";

import Login from "./pages/Login";
import WarehouseDashboard from "./pages/WarehouseDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import NotFound from "./pages/NotFound";

export default function App() {
	const [user, setUser] = useState(null);

	const [isVerifying, setIsVerifying] = useState(true);

	const handleLogout = () => {
	localStorage.removeItem("InventoryAppToken");
	localStorage.removeItem("InventoryAppUser");
	setUser(null);
	};

	useEffect(() => {
		const verifyUser = async () => {
			const token = localStorage.getItem("InventoryAppToken");
			
			if (!token) {
				setIsVerifying(false);
				return;
			}

			try {
				const { data: user } = await axios.get("/api/whoami", {
					headers: { Authorization: `Bearer ${token}` },
				});
				setUser(user);
			} catch (_error) {
				// Token is either expired or tampered with
				localStorage.removeItem("InventoryAppToken");
				localStorage.removeItem("InventoryAppUser");
				setUser(null);
			} finally {
				// This runs regardless of success or failure
				setIsVerifying(false);
			}
		};

		verifyUser();
	}, []);

	if (isVerifying) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-indigo-600 to-purple-700 p-6">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
					<p className="text-white font-bold tracking-widest uppercase text-xs">
						Initializing
					</p>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-slate-50">
			{/* 1. Global Loading State (Session Check) */}
			{isVerifying ? (
			<div className="min-h-screen flex flex-col items-center justify-center">
				<div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
				<p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
				Authenticating...
				</p>
			</div>
			) : !user ? (
			/* 2. Login View (If no user is authenticated) */
			<Login setUser={setUser} />
			) : (
			/* 3. Dashboard View (Based on Role) */
			<>
				{user.role === "Clinic" && (
				<ClinicDashboard user={user} logout={handleLogout} />
				)}
				
				{user.role === "Warehouse" && (
				<WarehouseDashboard user={user} logout={handleLogout} />
				)}
				
				{user.role === "Admin" && (
				<AdminDashboard user={user} logout={handleLogout} />
				)}
				
				{/* ✅ The "Not Found" Fallback 
					If the role isn't any of the above, show your NotFound component */}
				{!["Clinic", "Warehouse", "Admin"].includes(user.role) && (
				<NotFound logout={handleLogout} />
				)}
			</>
			)}
		</main>
	);
}
