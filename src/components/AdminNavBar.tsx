import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { adminSidebarItems } from '../Utils/Constant';
import { Menu, X, PlusCircle , LogOut, Car, LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings } from 'lucide-react';
import { logoutUser } from '../appwrite/Auth';

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'dashboard':
      return <LayoutDashboard className="w-4 h-4" />;
    case 'package':
      return <Package className="w-4 h-4" />;
    case 'shopping-cart':
      return <ShoppingCart className="w-4 h-4" />;
    case 'users':
      return <Users className="w-4 h-4" />;
    case 'chart':
      return <BarChart3 className="w-4 h-4" />;
    case 'settings':
      return <Settings className="w-4 h-4" />;
    case 'plus-circle': // Add this case for your manual entries item
      return <PlusCircle className="w-4 h-4" />;
    default:
      return <Car className="w-4 h-4" />;
  }
};

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/sign-in';
  };

  return (
    <>
      {/* Mobile Floating Header Bar */}
      <div className="lg:hidden sticky top-4 z-50 mx-4 flex items-center justify-between bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-400 rounded-xl text-white shadow-sm shadow-blue-400/30">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-none">Kinchris Switch</span>
            <span className="text-[11px] font-medium text-blue-500 tracking-wide mt-1 block">Automotive Store</span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 focus:outline-none transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Floating Dropdown Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-4 top-20 z-40 bg-white/95 backdrop-blur-2xl p-3 rounded-2xl space-y-1 shadow-xl shadow-slate-200/50 border border-slate-100">
          {adminSidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.route}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-400 text-white shadow-sm shadow-blue-400/30'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {getIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <div className="pt-2 mt-1 border-t border-slate-100">
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Floating Card Sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-4 left-4 w-64 bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100 z-30 overflow-hidden transition-all duration-300">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-100/80">
          <div className="p-2.5 bg-blue-400 rounded-2xl text-white shadow-sm shadow-blue-400/30">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">Kinchris Switch</span>
            <span className="text-[11px] font-medium text-blue-500 tracking-wide block mt-0.5">Automotive Store</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {adminSidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.route}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold tracking-tight transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-400 text-white shadow-md shadow-blue-400/25 scale-[1.01]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-2 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-50/80 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                  }`}>
                    {getIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-3 border-t border-slate-100/80 bg-slate-50/20">
          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300"
          >
            <span className="p-2 rounded-xl bg-rose-50 text-rose-400 group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;