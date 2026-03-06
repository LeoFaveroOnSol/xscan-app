"use client";

import { cn } from "@/lib/utils/cn";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  containerClassName?: string;
  colors?: number[][];
  dotSize?: number;
  showGradient?: boolean;
}

export const CanvasRevealEffect = ({
  animationSpeed = 4,
  containerClassName,
  colors = [[0, 255, 136]],
  dotSize = 3,
  showGradient = true,
}: CanvasRevealEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let dots: { x: number; y: number; radius: number; alpha: number; vx: number; vy: number; color: number[] }[] = [];
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      const spacing = 20;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          dots.push({
            x: x + Math.random() * 10,
            y: y + Math.random() * 10,
            radius: Math.random() * dotSize + 1,
            alpha: 0,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01 * animationSpeed;

      dots.forEach((dot, i) => {
        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Bounce off edges
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        // Animate alpha based on wave
        const wave = Math.sin(time + i * 0.1) * 0.5 + 0.5;
        dot.alpha = isVisible ? wave * 0.8 : dot.alpha * 0.95;

        // Draw dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot.color[0]}, ${dot.color[1]}, ${dot.color[2]}, ${dot.alpha})`;
        ctx.fill();

        // Draw connections
        dots.slice(i + 1, i + 5).forEach((other) => {
          const dx = dot.x - other.x;
          const dy = dot.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(dot.x, dot.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${dot.color[0]}, ${dot.color[1]}, ${dot.color[2]}, ${dot.alpha * 0.2})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    animate();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [animationSpeed, colors, dotSize, isVisible]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", containerClassName)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      )}
    </div>
  );
};

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Icon = ({ className, style }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      style={style}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

interface CanvasRevealCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgePosition?: number;
  avatar?: string;
  stats?: { label: string; value: string }[];
  children?: React.ReactNode;
  className?: string;
  effectColors?: number[][];
  effectSpeed?: number;
  effectDotSize?: number;
  containerClassName?: string;
  href?: string;
}

export const CanvasRevealCard = ({
  title,
  subtitle,
  badge,
  badgePosition,
  avatar,
  stats,
  children,
  className,
  effectColors = [[0, 255, 136]],
  effectSpeed = 4,
  effectDotSize = 3,
  containerClassName = "bg-emerald-900/20",
  href,
}: CanvasRevealCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const CardWrapper = href ? "a" : "div";
  const cardProps = href ? { href } : {};

  return (
    <CardWrapper
      {...cardProps}
      className={cn(
        "group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] p-6 transition-all duration-500",
        "hover:border-primary/30 hover:shadow-[0_0_30px_rgba(0,255,136,0.1)]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Corner Icons */}
      <Icon className="absolute -top-3 -left-3 h-6 w-6 text-white/10 group-hover:text-primary/30 transition-colors duration-500" />
      <Icon className="absolute -top-3 -right-3 h-6 w-6 text-white/10 group-hover:text-primary/30 transition-colors duration-500" />
      <Icon className="absolute -bottom-3 -left-3 h-6 w-6 text-white/10 group-hover:text-primary/30 transition-colors duration-500" />
      <Icon className="absolute -bottom-3 -right-3 h-6 w-6 text-white/10 group-hover:text-primary/30 transition-colors duration-500" />

      {/* Badge Position */}
      {badgePosition && (
        <div
          className={cn(
            "absolute -top-2 -right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
            badgePosition === 1 && "bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]",
            badgePosition === 2 && "bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-[0_0_10px_rgba(156,163,175,0.3)]",
            badgePosition === 3 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)]"
          )}
        >
          #{badgePosition}
        </div>
      )}

      {/* Canvas Effect */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <CanvasRevealEffect
          animationSpeed={effectSpeed}
          containerClassName={containerClassName}
          colors={effectColors}
          dotSize={effectDotSize}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Avatar */}
        {avatar && (
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/10 group-hover:border-primary/30 transition-colors duration-500">
              <img
                src={avatar}
                alt={title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${title}`;
                }}
              />
            </div>
            {badgePosition === 1 && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">👑</div>
            )}
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">@{subtitle}</p>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
            {badge}
          </span>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-6 mt-2">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </CardWrapper>
  );
};

export default CanvasRevealEffect;
