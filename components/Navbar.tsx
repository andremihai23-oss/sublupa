'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Menu, X } from 'lucide-react';
import SearchModal from './SearchModal';

interface Props {
  logoUrl: string | null;
}

export default function Navbar({ logoUrl }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 rounded-2xl bg-navy-800/90 backdrop-blur-md border border-navy-700/50 shadow-xl">
            <div className="flex items-center justify-between h-16 px-5">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2 group">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="SubLupa"
                    width={120}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xl font-black tracking-tight text-white">
                    Sub<span className="text-accent-500">Lupa</span>
                  </span>
                )}
              </a>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-700/60 rounded-xl transition-all duration-200"
                  aria-label="Search articles"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <a
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-accent-500 rounded-xl transition-colors duration-200"
                >
                  Admin
                </a>
              </div>

              {/* Mobile nav */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-slate-300 hover:text-accent-500 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                  aria-label="Menu"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
              <div className="md:hidden border-t border-navy-700/50 px-5 py-3 animate-fade-in">
                <a
                  href="/admin"
                  className="block py-2 text-sm text-slate-400 hover:text-accent-500 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Admin Panel
                </a>
              </div>
            )}
          </div>
        </nav>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
