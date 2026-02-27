'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from 'ai/react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { query, where, onSnapshot } from 'firebase/firestore';
import BrandingTab from '@/components/BrandingTab';
import PaymentTab from '@/components/PaymentTab';
import BillingTab from '@/components/BillingTab';
import { BillingData, BrandingData } from '../settings/profile/types';
import type { PaymentMethod } from '@/lib/types/payment';
import ServicesTab from '@/components/ServicesTab';
import ProfileTab from '@/components/ProfileTab';
import LegalSettingsTab from '@/components/LegalSettingsTab';
import { HomeIcon, DocumentTextIcon, CreditCardIcon, SparklesIcon, UserIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';

interface UserProfile {
  location?: string;
  bio?: string;
  tarifaHoraria?: number;
  tarifaHorariaMoneda?: 'MXN' | 'USD';
}

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Servicios');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState<any>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [isFacturacionModalOpen, setIsFacturacionModalOpen] = useState(false);

  // Estado para datos fiscales
  const [datosFiscales, setDatosFiscales] = useState<BillingData>({
    razonSocial: '',
    rfc: '',
    direccion: {
      calle: '',
      numeroExterior: '',
      numeroInterior: '',
      colonia: '',
      codigoPostal: '',
      municipio: '',
      estado: '',
      pais: 'MX',
    },
    email: '',
    telefono: ''
  });

  // Estado para datos de branding
  const [brandingData, setBrandingData] = useState<BrandingData>({
    nombreDespacho: '',
    slogan: '',
    anoFundacion: '',
    descripcion: '',
    colores: {
      primario: '#000000',
      secundario: '#666666',
      terciario: '#999999'
    },
    logoURL: ''
  });

  // Estado para nuevo servicio
  const [newService, setNewService] = useState({
    nombre: '',
    descripcion: '',
    detalles: '',
    tiempo: '',
    precio: '',
    incluye: ['']
  });

  // Agregar estos estados
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Inicializar el estado
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Agregar esta función para manejar la selección del método de pago
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const { complete, isLoading: isAILoading } = useCompletion({
    api: '/api/openai/chat',
    onResponse: () => { },
    onFinish: () => { },
    onError: (error) => {
      console.error('[AI Error Event]:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      setError(`Error: ${error.message}`);
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cargarServicios = async () => {
      if (!user?.uid) return;

      try {
        const serviciosRef = collection(db, 'servicios');
        const q = query(serviciosRef, where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const serviciosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setServicios(serviciosData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      }
    };

    cargarServicios();
  }, [user?.uid]);

  // Modificar el useEffect para cargar datos fiscales
  useEffect(() => {
    const cargarDatosFiscales = async () => {
      if (!user?.uid) return;

      try {
        const billingRef = doc(db, 'billing', user.uid);
        const unsubscribe = onSnapshot(billingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const billingData = docSnapshot.data();
            setDatosFiscales({
              razonSocial: billingData.razonSocial || '',
              rfc: billingData.rfc || '',
              direccion: {
                calle: billingData.direccion?.calle || '',
                numeroExterior: billingData.direccion?.numeroExterior || '',
                numeroInterior: billingData.direccion?.numeroInterior || '',
                colonia: billingData.direccion?.colonia || '',
                codigoPostal: billingData.direccion?.codigoPostal || '',
                municipio: billingData.direccion?.municipio || '',
                estado: billingData.direccion?.estado || '',
              },
              email: billingData.email || '',
              telefono: billingData.telefono || ''
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar datos fiscales:', error);
        toast.error('Error al cargar los datos fiscales');
      }
    };

    cargarDatosFiscales();
  }, [user?.uid]);

  // 1. Primero, asegurémonos de que el usuario existe al inicio
  useEffect(() => {
    const initializeUserDoc = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // Crear documento inicial si no existe
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error initializing user document:', error);
      }
    };

    initializeUserDoc();
  }, [user?.uid]);

  // Agregar este useEffect para cargar métodos de pago
  useEffect(() => {
    const cargarMetodosPago = async () => {
      if (!user?.uid) return;

      try {
        // Cambiar a la colección paymentInfo
        const paymentRef = doc(db, 'paymentInfo', user.uid);
        const unsubscribe = onSnapshot(paymentRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const paymentData = docSnapshot.data();
            if (paymentData.methods) {
              const methodsArray = Object.values(paymentData.methods) as PaymentMethod[];
              setPaymentMethods(methodsArray);
            } else {
              setPaymentMethods([]);
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
        toast.error('Error al cargar los métodos de pago');
      }
    };

    cargarMetodosPago();
  }, [user?.uid]);

  // Agregar este useEffect para cargar datos de brandingInfo
  useEffect(() => {
    const cargarDatosBranding = async () => {
      if (!user?.uid) return;

      try {
        const brandingRef = doc(db, 'brandingInfo', user.uid);
        const unsubscribe = onSnapshot(brandingRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const brandingInfo = docSnapshot.data();
            setBrandingData({
              nombreDespacho: brandingInfo.nombreDespacho || '',
              slogan: brandingInfo.slogan || '',
              anoFundacion: brandingInfo.anoFundacion || '',
              colores: {
                primario: brandingInfo.colores?.primario || '#000000',
                secundario: brandingInfo.colores?.secundario || '#666666',
                terciario: brandingInfo.colores?.terciario || '#999999',
              },
              descripcion: brandingInfo.descripcion || '',
              logoURL: brandingInfo.logoURL || ''
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar datos de branding:', error);
        toast.error('Error al cargar los datos de branding');
      }
    };

    cargarDatosBranding();
  }, [user?.uid]);

  // Agregar este useEffect para cargar el perfil del usuario
  useEffect(() => {
    const cargarPerfilUsuario = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const profileData = docSnapshot.data();
            setUserProfile({
              location: profileData.location,
              bio: profileData.bio
            });
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error al cargar perfil del usuario:', error);
        toast.error('Error al cargar el perfil');
      }
    };

    cargarPerfilUsuario();
  }, [user?.uid]);

  if (!mounted) return null;

  return (
    <div className="w-full mx-auto px-4 box-border max-w-full bg-[#F5F6F8] min-h-screen font-jakarta">
      <div className="md:hidden sticky top-16 z-10 bg-white border-b border-gray-200 py-3">
        <h1 className="text-lg font-semibold text-[#0E162F] text-center">Configurador de Cotizador con IA</h1>
      </div>
      <div className="flex flex-col items-center">
        <h1 className="hidden md:block text-[18px] font-bold text-[#0E162F] mb-2 text-center mt-8">Configurador de Cotizador con IA</h1>
        <p className="hidden md:block text-[16px] text-[#3B3D45] mb-3 text-center">Configura estas opciones para automatizar tus cotizaciones.</p>
        {/* Navegación con estilo Flat Tabs del sistema */}
        <div className="w-full flex justify-center mb-6">
          <nav className="flex border-b border-gray-100 overflow-x-auto mx-auto max-w-4xl bg-white px-4 rounded-t-2xl">
            {[
              { label: 'Perfil', Icon: UserIcon },
              { label: 'Servicios', Icon: HomeIcon },
              { label: 'Facturación', Icon: DocumentTextIcon },
              { label: 'Pago', Icon: CreditCardIcon },
              { label: 'Branding', Icon: SparklesIcon },
              { label: 'Configuración', Icon: Cog6ToothIcon },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => setSelectedTab(label)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                  ${selectedTab === label
                    ? 'text-[#3B82F6] border-[#3B82F6] font-semibold'
                    : 'text-[#6B7280] border-transparent hover:text-[#374151] hover:border-gray-200'}
                `}
              >
                <Icon className={`w-4 h-4 ${selectedTab === label ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {selectedTab === 'Perfil' ? (
            <ProfileTab
              userId={user?.uid || ''}
            />
          ) : selectedTab === 'Servicios' ? (
            <ServicesTab
              userId={user?.uid || ''}
              servicios={servicios}
              onServiciosUpdate={setServicios}
            />
          ) : selectedTab === 'Facturación' ? (
            <BillingTab
              userId={user?.uid || ''}
              billingData={datosFiscales}
              onBillingUpdate={setDatosFiscales}
            />
          ) : selectedTab === 'Pago' ? (
            <PaymentTab
              userId={user?.uid || ''}
              paymentMethods={paymentMethods}
              onPaymentUpdate={setPaymentMethods}
              onDefaultChange={() => { }}
            />
          ) : selectedTab === 'Branding' ? (
            <BrandingTab
              userId={user?.uid || ''}
              brandingData={brandingData}
              onBrandingUpdate={setBrandingData}
            />
          ) : selectedTab === 'Configuración' ? (
            <LegalSettingsTab />
          ) : (
            <div className="w-full text-center py-12">
              <h2 className="text-[18px] font-bold text-[#0E162F] mb-4">Sube tu primer proyecto</h2>
              <p className="text-[16px] text-[#3B3D45] mb-6">
                Muestra tu mejor trabajo. Recibe retroalimentación y sé parte de una comunidad en crecimiento.
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded-full font-medium hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto">
                <PlusIcon className="w-5 h-5" />
                Subir primer proyecto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
