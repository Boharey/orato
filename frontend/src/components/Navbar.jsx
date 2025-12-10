import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export const Navbar = () => {
  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-serif font-light tracking-tight text-primary">ORATO</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button data-testid="nav-login-btn" variant="ghost" className="text-foreground hover:text-primary">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button data-testid="nav-register-btn" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};