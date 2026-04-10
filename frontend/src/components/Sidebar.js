import { NavLink } from 'react-router-dom';
import { Home, Calendar, AlertCircle, Wallet, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ user, onLogout, isOpen, setIsOpen }) {
  const navItems = [
    { to: '/home', icon: Home, label: 'HOME', badge: null },
    { to: '/eod-request', icon: Calendar, label: 'EOD Request', badge: null },
    { to: '/missing-eod', icon: AlertCircle, label: 'Missing EOD', badge: null },
    { to: '/wallet', icon: Wallet, label: 'Wallet', badge: null },
  ];

  return (
    <>
      <div className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-indigo-600 to-indigo-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo/Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            {isOpen && (
              <div>
                <h2 className="font-bold text-lg">UIDAI</h2>
                <p className="text-xs text-indigo-200">Staff Portal</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hover:bg-indigo-700 p-1 rounded transition-colors"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* User Info */}
        {isOpen && (
          <div className="px-6 py-4 bg-indigo-700/50 mb-2">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-sm text-indigo-200 truncate">ID: {user?.staff_id}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`
              }
              title={!isOpen ? item.label : ''}
            >
              <item.icon className={`${isOpen ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
              {isOpen && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-red-500/20 hover:bg-red-500 text-white transition-all"
            title={!isOpen ? 'Logout' : ''}
          >
            <LogOut className={`${isOpen ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
