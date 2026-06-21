import { supabase } from './supabaseClient';

/**
 * Authentication Services
 */
export const signUpUser = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Initialize a default profile and starter tables for the new user
  if (data?.user) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          level: 1,
          exp: 0,
          points: 0,
          title: 'Novice',
          str: 5,
          agi: 5,
          int: 5
        });
      if (profileError) console.error("Error creating profile row", profileError);
      
      const { error: invError } = await supabase
        .from('inventory')
        .insert({
          user_id: data.user.id,
          weapon_id: null,
          armor_id: null,
          ring_id: null
        });
      if (invError) console.error("Error creating inventory row", invError);

      const defaultDailies = [
        { user_id: data.user.id, name: 'Belajar 1-2 Video Course', completed: false },
        { user_id: data.user.id, name: 'Jalan 10k Langkah / Gym', completed: false },
        { user_id: data.user.id, name: 'Belanja ke Pasar', completed: false },
        { user_id: data.user.id, name: 'Mengantar Adik Sekolah', completed: false },
        { user_id: data.user.id, name: 'Apply 3-5 Lowongan Kerja', completed: false }
      ];
      await supabase.from('dailies').insert(defaultDailies);

      const defaultRewards = [
        { user_id: data.user.id, name: '1 Match Mobile Legends', cost: 50, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
        { user_id: data.user.id, name: '15 Menit Scrolling Medsos', cost: 20, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
        { user_id: data.user.id, name: '1 Episode Anime', cost: 40, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
        { user_id: data.user.id, name: 'Cheat Meal / Snack', cost: 80, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false }
      ];
      await supabase.from('rewards').insert(defaultRewards);

      const defaultLogs = [
        { 
          user_id: data.user.id, 
          text: 'Petualangan dimulai! Bersiaplah menyelesaikan Quest.', 
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
        }
      ];
      await supabase.from('logs').insert(defaultLogs);
    } catch (e) {
      console.error("Failed to initialize user DB rows", e);
    }
  }

  return data;
};

export const signInUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Database Load Service
 * Fetches all RPG user tables. Fallbacks to default values if rows do not exist.
 */
export const loadOnlineData = async (userId) => {
  if (!userId) return null;

  try {
    // 1. Load Profile
    let { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profError) throw profError;

    // If profile row doesn't exist, create it
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: userId, level: 1, exp: 0, points: 0, title: 'Novice', str: 5, agi: 5, int: 5 })
        .select()
        .single();
      if (createError) throw createError;
      profile = newProfile;
    }

    // 2. Load Dailies
    let { data: dailies, error: dailiesError } = await supabase
      .from('dailies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (dailiesError) throw dailiesError;

    // 3. Load Guild Board
    const { data: guildBoard, error: guildError } = await supabase
      .from('guild_board')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (guildError) throw guildError;

    // 4. Load Inventory
    let { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (invError) throw invError;

    if (!inventory) {
      const { data: newInv, error: createError } = await supabase
        .from('inventory')
        .insert({ user_id: userId, weapon_id: null, armor_id: null, ring_id: null })
        .select()
        .single();
      if (createError) throw createError;
      inventory = newInv;
    }

    // 5. Load Rewards
    let { data: rewards, error: rewError } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId);
    if (rewError) throw rewError;

    // 6. Load Logs
    let { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (logsError) throw logsError;

    // Seed defaults if the account is completely unseeded (dailies and rewards are empty)
    if ((!dailies || dailies.length === 0) && (!rewards || rewards.length === 0)) {
      try {
        const defaultDailies = [
          { user_id: userId, name: 'Belajar 1-2 Video Course', completed: false },
          { user_id: userId, name: 'Jalan 10k Langkah / Gym', completed: false },
          { user_id: userId, name: 'Belanja ke Pasar', completed: false },
          { user_id: userId, name: 'Mengantar Adik Sekolah', completed: false },
          { user_id: userId, name: 'Apply 3-5 Lowongan Kerja', completed: false }
        ];
        const { data: insertedDailies, error: dError } = await supabase
          .from('dailies')
          .insert(defaultDailies)
          .select();
        if (!dError && insertedDailies) {
          dailies = insertedDailies;
        }

        const defaultRewards = [
          { user_id: userId, name: '1 Match Mobile Legends', cost: 50, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
          { user_id: userId, name: '15 Menit Scrolling Medsos', cost: 20, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
          { user_id: userId, name: '1 Episode Anime', cost: 40, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false },
          { user_id: userId, name: 'Cheat Meal / Snack', cost: 80, purchases: 0, anti_cheat: true, cooldown_duration: 30 * 60 * 1000, cooldown_until: 0, claimed_today: false }
        ];
        const { data: insertedRewards, error: rError } = await supabase
          .from('rewards')
          .insert(defaultRewards)
          .select();
        if (!rError && insertedRewards) {
          rewards = insertedRewards;
        }

        if (!logs || logs.length === 0) {
          const defaultLogs = [
            { 
              user_id: userId, 
              text: 'Petualangan dimulai! Bersiaplah menyelesaikan Quest.', 
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
            }
          ];
          const { data: insertedLogs, error: lError } = await supabase
            .from('logs')
            .insert(defaultLogs)
            .select();
          if (!lError && insertedLogs) {
            logs = insertedLogs;
          }
        }
      } catch (seedErr) {
        console.error("Failed to seed default user tables", seedErr);
      }
    }

    return {
      character: {
        level: profile.level,
        exp: profile.exp,
        points: profile.points,
        title: profile.title,
        str: profile.str,
        agi: profile.agi,
        int: profile.int
      },
      dailies: dailies.map(d => ({ id: d.id, name: d.name, completed: d.completed })),
      guildBoard: guildBoard.map(g => ({
        id: g.id,
        name: g.name,
        difficulty: g.difficulty,
        expReward: g.exp_reward,
        pointsReward: g.points_reward,
        enemyType: g.enemy_type
      })),
      inventory: {
        weapon: inventory.weapon_id ? { id: inventory.weapon_id } : null, // we resolve object dynamically
        armor: inventory.armor_id ? { id: inventory.armor_id } : null,
        ring: inventory.ring_id ? { id: inventory.ring_id } : null
      },
      rewards: rewards.map(r => ({
        id: r.id,
        name: r.name,
        cost: r.cost,
        purchases: r.purchases,
        cooldownUntil: Number(r.cooldown_until),
        claimedToday: r.claimed_today,
        antiCheat: r.anti_cheat,
        cooldownDuration: Number(r.cooldown_duration)
      })),
      logs: logs.map(l => ({ id: l.id, text: l.text, timestamp: l.timestamp }))
    };
  } catch (e) {
    console.error("Failed to load online Supabase data", e);
    return null;
  }
};

/**
 * Synchronization Services
 */
export const saveOnlineProfile = async (userId, character) => {
  if (!userId) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      level: character.level,
      exp: character.exp,
      points: character.points,
      title: character.title,
      str: character.str,
      agi: character.agi,
      int: character.int,
      updated_at: new Date()
    })
    .eq('id', userId);
  if (error) console.error("Error saving online profile", error);
};

