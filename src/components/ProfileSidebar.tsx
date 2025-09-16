'use client';

import { User, ShoppingBag, Heart } from 'lucide-react';

interface SidebarLinkProps {
  tabKey: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarLink = ({  icon, label, isActive, onClick }: SidebarLinkProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function ProfileSidebar({ activeTab, setActiveTab }: ProfileSidebarProps) {
  const links = [
    { key: 'profile', icon: <User className="w-5 h-5" />, label: 'My Profile' },
    { key: 'orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'My Orders' },
    { key: 'wishlist', icon: <Heart className="w-5 h-5" />, label: 'Wishlist' },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="flex items-center space-x-3 p-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">My Account</p>
          <p className="text-sm text-gray-500">Manage your profile</p>
        </div>
      </div>
      
      <div className="flex-1 space-y-1">
        {links.map((link) => (
          <SidebarLink
            key={link.key}
            tabKey={link.key}
            icon={link.icon}
            label={link.label}
            isActive={activeTab === link.key}
            onClick={() => setActiveTab(link.key)}
          />
        ))}
      </div>
      
    </div>
  );
}
