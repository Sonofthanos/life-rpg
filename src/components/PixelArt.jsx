import React, { useState } from 'react';

// Color map for RPG pixel art fallback
const COLOR_MAP = {
  '.': 'transparent',
  'K': '#4b5563', // Metal Gray (helmet/weapon)
  'S': '#9ca3af', // Silver (highlights)
  'B': '#2563eb', // Blue Armor
  'R': '#dc2626', // Red (plume/cape/dragon)
  'P': '#fcd34d', // Skin tone
  'Y': '#fbbf24', // Gold (shield/dragon belly)
  'W': '#ffffff', // White (eyes/fangs/sword metal)
  'X': '#000000', // Black (eyes/details)
  'G': '#10b981', // Green Slime/Orc skin
  'D': '#047857', // Dark Green
  'O': '#b45309', // Brown Orc leather/hair
  'F': '#f97316', // Orange Fire particle
  'N': '#7f1d1d', // Dark Red (dragon shadows)
};

const SPRITES = {
  hero: [
    "....RRRR........",
    "...RKKKSR.......",
    "..RKKKKKSR......",
    "..RRPPPXXR......",
    "..RRRPPPRR......",
    "...KBBBBK.W.....",
    "..KBBBBBBKW.....",
    "..KBYYBBBKW.....",
    ".KBBBBBBBBKW....",
    ".KBBBBBBBBKK....",
    "..KK..KK........",
    "..KK..KK........"
  ],
  slime: [
    "................",
    "......GGGG......",
    "....GGDDDDGG....",
    "...GGDDDDDDGG...",
    "..GGDWWDDWWDDG..",
    "..GGDXXDDXXDDG..",
    ".GGDDDDDDDDDDDG.",
    ".GGDGGDDGGDDGGG.",
    ".GGGGGGGGGGGGGG.",
    "..GGGGGGGGGGGG.."
  ],
  orc: [
    "......OOOO......",
    "....GGGGGGGG....",
    "...GGXXGGXXGG...",
    "...GGGGWWGGGG...",
    "....GGGGGGGG....",
    "...OOGGGGGGOO...",
    "..OOBBBBBBBBOO..",
    "..OOBYYYYYYBOO..",
    "..OOBBBBBBBBOO..",
    "...GGGG..GGGG...",
    "...GGGG..GGGG..."
  ],
  dragon: [
    "........RRRRRRR.........",
    "......RRRRRRRRRRR.......",
    ".....RRRRXXRRRXXRRR.....",
    ".....RRRRWWDRRWDDRR.....",
    "......RRRRRRRRRRR.......",
    ".....SSRRRRRRRRRSS......",
    ".....SSRRRYYYRRRSS......",
    "....SS.RYYYYYY.SSS......",
    "...SSS.RYYYYYY.SSSS.....",
    "..SSSS.RYYYYYY.SSSSS....",
    ".SSSSS.RYYYYYY.SSSSS....",
    ".......RRRRRRR..........",
    "......RRRRRRRRR...FFFF..",
    ".....RRRRN.NRRRR.FFFFF..",
    "....RRRR....RRRR..FFF...",
    "....RR........RR........"
  ]
};

const IMAGE_MAP = {
  hero: 'assets/hero_knight.png',
  slime: 'assets/enemy_slime.png',
  orc: 'assets/enemy_orc.png',
  dragon: 'assets/boss_dragon.png',
};

const SIZE_MAP = {
  hero: { width: 48, height: 48 },
  slime: { width: 36, height: 36 },
  orc: { width: 44, height: 44 },
  dragon: { width: 64, height: 64 },
};

export default function PixelArt({ type = 'hero', className = '', scale = 1 }) {
  const [loadError, setLoadError] = useState(false);
  const imageSrc = IMAGE_MAP[type];
  const size = SIZE_MAP[type] || { width: 32, height: 32 };
  const actualScale = scale * 4;

  // If we have a valid PNG and no loading error, render the premium image
  if (imageSrc && !loadError) {
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{
          width: `${size.width * actualScale}px`,
          height: `${size.height * actualScale}px`,
        }}
      >
        <style>
          {`
            @keyframes idle-bob {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
            @keyframes slime-stretch {
              0%, 100% { transform: scale(1, 1); }
              50% { transform: scale(1.1, 0.88) translateY(2px); }
            }
            @keyframes orc-bob {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-3px) rotate(1deg); }
            }
            @keyframes dragon-hover {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }
            .png-hero {
              animation: idle-bob 1.6s ease-in-out infinite;
              transform-origin: bottom center;
            }
            .png-slime {
              animation: slime-stretch 1.2s ease-in-out infinite;
              transform-origin: bottom center;
            }
            .png-orc {
              animation: orc-bob 1.8s ease-in-out infinite;
              transform-origin: bottom center;
            }
            .png-dragon {
              animation: dragon-hover 2.2s ease-in-out infinite;
              transform-origin: bottom center;
            }
          `}
        </style>
        <img 
          src={imageSrc} 
          alt={type}
          onError={() => setLoadError(true)}
          className={`w-full h-full object-contain ${
            type === 'hero' ? 'png-hero' :
            type === 'slime' ? 'png-slime' :
            type === 'orc' ? 'png-orc' :
            type === 'dragon' ? 'png-dragon' : ''
          }`}
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }

  // Fallback to SVG rendering if image fails to load
  const sprite = SPRITES[type] || SPRITES.hero;
  const height = sprite.length;
  const width = Math.max(...sprite.map(row => row.length));

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={`select-none ${className}`}
      style={{ 
        width: `${width * 3 * actualScale}px`, 
        height: `${height * 3 * actualScale}px`,
        imageRendering: 'pixelated'
      }}
    >
      <style>
        {`
          @keyframes idle-bob-svg {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(3%); }
          }
          @keyframes slime-stretch-svg {
            0%, 100% { transform: scale(1, 1); }
            50% { transform: scale(1.05, 0.92) translateY(2%); }
          }
          @keyframes fire-flicker {
            0%, 100% { transform: translate(0, 0); opacity: 0.8; }
            50% { transform: translate(1px, -1px); opacity: 1; }
          }
          .pixel-hero-svg {
            animation: idle-bob-svg 1.6s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .pixel-slime-svg {
            animation: slime-stretch-svg 1.2s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .pixel-orc-svg {
            animation: idle-bob-svg 1.8s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .pixel-dragon-svg {
            animation: idle-bob-svg 2.2s ease-in-out infinite;
            transform-origin: bottom center;
          }
          .pixel-fire {
            animation: fire-flicker 0.4s ease-in-out infinite;
          }
        `}
      </style>
      <g className={
        type === 'hero' ? 'pixel-hero-svg' : 
        type === 'slime' ? 'pixel-slime-svg' : 
        type === 'orc' ? 'pixel-orc-svg' : 
        type === 'dragon' ? 'pixel-dragon-svg' : ''
      }>
        {sprite.map((row, y) => {
          return row.split('').map((char, x) => {
            const fillColor = COLOR_MAP[char] || 'transparent';
            if (fillColor === 'transparent') return null;

            const isFire = char === 'F';

            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={fillColor}
                className={isFire ? 'pixel-fire' : ''}
              />
            );
          });
        })}
      </g>
    </svg>
  );
}
