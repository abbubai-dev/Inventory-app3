import { useState, useLayoutEffect } from "react";
import axios from "axios";

const Login = ({ setUser }) => {
	const [firstSetup, setFirstSetup] = useState(true);
	const [loading, setLoading] = useState(false);
	const [setupData, setSetupData] = useState({ locations: [], users: [] });
	const [selectedLoc, setSelectedLoc] = useState("");
	const [selectedUser, setSelectedUser] = useState("");
	const [password, setPassword] = useState("");
	const [step, setStep] = useState(1);
	const [otp, setOtp] = useState("");

	useLayoutEffect(() => {
		const initialLoad = async () => {
			try {
				setFirstSetup(true);
				const { data: allUsersAndLocations } = await axios.get("/api/getusers");
				setSetupData(allUsersAndLocations || { locations: [], users: [] });
			} catch (err) {
				console.error("Initial Load Failed", err);
			} finally {
				setFirstSetup(false);
			}
		};

		initialLoad();
	}, []);

	// STEP 1: Validate Password and Send OTP
	const handleRequestOTP = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			await axios.post("/api/login", {
				username: selectedUser,
				password,
				selectedLoc,
			});

			alert("OTP sent!");
			setStep(2);
		} catch (err) {
			alert("Login Failed");
			console.error("Login Failed", err);
		} finally {
			setLoading(false);
		}
	};

	// STEP 2: Verify OTP and Log In
	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const { data: loginData } = await axios.post("/api/verifyotp", {
				username: selectedUser,
				password,
				selectedLoc,
				otp,
			});

			const { data: reqUser } = await axios.get("/api/whoami", {
				headers: {
					Authorization: `Bearer ${loginData.token}`,
				},
			});

			localStorage.setItem("InventoryAppToken", loginData.token);
			localStorage.setItem("InventoryAppUser", JSON.stringify(reqUser));
			setUser(reqUser);
		} catch (err) {
			console.error("Verification error", err);
			alert("Verification error.");
		} finally {
			setLoading(false);
		}
	};

	if (firstSetup) {
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
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 via-indigo-600 to-purple-700 p-6">
			<div className="w-full max-w-md bg-white/20 backdrop-blur-xl rounded-[2.5rem] border border-white/30 shadow-2xl p-8 text-white">
				<div className="flex justify-center mb-6">
					<img
						src="/LOGO-K-DIP.png"
						alt="Logo K-DIP"
						className="h-20 w-auto object-contain"
					/>
				</div>
				<h1 className="text-xl font-bold mb-6 text-center text-slate-800">
					Kuala Kangsar Dental Inventory Platform
				</h1>

				{step === 1 ? (
					/* STEP 1 FORM */
					<form onSubmit={handleRequestOTP} className="space-y-4">
						<div>
							{/** biome-ignore lint/a11y/noLabelWithoutControl: false positive */}
							<label className="text-[10px] font-bold text-slate-800 uppercase ml-1">
								Location
							</label>
							<select
								className="w-full p-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white outline-none appearance-none shadow-lg"
								style={{
									backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
									backgroundRepeat: "no-repeat",
									backgroundPosition: "right 1rem center",
									backgroundSize: "1.5em",
								}}
								value={selectedLoc}
								onChange={(e) => {
									setSelectedLoc(e.target.value);
									setSelectedUser("");
								}}
								required
							>
								<option value="" className="text-slate-900">
									Select Location...
								</option>
								{(setupData.locations || []).map((l) => (
									<option key={l} value={l} className="text-slate-900">
										{l}
									</option>
								))}
							</select>
						</div>

						<div>
							{/** biome-ignore lint/a11y/noLabelWithoutControl: false positive */}
							<label className="text-[10px] font-bold text-slate-800 uppercase ml-1">
								User
							</label>
							<select
								className="w-full p-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl text-white outline-none appearance-none shadow-lg disabled:opacity-50"
								style={{
									backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
									backgroundRepeat: "no-repeat",
									backgroundPosition: "right 1rem center",
									backgroundSize: "1.5em",
								}}
								value={selectedUser}
								onChange={(e) => setSelectedUser(e.target.value)}
								disabled={!selectedLoc}
								required
							>
								<option value="" className="text-slate-900">
									Select Staff...
								</option>
								{(setupData.users || [])
									.filter((u) => u.location === selectedLoc)
									.map((u, i) => (
										<option
											key={`${i}-${selectedLoc}-${u.username}`}
											value={u.username}
											className="text-slate-900"
										>
											{u.username}
										</option>
									))}
							</select>
						</div>

						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full p-4 bg-white/20 border border-white/30 rounded-2xl placeholder:text-white/70 text-white outline-none mb-4"
							required
						/>

						<button
							type="submit"
							disabled={loading || !selectedUser}
							className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
						>
							{loading ? "Processing..." : "Get OTP"}
						</button>
					</form>
				) : (
					/* STEP 2 FORM: OTP */
					<form
						onSubmit={handleVerifyOTP}
						className="space-y-6 animate-in fade-in zoom-in duration-300"
					>
						<div className="text-center">
							<p className="text-sm text-slate-100">
								Verification code sent to email associated with{" "}
								<b>{selectedUser}</b>
							</p>
						</div>

						<input
							type="text"
							maxLength="6"
							placeholder="000000"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							className="w-full p-5 bg-white/20 border border-white/30 rounded-2xl text-white text-center text-3xl font-black tracking-[0.5em] outline-none"
							required
							// biome-ignore lint/a11y/noAutofocus: false positive
							autoFocus
						/>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition shadow-lg"
						>
							{loading ? "Verifying..." : "Confirm & Login"}
						</button>

						<button
							type="button"
							onClick={() => setStep(1)}
							className="w-full text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white"
						>
							← Back to login
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default Login;
