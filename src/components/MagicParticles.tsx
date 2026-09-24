'use client';

import { useEffect, useRef } from 'react';

export function MagicParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        // Magical upward float with slight horizontal scatter
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 1;
        this.radius = Math.random() * 6 + 2;
        this.alpha = 1;
        // Shades of emerald, green and glowing white
        const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        // Add a beautiful glow to each bubble
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02; // Fade out speed
        this.radius *= 0.95; // Shrink speed
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      // Remove dead particles to keep performance high
      particles = particles.filter(p => p.alpha > 0.05);
      
      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Check if mouse is inside the canvas area (Hero Section)
      if (e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create 4-5 bubbles per mouse movement event for a rich trail
        for(let i=0; i<5; i++) {
          particles.push(new Particle(x, y));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
