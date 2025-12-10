import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Home, BarChart2, Video, BookOpen, User, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/evaluation', icon: Video, label: 'Evaluation' },
    { path: '/training', icon: BookOpen, label: 'Training' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl font-serif font-light tracking-tight text-primary">ORATO</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`sidebar-${item.label.toLowerCase()}-link`}
            >
              <div
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-4">
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          data-testid="sidebar-logout-btn"
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
};