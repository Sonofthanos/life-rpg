import React, { useState, useEffect } from 'react';
import { 
  loadRPGData, 
  triggerCompleteDaily, 
  addDailyTask, 
  deleteDailyTask, 
  triggerAddSpecialQuest, 
  triggerDefeatSpecialQuest, 
  triggerRedeemReward, 
  addCustomReward, 
  deleteCustomReward, 
  addLogEntry 
} from './services/rpgService';

import { StatusHud, StatsPanel, DungeonArena } from './components/CharacterCard';
import QuestList from './components/QuestList';
import RewardShop from './components/RewardShop';
import ActionLog from './components/ActionLog';
import PixelArt from './components/PixelArt';
import { GuildHallBg, DungeonBg } from './components/Backgrounds';

import { Trophy, ShieldAlert, Swords, ShoppingBag, ArrowLeft, Volume2, VolumeX, Play, AlertTriangle, Coins, Map as MapIcon, Shield, Terminal } from 'lucide-react';
import * as audioService from './services/audioService';

import { supabase } from './services/supabaseClient';
import * as dbService from './services/rpgSupabaseService';

// Armory equipment items definitions
const ARMORY_ITEMS = [
  { id: 'eq_w1', name: 'Steel Claymore', type: 'weapon', cost: 100, bonus: { str: 4 }, desc: '+4 STR (Strength)' },
  { id: 'eq_w2', name: 'Excalibur (Lgd)', type: 'weapon', cost: 300, bonus: { str: 10 }, desc: '+10 STR (Strength)' },
  { id: 'eq_a1', name: 'Scout Cloak', type: 'armor', cost: 80, bonus: { agi: 3 }, desc: '+3 AGI (Agility)' },
  { id: 'eq_a2', name: 'Titan Shield', type: 'armor', cost: 250, bonus: { agi: 8 }, desc: '+8 AGI (Agility)' },
  { id: 'eq_r1', name: 'Wisdom Ring', type: 'ring', cost: 120, bonus: { int: 5 }, desc: '+5 INT (Intellect)' },
  { id: 'eq_r2', name: 'Archmage Sigil', type: 'ring', cost: 280, bonus: { int: 11 }, desc: '+11 INT (Intellect)' }
];

const playAlarmSound = () => {
  audioService.playAlarmSound();
};

