import React, { useRef, useState, MouseEvent } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // max tilt degrees
  scale?: number;
  perspective?: number;
  onClick?: () => void;
}

export const Card3DTilt: React.FC<Card3DTiltProps> = ({
  children,
  className = '',
  maxRotation = 10,
  scale = 1.02,
  perspective = 1000,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -maxRotation;
    const rY = ((x - centerX) / centerX) * maxRotation;

    setRotX(rX);
    setRotY(rY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className="inline-block w-full h-full"
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 80ms ease-out' : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
