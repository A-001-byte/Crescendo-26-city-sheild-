import React from 'react'

export default function DashParticles() {
  return (
    <>
      <div className="dash-particle bg-tertiary-container top-40 right-[15%] rotate-12 opacity-60"></div>
      <div className="dash-particle bg-error top-96 left-[5%] -rotate-45 opacity-60"></div>
      <div className="dash-particle bg-secondary-fixed top-[60%] right-[10%] rotate-90 opacity-60"></div>
      <div className="dash-particle bg-primary top-[80%] left-[20%] rotate-180 opacity-40"></div>
      
      {/* Structural layout separation logic via skew and tonal background layering */}
      <div className="fixed inset-0 -z-10 bg-surface-container-lowest"></div>
      <div className="fixed top-0 right-0 w-[50%] md:w-[35%] h-full bg-surface-container-low/50 -z-10 skew-x-[-15deg] translate-x-32 hidden sm:block"></div>
    </>
  )
}
