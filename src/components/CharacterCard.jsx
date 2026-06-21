import React from 'react';
import PixelArt from './PixelArt';
import { Shield, Swords, Brain, Coins, Sparkles, User, Trophy } from 'lucide-react';

/**
 * StatusHud
 * Displays name "Adlan", level indicators, EXP bar, and Gold Points (GP).
 */
export function StatusHud({ character, className = '', compact = false }) {
  const expNeeded = character.level * 100;
  const expPercent = Math.min(100, Math.max(0, (character.exp / expNeeded) * 100));

  return (
    <div className={`pixel-border-primary bg-zinc-950 p-3.5 flex items-center justify-between gap-4 pixel-shadow ${className}`}>
      
      {/* Name and Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center border-2 border-black pixel-shadow-sm shrink-0">
          <User className="w-5 h-5 text-zinc-950" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-[12px] font-black text-amber-400 tracking-wider font-pressstart">ADLAN</h2>
          <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{character.title}</p>
        </div>
      </div>

      {/* Level, EXP Progress Bar & Gold Points */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        {/* EXP segment */}
        <div className="flex flex-col gap-1 min-w-[100px] md:min-w-[140px] flex-1 max-w-[200px]">
          <div className="flex justify-between items-center text-[7px] font-bold text-zinc-400 font-mono font-pressstart">
            <span className="text-amber-400">LV {character.level}</span>
            {!compact && <span className="text-zinc-500">{character.exp}/{expNeeded} XP</span>}
          </div>
          <div className="h-3.5 bg-zinc-900 border border-zinc-700 relative p-0.5 pixel-shadow-sm">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
              style={{ width: `${expPercent}%` }}
            ></div>
          </div>
        </div>

        {/* GP Gold */}
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 border-2 border-amber-500 shrink-0 pixel-shadow-sm">
          <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-[10px] text-yellow-400 font-bold font-mono font-pressstart">
            {character.points} <span className="text-[7px] text-zinc-500 font-semibold">GP</span>
          </span>
        </div>
      </div>

    </div>
  );
}

/**
 * StatsPanel
 * Displays Strength (STR), Agility (AGI), Intelligence (INT) attributes.
 * Shows equipment slots and status boosts.
 */
export function StatsPanel({ character, attributes, inventory = { weapon: null, armor: null, ring: null }, className = '', mini = false }) {
  // Safe fallbacks for computed attributes
  const strVal = attributes ? attributes.str : (character.str || 5);
  const agiVal = attributes ? attributes.agi : (character.agi || 5);
  const intVal = attributes ? attributes.int : (character.int || 5);
  
  const baseStr = attributes ? attributes.baseStr : (character.str || 5);
  const baseAgi = attributes ? attributes.baseAgi : (character.agi || 5);
  const baseInt = attributes ? attributes.baseInt : (character.int || 5);

  const strBonus = attributes ? attributes.strBonus : 0;
  const agiBonus = attributes ? attributes.agiBonus : 0;
  const intBonus = attributes ? attributes.intBonus : 0;

  if (mini) {
    return (
      <div className={`pixel-border bg-zinc-950 p-2.5 flex justify-between items-center gap-2 pixel-shadow ${className}`}>
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest font-pressstart shrink-0">STATS:</span>
        <div className="flex gap-3 items-center flex-1 justify-around text-[9px] font-bold">
          <span className="text-red-400 flex items-center gap-1">
            <Swords className="w-3.5 h-3.5 text-red-500 shrink-0" /> {strVal}
          </span>
          <span className="text-sky-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-sky-500 shrink-0" /> {agiVal}
          </span>
          <span className="text-purple-400 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-purple-500 shrink-0" /> {intVal}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pixel-border bg-zinc-950 p-4 flex flex-col gap-4 pixel-shadow ${className}`}>
      
      {/* Attributes Section */}
      <div className="flex flex-col gap-3">
        <div className="border-b border-zinc-800 pb-1.5">
          <h3 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 font-pressstart select-none">
            <Trophy className="w-4 h-4 text-amber-500" />
            HERO STATUS
          </h3>
        </div>
        
        <div className="flex flex-col gap-2 font-mono">
          {/* STR */}
          <div className="flex justify-between items-center bg-zinc-900 px-3 py-2 border border-zinc-800 hover:border-red-900/40 transition-colors">
            <span className="text-[10px] text-red-400 font-bold flex items-center gap-2 select-none">
              <Swords className="w-4 h-4 text-red-500" />
              STR (STRENGTH)
            </span>
            <div className="text-[11px] font-bold text-red-400 font-pressstart flex items-center gap-1">
              <span>{strVal}</span>
              {strBonus > 0 && <span className="text-[8px] text-emerald-500 font-semibold font-mono">+{strBonus}</span>}
            </div>
          </div>

          {/* AGI */}
          <div className="flex justify-between items-center bg-zinc-900 px-3 py-2 border border-zinc-800 hover:border-sky-900/40 transition-colors">
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-2 select-none">
              <Shield className="w-4 h-4 text-sky-500" />
              AGI (AGILITY)
            </span>
            <div className="text-[11px] font-bold text-sky-400 font-pressstart flex items-center gap-1">
              <span>{agiVal}</span>
              {agiBonus > 0 && <span className="text-[8px] text-emerald-500 font-semibold font-mono">+{agiBonus}</span>}
            </div>
          </div>

          {/* INT */}
          <div className="flex justify-between items-center bg-zinc-900 px-3 py-2 border border-zinc-800 hover:border-purple-900/40 transition-colors">
            <span className="text-[10px] text-purple-400 font-bold flex items-center gap-2 select-none">
              <Brain className="w-4 h-4 text-purple-500" />
              INT (INTELLECT)
            </span>
            <div className="text-[11px] font-bold text-purple-400 font-pressstart flex items-center gap-1">
              <span>{intVal}</span>
              {intBonus > 0 && <span className="text-[8px] text-emerald-500 font-semibold font-mono">+{intBonus}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Slots Section */}
      <div className="flex flex-col gap-2.5 mt-1">
        <div className="border-b border-zinc-800 pb-1.5">
          <h3 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-pressstart select-none">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            EQUIPMENT
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Weapon Slot */}
          <div className={`p-2 border-2 flex flex-col items-center justify-center min-h-[56px] ${inventory.weapon ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mb-1">WEAPON</span>
            {inventory.weapon ? (
              <div className="text-center w-full">
                <span className="text-[8px] text-amber-400 font-bold block truncate" title={inventory.weapon.name}>
                  {inventory.weapon.name}
                </span>
                <span className="text-[7px] text-emerald-400 font-bold font-mono">+{inventory.weapon.bonus.str} STR</span>
              </div>
            ) : (
              <span className="text-[8px] text-zinc-700 font-bold font-mono">EMPTY</span>
            )}
          </div>

          {/* Armor Slot */}
          <div className={`p-2 border-2 flex flex-col items-center justify-center min-h-[56px] ${inventory.armor ? 'border-sky-500 bg-sky-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mb-1">ARMOR</span>
            {inventory.armor ? (
              <div className="text-center w-full">
                <span className="text-[8px] text-sky-400 font-bold block truncate" title={inventory.armor.name}>
                  {inventory.armor.name}
                </span>
                <span className="text-[7px] text-emerald-400 font-bold font-mono">+{inventory.armor.bonus.agi} AGI</span>
              </div>
            ) : (
              <span className="text-[8px] text-zinc-700 font-bold font-mono">EMPTY</span>
            )}
          </div>

          {/* Ring Slot */}
          <div className={`p-2 border-2 flex flex-col items-center justify-center min-h-[56px] ${inventory.ring ? 'border-purple-500 bg-purple-950/20' : 'border-zinc-800 bg-zinc-900'}`}>
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mb-1">RING</span>
            {inventory.ring ? (
              <div className="text-center w-full">
                <span className="text-[8px] text-purple-400 font-bold block truncate" title={inventory.ring.name}>
                  {inventory.ring.name}
                </span>
                <span className="text-[7px] text-emerald-400 font-bold font-mono">+{inventory.ring.bonus.int} INT</span>
              </div>
            ) : (
              <span className="text-[8px] text-zinc-700 font-bold font-mono">EMPTY</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

/**
 * DungeonArena
 * Renders the battle arena stone background simulating combat scene.
 */
export function DungeonArena({ 
  uncompletedDailies = [], 
  activeBoss = null, 
  combatEffect = null, 
  className = '' 
}) {
  return (
    <div className={`pixel-border bg-zinc-950 pixel-shadow crt-effect overflow-hidden relative flex flex-col justify-between select-none h-[280px] md:h-[350px] ${className}`}>
      
      {/* Dungeon Arena Bg Image */}
      <img 
        src="assets/dungeon_bg.png" 
        alt="Dungeon Arena Bg" 
        className="absolute inset-0 w-full h-full object-cover opacity-45 z-0 filter brightness-50 contrast-125 saturate-75"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/85 z-0"></div>

      {/* Banner Label */}
      <div className="z-20 bg-stone-900/95 border-b-2 border-stone-800 text-center py-2 px-2 w-full text-[8px] text-stone-400 uppercase tracking-widest font-bold font-pressstart">
        DARK DUNGEON DEPTHS
      </div>

      {/* Arena Visual Scene */}
      <div className="flex-1 w-full relative flex flex-col justify-end min-h-0 z-10">
        
        {/* Stone ground floor */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-stone-900 to-stone-950 border-t-4 border-stone-800 z-0"></div>

        {/* Visual Combat Grid */}
        <div className="relative z-10 flex justify-between items-end w-full px-6 pb-6 mt-auto">
          
          {/* Hero Knight */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 mb-1">
            <div className="relative h-32 w-32 md:h-44 md:w-44 flex items-center justify-center">
              <PixelArt 
                type="hero" 
                scale={0.9} 
                className={`drop-shadow-[0_4px_12px_rgba(37,99,235,0.6)] ${
                  combatEffect?.active && combatEffect.target === 'hero' ? 'animate-shake' : 
                  combatEffect?.active && combatEffect.target === 'enemy' ? 'animate-dash-forward' : ''
                }`} 
              />
            </div>
            <div className="bg-blue-950/90 border border-blue-800 text-[8px] text-blue-400 px-2 py-0.5 font-bold uppercase tracking-wider font-pressstart">
              HERO
            </div>
          </div>

          {/* Enemies list */}
          <div className="flex items-end gap-2 shrink-0">
            
            {/* Active Guild Board Boss */}
            {activeBoss && (() => {
              const enemyType = activeBoss.enemyType || (activeBoss.difficulty === 'hard' ? 'dragon' : activeBoss.difficulty === 'medium' ? 'orc' : 'slime');
              let scale = 1.0;
              let containerClass = 'h-32 w-32';
              if (enemyType === 'dragon') {
                scale = 1.6;
                containerClass = 'h-44 w-44';
              } else if (enemyType === 'orc') {
                scale = 1.2;
                containerClass = 'h-36 w-36';
              } else if (enemyType === 'slime') {
                scale = 0.6;
                containerClass = 'h-24 w-24';
              }

              return (
                <div className="flex flex-col items-center gap-1.5 relative mb-1">
                  {/* Hit effect overlay */}
                  {combatEffect?.active && combatEffect.target === 'enemy' && combatEffect.id === activeBoss.id && (
                    <>
                      <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <div className="w-full h-full max-h-[160px] max-w-[160px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cpath d=%22M10 90 L90 10 M20 90 L80 30 M30 70 L70 10%22 stroke=%22%23ef4444%22 stroke-width=%2210%22 stroke-linecap=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-contain animate-slash"></div>
                      </div>
                      <div className="absolute -top-6 font-bold text-[10px] text-red-500 animate-bounce z-20 drop-shadow-[0_1.5px_0_#000] font-pressstart">
                        CRITICAL!
                      </div>
                      <div className="absolute -top-12 flex flex-col items-center z-30 animate-pulse font-pressstart text-[7px]">
                        <span className="text-purple-400 drop-shadow-[0_1px_0_#000]">+{combatEffect.exp} XP</span>
                        <span className="text-yellow-400 drop-shadow-[0_1px_0_#000]">+{combatEffect.points} GP</span>
                      </div>
                    </>
                  )}

                  <div className={`${containerClass} flex items-center justify-center`}>
                    <PixelArt 
                      type={enemyType} 
                      scale={scale} 
                      className={`drop-shadow-[0_4px_12px_rgba(220,38,38,0.6)] ${combatEffect?.active && combatEffect.target === 'enemy' && combatEffect.id === activeBoss.id ? 'animate-shake filter brightness-150' : ''}`}
                    />
                  </div>
                  <div className="bg-red-950/90 border border-red-800 text-[8px] text-red-400 px-2 py-0.5 font-bold truncate max-w-[140px] font-pressstart">
                    {enemyType.toUpperCase()}
                  </div>
                </div>
              );
            })()}

            {/* Daily slimes */}
            <div className="flex gap-1 items-end">
              {uncompletedDailies.slice(0, 3).map((daily, idx) => {
                const isBeingHit = combatEffect?.active && combatEffect.id === daily.id;

                return (
                  <div key={daily.id} className="flex flex-col items-center gap-1.5 relative mb-1">
                    {/* Hit effect overlay */}
                    {isBeingHit && (
                      <>
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                          <div className="w-full h-full max-h-[120px] max-w-[120px] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cpath d=%22M10 90 L90 10 M20 90 L80 30%22 stroke=%22%23ef4444%22 stroke-width=%2212%22 stroke-linecap=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-contain animate-slash"></div>
                        </div>
                        <div className="absolute -top-5 font-bold text-[9px] text-red-500 animate-bounce z-20 drop-shadow-[0_1px_0_#000] font-pressstart">
                          K.O.!
                        </div>
                        <div className="absolute -top-10 flex flex-col items-center z-30 animate-pulse font-pressstart text-[6px]">
                          <span className="text-purple-400 drop-shadow-[0_1px_0_#000]">+{combatEffect.exp} XP</span>
                          <span className="text-yellow-400 drop-shadow-[0_1px_0_#000]">+{combatEffect.points} GP</span>
                        </div>
                      </>
                    )}

                    <div className="h-20 w-20 flex items-center justify-center">
                      <PixelArt 
                        type="slime" 
                        scale={0.55} 
                        className={`drop-shadow-[0_2px_6px_rgba(16,185,129,0.5)] ${isBeingHit ? 'animate-shake filter brightness-150' : ''}`}
                      />
                    </div>
                    <div className="bg-emerald-950/90 border border-emerald-800 text-[7px] text-emerald-400 px-2 py-0.5 select-none font-bold font-pressstart">
                      SLIME
                    </div>
                  </div>
                );
              })}

              {uncompletedDailies.length === 0 && !activeBoss && (
                <div className="text-[8px] text-stone-600 uppercase font-bold text-center tracking-wider pb-4 pr-4 font-pressstart">
                  DUNGEON BERSIH
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Floor label info */}
      <div className="z-20 bg-stone-900 border-t-2 border-stone-800 px-3 py-1.5 flex justify-between items-center text-[8px] text-stone-500 font-bold font-mono">
        <span>ACTIVE FOES: {uncompletedDailies.length + (activeBoss ? 1 : 0)}</span>
        <span>DUNGEON FLOOR 1</span>
      </div>

    </div>
  );
}

// Default export wrapper compatibility
export default function CharacterCard() {
  return null;
}
