'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import Link from 'next/link';
import {
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    PlusIcon,
    ArrowRightIcon,
    ClockIcon,
    UserIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';

interface Quotation {
    id: string;
    clientName: string;
    folio: string;
    createdAt: any;
    status: string;
    quotationType: string;
    descripcion?: string;
    formDataSnapshot?: {
        quotationName?: string;
        client?: string;
    };
}

export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loadingQuotations, setLoadingQuotations] = useState(true);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setDisplayName(data.displayName || data.nombre || user.displayName || '');
            } else { setDisplayName(user.displayName || ''); }
        });
        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'quotations'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation));
            setQuotations(docs);
            setLoadingQuotations(false);
        }, (error) => {
            console.error('Error fetching quotations:', error);
            setLoadingQuotations(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos d\u00edas';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            generated: 'bg-green-50 text-green-700 border-green-200',
            draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            sent: 'bg-blue-50 text-blue-700 border-blue-200',
        };
        const labels: Record<string, string> = {
            generated: 'Generada',
            draft: 'Borrador',
            sent: 'Enviada',
        };
        const badgeStyle = styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
        return (
            <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border " + badgeStyle}>
                {labels[status] || status}
            </span>
        );
    };

    if (!mounted) return null;

    const firstName = displayName ? displayName.split(' ')[0] : '';

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0E162F]">
                    {getGreeting()}{firstName ? ', ' + firstName : ''}
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">Panel de cotizaciones legales con IA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link href="/cotizacion-express" className="group">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><BoltIcon className="w-6 h-6 text-blue-600" /></div>
                            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#0E162F] mb-1">Cotizaci\u00f3n Express</h3>
                        <p className="text-sm text-[#6B7280]">Genera una cotizaci\u00f3n r\u00e1pida con IA. Ideal para propuestas iniciales en minutos.</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">R\u00e1pida</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">Con IA</span>
                        </div>
                    </div>
                </Link>

                <Link href="/cotizacion-estructurada" className="group">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><ClipboardDocumentListIcon className="w-6 h-6 text-indigo-600" /></div>
                            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#0E162F] mb-1">Cotizaci\u00f3n Estructurada</h3>
                        <p className="text-sm text-[#6B7280]">Wizard paso a paso para cotizaciones detalladas y formales.</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">Detallada</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">Profesional</span>
                        </div>
                    </div>
                </Link>
            </div>

            <Link href="/configuracion" className="group">
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all duration-200 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><Cog6ToothIcon className="w-5 h-5 text-gray-500" /></div>
                        <div>
                            <p className="text-sm font-medium text-[#0E162F]">Configurador de Cotizador</p>
                            <p className="text-xs text-[#6B7280]">Perfil, servicios, facturaci\u00f3n, pagos y branding</p>
                        </div>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
            </Link>

            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-[#0E162F]" />
                        <h2 className="text-base font-semibold text-[#0E162F]">Cotizaciones recientes</h2>
                    </div>
                </div>

                {loadingQuotations ? (
                    <div className="px-6 py-12 text-center"><div className="animate-pulse flex flex-col items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-200"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div></div>
                ) : quotations.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4"><DocumentTextIcon className="w-8 h-8 text-gray-300" /></div>
                        <h3 className="text-base font-medium text-[#0E162F] mb-1">Sin cotizaciones a\u00fan</h3>
                        <p className="text-sm text-[#6B7280] mb-4">Crea tu primera cotizaci\u00f3n con IA y aparecer\u00e1 aqu\u00ed.</p>
                        <Link href="/cotizacion-express" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white text-sm font-medium rounded-xl hover:bg-[#2563EB] transition-colors"><BoltIcon className="w-4 h-4" />Crear primera cotizaci\u00f3n</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {quotations.map((q) => (
                            <div key={q.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-sm font-semibold text-[#0E162F] truncate">{q.formDataSnapshot?.quotationName || q.clientName || 'Sin nombre'}</h3>
                                            {getStatusBadge(q.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                                            {q.clientName && (<span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" />{q.clientName}</span>)}
                                            {q.folio && (<span className="font-mono">{q.folio}</span>)}
                                            {q.createdAt && (<span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{formatDate(q.createdAt)}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}