import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { getUser, isLoggedIn, clearSession } from "../common/session";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();

  const handleLogout = () => {
    clearSession();
    // Hard redirect so all in-memory React state (user, loggedIn) is fully reset
    window.location.href = "/signup";
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-auto">
          <div className="bg-green-600 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
          <span className="font-bold text-lg tracking-tight">
            Seva<span className="text-green-600">Connect</span>
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex gap-8 text-gray-600 font-medium mx-auto">
          <Link to="/explore" className="link">Explore</Link>
          <Link to="/request-ngo" className="link">Request an NGO</Link>
          <Link to="/about" className="link">About Us</Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          {loggedIn ? (
            <>
              <Link
                to={user?.role === "Organisation" ? "/ngo-dashboard" : "/user-dashboard"}
                className="link hidden md:block"
              >
                Dashboard
              </Link>
              <div className="relative" onBlur={() => setTimeout(() => setMenuOpen(false), 150)}>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl pl-2 pr-3 py-1.5 transition-all cursor-pointer">
                  <Link
                    to={user?.role === "volunteer" ? `/user/${user?.id}` : `/organisation/${user?.id}`}
                    className="flex items-center gap-2 text-green-700 font-medium text-sm hover:opacity-80"
                  >
                    <div className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden md:block max-w-[100px] truncate select-none">{user?.name}</span>
                  </Link>
                  <button
                    onClick={() => setMenuOpen(v => !v)}
                    className="pl-2 border-l border-green-200 text-green-600 hover:text-green-800 flex items-center justify-center h-full outline-none"
                    aria-label="Open menu"
                  >
                    <i className="fi fi-rr-angle-small-down text-xs mt-0.5"></i>
                  </button>
                </div>
                {menuOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-lg w-48 py-2 z-50">
                    <button onMouseDown={() => navigate(user?.role === "Organisation" ? "/ngo-dashboard" : "/user-dashboard")} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                      <i className="fi fi-rr-dashboard mr-2"></i>Dashboard
                    </button>
                    <button onMouseDown={() => navigate(user?.role === "volunteer" ? `/user/${user?.id}` : `/organisation/${user?.id}`)} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                      <i className="fi fi-rr-user mr-2"></i>Profile
                    </button>
                    <button onMouseDown={() => navigate("/settings/edit-profile")} className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600">
                      <i className="fi fi-rr-settings mr-2"></i>Edit Profile
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button onMouseDown={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <i className="fi fi-rr-sign-out-alt mr-2"></i>Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="link hidden md:block">Login</Link>
              <Link to="/signup" className="btn-primary text-sm py-2.5 px-5">Join Us</Link>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  );
};

export default Navbar;
