/**
 * rpgService.js
 * 
 * Manages all game state logic, leveling formulas, reward processing,
 * and data synchronization (currently using localStorage).
 */

const STORAGE_KEYS = {
  CHARACTER: 'life_rpg_character',
  DAILIES: 'life_rpg_dailies',
  GUILD_BOARD: 'life_rpg_guild_board',
  REWARDS: 'life_rpg_rewards',
  LOGS: 'life_rpg_logs',
  LAST_SAVED_DATE: 'life_rpg_last_saved_date'
};

const DEFAULT_DAILIES = [
  { id: 'd1', name: 'Belajar 1-2 Video Course', completed: false },
  { id: 'd2', name: 'Jalan 10k Langkah / Gym', completed: false },
  { id: 'd3', name: 'Belanja ke Pasar', completed: false },
  { id: 'd4', name: 'Mengantar Adik Sekolah', completed: false },
  { id: 'd5', name: 'Apply 3-5 Lowongan Kerja', completed: false } // Added for fresh graduate job hunt
];

const DEFAULT_REWARDS = [
  { 
    id: 'r1', 
    name: '1 Match Mobile Legends', 
    cost: 50, 
    purchases: 0, 
    antiCheat: true, 
    cooldownDuration: 30 * 60 * 1000, // 30 minutes in ms
    cooldownUntil: 0,
    claimedToday: false
  },
  { 
    id: 'r2', 
    name: '15 Menit Scrolling Medsos', 
    cost: 20, 
    purchases: 0, 
    antiCheat: true, 
    cooldownDuration: 30 * 60 * 1000, 
    cooldownUntil: 0,
    claimedToday: false
  },
  { 
    id: 'r3', 
    name: '1 Episode Anime', 
    cost: 40, 
    purchases: 0, 
    antiCheat: true, 
    cooldownDuration: 30 * 60 * 1000, 
    cooldownUntil: 0,
    claimedToday: false
  },
  { 
    id: 'r4', 
    name: 'Cheat Meal / Snack', 
    cost: 80, 
    purchases: 0, 
    antiCheat: true, 
    cooldownDuration: 30 * 60 * 1000, 
    cooldownUntil: 0,
    claimedToday: false
  }
];

const DEFAULT_CHARACTER = {
  level: 1,
  exp: 0,
  points: 0,
  title: 'Novice',
  str: 5,
  agi: 5,
  int: 5
};

const DEFAULT_LOGS = [
  { id: 'l1', timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), text: 'Petualangan dimulai! Bersiaplah menyelesaikan Quest.' }
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

/**
 * Loads all game data, checks for daily resets.
 */
export const loadRPGData = () => {
  try {
    const rawChar = localStorage.getItem(STORAGE_KEYS.CHARACTER);
    const rawDailies = localStorage.getItem(STORAGE_KEYS.DAILIES);
    const rawGuild = localStorage.getItem(STORAGE_KEYS.GUILD_BOARD);
    const rawRewards = localStorage.getItem(STORAGE_KEYS.REWARDS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    const lastSavedDate = localStorage.getItem(STORAGE_KEYS.LAST_SAVED_DATE);

    let character = rawChar ? JSON.parse(rawChar) : { ...DEFAULT_CHARACTER };
    let dailies = rawDailies ? JSON.parse(rawDailies) : [ ...DEFAULT_DAILIES ];
    let guildBoard = rawGuild ? JSON.parse(rawGuild) : [];
    let rewards = rawRewards ? JSON.parse(rawRewards) : [ ...DEFAULT_REWARDS ];
    let actionLogs = rawLogs ? JSON.parse(rawLogs) : [ ...DEFAULT_LOGS ];

    // Safeguards against null values from JSON.parse (corrupted localStorage)
    if (!character || typeof character !== 'object') character = { ...DEFAULT_CHARACTER };
    if (!Array.isArray(dailies)) dailies = [ ...DEFAULT_DAILIES ];
    if (!Array.isArray(guildBoard)) guildBoard = [];
    if (!Array.isArray(rewards)) rewards = [ ...DEFAULT_REWARDS ];
    if (!Array.isArray(actionLogs)) actionLogs = [ ...DEFAULT_LOGS ];

    // Merge loaded rewards with DEFAULT_REWARDS to ensure antiCheat properties exist
    rewards = DEFAULT_REWARDS.map(defaultReward => {
      const existing = rewards.find(r => r.id === defaultReward.id || r.name === defaultReward.name);
      if (existing) {
        return {
          ...defaultReward,
          purchases: existing.purchases || 0,
          claimedToday: existing.claimedToday !== undefined ? existing.claimedToday : defaultReward.claimedToday,
          cooldownUntil: existing.cooldownUntil !== undefined ? existing.cooldownUntil : defaultReward.cooldownUntil
        };
      }
      return defaultReward;
    }).concat(
      // Keep custom rewards added by the user
      rewards.filter(r => !DEFAULT_REWARDS.some(d => d.id === r.id || d.name === r.name))
    );

    // Ensure character has attributes
    if (character.str === undefined) character.str = 5;
    if (character.agi === undefined) character.agi = 5;
    if (character.int === undefined) character.int = 5;

    // Daily Reset Logic
    const today = getTodayDateString();
    if (lastSavedDate !== today) {
      // Reset all daily completions
      dailies = dailies.map(d => ({ ...d, completed: false }));
      
      // Reset claimedToday for rewards, but keep active cooldowns
      rewards = rewards.map(r => ({
        ...r,
        claimedToday: false
      }));

      // Log daily reset
      const resetLog = {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        text: 'Hari baru telah tiba! Semua Daily Grinding dan jatah belanja harian di-reset.'
      };
      actionLogs = [resetLog, ...actionLogs].slice(0, 50);

      localStorage.setItem(STORAGE_KEYS.DAILIES, JSON.stringify(dailies));
      localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(actionLogs));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_DATE, today);
    }

    return { character, dailies, guildBoard, rewards, actionLogs };
  } catch (error) {
    console.error("Failed to load RPG data from localStorage", error);
    return {
      character: { ...DEFAULT_CHARACTER },
      dailies: [ ...DEFAULT_DAILIES ],
      guildBoard: [],
      rewards: [ ...DEFAULT_REWARDS ],
      actionLogs: [ ...DEFAULT_LOGS ]
    };
  }
};

