import React from 'react';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
  logoutAction?: string | ((formData: FormData) => void);
}

export function Header({ logoutAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between">
      {/* Mobile Branding */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl leading-none">E</span>
        </div>
      </div>

      <div className="flex-1 flex justify-center md:justify-start">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent">
          <span className="text-sm font-medium text-slate-800">System Management</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {logoutAction ? (
          <form action={logoutAction}>
            <button 
              type="submit"
              className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        ) : (
          <form>
            <button 
              type="submit"
              className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
