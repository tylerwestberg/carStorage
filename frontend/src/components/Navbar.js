import { Link } from "react-router-dom";

export default function Navbar({ onLogout }) {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Car Storage</div>
      <div className="space-x-4">
        <Link
          to="/"
          className="inline-block no-underline bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          
        >
          Dashboard
        </Link>
        <Link
          to="/profile"
          className="inline-block no-underline bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        >
          Profile
        </Link>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
