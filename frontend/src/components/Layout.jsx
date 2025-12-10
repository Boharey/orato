import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};