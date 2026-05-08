import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border/40 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="text-xl sm:text-2xl font-serif font-light tracking-tight text-primary hover:text-primary/80 transition-colors">
              ORATO
            </span>
          </Link>

          {/* Desktop Nav - visible on sm and up */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-4">
            <Link to="/login">
              <Button
                data-testid="nav-login-btn"
                variant="ghost"
                className="text-foreground/80 hover:text-primary hover:bg-accent/20 transition-all"
              >
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button
                data-testid="nav-register-btn"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger - visible only on screens smaller than sm (640px) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden inline-flex items-center justify-center p-2 text-foreground hover:bg-accent/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu - slides down when open */}
        {isOpen && (
          <div className="sm:hidden border-t border-border/30 bg-background/50 px-2 py-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            <Link to="/login" onClick={() => setIsOpen(false)} className="block">
              <Button
                variant="ghost"
                className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-accent/20"
              >
                Login
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsOpen(false)} className="block">
              <Button
                className="w-full justify-start bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};