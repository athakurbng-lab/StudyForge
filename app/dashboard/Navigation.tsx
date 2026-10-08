"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Anvil, Menu, X, Home, PlusCircle, Users } from 'lucide-react';
import { useState } from 'react';

export function Navigation({ userXp, userStreak, userName }: { userXp: number, userStreak: number, userName: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/sessions', label: 'Log Session', icon: PlusCircle },
    { href: '/groups', label: 'Groups', icon: Users },
  ];

  return (
    <>
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 text-xl font-syne font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                <Anvil className="w-6 h-6 text-indigo-400" />
                <span>StudyForge</span>
              </Link>
              
              {/* Desktop Nav */}
              <div className="hidden md:flex space-x-4">
                {links.map(link => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className={`transition-colors flex items-center gap-1.5 ${pathname === link.href ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-300 hidden sm:flex items-center gap-2">
                <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg">🔥 {userStreak}</span>
                <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-lg">⚡ {userXp} XP</span>
              </div>
              
              <div className="hidden sm:flex h-8 w-8 rounded-full bg-indigo-600 items-center justify-center text-sm font-bold text-white border-2 border-indigo-400 shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 text-slate-300 hover:text-white"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl absolute w-full">
            <div className="px-4 py-4 space-y-2">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5 sm:hidden">
                <span className="text-amber-500 font-bold">🔥 {userStreak} Day Streak</span>
                <span className="text-indigo-400 font-bold">⚡ {userXp} XP</span>
              </div>
              {links.map(link => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === link.href ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
