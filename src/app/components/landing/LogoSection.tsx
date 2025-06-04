export default function LogoSection() {
  return (
    <div className="flex flex-col items-start gap-4 relative">
      <div className="w-48">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/group39279-4M5rEhpUUqc1gMM78pRBlrCQMaO1nI.png"
          alt="AI Quote Logo"
          className="w-full h-auto"
        />
      </div>
      <div className="w-32 relative">
        <div className="absolute -top-2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/group1000004148-JHAPx9ZRb3lSpLcFw2e7vxbYBGlT1c.png"
          alt="Lawgic Logo"
          className="w-full h-auto"
        />
      </div>
    </div>
  )
} 