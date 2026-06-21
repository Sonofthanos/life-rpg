import React from 'react';

export function GuildHallBg() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <img 
        src="assets/guild_bg.png" 
        alt="Guild Hall Background" 
        className="w-full h-full object-cover opacity-35 filter brightness-90 saturate-90"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Cinematic dark vignette shade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90"></div>
    </div>
  );
}

export function DungeonBg() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <img 
        src="assets/dungeon_bg.png" 
        alt="Dungeon Background" 
        className="w-full h-full object-cover opacity-30 filter brightness-75 contrast-110 saturate-75"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Dark dungeon glow overlay (purple-indigo tint) */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-black/60 to-black/95"></div>
    </div>
  );
}
