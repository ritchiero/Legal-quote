'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Modal from './Modal';
import SignInModal from '@/components/SignInModal';

export default function AuthButton() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  const handleUserSettings = () => {
    router.push('/settings/profile');
    setShowMenu(false);
  };

  return (
    <>
      {user ? (
        <div className="relative" ref={menuRef}>
          <button 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
            onClick={() => setShowMenu(!showMenu)}
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <Image
              src={user.photoURL || '/default-avatar-icon.png'}
              alt={user.displayName || 'Usuario'}
              width={40}
              height={40}
              className="object-cover"
            />
          </button>

          {showMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
            >
              {/* Info del usuario */}
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
              </div>

              {/* Opciones del menú */}
              <div className="py-1">
                <button
                  onClick={() => {
                    signOut();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={() => setIsSignInOpen(true)}
        >
          Sign in
        </button>
      )}

      {isSignInOpen && mounted && (
        <Modal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)}>
          <SignInModal onClose={() => setIsSignInOpen(false)} />
        </Modal>
      )}
    </>
  );
} 