export const syncOnlineDailies = async (userId, dailies) => {
  if (!userId) return;
  try {
    // Delete existing
    const { error: delError } = await supabase
      .from('dailies')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    // Insert new list
    if (dailies.length > 0) {
      const rows = dailies.map(d => ({
        user_id: userId,
        name: d.name,
        completed: d.completed
      }));
      const { error: insError } = await supabase
        .from('dailies')
        .insert(rows);
      if (insError) throw insError;
    }
  } catch (e) {
    console.error("Error syncing dailies online", e);
  }
};

export const syncOnlineGuildBoard = async (userId, guildBoard) => {
  if (!userId) return;
  try {
    // Delete existing
    const { error: delError } = await supabase
      .from('guild_board')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    // Insert new list
    if (guildBoard.length > 0) {
      const rows = guildBoard.map(g => ({
        user_id: userId,
        name: g.name,
        difficulty: g.difficulty,
        exp_reward: g.expReward,
        points_reward: g.pointsReward,
        enemy_type: g.enemyType
      }));
      const { error: insError } = await supabase
        .from('guild_board')
        .insert(rows);
      if (insError) throw insError;
    }
  } catch (e) {
    console.error("Error syncing guild board online", e);
  }
};

export const syncOnlineInventory = async (userId, inventory) => {
  if (!userId) return;
  const { error } = await supabase
    .from('inventory')
    .update({
      weapon_id: inventory.weapon ? inventory.weapon.id : null,
      armor_id: inventory.armor ? inventory.armor.id : null,
      ring_id: inventory.ring ? inventory.ring.id : null,
      updated_at: new Date()
    })
    .eq('user_id', userId);
  if (error) console.error("Error syncing inventory online", error);
};

export const syncOnlineRewards = async (userId, rewards) => {
  if (!userId) return;
  try {
    // Delete existing
    const { error: delError } = await supabase
      .from('rewards')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    // Insert new
    if (rewards.length > 0) {
      const rows = rewards.map(r => ({
        user_id: userId,
        name: r.name,
        cost: r.cost,
        purchases: r.purchases,
        cooldown_until: r.cooldownUntil,
        claimed_today: r.claimedToday,
        anti_cheat: r.antiCheat,
        cooldown_duration: r.cooldownDuration
      }));
      const { error: insError } = await supabase
        .from('rewards')
        .insert(rows);
      if (insError) throw insError;
    }
  } catch (e) {
    console.error("Error syncing rewards online", e);
  }
};

export const syncOnlineLogs = async (userId, logs) => {
  if (!userId) return;
  try {
    // Delete existing
    const { error: delError } = await supabase
      .from('logs')
      .delete()
      .eq('user_id', userId);
    if (delError) throw delError;

    // Insert new (up to 35 logs for size bounds)
    const logsToSync = logs.slice(0, 35);
    if (logsToSync.length > 0) {
      const rows = logsToSync.map(l => ({
        user_id: userId,
        text: l.text,
        timestamp: l.timestamp
      }));
      const { error: insError } = await supabase
        .from('logs')
        .insert(rows);
      if (insError) throw insError;
    }
  } catch (e) {
    console.error("Error syncing logs online", e);
  }
};
