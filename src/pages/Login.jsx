import { useState, useLayoutEffect } from "react";
import axios from "axios";

const Login = ({ setUser }) => {
    const [firstSetup, setFirstSetup] = useState(true);
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState({ locations: [], users: [] });
    const [selectedLoc, setSelectedLoc] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // 👁️ Password visibility state
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

    // Helper to handle the actual API call and state update
    const finalizeLogin = async (otpCode) => {
        setLoading(true);
        try {
            const { data: loginResponse } = await axios.post("/api/verifyotp", {
                username: selectedUser,
                password,
                otp: otpCode,
            });

            if (loginResponse.success) {
                localStorage.setItem("InventoryAppToken", loginResponse.token);
                localStorage.setItem("InventoryAppUser", JSON.stringify(loginResponse.user));
                
                // This triggers App.jsx to show the dashboard
                setUser(loginResponse.user);
            }
        } catch (err) {
            console.error("Verification error", err);
            alert("Verification error: Invalid OTP or session expired.");
        } finally {
            setLoading(false);
        }
    };
    
    // STEP 1: Validate Password and Send OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post("/api/login", {
                username: selectedUser,
                password,
                selectedLoc,
            });

            // Check if the server said we can skip OTP
            if (response.data.otpSkipped) {
                localStorage.setItem("InventoryAppToken", response.data.token);
                localStorage.setItem("InventoryAppUser", JSON.stringify(response.data.user));
                setUser(response.data.user); 
            } else {
                alert("OTP sent!");
                setStep(2); // Proceed to OTP screen
            }
        } catch (err) {
            alert("Login Failed: Check credentials");
            console.error("Login Failed", err);
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify OTP and Log In
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        await finalizeLogin(otp);
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
                <div className="flex justify-center items-end mb-6">
                    <img
                        src="/LOGO-K-DIP.png"
                        alt="Logo K-DIP"
                        className="h-30 w-auto object-contain"
                    />
                    <img
                        src="/K-DIP.png"
                        alt="Logo text K-DIP"
                        className="h-30 w-auto object-contain"
                    />
                </div>

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

                        {/* 👁️ PASSWORD FIELD WITH TOGGLE BUTTON */}
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 pr-12 bg-white/20 border border-white/30 rounded-2xl placeholder:text-white/70 text-white outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white focus:outline-none"
                                tabIndex="-1"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    /* Eye Off Icon */
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.498 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    /* Eye Icon */
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.074 4.061 4.52 7 8.964 7 4.444 0 7.89-2.939 8.964-7-1.074-4.061-4.52-7-8.964-7-4.444 0-7.89 2.939-8.964 7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>

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