/**
 * Saves specific parts of RPG data
 */
export const saveRPGDataPart = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED_DATE, getTodayDateString());
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
};

/**
 * Calculates level up and attributes growth mechanics
 */
export const gainRewards = (character, amountExp, amountGold) => {
  let level = character.level;
  let exp = character.exp + amountExp;
  let points = character.points + amountGold;
  let str = character.str || 5;
  let agi = character.agi || 5;
  let int = character.int || 5;
  let leveledUp = false;
  let attributesIncreased = false;

  const oldLevel = character.level;

  // Level Up Formula: EXP needed = level * 100
  while (exp >= level * 100) {
    exp -= level * 100;
    level += 1;
    leveledUp = true;
  }

  // Attributes growth logic: Every 3 level milestones (e.g. going past level 3, 6, 9)
  const oldMilestones = Math.floor(oldLevel / 3);
  const newMilestones = Math.floor(level / 3);
  if (newMilestones > oldMilestones) {
    const diff = newMilestones - oldMilestones;
    str += diff * 2;
    agi += diff * 2;
    int += diff * 2;
    attributesIncreased = true;
  }

  let title = 'Novice';
  if (level >= 15) {
    title = 'Legendary Hero';
  } else if (level >= 10) {
    title = 'Paladin';
  } else if (level >= 5) {
    title = 'Knight';
  }

  const updatedChar = { level, exp, points, title, str, agi, int };
  saveRPGDataPart('CHARACTER', updatedChar);

  return { character: updatedChar, leveledUp, attributesIncreased };
};

/**
 * Marks a daily task completed and issues standard reward (+10 EXP, +10 Points)
 */
export const triggerCompleteDaily = (dailies, character, id) => {
  let dailyTarget = null;
  const updatedDailies = dailies.map(d => {
    if (d.id === id) {
      dailyTarget = d;
      return { ...d, completed: true };
    }
    return d;
  });

  if (!dailyTarget || dailyTarget.completed) {
    return { dailies, character, rewarded: false };
  }

  saveRPGDataPart('DAILIES', updatedDailies);
  
  // Calculate XP and Gold reward
  const { character: updatedChar, leveledUp, attributesIncreased } = gainRewards(character, 10, 10);

  return {
    dailies: updatedDailies,
    character: updatedChar,
    leveledUp,
    attributesIncreased,
    rewarded: true,
    taskName: dailyTarget.name
  };
};

/**
 * Adds a new daily task manually
 */
export const addDailyTask = (dailies, name) => {
  const newDaily = {
    id: `d_${Date.now()}`,
    name,
    completed: false
  };
  const updated = [...dailies, newDaily];
  saveRPGDataPart('DAILIES', updated);
  return updated;
};

/**
 * Deletes a daily task
 */
