import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
			<div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl p-12 text-center">
				<div className="flex justify-center mb-6">
					<div className="p-6 bg-red-50 text-red-500 rounded-full animate-bounce">
						<AlertCircle size={64} strokeWidth={1.5} />
					</div>
				</div>

				<h1 className="text-6xl font-black text-slate-900 mb-2">404</h1>
				<p className="text-xl font-bold text-slate-600 mb-8">
					Oops! Page not found.
				</p>

				<p className="text-sm text-slate-400 mb-10 leading-relaxed">
					The page you are looking for might have been removed, had its name
					changed, or is temporarily unavailable.
				</p>

				<Link
					to="/"
					className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
				>
					<Home size={18} />
					Back to Dashboard
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
