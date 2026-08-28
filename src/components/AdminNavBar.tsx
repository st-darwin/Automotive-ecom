import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { adminSidebarItems } from '../Utils/Constant';
import { Menu, X, LogOut, Car } from 'lucide-react';
import { logoutUser } from '../appwrite/Auth';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/sign-in';
  };

  return (
    <>
      {/* Mobile Floating Header Bar */}
      <div className="lg:hidden sticky top-4 z-50 mx-4 flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-400 rounded-xl text-white shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">Kinchris Switch</span>
            <span className="text-xs font-medium text-blue-500 tracking-wide">Automotive Store</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Floating Dropdown Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-4 top-20 z-40 bg-white/95 backdrop-blur-md p-3 rounded-2xl space-y-1 shadow-lg border border-slate-100">
          {adminSidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.route}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-400 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 mt-1 border-t border-slate-100">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Floating Card Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-4 left-4 w-64 bg-white rounded-3xl shadow-sm border border-slate-100 z-30 overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-50">
          <div className="p-2 bg-blue-400 rounded-xl text-white shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">Kinchris Switch</span>
            <span className="text-xs font-medium text-blue-500 tracking-wide">Automotive Store</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminSidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.route}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-400 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;