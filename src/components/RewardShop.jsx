import React, { useState, useEffect } from 'react';
import { Beer, Coins, Plus, Trash2, ShieldAlert, Clock, ShieldCheck, Swords } from 'lucide-react';

export default function RewardShop({ 
  rewards, 
  points, 
  inventory = { weapon: null, armor: null, ring: null },
  armoryItems = [],
  onRedeemReward, 
  onBuyEquipment,
  onAddReward, 
  onDeleteReward 
}) {
  const [activeTab, setActiveTab] = useState('tavern');
  
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');
  const [formError, setFormError] = useState('');
  
  // Local timer tick to update countdowns in real-time
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddRewardSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newRewardName.trim()) {
      setFormError('Nama reward kosong!');
      return;
    }
    const cost = parseInt(newRewardCost, 10);
    if (isNaN(cost) || cost <= 0) {
      setFormError('Cost harus berupa angka positif!');
      return;
    }

    onAddReward(newRewardName.trim(), cost);
    setNewRewardName('');
    setNewRewardCost('');
  };

  // Helper to format remaining time
  const getCooldownString = (cooldownUntil) => {
    const msRemaining = cooldownUntil - now;
    if (msRemaining <= 0) return null;
    const totalSecs = Math.ceil(msRemaining / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Find if there is an active cooldown timer
  const activeCooldownReward = rewards.find(r => r.cooldownUntil && r.cooldownUntil > now);
  const activeCooldownStr = activeCooldownReward ? getCooldownString(activeCooldownReward.cooldownUntil) : null;

  return (
    <div className="w-full flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
      
      {/* 1. LARGE ACTIVE TIMER OVERLAY (Anti-Cheat Banner) */}
      {activeCooldownReward && activeCooldownStr && (
        <div className="pixel-border-danger bg-red-950/80 p-3.5 flex flex-col items-center justify-center text-center gap-1.5 pixel-shadow animate-pulse shrink-0">
          <span className="text-[7px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 font-pressstart">
            <Clock className="w-3.5 h-3.5 text-red-500 animate-spin" />
            REST TIME ACTIVE (DO NOT CHEAT!)
          </span>
          <span className="text-3xl font-black text-red-400 font-mono tracking-widest drop-shadow-[0_2.5px_0_#000] font-pressstart">
            {activeCooldownStr}
          </span>
          <span className="text-[9px] text-zinc-400 font-semibold uppercase leading-normal">
            Enjoying: "{activeCooldownReward.name}"
          </span>
        </div>
      )}

      {/* Tavern Room Banner */}
      <div className="relative h-24 w-full bg-zinc-950 border-2 border-zinc-800 overflow-hidden flex items-center justify-center crt-effect shrink-0">
        <img 
          src="assets/tavern_bg.png" 
          alt="Tavern Room" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
        <div className="z-10 text-center flex flex-col items-center gap-1">
          <h3 className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 drop-shadow-[0_2px_0_#000] font-pressstart">
            <Beer className="w-4 h-4 text-amber-500 animate-bounce" />
            THE TAVERN SHOP
          </h3>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
            Upgrade your gear or purchase custom activity rewards
          </p>
        </div>
      </div>

      {/* Shop Category Tabs */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('tavern')}
          className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider border-4 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${activeTab === 'tavern' ? 'bg-zinc-900 border-amber-500 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
        >
          TAVERN REWARDS
        </button>
        <button
          onClick={() => setActiveTab('armory')}
          className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider border-4 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${activeTab === 'armory' ? 'bg-zinc-900 border-indigo-500 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
        >
          ARMORY GEAR
        </button>
      </div>

      {/* Scrollable Reward List Box */}
      <div className="flex-1 overflow-y-auto pr-1">
        
        {/* TAVERN TAB */}
        {activeTab === 'tavern' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
            {rewards.length === 0 ? (
              <div className="text-sm text-zinc-500 text-center py-10 col-span-full">
                No custom rewards menu available. Create one below!
              </div>
            ) : (
              rewards.map((reward) => {
                const cooldownStr = reward.cooldownUntil ? getCooldownString(reward.cooldownUntil) : null;
                const isCooldowned = !!cooldownStr;
                const isClaimedToday = reward.claimedToday;
                const canAfford = points >= reward.cost;

                // Enforce lock states
                let isDisabled = false;
                let lockReason = '';
                let btnLabel = 'BUY';

                // Prevent shopping if another anti-cheat timer is already running
                if (activeCooldownReward && activeCooldownReward.id !== reward.id) {
                  isDisabled = true;
                  lockReason = 'ACTIVE COOLDOWN';
                }

                if (reward.antiCheat) {
                  if (isCooldowned) {
                    isDisabled = true;
                    btnLabel = cooldownStr;
                    lockReason = 'COOLDOWN';
                  } else if (isClaimedToday) {
                    isDisabled = true;
                    btnLabel = 'TAKEN';
                    lockReason = 'DAILY LIMIT';
                  }
                }

                if (!isDisabled && !canAfford) {
                  isDisabled = true;
                  lockReason = 'NEED GP';
                }

                return (
                  <div 
                    key={reward.id}
                    className={`flex flex-col justify-between p-3.5 border-2 border-zinc-900 bg-zinc-900/60 transition-all ${isDisabled ? 'opacity-60 border-zinc-950 bg-zinc-950/20' : 'hover:border-zinc-800 hover:bg-zinc-900'}`}
                  >
                    <div className="flex justify-between items-start gap-2.5 mb-2.5">
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        <span className={`text-[13px] leading-relaxed font-bold ${isDisabled ? 'text-zinc-500' : 'text-zinc-200'}`}>
                          {reward.name}
                        </span>
                        <div className="flex gap-2.5 items-center flex-wrap mt-0.5">
                          <span className="text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 font-pressstart">
                            <Coins className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            {reward.cost} <span className="text-[7px] text-zinc-500 font-semibold font-mono">GP</span>
                          </span>
                          <span className="text-[8px] text-zinc-500 font-bold uppercase font-mono">
                            Claimed: {reward.purchases}x
                          </span>
                        </div>
                      </div>

                      {reward.antiCheat && (
                        <span className="bg-purple-950/80 border border-purple-800 text-purple-400 text-[6px] font-bold px-2 py-0.5 uppercase tracking-widest shrink-0 font-pressstart">
                          LOCKOUT
                        </span>
                      )}
                    </div>

                    {/* Redeem Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-950 mt-1">
                      <div className="text-[8px] font-bold truncate max-w-[130px] font-mono">
                        {isCooldowned && (
                          <span className="text-purple-400 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 animate-spin" />
                            Time: {cooldownStr}
                          </span>
                        )}
                        {!isCooldowned && isClaimedToday && (
                          <span className="text-red-400 flex items-center gap-0.5">
                            Purchased Today
                          </span>
                        )}
                        {lockReason && !isCooldowned && !isClaimedToday && (
                          <span className="text-zinc-600 uppercase">{lockReason}</span>
                        )}
                        {!isDisabled && (
                          <span className="text-emerald-500 uppercase font-semibold">AVAILABLE</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onRedeemReward(reward.id)}
                          disabled={isDisabled}
                          className={`text-[8px] font-bold border-2 px-3.5 py-1.5 flex items-center gap-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${!isDisabled ? 'bg-amber-600 border-amber-400 hover:bg-amber-500 text-zinc-950' : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'}`}
                        >
                          {btnLabel}
                        </button>

                        {!reward.antiCheat && (
                          <button
                            onClick={() => onDeleteReward(reward.id)}
                            className="text-zinc-600 hover:text-red-400 p-1 transition-colors focus:outline-none"
                            title="Remove Reward"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ARMORY TAB */}
        {activeTab === 'armory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
            {armoryItems.map((item) => {
              // Check if equipped
              const isEquipped = 
                (item.type === 'weapon' && inventory.weapon?.id === item.id) ||
                (item.type === 'armor' && inventory.armor?.id === item.id) ||
                (item.type === 'ring' && inventory.ring?.id === item.id);
              
              const canAfford = points >= item.cost;
              const isDisabled = isEquipped || !canAfford;

              // Border colors based on equipment category
              let borderClass = 'border-zinc-800 hover:border-zinc-700';
              let badgeColor = 'bg-zinc-900 text-zinc-400 border-zinc-800';
              if (item.type === 'weapon') {
                borderClass = isEquipped ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-900 hover:border-amber-900/60';
                badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800';
              } else if (item.type === 'armor') {
                borderClass = isEquipped ? 'border-sky-500 bg-sky-950/20' : 'border-zinc-900 hover:border-sky-900/60';
                badgeColor = 'bg-sky-950/80 text-sky-400 border-sky-800';
              } else if (item.type === 'ring') {
                borderClass = isEquipped ? 'border-purple-500 bg-purple-950/20' : 'border-zinc-900 hover:border-purple-900/60';
                badgeColor = 'bg-purple-950/80 text-purple-400 border-purple-800';
              }

              return (
                <div 
                  key={item.id}
                  className={`flex flex-col justify-between p-3.5 border-2 bg-zinc-900/60 transition-all ${borderClass} ${isEquipped ? 'glow-blue' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <span className="text-[13px] leading-relaxed font-bold text-zinc-200">
                        {item.name}
                      </span>
                      <div className="flex gap-2.5 items-center flex-wrap">
                        <span className="text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 font-pressstart">
                          <Coins className="w-3.5 h-3.5 text-yellow-500" />
                          {item.cost} <span className="text-[7px] text-zinc-500 font-semibold font-mono">GP</span>
                        </span>
                        <span className="text-[8px] text-emerald-400 font-bold font-mono">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`border text-[6px] font-bold px-2 py-0.5 uppercase tracking-wider shrink-0 font-pressstart ${badgeColor}`}>
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-950 mt-2">
                    <span className="text-[8px] font-bold font-mono text-zinc-500">
                      {isEquipped ? 'CURRENTLY ACTIVE' : !canAfford ? 'INSUFFICIENT GOLD' : 'PERMANENT UPGRADE'}
                    </span>

                    <button
                      onClick={() => onBuyEquipment(item)}
                      disabled={isDisabled}
                      className={`text-[8px] font-bold border-2 px-3.5 py-1.5 flex items-center gap-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${isEquipped ? 'bg-zinc-800 border-zinc-700 text-emerald-500 cursor-not-allowed opacity-80' : canAfford ? 'bg-indigo-700 border-indigo-500 hover:bg-indigo-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-50'}`}
                    >
                      {isEquipped ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          EQUIPPED
                        </>
                      ) : (
                        <>
                          <Swords className="w-3.5 h-3.5 text-indigo-200" />
                          FORGE
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Form: Add Custom Reward (Only visible in tavern rewards tab) */}
      {activeTab === 'tavern' && (
        <form onSubmit={handleAddRewardSubmit} className="mt-auto pt-3.5 border-t-2 border-zinc-900 flex flex-col gap-2 shrink-0">
          <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest font-pressstart">
            Create Custom Shop Reward
          </div>
          
          {formError && (
            <div className="text-[9px] text-red-500 font-bold flex items-center gap-1 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              {formError}
            </div>
          )}

          <div className="flex gap-2.5">
            <input 
              type="text"
              placeholder="Contoh: Bermain Game 30 Menit..."
              value={newRewardName}
              onChange={(e) => setNewRewardName(e.target.value)}
              className="flex-1 bg-zinc-900 border-2 border-zinc-800 text-[13px] px-3 py-2 text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-700 font-mono"
            />
            <input 
              type="number"
              placeholder="Gold..."
              value={newRewardCost}
              onChange={(e) => setNewRewardCost(e.target.value)}
              className="w-20 bg-zinc-900 border-2 border-zinc-800 text-[13px] px-2 py-2 text-white placeholder-zinc-650 focus:outline-none focus:border-zinc-700 font-mono"
            />
            <button
              type="submit"
              className="bg-zinc-900 hover:bg-zinc-850 border-2 border-zinc-700 text-[8px] font-bold text-amber-400 px-4 py-2 flex items-center justify-center pixel-btn pixel-shadow-sm font-pressstart shrink-0 focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              CREATE
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
