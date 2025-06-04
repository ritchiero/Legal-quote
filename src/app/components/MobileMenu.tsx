'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon, HomeIcon, DocumentTextIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);
  const menuItems = [
    { href: '/', label: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
    { href: '/cotizacion-express', label: 'Cotización Express', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { href: '/settings/edit', label: 'Editar Perfil', icon: <Cog6ToothIcon className="h-5 w-5" /> },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 text-gray-700">
          <Bars3Icon className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-4 w-[80vw] max-w-[320px]">
        <nav>
          <ul className="space-y-4">
            {menuItems.map(item => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center space-x-2 text-lg" onClick={() => setOpen(false)}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
