import React from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto" data-testid="profile-page">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 space-y-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-medium" data-testid="profile-name">{user?.name}</h2>
              <p className="text-muted-foreground" data-testid="profile-email">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-border pt-8 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium" data-testid="profile-created-at">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};