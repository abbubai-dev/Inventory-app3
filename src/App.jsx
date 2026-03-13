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

	const logout = () => {
		setUser(null);
		localStorage.removeItem("InventoryAppToken");
		localStorage.removeItem("InventoryAppUser");
		window.location.href = "/";
	};

	useEffect(() => {
		const verifyUser = async () => {
			const token = localStorage.getItem("InventoryAppToken");
			if (!token) {
				setIsVerifying(false);
				return;
			}

			try {
				const { data } = await axios.get("/api/whoami", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				setUser(data);
				setIsVerifying(false);
			} catch (_error) {
				setUser(null);
			} finally {
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
		<Router>
			<Routes>
				<Route
					path="/"
					element={
						!user ? (
							<Login setUser={setUser} />
						) : (
							<Navigate
								to={
									user.role === "Admin"
										? "/admin"
										: user.role === "Warehouse"
											? "/warehouse"
											: "/clinic"
								}
							/>
						)
					}
				/>
				<Route
					path="/warehouse"
					element={
						user?.role === "Warehouse" ? (
							<WarehouseDashboard user={user} logout={logout} />
						) : (
							<Navigate to="/" />
						)
					}
				/>
				<Route
					path="/clinic"
					element={
						user?.role === "Clinic" ? (
							<ClinicDashboard user={user} logout={logout} />
						) : (
							<Navigate to="/" />
						)
					}
				/>
				<Route
					path="/admin"
					element={
						user?.role === "Admin" ? (
							<AdminDashboard user={user} logout={logout} />
						) : (
							<Navigate to="/" />
						)
					}
				/>
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Router>
	);
}
