'use client';

import { useState } from 'react';
import { Wallet, Bell, Shield, HelpCircle, LogOut, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const [isConnected, setIsConnected] = useState(false);

  const menuItems = [
    { icon: Wallet, label: 'Wallet', description: 'Connect your wallet', href: '#wallet' },
    { icon: Star, label: 'Favorites', description: '0 KOLs saved', href: '#favorites' },
    { icon: Bell, label: 'Notifications', description: 'Manage alerts', href: '#notifications' },
    { icon: Shield, label: 'Privacy', description: 'Your data settings', href: '#privacy' },
    { icon: HelpCircle, label: 'Help & Support', description: 'FAQ and contact', href: '/faq' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Image src="/logo.png" alt="XSCAN" width={48} height={48} />
          </div>

          {isConnected ? (
            <>
              <h1 className="text-xl font-bold mb-1">Connected</h1>
              <p className="text-sm text-muted-foreground">
                0x1234...5678
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-1">Welcome to XSCAN</h1>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to unlock features
              </p>
            </>
          )}
        </div>

        {/* Connect Wallet Button */}
        {!isConnected && (
          <button
            onClick={() => setIsConnected(true)}
            className="mobile-button mobile-button-primary w-full mb-6"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </button>
        )}

        {/* Stats Cards */}
        <div className="mobile-stats-grid mb-6">
          <div className="mobile-stat-card">
            <p className="mobile-stat-label">Following</p>
            <p className="mobile-stat-value">0</p>
          </div>
          <div className="mobile-stat-card">
            <p className="mobile-stat-label">Alerts</p>
            <p className="mobile-stat-value">0</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="mobile-card">
          {menuItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className="mobile-list-item mobile-card-pressable"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mr-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </a>
          ))}
        </div>

        {/* Logout Button */}
        {isConnected && (
          <button
            onClick={() => setIsConnected(false)}
            className="mobile-button mobile-button-secondary w-full mt-6"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Disconnect
          </button>
        )}

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          XSCAN v1.0.0
        </p>
      </div>
    </div>
  );
}