export const deleteDailyTask = (dailies, id) => {
  const updated = dailies.filter(d => d.id !== id);
  saveRPGDataPart('DAILIES', updated);
  return updated;
};

/**
 * Adds a special quest (boss) with custom difficulty
 */
export const triggerAddSpecialQuest = (guildBoard, name, difficulty) => {
  let expReward = 15;
  let pointsReward = 10;
  let enemyType = 'slime';

  if (difficulty === 'medium') {
    expReward = 40;
    pointsReward = 25;
    enemyType = 'orc';
  } else if (difficulty === 'hard') {
    expReward = 100;
    pointsReward = 50;
    enemyType = 'dragon';
  }

  const newQuest = {
    id: `g_${Date.now()}`,
    name,
    difficulty,
    expReward,
    pointsReward,
    enemyType,
    createdDate: getTodayDateString()
  };

  const updated = [...guildBoard, newQuest];
  saveRPGDataPart('GUILD_BOARD', updated);
  return updated;
};

/**
 * Defeats a boss/special quest, awards points, and deletes the quest
 */
export const triggerDefeatSpecialQuest = (guildBoard, character, id) => {
  const questToDefeat = guildBoard.find(q => q.id === id);
  if (!questToDefeat) {
    return { guildBoard, character, rewarded: false };
  }

  const updatedGuildBoard = guildBoard.filter(q => q.id !== id);
  saveRPGDataPart('GUILD_BOARD', updatedGuildBoard);

  const { character: updatedChar, leveledUp, attributesIncreased } = gainRewards(
    character, 
    questToDefeat.expReward, 
    questToDefeat.pointsReward
  );

  return {
    guildBoard: updatedGuildBoard,
    character: updatedChar,
    leveledUp,
    attributesIncreased,
    rewarded: true,
    quest: questToDefeat
  };
};

/**
 * Purchases/Redeems a reward with points, handling timers & double verification
 */
export const triggerRedeemReward = (rewards, character, id) => {
  const rewardIndex = rewards.findIndex(r => r.id === id);
  if (rewardIndex === -1) {
    return { rewards, character, success: false, error: 'Reward tidak ditemukan!' };
  }

  const rewardToRedeem = rewards[rewardIndex];

  // Anti-cheat verification
  if (rewardToRedeem.antiCheat) {
    // 1. Check if claimed today
    if (rewardToRedeem.claimedToday) {
      return { rewards, character, success: false, error: 'Sudah diambil hari ini!' };
    }
    // 2. Check if cooldown timer is active
    if (rewardToRedeem.cooldownUntil && rewardToRedeem.cooldownUntil > Date.now()) {
      return { rewards, character, success: false, error: 'Cooldown sedang berjalan!' };
    }
  }

  if (character.points < rewardToRedeem.cost) {
    return { rewards, character, success: false, error: 'Gold Anda tidak mencukupi!' };
  }

  const updatedCharacter = {
    ...character,
    points: character.points - rewardToRedeem.cost
  };
  saveRPGDataPart('CHARACTER', updatedCharacter);

  // Apply cooldown and claimed today triggers
  const updatedRewards = rewards.map((r, idx) => {
    if (idx === rewardIndex) {
      return { 
        ...r, 
        purchases: r.purchases + 1,
        claimedToday: r.antiCheat ? true : r.claimedToday,
        cooldownUntil: r.antiCheat ? Date.now() + r.cooldownDuration : r.cooldownUntil
      };
    }
    return r;
  });
  saveRPGDataPart('REWARDS', updatedRewards);

  return {
    rewards: updatedRewards,
    character: updatedCharacter,
    success: true,
    reward: rewardToRedeem
  };
};

/**
 * Adds a new custom reward
 */
export const addCustomReward = (rewards, name, cost) => {
  const newReward = {
    id: `r_${Date.now()}`,
    name,
    cost: parseInt(cost, 10) || 10,
    purchases: 0,
    antiCheat: false,
    cooldownUntil: 0,
    claimedToday: false
  };
  const updated = [...rewards, newReward];
  saveRPGDataPart('REWARDS', updated);
  return updated;
};

/**
 * Deletes a reward
 */
export const deleteCustomReward = (rewards, id) => {
  const updated = rewards.filter(r => r.id !== id);
  saveRPGDataPart('REWARDS', updated);
  return updated;
};

/**
 * Adds a visual game action log
 */
export const addLogEntry = (logs, text) => {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const newLog = {
    id: `l_${Date.now()}`,
    timestamp: time,
    text
  };
  const updated = [newLog, ...logs].slice(0, 50);
  saveRPGDataPart('LOGS', updated);
  return updated;
};
