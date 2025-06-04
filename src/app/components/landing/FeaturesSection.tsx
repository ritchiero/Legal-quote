import { Sparkles, Settings2, BarChart3 } from "lucide-react"

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-32 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-12 text-center">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Características Principales</h2>
            <p className="text-xl text-gray-600">
              Descubre cómo Legal AI Quote revoluciona el proceso de cotización legal
            </p>
          </div>
          <div className="grid gap-12 lg:grid-cols-3 w-full max-w-6xl">
            {[
              {
                icon: Sparkles,
                title: "Genera catálogo de servicios con IA",
                description: "Genera nuevos servicios en 1 minuto con nuestra tecnología de IA avanzada",
              },
              {
                icon: Settings2,
                title: "Personaliza y predefine valores",
                description: "Configura tus preferencias y valores predeterminados para cotizaciones más rápidas",
              },
              {
                icon: BarChart3,
                title: "Mercado IA",
                description: "¿No sabes cuánto cobrar? Mercado IA te da consideraciones importantes para tu cobro",
              },
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-300" />
                <div className="relative flex flex-col items-center space-y-4 p-8">
                  <div className="p-4 bg-blue-600/5 rounded-2xl group-hover:bg-blue-600/10 transition-colors">
                    <item.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-gray-600 text-center">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 