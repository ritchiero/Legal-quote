'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState, useEffect, useRef } from 'react';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const menuItems = [
    {
      href: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" >
          <g clipPath="url(#clip0_409_52885)">
            <path d="M10.4861 2.17812C10.2049 1.94062 9.79548 1.94062 9.51423 2.17812L1.26424 9.17812C0.94861 9.44688 0.91111 9.91875 1.17674 10.2344C1.44236 10.55 1.91736 10.5875 2.23299 10.3219L3.00173 9.67188V15.5C3.00173 16.8813 4.12049 18 5.50174 18H14.5017C15.883 18 17.0017 16.8813 17.0017 15.5V9.67188L17.7674 10.3219C18.083 10.5906 18.558 10.55 18.8236 10.2344C19.0892 9.91875 19.0517 9.44375 18.7361 9.17812L10.4861 2.17812ZM4.50173 15.5V8.4L10.0017 3.73438L15.5017 8.4V15.5C15.5017 16.0531 15.0549 16.5 14.5017 16.5H13.0017V11.75C13.0017 11.0594 12.4424 10.5 11.7517 10.5H8.25174C7.56111 10.5 7.00174 11.0594 7.00174 11.75V16.5H5.50174C4.94861 16.5 4.50173 16.0531 4.50173 15.5ZM8.50174 16.5V12H11.5017V16.5H8.50174Z" fill="currentColor" />
          </g>
          <defs>
            <clipPath id="clip0_409_52885">
              <rect width="18" height="16" fill="white" transform="translate(1 2)" />
            </clipPath>
          </defs>
        </svg>
      ),
      label: 'Inicio'
    },
    {
      href: '/cotizacion-express',
      icon: (
        <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_409_52891)">
            <path d="M1.5 14V2C1.5 1.725 1.725 1.5 2 1.5H7V4C7 4.55312 7.44688 5 8 5H10.5V14C10.5 14.275 10.275 14.5 10 14.5H2C1.725 14.5 1.5 14.275 1.5 14ZM2 0C0.896875 0 0 0.896875 0 2V14C0 15.1031 0.896875 16 2 16H10C11.1031 16 12 15.1031 12 14V4.82812C12 4.29688 11.7906 3.7875 11.4156 3.4125L8.58438 0.584375C8.20938 0.209375 7.70312 0 7.17188 0H2ZM6.75 8.75C6.75 8.33438 6.41563 8 6 8C5.58437 8 5.25 8.33438 5.25 8.75V12.75C5.25 13.1656 5.58437 13.5 6 13.5C6.41563 13.5 6.75 13.1656 6.75 12.75V8.75ZM9.5 9.75C9.5 9.33438 9.16562 9 8.75 9C8.33438 9 8 9.33438 8 9.75V12.75C8 13.1656 8.33438 13.5 8.75 13.5C9.16562 13.5 9.5 13.1656 9.5 12.75V9.75ZM4 10.75C4 10.3344 3.66563 10 3.25 10C2.83437 10 2.5 10.3344 2.5 10.75V12.75C2.5 13.1656 2.83437 13.5 3.25 13.5C3.66563 13.5 4 13.1656 4 12.75V10.75Z" fill="currentColor" />
          </g>
          <defs>
            <clipPath id="clip0_409_52891">
              <rect width="12" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
      label: 'Cotización Express',
    },
    {
      href: '/cotizacion-estructurada',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 0C0.896875 0 0 0.896875 0 2V14C0 15.1031 0.896875 16 2 16H14C15.1031 16 16 15.1031 16 14V2C16 0.896875 15.1031 0 14 0H2ZM1.5 2C1.5 1.725 1.725 1.5 2 1.5H14C14.275 1.5 14.5 1.725 14.5 2V4.5H1.5V2ZM1.5 6H14.5V9.5H1.5V6ZM1.5 11H14.5V14C14.5 14.275 14.275 14.5 14 14.5H2C1.725 14.5 1.5 14.275 1.5 14V11Z" fill="currentColor" />
        </svg>
      ),
      label: 'Cotización Estructurada',
    },
    {
      href: '/configuracion',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      label: 'Configuración',
    },
  ];

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="hidden md:block fixed left-0 top-0 h-screen w-16 bg-white border-r border-gray-200 z-40">
        <div className="h-full flex flex-col py-6">
          {/* Logo en la parte superior */}
          <div className="px-3 mb-6 flex justify-center">
            <Link href="/" className="block">
              <img
                src="/Lawgic-icon.svg"
                alt="Lawgic"
                className="w-6 h-6"
              />
            </Link>
          </div>

          {/* Navegación principal */}
          <nav className="flex-1">
            <ul className="space-y-4 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href} className="w-full">
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-center h-12 w-full rounded-xl transition-colors ${isActive ? 'bg-[#ECF1FD]' : 'hover:bg-gray-50'
                            }`}
                        >
                          <span className={`${isActive ? 'text-[#4570EB]' : 'text-[#67676F]'}`}>
                            {item.icon}
                            <span className="sr-only">{item.label}</span>
                          </span>
                        </Link>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="right"
                          sideOffset={8}
                          className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg z-50"
                        >
                          {item.label}
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Estilos Link (Bottom) */}
          <div className="px-3 mb-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Link
                  href="/estilos"
                  className={`flex items-center justify-center h-12 w-full rounded-xl transition-colors ${pathname === '/estilos' ? 'bg-[#ECF1FD] text-[#4570EB]' : 'text-[#67676F] hover:bg-gray-50'
                    }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21.36V21A5 5 0 0 1 17 16H18.79A5.4 5.4 0 0 0 23 12.18V8A7 7 0 0 0 10.15 4.38A6.88 6.88 0 0 0 8 4A7 7 0 0 0 1 11V14A7 7 0 0 0 8 21Z" />
                    <path d="M10 8V8.01" />
                    <path d="M14 8V8.01" />
                    <path d="M7 11V11.01" />
                    <path d="M17 11V11.01" />
                  </svg>
                  <span className="sr-only">Estilos</span>
                </Link>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg z-50"
                >
                  Estilos
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>

          {/* Avatar del usuario en la parte inferior con menú */}
          <div className="px-3 relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center justify-center h-12 w-full rounded-xl transition-colors ${pathname.startsWith('/settings') ? 'bg-[#ECF1FD]' : 'hover:bg-gray-50'
                }`}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200">
                <img
                  src={user?.photoURL || '/default-avatar-icon.png'}
                  alt={user?.displayName || 'Usuario'}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            {/* Menú dropdown */}
            {showMenu && (
              <div className="absolute left-full bottom-0 ml-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1">
                {/* Info del usuario */}
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Opciones */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push('/settings/profile');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuración
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
        </div>
      </div>
    </Tooltip.Provider>
  );
} 