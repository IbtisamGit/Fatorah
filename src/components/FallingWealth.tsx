'use client';

import { useEffect, useRef } from 'react';

export function FallingWealth() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let items: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Create falling elements (coins & floating spheres)
    for (let i = 0; i < 35; i++) {
      items.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 12 + 4,
        speedY: Math.random() * 1.5 + 0.5, // Slow fall
        speedX: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.4 + 0.1,
        type: Math.random() > 0.4 ? 'orb' : 'coin' // More orbs than coins for elegance
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.globalAlpha = item.opacity;

        if (item.type === 'coin') {
          // Draw a glowing golden coin
          ctx.beginPath();
          ctx.ellipse(0, 0, item.size, item.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24'; // Gold
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#fef3c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Draw a glowing emerald orb
          ctx.beginPath();
          ctx.arc(0, 0, item.size, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981'; // Emerald
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#10b981';
          ctx.fill();
        }

        ctx.restore();

        // Move
        item.y += item.speedY;
        item.x += item.speedX;
        item.rotation += item.rotationSpeed;

        // Reset to top if it falls off bottom
        if (item.y > canvas.height + 50) {
          item.y = -50;
          item.x = Math.random() * canvas.width;
        }
      });
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-70 pointer-events-none" />;
}
