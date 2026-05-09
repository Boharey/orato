import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Home, BarChart2, Video, BookOpen, User, LogOut, Menu, X, ClipboardList } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => setIsOpen(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/evaluation', icon: Video, label: 'Evaluation' },
    { path: '/training', icon: BookOpen, label: 'Training' },
    { path: '/scenarios', icon: ClipboardList, label: 'Scenarios' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border
          flex flex-col shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={closeSidebar}>
            <span className="text-2xl font-serif font-light tracking-tight text-primary hover:text-primary/80 transition-colors">
              ORATO
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                data-testid={`sidebar-${item.label.toLowerCase()}-link`}
              >
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border/50 space-y-3 bg-background/50">
          {/* User Info */}
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>

          {/* Logout Button */}
          <Button
            data-testid="sidebar-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
};