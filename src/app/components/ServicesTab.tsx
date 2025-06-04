'use client';
import { useState, useEffect } from 'react';
import { useCompletion } from 'ai/react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc} from 'firebase/firestore';
import { query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import ServiceForm from './ServiceForm';
import { formatPrice } from '@/lib/hooks/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import CreateServiceModal from '@/components/modals/CreateServiceModal';
import RequirementsAIModal from "@/components/modals/RequirementsAIModal";

interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  detalles: string;
  tiempo: string;
  precio: string;
  incluye: string[];
  userId: string;
  userEmail: string;
  createdAt: any;
  updatedAt: any;
  status: string;
}

interface ServicesTabProps {
  userId: string;
  servicios: Service[];
  onServiciosUpdate: (servicios: Service[]) => void;
}

export default function ServicesTab({ userId, servicios, onServiciosUpdate }: ServicesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedService, setEditedService] = useState<Service | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [precioError, setPrecioError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  // Estado para nuevo servicio
  const [newService, setNewService] = useState({
    nombre: '',
    descripcion: '',
    detalles: '',
    tiempo: '',
    precio: '',
    incluye: [''],
    requerimientos: '',
    userId: '',
    userEmail: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active'
  });
  // Estado para el modal de requerimientos IA
  const [isRequirementsAIModalOpen, setIsRequirementsAIModalOpen] = useState(false);
  const [requirementsOptions, setRequirementsOptions] = useState<string[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'tiempo' | 'fecha'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const { complete, isLoading: isAILoading } = useCompletion({
    api: '/api/openai/chat',
    onResponse: () => {},
    onFinish: () => {},
    onError: (error) => {
      console.error('[AI Error Event]:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      setError(`Error: ${error.message}`);
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para filtrar y ordenar servicios
  const getFilteredAndSortedServices = () => {
    let filtered = servicios.filter(servicio => {
      // Filtro por búsqueda
      const matchesSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por rango de precio
      let matchesPrice = true;
      if (priceRange.min || priceRange.max) {
        const precio = parseFloat(servicio.precio.replace(/[^\d.]/g, ''));
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        matchesPrice = precio >= min && precio <= max;
      }
      
      return matchesSearch && matchesPrice;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'nombre':
          valueA = a.nombre.toLowerCase();
          valueB = b.nombre.toLowerCase();
          break;
        case 'precio':
          valueA = parseFloat(a.precio.replace(/[^\d.]/g, ''));
          valueB = parseFloat(b.precio.replace(/[^\d.]/g, ''));
          break;
        case 'tiempo':
          valueA = a.tiempo.toLowerCase();
          valueB = b.tiempo.toLowerCase();
          break;
        case 'fecha':
          valueA = a.createdAt?.seconds || 0;
          valueB = b.createdAt?.seconds || 0;
          break;
        default:
          valueA = a.nombre.toLowerCase();
          valueB = b.nombre.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    return filtered;
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setSortBy('nombre');
    setSortOrder('asc');
  };

  // Función para estandarizar servicios con IA
  const [isStandardizing, setIsStandardizing] = useState(false);
  
  const standardizeServices = async () => {
    if (!user?.uid) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      setIsStandardizing(true);
      toast.success('Iniciando estandarización de servicios...');

      for (const servicio of servicios) {
        try {
          const response = await fetch('/api/ai/standardize-service', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: servicio.nombre,
              descripcion: servicio.descripcion,
              detalles: servicio.detalles,
              tiempo: servicio.tiempo,
              precio: servicio.precio,
              incluye: servicio.incluye
            })
          });

          if (!response.ok) {
            console.error(`Error estandarizando servicio ${servicio.id}`);
            continue;
          }

          const standardizedData = await response.json();
          
          // Actualizar en Firestore
          const serviceRef = doc(db, 'servicios', servicio.id);
          await updateDoc(serviceRef, {
            nombre: standardizedData.nombre || servicio.nombre,
            descripcion: standardizedData.descripcion || servicio.descripcion,
            detalles: standardizedData.detalles || servicio.detalles,
            tiempo: standardizedData.tiempo || servicio.tiempo,
            incluye: standardizedData.incluye || servicio.incluye,
            updatedAt: serverTimestamp(),
          });

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error procesando servicio ${servicio.id}:`, error);
        }
      }

      toast.success('Servicios estandarizados exitosamente');
      
    } catch (error) {
      console.error('Error en estandarización:', error);
      toast.error('Error al estandarizar servicios');
    } finally {
      setIsStandardizing(false);
    }
  };

  const handleNewServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'precio') {
      setNewService(prev => ({
        ...prev,
        [name]: formatPrice(value)
      }));
      if (value.trim()) {
        setPrecioError(false);
      }
    } else {
      setNewService(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddIncludeItem = () => {
    setNewService(prev => ({
      ...prev,
      incluye: [...prev.incluye, '']
    }));
  };

  const handleIncludeItemChange = (index: number, value: string) => {
    setNewService(prev => ({
      ...prev,
      incluye: prev.incluye.map((item, i) => i === index ? value : item)
    }));
  };

  const handleRemoveIncludeItem = (index: number) => {
    setNewService(prev => ({
      ...prev,
      incluye: prev.incluye.filter((_, i) => i !== index)
    }));
  };

  const handleCreateService = async () => {
    try {
      setIsLoading(true);

      // Validar campos requeridos excepto precio
      if (!newService.nombre || !newService.descripcion || !newService.detalles || !newService.tiempo) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      if (!newService.precio) {
        setPrecioError(true);
        setIsLoading(false);
        return;
      }

      // Filtrar items vacíos de incluye
      const itemsIncluidos = newService.incluye.filter(item => item.trim() !== '');
      
      if (itemsIncluidos.length === 0) {
        throw new Error('Debes incluir al menos un elemento en la lista de incluidos');
      }

      if (!user || !user.uid) {
        // Si no hay usuario o no tiene `uid`, no permitas continuar con la acción
        console.error("Usuario no autenticado o sin uid");
        return;
      }

      // Crear objeto del servicio
      const servicioData = {
        ...newService,
        incluye: itemsIncluidos,
        userId: user?.uid,
        userEmail: user?.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };

      // Guardar en Firestore
      const serviciosRef = collection(db, 'servicios');
      await addDoc(serviciosRef, servicioData);

      // Limpiar el formulario
      setNewService({
        nombre: '',
        descripcion: '',
        detalles: '',
        tiempo: '',
        precio: '',
        incluye: [''],
        requerimientos: '',
        userId: '',
        userEmail: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });
      setPrecioError(false);

      // Cerrar modal
      setIsCreateModalOpen(false);

      // Mostrar mensaje de éxito
      toast.success('El servicio ha sido agregado al catálogo exitosamente');

    } catch (error: any) {
      console.error('Error al crear servicio:', error);
      toast.error(error.message || 'Hubo un error al crear el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIServiceCreate = async () => {
    if (!aiPrompt.trim()) {
      setError('Por favor, describe el servicio que deseas crear');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el servicio');
      }

      if (!user?.uid || !user?.email) {
        throw new Error('El usuario no está autenticado');
      }

      const data = await response.json();
      if (data) {
        setNewService({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          detalles: data.detalles || '',
          tiempo: data.tiempo || '',
          precio: '',
          incluye: Array.isArray(data.incluye) ? data.incluye : [],
          requerimientos: '',
          userId: user?.uid || '', 
          userEmail: user?.email || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        });

        setIsAIModalOpen(false);
        setIsCreateModalOpen(true);
        setAiPrompt('');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Error al generar el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  // Agregar la función para eliminar servicio
  const handleDeleteService = async (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    
    try {
      const isConfirmed = window.confirm('¿Estás seguro de que deseas eliminar este servicio?');
      
      if (isConfirmed) {
        const serviceRef = doc(db, 'servicios', serviceId);
        await deleteDoc(serviceRef);
        toast.success('Servicio eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  // Agregar estas funciones para manejar los items en modo edición
  const handleEditIncludeItemChange = (index: number, value: string) => {
    setEditedService(prev => {
      if (prev === null) {
        return null;
      }
  
      return {
        ...prev,
        incluye: prev.incluye?.map((item, i) => i === index ? value : item) || ['']
      };
    });
  };

  const handleAddEditIncludeItem = () => {
    setEditedService(prev => {
      if (prev === null) {
        return null;  // Si el estado es null, no hacemos nada y retornamos null
      }
  
      return {
        ...prev,
        incluye: [...(prev.incluye || []), '']
      };
    });
  };

  const handleRemoveEditIncludeItem = (index: number) => {
    setEditedService(prev => {
      if (prev === null) {
        return null;  // Si el estado es null, no hacemos nada y retornamos null
      }
  
      return {
        ...prev,
        incluye: (prev.incluye || []).filter((_, i) => i !== index)
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    // Si el campo es 'precio', formateamos el valor antes de actualizar
    if (name === 'precio') {
      setEditedService(prev => {
        if (prev === null) return null; // Evitamos errores si el servicio es null
  
        return {
          ...prev,
          [name]: formatPrice(value), // Formateamos el precio
        };
      });
    } else {
      setEditedService(prev => {
        if (prev === null) return null; // Evitamos errores si el servicio es null
  
        return {
          ...prev,
          [name]: value, // Actualizamos el campo correspondiente
        };
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsLoading(true);

      // Validar campos requeridos
      if (!editedService?.nombre || !editedService?.descripcion || !editedService?.detalles || !editedService?.tiempo || !editedService?.precio) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Filtrar items vacíos de incluye
      const itemsIncluidos = editedService?.incluye.filter(item => item.trim() !== '') || [];

      if (itemsIncluidos.length === 0) {
        throw new Error('Debes incluir al menos un elemento en la lista de incluidos');
      }

      if (!user || !user.uid) {
        console.error("Usuario no autenticado o sin uid");
        return;
      }

      // Crear objeto del servicio con los datos actualizados
      const servicioData = {
        ...editedService,
        incluye: itemsIncluidos,
        userId: user?.uid,
        userEmail: user?.email,
        updatedAt: serverTimestamp(),
      };

      // Guardar en Firestore
      const serviceRef = doc(db, 'servicios', editedService.id);
      await updateDoc(serviceRef, servicioData);
      // Actualizar el servicio seleccionado para que se vean los cambios en el modal de detalles
      setSelectedService({
        ...servicioData,
        id: editedService.id,
        userEmail: servicioData.userEmail || '' // Aseguramos que userEmail nunca sea null
      });

      // Cerrar modal de edición
      setIsEditModalOpen(false);
      setIsEditing(false);

      // Mostrar mensaje de éxito
      toast.success('Servicio actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar servicio:', error);
      toast.error(error.message || 'Hubo un error al actualizar el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (service: Service) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    setEditedService(service);
    setIsEditing(true);
    setIsEditModalOpen(true); // Usar el nuevo estado para el modal de edición
  };
  
  const handleServiceClick = (service: Service) => {
    setSelectedService(service); // Establece el servicio seleccionado en el estado
    setIsModalOpen(true); // Abre un modal para mostrar los detalles del servicio
  };

  const handleSolicitarServicio = (service: Service) => {
    // Codificar los datos del servicio para pasarlos en la URL de forma segura
    const serviceData = encodeURIComponent(JSON.stringify({
      descripcion: service.descripcion,
      tiempo: service.tiempo,
      precio: service.precio,
      nombre: service.nombre,
      detalles: service.detalles,
      incluye: service.incluye
    }));

    // Navegar a cotización-express con los datos
    router.push(`/cotizacion-express?service=${serviceData}`);
  };

  // Ejemplo de función para abrir el modal y cargar sugerencias
  const openRequirementsAIModal = async () => {
    setIsRequirementsAIModalOpen(true);
    setRequirementsLoading(true);
    // Aquí deberías llamar a tu API para obtener sugerencias
    // Por ejemplo:
    // const res = await fetch('/api/cotizacion/requerimientos', { ... });
    // const data = await res.json();
    // setRequirementsOptions(data.options);
    // Simulación:
    setTimeout(() => {
      setRequirementsOptions([
        "Documentación legal de la empresa o producto que se desea proteger.",
        "Análisis de viabilidad y originalidad de la marca a registrar.",
        "Pago de las tarifas correspondientes al registro de la marca en la jurisdicción deseada."
      ]);
      setRequirementsLoading(false);
    }, 500);
  };

  return (
    <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header del Tab */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 pt-4 pb-2 border-b border-gray-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Catálogo de Servicios Legales</h2>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona los servicios que ofreces a tus clientes
              </p>
            </div>
            <div className="flex justify-end">
              {/* Botón móvil */}
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="md:hidden flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary"
              >
                <SparklesIcon className="h-4 w-4" />
                Crear con IA
              </button>
              {/* Botones desktop */}
              <div className="hidden md:grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </button>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Crear con IA
                </button>
                <button
                  onClick={standardizeServices}
                  disabled={isStandardizing || servicios.length === 0}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-purple-600 text-purple-600 text-sm font-medium hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStandardizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                      Estandarizando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Estandarizar IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Servicios */}
        <div className="p-4 md:p-8">
          {servicios.length > 0 ? (
            <>
              {/* Barra de búsqueda y controles */}
              <div className="space-y-4 mb-6">
                {/* Fila superior: Búsqueda y controles principales */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* Barra de búsqueda */}
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar servicios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Controles de ordenamiento y vista */}
                  <div className="flex items-center gap-2">
                    {/* Ordenamiento */}
                    <div className="flex items-center gap-1">
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field as 'nombre' | 'precio' | 'tiempo' | 'fecha');
                          setSortOrder(order as 'asc' | 'desc');
                        }}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nombre-asc">Nombre A-Z</option>
                        <option value="nombre-desc">Nombre Z-A</option>
                        <option value="precio-asc">Precio menor</option>
                        <option value="precio-desc">Precio mayor</option>
                        <option value="fecha-desc">Más reciente</option>
                        <option value="fecha-asc">Más antiguo</option>
                      </select>
                    </div>

                    {/* Botón de filtros */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Filtros"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-300"></div>

                    {/* Toggle de vista */}
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Vista en cuadrícula"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Vista en lista"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Panel de filtros expandible */}
                {showFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                      {/* Filtro de precio */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rango de precio
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Mín"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            placeholder="Máx"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Botón limpiar filtros */}
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                )}

                {/* Contador de resultados */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    {getFilteredAndSortedServices().length} de {servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}
                    {searchTerm && (
                      <span> • Búsqueda: <strong>"{searchTerm}"</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vista en cuadrícula mejorada */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {getFilteredAndSortedServices().map((servicio) => (
                    <div
                      key={servicio.id}
                      onClick={() => handleServiceClick(servicio)}
                      className="group relative bg-background-card rounded-2xl border border-border p-5 shadow transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Botón de eliminar */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => handleDeleteService(servicio.id, e)}
                          className="p-2 rounded-full bg-white shadow border border-border text-text-secondary hover:text-accent hover:border-accent"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Título del servicio */}
                        <h3 className="text-base font-semibold text-text-main group-hover:text-primary transition-colors line-clamp-2 font-jakarta">
                          {servicio.nombre}
                        </h3>
                        {/* Descripción */}
                        <details className="text-xs text-text-secondary font-jakarta">
                          <summary className="cursor-pointer line-clamp-3">
                            {servicio.descripcion}
                          </summary>
                          <p className="mt-1">{servicio.descripcion}</p>
                        </details>
                        {/* Precio y tiempo */}
                        <div className="pt-3 border-t border-border">
                          <div className="flex flex-col gap-2">
                            {/* Precio */}
                            <span className="text-base font-bold text-primary font-jakarta">
                              {formatPrice(servicio.precio)}
                            </span>
                            {/* Tiempo de entrega */}
                            <div className="flex items-center text-xs text-text-secondary font-jakarta">
                              <svg className="w-4 h-4 mr-1 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate">
                                {servicio.tiempo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vista en lista compacta */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {getFilteredAndSortedServices().map((servicio) => (
                    <div
                      key={servicio.id}
                      onClick={() => handleServiceClick(servicio)}
                      className="group relative bg-background-card rounded-xl border border-border p-4 shadow transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate font-jakarta">
                                {servicio.nombre}
                              </h3>
                              <p className="text-xs text-text-secondary font-jakarta line-clamp-2 mt-1">
                                {servicio.descripcion}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{servicio.tiempo}</span>
                              </div>
                              <span className="text-sm font-bold text-primary">
                                {formatPrice(servicio.precio)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de eliminar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button
                            onClick={(e) => handleDeleteService(servicio.id, e)}
                            className="p-1.5 rounded-full bg-white shadow border border-border text-text-secondary hover:text-accent hover:border-accent"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Estado cuando no hay resultados de búsqueda/filtros */}
              {getFilteredAndSortedServices().length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    No se encontraron servicios
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || priceRange.min || priceRange.max 
                      ? 'No hay servicios que coincidan con los filtros aplicados.' 
                      : 'No hay servicios para mostrar.'}
                  </p>
                  {(searchTerm || priceRange.min || priceRange.max) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            // Empty state para cuando no hay servicios
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No hay servicios configurados
              </h3>
              <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                Comienza agregando los servicios legales que ofreces a tus clientes
              </p>
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 md:gap-4 w-full">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 w-full md:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar servicio
                </button>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 w-full md:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Crear con IA
                </button>
              </div>
            </div>
      )}
      </div>
    </div>
    {/* Botón flotante para nuevo servicio */}
    <button
      onClick={() => setIsCreateModalOpen(true)}
      aria-label="Crear nuevo servicio"
      className="md:hidden fixed bottom-4 right-4 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg bg-primary text-white transition-transform duration-150 active:scale-95 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <PlusIcon className="h-5 w-5" />
      <span className="sr-only sm:not-sr-only">Servicio</span>
    </button>
    </div>

      {/* Modales */}
      {/* Modal de Detalles del Servicio */}
      {isModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header del Modal */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedService.nombre}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={handleEditClick(selectedService)}
                      className="text-gray-400 hover:text-blue-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isEditing ? (
                      <input
                        type="text"
                        name="tiempo"
                        value={editedService?.tiempo || ''}  
                        onChange={handleInputChange}
                        className="px-2 py-1 border rounded-lg text-gray-900"
                        placeholder="ej: 2-3 semanas"
                      />
                    ) : (
                      <span>{selectedService.tiempo}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isEditing ? (
                      <input
                        type="text"
                        name="precio"
                        value={editedService?.precio || ''}
                        onChange={handleInputChange}
                        className="px-2 py-1 border rounded-lg text-gray-900"
                        placeholder="$0.00"
                      />
                    ) : (
                      <span>{selectedService.precio}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Incluye</h4>
                  {isEditing ? (
                    <div className="space-y-2">
                      {editedService?.incluye.map((item: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleEditIncludeItemChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                            placeholder="ej: Redacción del contrato"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEditIncludeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddEditIncludeItem}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Agregar ítem
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {selectedService.incluye.map((item: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Footer del Modal */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsModalOpen(false); // Primero cerramos el modal
                      handleSolicitarServicio(selectedService); // Luego redirigimos
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Solicitar Servicio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Servicio */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Crear Nuevo Servicio
                  </h3>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulario para crear */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={newService.nombre}
                    onChange={handleNewServiceChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="ej: Constitución de Sociedades"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Corta
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={newService.descripcion}
                    onChange={handleNewServiceChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Breve descripción del servicio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Detallada
                  </label>
                  <textarea
                    name="detalles"
                    value={newService.detalles}
                    onChange={handleNewServiceChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Descripción completa del servicio..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo Estimado
                    </label>
                    <input
                      type="text"
                      name="tiempo"
                      value={newService.tiempo}
                      onChange={handleNewServiceChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="ej: 2-3 semanas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Base
                    </label>
                    <input
                      type="text"
                      name="precio"
                      value={newService.precio}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        handleNewServiceChange({
                          target: {
                            name: 'precio',
                            value: formatPrice(value)
                          }
                        } as React.ChangeEvent<HTMLInputElement>);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${precioError ? 'border-red-500' : ''}`}
                      placeholder="$0.00"
                    />
                    {precioError && (
                      <p className="mt-1 text-sm text-red-600">Este campo es obligatorio.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incluye
                  </label>
                  <div className="space-y-2">
                    {newService.incluye.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleIncludeItemChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="ej: Acta constitutiva"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveIncludeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddIncludeItem}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Agregar ítem
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewService({
                      nombre: '',
                      descripcion: '',
                      detalles: '',
                      tiempo: '',
                      precio: '',
                      incluye: [''],
                      requerimientos: '',
                      userId: '',
                      userEmail: '',
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      status: 'active'
                    });
                    setPrecioError(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateService}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Crear Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Servicio */}
      {isEditModalOpen && editedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Editar Servicio
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsEditing(false);
                    setEditedService(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulario de edición */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={editedService.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="ej: Constitución de Sociedades"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Corta
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={editedService.descripcion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Breve descripción del servicio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Detallada
                  </label>
                  <textarea
                    name="detalles"
                    value={editedService.detalles}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Descripción completa del servicio..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo Estimado
                    </label>
                    <input
                      type="text"
                      name="tiempo"
                      value={editedService.tiempo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="ej: 2-3 semanas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Base
                    </label>
                    <input
                      type="text"
                      name="precio"
                      value={editedService.precio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="$0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incluye
                  </label>
                  <div className="space-y-2">
                    {editedService.incluye.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleEditIncludeItemChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="ej: Acta constitutiva"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditIncludeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddEditIncludeItem}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Agregar ítem
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsEditing(false);
                    setEditedService(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Servicio con IA */}
      <CreateServiceModal
        isOpen={isAIModalOpen}
        aiPrompt={aiPrompt}
        onPromptChange={(val) => {
          setAiPrompt(val);
          setError(null);
        }}
        loading={isLoading}
        error={error}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIServiceCreate}
      />

      {/* Modal de Requerimientos IA */}
      <RequirementsAIModal
        isOpen={isRequirementsAIModalOpen}
        loading={requirementsLoading}
        options={requirementsOptions}
        onClose={() => setIsRequirementsAIModalOpen(false)}
        onSelect={(opts) => {
          setSelectedRequirements(opts);
          setNewService(prev => ({
            ...prev,
            requerimientos: opts.map(r => `- ${r}`).join('\n')
          }));
        }}
      />
    </div>
  );
} 