function App() {
  // Authentication states
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Game states
  const [character, setCharacter] = useState({ level: 1, exp: 0, points: 0, title: 'Novice', str: 5, agi: 5, int: 5 });
  const [dailies, setDailies] = useState([]);
  const [guildBoard, setGuildBoard] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [logs, setLogs] = useState([]);

  // Equipment inventory state
  const [inventory, setInventory] = useState({ weapon: null, armor: null, ring: null });

  // Navigation state: 'map' | 'main' | 'battle' | 'shop' | 'logs'
  const [currentPage, setCurrentPage] = useState('map');

  // Audio Mute State
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem('life_rpg_muted');
    return stored ? JSON.parse(stored) : false;
  });

  // Combat details
  const [activeBossId, setActiveBossId] = useState(null);
  const [combatEffect, setCombatEffect] = useState({ active: false, id: null, type: 'none', target: 'none', exp: 0, points: 0 });

  // Popups & Alarms Modals
  const [levelUpModal, setLevelUpModal] = useState({ show: false, level: 1, title: '', statsUp: false });
  const [alarmModal, setAlarmModal] = useState({ show: false, rewardName: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // 1. Observe Authentication State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Data from Supabase once logged in
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      setAuthLoading(true);
      const onlineData = await dbService.loadOnlineData(user.id);
      
      if (onlineData) {
        setCharacter(onlineData.character);
        setDailies(onlineData.dailies);
        setGuildBoard(onlineData.guildBoard);
        setLogs(onlineData.logs);
        setRewards(onlineData.rewards);
        
        // Resolve inventory details
        const inv = onlineData.inventory;
        const weapon = inv.weapon ? ARMORY_ITEMS.find(i => i.id === inv.weapon.id) : null;
        const armor = inv.armor ? ARMORY_ITEMS.find(i => i.id === inv.armor.id) : null;
        const ring = inv.ring ? ARMORY_ITEMS.find(i => i.id === inv.ring.id) : null;
        setInventory({ weapon, armor, ring });

        if (onlineData.guildBoard.length > 0) {
          setActiveBossId(onlineData.guildBoard[0].id);
        }
      }
      setAuthLoading(false);
    };

    fetchUserData();
  }, [user]);

  // 3. Sync states to Supabase reactively
  useEffect(() => {
    if (user) {
      dbService.saveOnlineProfile(user.id, character);
    }
  }, [character, user]);

  useEffect(() => {
    if (user) {
      dbService.syncOnlineDailies(user.id, dailies);
    }
  }, [dailies, user]);

  useEffect(() => {
    if (user) {
      dbService.syncOnlineGuildBoard(user.id, guildBoard);
    }
  }, [guildBoard, user]);

  useEffect(() => {
    if (user) {
      dbService.syncOnlineInventory(user.id, inventory);
    }
  }, [inventory, user]);

  useEffect(() => {
    if (user) {
      dbService.syncOnlineRewards(user.id, rewards);
    }
  }, [rewards, user]);

  useEffect(() => {
    if (user) {
      dbService.syncOnlineLogs(user.id, logs);
    }
  }, [logs, user]);

  // Sync mute state with service
  useEffect(() => {
    audioService.setMute(isMuted);
    localStorage.setItem('life_rpg_muted', JSON.stringify(isMuted));
  }, [isMuted]);

  // Handle Dungeon Battle BGM loop
  useEffect(() => {
    if (currentPage === 'battle') {
      audioService.startBattleMusic();
    } else {
      audioService.stopBattleMusic();
    }
    return () => {
      audioService.stopBattleMusic();
    };
  }, [currentPage]);

  const toggleMute = () => {
    audioService.initAudio();
    setIsMuted(prev => !prev);
  };

  // 1-Second Interval Loop checking active anti-cheat countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      let hasUpdates = false;
      let expiredItemName = '';

      const updatedRewards = rewards.map(r => {
        if (r.cooldownUntil && r.cooldownUntil > 0) {
          if (currentTime >= r.cooldownUntil) {
            expiredItemName = r.name;
            hasUpdates = true;
            return { ...r, cooldownUntil: 0 };
          }
        }
        return r;
      });

      if (hasUpdates) {
        setRewards(updatedRewards);
        localStorage.setItem('life_rpg_rewards', JSON.stringify(updatedRewards));
        
        playAlarmSound();
        setAlarmModal({ show: true, rewardName: expiredItemName });
        
        const newLogs = addLogEntry(logs, `★ ALARM ★: Waktu santai untuk "${expiredItemName}" habis! Kembali bekerja!`);
        setLogs(newLogs);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rewards, logs]);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const playCombatEffect = (target, id, expGained, pointsGained) => {
    setCombatEffect({ active: true, id, type: 'attack', target, exp: expGained, points: pointsGained });
    audioService.playHitSound(); // Play attack SFX
    setTimeout(() => {
      setCombatEffect({ active: false, id: null, type: 'none', target: 'none', exp: 0, points: 0 });
    }, 800);
  };

  // Compute dynamic attributes including equipment bonuses
  const getAttributes = () => {
    let strBonus = 0;
    let agiBonus = 0;
    let intBonus = 0;

    if (inventory.weapon) strBonus += inventory.weapon.bonus.str || 0;
    if (inventory.armor) agiBonus += inventory.armor.bonus.agi || 0;
    if (inventory.ring) intBonus += inventory.ring.bonus.int || 0;

    return {
      str: character.str + strBonus,
      agi: character.agi + agiBonus,
      int: character.int + intBonus,
      baseStr: character.str,
      baseAgi: character.agi,
      baseInt: character.int,
      strBonus,
      agiBonus,
      intBonus
    };
  };

  const attributes = getAttributes();

  // Authentication Signin/Signup Actions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!emailInput.trim() || !passwordInput) {
      setAuthError('Email dan password tidak boleh kosong!');
      return;
    }

    try {
      setAuthLoading(true);
      if (isRegistering) {
        await dbService.signUpUser(emailInput.trim(), passwordInput);
        showToast('Pendaftaran berhasil! Akun Anda telah aktif.', 'success');
      } else {
        await dbService.signInUser(emailInput.trim(), passwordInput);
        showToast('Berhasil masuk!', 'success');
      }
      setEmailInput('');
      setPasswordInput('');
    } catch (err) {
      setAuthError(err.message || 'Terjadi kesalahan otentikasi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dbService.signOutUser();
      setUser(null);
      setCurrentPage('map');
      showToast('Berhasil keluar!', 'info');
    } catch (err) {
      showToast('Gagal keluar.', 'danger');
    }
  };

  // Handlers
  const handleCompleteDaily = (id) => {
    const res = triggerCompleteDaily(dailies, character, id);
    if (res.rewarded) {
      setDailies(res.dailies);
      setCharacter(res.character);
      playCombatEffect('enemy', id, 10, 10);
      
      const newLogs = addLogEntry(logs, `Mengalahkan Slime! Menyelesaikan Daily: "${res.taskName}" (+10 EXP, +10 GP)`);
      setLogs(newLogs);

      if (res.leveledUp) {
        triggerLevelUpCelebration(res.character.level, res.character.title, res.attributesIncreased, newLogs);
      } else {
        showToast('Daily Quest selesai! +10 XP & +10 Gold', 'success');
      }
    }
  };

  const handleAddDaily = (name) => {
    const updated = addDailyTask(dailies, name);
    setDailies(updated);
    const newLogs = addLogEntry(logs, `Quest Harian baru terdaftar: "${name}"`);
    setLogs(newLogs);
    showToast('Quest Harian ditambahkan!');
  };

  const handleDeleteDaily = (id) => {
    const target = dailies.find(d => d.id === id);
    const updated = deleteDailyTask(dailies, id);
    setDailies(updated);
    if (target) {
      const newLogs = addLogEntry(logs, `Quest Harian dihapus: "${target.name}"`);
      setLogs(newLogs);
    }
  };

  const handleAddSpecialQuest = (name, difficulty) => {
    const updated = triggerAddSpecialQuest(guildBoard, name, difficulty);
    setGuildBoard(updated);
    
    const newQuest = updated[updated.length - 1];
    setActiveBossId(newQuest.id);

    let diffName = difficulty === 'hard' ? 'Naga Raksasa (BOSS)' : difficulty === 'medium' ? 'Orc Elit (MEDIUM)' : 'Slime Liar (EASY)';
    const newLogs = addLogEntry(logs, `Bos dipanggil ke Guild Board: "${name}" (${diffName})`);
    setLogs(newLogs);
    showToast(`Bos dipanggil ke Board!`);
  };

  const handleDefeatSpecialQuest = (id) => {
    const res = triggerDefeatSpecialQuest(guildBoard, character, id);
    if (res.rewarded) {
      setGuildBoard(res.guildBoard);
      setCharacter(res.character);
      playCombatEffect('enemy', id, res.quest.expReward, res.quest.pointsReward);

      if (activeBossId === id) {
        setActiveBossId(res.guildBoard[0]?.id || null);
      }

      let enemyLabel = res.quest.difficulty === 'hard' ? 'BOSS NAGA' : res.quest.difficulty === 'medium' ? 'ORC ELIT' : 'SLIME';
      const newLogs = addLogEntry(
        logs, 
        `MENGALAHKAN ${enemyLabel}! Menyelesaikan Boss Quest: "${res.quest.name}" (+${res.quest.expReward} EXP, +${res.quest.pointsReward} GP)`
      );
      setLogs(newLogs);

      if (res.leveledUp) {
        triggerLevelUpCelebration(res.character.level, res.character.title, res.attributesIncreased, newLogs);
      } else {
        showToast(`Tantangan K.O.! +${res.quest.expReward} XP & +${res.quest.pointsReward} Gold`, 'success');
      }
    }
  };

  const handleRedeemReward = (id) => {
    const res = triggerRedeemReward(rewards, character, id);
    if (res.success) {
      setRewards(res.rewards);
      setCharacter(res.character);
      
      const newLogs = addLogEntry(logs, `Menukarkan Tavern: "${res.reward.name}" (-${res.reward.cost} GP)`);
      setLogs(newLogs);
      showToast(`Menikmati reward: ${res.reward.name}!`, 'success');
    } else {
      showToast(res.error, 'danger');
    }
  };

  const handleAddReward = (name, cost) => {
    const updated = addCustomReward(rewards, name, cost);
    setRewards(updated);
    const newLogs = addLogEntry(logs, `Menu Tavern baru ditambahkan: "${name}" seharga ${cost} GP`);
    setLogs(newLogs);
    showToast('Menu Tavern ditambahkan!');
  };

  const handleDeleteReward = (id) => {
    const target = rewards.find(r => r.id === id);
    const updated = deleteCustomReward(rewards, id);
    setRewards(updated);
    if (target) {
      const newLogs = addLogEntry(logs, `Menu Tavern dihapus: "${target.name}"`);
      setLogs(newLogs);
    }
  };

  const handleBuyEquipment = (item) => {
    if (character.points < item.cost) {
      showToast('Gold Anda tidak mencukupi!', 'danger');
      return;
    }

    const updatedChar = {
      ...character,
      points: character.points - item.cost
    };
    setCharacter(updatedChar);
    localStorage.setItem('life_rpg_character', JSON.stringify(updatedChar));

    const updatedInv = {
      ...inventory,
      [item.type]: item
    };
    setInventory(updatedInv);
    localStorage.setItem('life_rpg_inventory', JSON.stringify(updatedInv));

    let statBoostText = '';
    if (item.type === 'weapon') statBoostText = `+${item.bonus.str} STR`;
    if (item.type === 'armor') statBoostText = `+${item.bonus.agi} AGI`;
    if (item.type === 'ring') statBoostText = `+${item.bonus.int} INT`;

    const newLogs = addLogEntry(logs, `⚔️ MEMBELI PERALATAN: "${item.name}" (${statBoostText}) seharga ${item.cost} GP!`);
    setLogs(newLogs);
    
    audioService.playLevelUpSound();
    showToast(`Berhasil menempa ${item.name}!`, 'success');
  };

  const uncompletedDailies = dailies.filter(d => !d.completed);
  const activeBoss = guildBoard.find(q => q.id === activeBossId) || guildBoard[0] || null;

  // -----------------------------------------------------------------
  // RENDER RAG / LOADING / AUTH PANELS
  // -----------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-pressstart text-[10px] select-none relative">
        <div className="absolute inset-0 pointer-events-none crt-effect z-30"></div>
        <div className="animate-pulse">LOADING ONLINE SESSION...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans select-none relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none crt-effect z-30"></div>
        
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 select-none">
          <img 
            src="assets/world_map.png" 
            alt="World Map Background" 
            className="w-full h-full object-cover filter blur-[2px] scale-105"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
        </div>

        <div className="relative z-10 w-full max-w-sm p-6 bg-zinc-900/95 border-4 border-double border-amber-600 pixel-shadow flex flex-col gap-4 text-center">
          <div className="flex flex-col gap-1 items-center">
            <h1 className="text-[12px] font-black text-amber-500 font-pressstart tracking-wider flex items-center gap-1.5 select-none animate-pulse">
              ⚔️ LIFE-RPG
            </h1>
            <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest font-pressstart font-mono">
              Database Sync Login
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-3.5 mt-2">
            {authError && (
              <div className="bg-red-950/70 border border-red-900 text-red-400 text-[10px] px-3 py-2 text-left font-mono font-bold flex items-center gap-1.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="break-words">{authError}</span>
              </div>
            )}

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest font-pressstart">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="knight@liferpg.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-zinc-950 border-2 border-zinc-800 text-sm px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-750 font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest font-pressstart">SECRET PASSWORD</label>
              <input
                type="password"
                placeholder="********"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="bg-zinc-950 border-2 border-zinc-800 text-sm px-3 py-2 text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-750 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 border-2 border-amber-400 text-[9px] font-bold text-zinc-950 py-2.5 mt-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none disabled:opacity-50"
            >
              {isRegistering ? 'SIGN UP NEW ACCOUNT' : 'ENTER WORLD'}
            </button>
          </form>

          <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[8px] font-bold font-pressstart">
            <span className="text-zinc-500 uppercase">
              {isRegistering ? 'MEMBER?' : 'NEW HERO?'}
            </span>
            <button
              onClick={() => {
                setAuthError('');
                setIsRegistering(!isRegistering);
              }}
              className="text-amber-400 hover:text-amber-300 focus:outline-none py-1.5 px-2 border border-transparent hover:border-zinc-800"
            >
              {isRegistering ? 'LOGIN' : 'SIGN UP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // MAIN GAME SCREEN (AUTHENTICATED)
  // -----------------------------------------------------------------
  return (
    <div className="w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none relative">
      
      <div className="absolute inset-0 pointer-events-none crt-effect z-30"></div>

      {/* Global Sound Control */}
      <button
        onClick={toggleMute}
        className="fixed top-4 right-4 z-40 p-2 bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-400 hover:text-amber-400 pixel-btn pixel-shadow-sm transition-all focus:outline-none flex items-center justify-center"
        title={isMuted ? "Unmute Audio" : "Mute Audio"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 shrink-0" />
        ) : (
          <Volume2 className="w-4 h-4 shrink-0 animate-pulse text-amber-500" />
        )}
      </button>

      {/* ======================================================== */}
      {/* 1. PERSISTENT DESKTOP ONLY SIDEBAR */}
      {/* ======================================================== */}
      {currentPage !== 'map' && (
        <div className="hidden md:flex w-80 bg-zinc-950 border-r-4 border-zinc-800 p-4 flex-col gap-4 shrink-0 z-20 overflow-y-auto max-h-screen">
          
          <div className="flex flex-col gap-1">
            <h1 className="text-[12px] font-black text-amber-500 tracking-wider font-pressstart flex items-center gap-1.5 select-none">
              ⚔️ LIFE-RPG
            </h1>
            <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Character Client v1.2</p>
          </div>

          <StatusHud character={character} compact={true} />
          
          <StatsPanel character={character} attributes={attributes} inventory={inventory} />
          
          {/* Quick Travel back to Map */}
          <button
            onClick={() => {
              audioService.initAudio();
              setCurrentPage('map');
            }}
            className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-[8px] font-bold text-amber-400 flex items-center justify-center gap-2 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none mb-1"
          >
            <MapIcon className="w-4 h-4 text-amber-500" />
            WORLD MAP
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-red-950/80 hover:bg-red-900/80 border-2 border-red-800 text-[8px] font-bold text-red-400 flex items-center justify-center gap-2 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none mt-auto"
          >
            LOGOUT USER
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE / CONTENT PANEL */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        
        {/* WORLD MAP PAGE */}
        {currentPage === 'map' && (
          <div className="relative w-full h-full flex flex-col justify-between items-center z-10 animate-fade-in text-zinc-100 p-4">
            
            {/* World Map Backdrop */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
              <img 
                src="assets/world_map.png" 
                alt="World Map Background" 
                className="w-full h-full object-cover opacity-70 filter contrast-110 brightness-[85%] saturate-[85%]"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85"></div>
            </div>

            {/* Top Title HUD */}
            <div className="w-full flex justify-between items-center bg-zinc-950/90 border-4 border-double border-amber-600 p-3.5 pixel-shadow z-10 max-w-5xl mt-2">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-[10px] sm:text-[11px] font-black text-amber-400 tracking-widest uppercase font-pressstart">
                  WORLD MAP
                </h1>
                <p className="text-[8px] text-zinc-550 uppercase tracking-wider font-semibold font-mono">
                  Select your destination
                </p>
              </div>
              <div className="bg-zinc-900 px-2.5 py-1 border border-zinc-700 text-yellow-400 text-[8px] sm:text-[9px] font-bold font-pressstart flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-500" />
                {character.points} <span className="text-[6px] text-zinc-500 font-pressstart">GP</span>
              </div>
            </div>

            {/* Travel Pin Nodes */}
            <div className="flex-1 w-full max-w-5xl relative my-4 flex items-center justify-center z-10 min-h-0">
              
              {/* Guild Hall Pin */}
              <button
                onClick={() => {
                  audioService.initAudio();
                  setCurrentPage('main');
                }}
                className="absolute top-[18%] left-[10%] sm:left-[20%] flex flex-col items-center gap-1.5 group focus:outline-none"
              >
                <div className="w-24 h-24 sm:w-36 sm:h-36 flex items-center justify-center bg-amber-950/80 border-2 border-amber-600 hover:border-yellow-400 pixel-btn pixel-shadow hover:scale-105 transition-all">
                  <PixelArt type="hero" scale={0.55} className="animate-bounce" />
                </div>
                <span className="bg-zinc-950/90 border border-zinc-800 text-[7px] sm:text-[8px] text-amber-400 font-bold px-2 py-0.5 uppercase tracking-wide font-pressstart group-hover:border-yellow-500">
                  GUILD STATUS
                </span>
              </button>

              {/* Dungeon Pin */}
              <button
                onClick={() => {
                  audioService.initAudio();
                  setCurrentPage('battle');
                }}
                className="absolute top-[45%] right-[10%] sm:right-[22%] flex flex-col items-center gap-1.5 group focus:outline-none"
              >
                <div className="w-24 h-24 sm:w-36 sm:h-36 flex items-center justify-center bg-red-950/85 border-2 border-red-650 hover:border-red-400 pixel-btn pixel-shadow hover:scale-105 transition-all">
                  <Swords className="w-10 h-10 sm:w-14 sm:h-14 text-red-500 animate-pulse" />
                </div>
                <span className="bg-zinc-950/90 border border-zinc-800 text-[7px] sm:text-[8px] text-red-400 font-bold px-2 py-0.5 uppercase tracking-wide font-pressstart group-hover:border-red-500">
                  DUNGEON BATTLE
                </span>
              </button>

              {/* Tavern Pin */}
              <button
                onClick={() => {
                  audioService.initAudio();
                  setCurrentPage('shop');
                }}
                className="absolute bottom-[20%] left-[30%] sm:left-[45%] flex flex-col items-center gap-1.5 group focus:outline-none"
              >
                <div className="w-24 h-24 sm:w-36 sm:h-36 flex items-center justify-center bg-indigo-950/80 border-2 border-indigo-650 hover:border-indigo-400 pixel-btn pixel-shadow hover:scale-105 transition-all">
                  <ShoppingBag className="w-10 h-10 sm:w-14 sm:h-14 text-indigo-400" />
                </div>
                <span className="bg-zinc-950/90 border border-zinc-800 text-[7px] sm:text-[8px] text-indigo-400 font-bold px-2 py-0.5 uppercase tracking-wide font-pressstart group-hover:border-indigo-500">
                  TAVERN SHOP
                </span>
              </button>
            </div>

            {/* Map Footer Info */}
            <div className="w-full max-w-5xl bg-zinc-950/90 border border-zinc-850 px-4 py-2 flex justify-between items-center text-[7px] sm:text-[8px] text-zinc-550 font-bold uppercase tracking-wider mb-2 z-10 font-mono">
              <span>PLAYER: ADLAN (LEVEL {character.level})</span>
              <span>GEAR: {inventory.weapon ? 'EQUIPPED' : 'BASIC'}</span>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* ACTIVE PAGES GRID: IN-GAME WORKSPACE */}
        {/* -------------------------------------------------------- */}
        {currentPage !== 'map' && (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-4 p-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-16 md:pb-4">
            
            {/* Center Area (Tab contents) */}
            <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
              
              {/* GUILD HALL VIEW */}
              {currentPage === 'main' && (
                <div className="relative w-full h-full flex flex-col justify-start items-center gap-4 z-10 animate-fade-in overflow-y-auto pb-4">
                  <GuildHallBg />
                  
                  {/* On mobile, we render the full Character details directly here since Sidebar is hidden */}
                  <div className="md:hidden w-full flex flex-col gap-3 z-10 shrink-0">
                    <StatusHud character={character} />
                    <StatsPanel character={character} attributes={attributes} inventory={inventory} />
                    
                    {/* Logout Button for mobile */}
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 px-3 bg-red-950/85 hover:bg-red-900/85 border-2 border-red-800 text-[8px] font-bold text-red-400 flex items-center justify-center gap-2 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
                    >
                      LOGOUT USER
                    </button>
                  </div>

                  {/* Hero Card layout */}
                  <div className="relative flex flex-col items-center justify-center p-6 bg-zinc-950/85 border-4 border-double border-amber-600 pixel-shadow max-w-md w-full text-center mt-2 z-10">
                    <div className="absolute -top-4 bg-amber-800 border-2 border-amber-500 text-amber-300 px-4 py-1.5 text-[8px] font-bold uppercase tracking-wider font-pressstart">
                      GUILD MEMBER
                    </div>

                    <div className="h-44 w-44 sm:h-56 sm:w-56 flex items-center justify-center mb-3 mt-2">
                      <PixelArt type="hero" scale={1.2} className="animate-bounce" />
                    </div>

                    <span className="text-lg font-black text-amber-400 block tracking-widest uppercase font-pressstart">
                      ADLAN
                    </span>
                    <span className="text-[8px] text-zinc-500 uppercase font-semibold font-pressstart block tracking-widest mt-0.5">
                      {character.title}
                    </span>
                  </div>
                </div>
              )}

              {/* DUNGEON BATTLE VIEW */}
              {currentPage === 'battle' && (
                <div className="flex-1 flex flex-col gap-4 min-h-0 animate-fade-in">
                  <DungeonArena 
                    uncompletedDailies={uncompletedDailies} 
                    activeBoss={activeBoss}
                    combatEffect={combatEffect}
                    className="shrink-0"
                  />
                  
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <QuestList 
                      dailies={dailies}
                      guildBoard={guildBoard}
                      onCompleteDaily={handleCompleteDaily}
                      onAddDaily={handleAddDaily}
                      onDeleteDaily={handleDeleteDaily}
                      onAddSpecialQuest={handleAddSpecialQuest}
                      onDefeatSpecialQuest={handleDefeatSpecialQuest}
                      onSetActiveEnemy={(enemy) => {
                        const foundBoss = guildBoard.find(q => q.id === enemy.id);
                        if (foundBoss) setActiveBossId(foundBoss.id);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAVERN SHOP VIEW */}
              {currentPage === 'shop' && (
                <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
                  {/* On mobile, show status HUD above shop for context */}
                  <div className="md:hidden mb-2.5">
                    <StatusHud character={character} compact={true} />
                  </div>
                  <RewardShop 
                    rewards={rewards}
                    points={character.points}
                    inventory={inventory}
                    armoryItems={ARMORY_ITEMS}
                    onRedeemReward={handleRedeemReward}
                    onBuyEquipment={handleBuyEquipment}
                    onAddReward={handleAddReward}
                    onDeleteReward={handleDeleteReward}
                  />
                </div>
              )}

              {/* MOBILE ONLY JOURNAL LOGS VIEW */}
              {currentPage === 'logs' && (
                <div className="md:hidden flex-1 flex flex-col min-h-0 animate-fade-in">
                  <ActionLog logs={logs} />
                </div>
              )}

            </div>

            {/* Right Side: Adventure Log Box (Visible only on desktop/large screens) */}
            <div className="hidden lg:flex lg:col-span-1 flex-col shrink-0 lg:min-h-0">
              <ActionLog logs={logs} />
            </div>

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 3. STICKY MOBILE BOTTOM NAVIGATION BAR */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t-4 border-zinc-800 flex justify-around items-center z-30 font-pressstart text-[7px] px-2">
        <button
          onClick={() => {
            audioService.initAudio();
            setCurrentPage('map');
          }}
          className={`flex flex-col items-center gap-1 focus:outline-none py-1.5 px-2 transition-colors ${currentPage === 'map' ? 'text-amber-400' : 'text-zinc-650'}`}
        >
          <MapIcon className="w-5 h-5 shrink-0" />
          <span>MAP</span>
        </button>
        <button
          onClick={() => {
            audioService.initAudio();
            setCurrentPage('main');
          }}
          className={`flex flex-col items-center gap-1 focus:outline-none py-1.5 px-2 transition-colors ${currentPage === 'main' ? 'text-amber-400' : 'text-zinc-650'}`}
        >
          <Trophy className="w-5 h-5 shrink-0" />
          <span>HERO</span>
        </button>
        <button
          onClick={() => {
            audioService.initAudio();
            setCurrentPage('battle');
          }}
          className={`flex flex-col items-center gap-1 focus:outline-none py-1.5 px-2 transition-colors ${currentPage === 'battle' ? 'text-amber-400' : 'text-zinc-650'}`}
        >
          <Swords className="w-5 h-5 shrink-0 animate-pulse" />
          <span>BATTLE</span>
        </button>
        <button
          onClick={() => {
            audioService.initAudio();
            setCurrentPage('shop');
          }}
          className={`flex flex-col items-center gap-1 focus:outline-none py-1.5 px-2 transition-colors ${currentPage === 'shop' ? 'text-amber-400' : 'text-zinc-650'}`}
        >
          <ShoppingBag className="w-5 h-5 shrink-0" />
          <span>TAVERN</span>
        </button>
        <button
          onClick={() => {
            audioService.initAudio();
            setCurrentPage('logs');
          }}
          className={`flex flex-col items-center gap-1 focus:outline-none py-1.5 px-2 transition-colors ${currentPage === 'logs' ? 'text-amber-400' : 'text-zinc-650'}`}
        >
          <Terminal className="w-5 h-5 shrink-0" />
          <span>JOURNAL</span>
        </button>
      </div>

      {/* LEVEL UP MODAL */}
      {levelUpModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="pixel-border-primary bg-zinc-950 max-w-xs w-full p-6 flex flex-col items-center text-center gap-4 pixel-shadow relative crt-effect">
            <div 
              className="absolute top-2 right-2 border-2 border-zinc-700 text-zinc-505 hover:text-white px-2 py-0.5 text-[8px] font-bold cursor-pointer font-pressstart" 
              onClick={() => setLevelUpModal({ show: false, level: 1, title: '', statsUp: false })}
            >
              X
            </div>

            <Trophy className="w-12 h-12 text-amber-500 animate-bounce" />
            
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-pressstart animate-pulse">
                LEVEL UP!
              </h2>
              <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">You grew stronger!</p>
            </div>

            <div className="border-y-2 border-zinc-800 py-3.5 w-full my-1 flex flex-col items-center gap-2">
              <div>
                <p className="text-[11px] font-bold text-white mb-1 font-pressstart">LEVEL {levelUpModal.level}</p>
                <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[7px] px-2 py-0.5 font-bold uppercase font-pressstart">
                  {levelUpModal.title}
                </span>
              </div>

              {levelUpModal.statsUp && (
                <div className="mt-2 pt-2 border-t border-zinc-855 w-full">
                  <span className="text-[7px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5 font-pressstart">
                    ★ Attributes Grew! ★
                  </span>
                  <div className="flex justify-center gap-2.5 text-[9px] font-bold text-zinc-300 font-mono">
                    <span className="text-red-400">STR +2</span>
                    <span className="text-sky-400">AGI +2</span>
                    <span className="text-purple-400">INT +2</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              New stats recorded. Return to the adventure!
            </p>

            <button
              onClick={() => setLevelUpModal({ show: false, level: 1, title: '', statsUp: false })}
              className="w-full bg-amber-600 hover:bg-amber-500 border-2 border-amber-400 text-[8px] font-bold text-zinc-950 py-2.5 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* ALARM OVERLAY MODAL */}
      {alarmModal.show && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="pixel-border-danger bg-zinc-950 max-w-xs w-full p-6 flex flex-col items-center text-center gap-4 pixel-shadow relative crt-effect">
            
            <div className="w-12 h-12 bg-red-950/50 border-2 border-red-500 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-[9px] font-bold text-red-500 uppercase tracking-widest animate-pulse font-pressstart">
                COOLDOWN OVER!
              </h2>
              <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">BACK TO WORK!</p>
            </div>

            <div className="border-y-2 border-zinc-800 py-3.5 w-full my-1 bg-zinc-900 px-3">
              <span className="text-[8px] text-zinc-500 font-bold block mb-1">REST TIMER EXPIRED FOR:</span>
              <p className="text-[10px] font-bold text-yellow-400 uppercase font-mono truncate">
                "{alarmModal.rewardName}"
              </p>
            </div>

            <p className="text-[11px] text-zinc-450 leading-relaxed uppercase">
              Your break has ended. Return to completing productivity quests!
            </p>

            <button
              onClick={() => setAlarmModal({ show: false, rewardName: '' })}
              className="w-full bg-red-700 hover:bg-red-600 border-2 border-red-500 text-[8px] font-bold text-white py-2.5 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* TOAST ALERTS */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-[280px] w-full">
          <div className={`px-4 py-3 border-2 text-[9px] text-center font-bold pixel-shadow-sm uppercase font-pressstart ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' : toast.type === 'danger' ? 'bg-red-950/80 border-red-500 text-red-400' : 'bg-zinc-900 border-zinc-500 text-zinc-300'}`}>
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
