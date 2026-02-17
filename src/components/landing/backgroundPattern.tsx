"use client"

export default function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Navy-900 flat premium background — Lawgic DS Fondo 4 */}
      <div className="absolute inset-0 bg-[#101836]" />

      {/* Subtle radial glow for depth — no grid, no noise */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(60,101,226,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Secondary subtle glow bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 30% 80%, rgba(60,101,226,0.06) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}
