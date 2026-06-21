import React, { useState } from 'react';
import { Swords, Plus, Trash2, Calendar, ShieldAlert, Award } from 'lucide-react';

export default function QuestList({ 
  dailies, 
  guildBoard, 
  onCompleteDaily, 
  onAddDaily, 
  onDeleteDaily, 
  onAddSpecialQuest, 
  onDefeatSpecialQuest,
  onSetActiveEnemy 
}) {
  const [activeTab, setActiveTab] = useState('dailies');
  
  const [newDailyName, setNewDailyName] = useState('');
  const [newSpecialName, setNewSpecialName] = useState('');
  const [newSpecialDifficulty, setNewSpecialDifficulty] = useState('easy');

  const handleAddDailySubmit = (e) => {
    e.preventDefault();
    if (!newDailyName.trim()) return;
    onAddDaily(newDailyName.trim());
    setNewDailyName('');
  };

  const handleAddSpecialSubmit = (e) => {
    e.preventDefault();
    if (!newSpecialName.trim()) return;
    onAddSpecialQuest(newSpecialName.trim(), newSpecialDifficulty);
    setNewSpecialName('');
    setNewSpecialDifficulty('easy');
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'hard':
        return <span className="bg-red-950 text-red-400 border border-red-800 text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0 font-pressstart">BOSS</span>;
      case 'medium':
        return <span className="bg-orange-950 text-orange-400 border border-orange-800 text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0 font-pressstart">ELITE</span>;
      default:
        return <span className="bg-blue-950 text-blue-400 border border-blue-800 text-[8px] px-2 py-0.5 font-bold uppercase tracking-wider shrink-0 font-pressstart">EASY</span>;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* RPG Tab Selection Panel */}
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('dailies')}
          className={`flex-1 py-3 px-2 text-[9px] text-center border-4 font-bold pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${activeTab === 'dailies' ? 'bg-zinc-900 border-amber-500 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
        >
          DAILY GRIND
        </button>
        <button 
          onClick={() => setActiveTab('guild')}
          className={`flex-1 py-3 px-2 text-[9px] text-center border-4 font-bold pixel-btn pixel-shadow-sm font-pressstart focus:outline-none ${activeTab === 'guild' ? 'bg-zinc-900 border-amber-500 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
        >
          GUILD BOARD
        </button>
      </div>

      {/* Main Quest Content Box */}
      <div className="pixel-border bg-zinc-950 p-4 pixel-shadow">
        
        {/* Tab 1: Daily Grinding */}
        {activeTab === 'dailies' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-[9px] font-bold text-emerald-400 flex items-center gap-2 font-pressstart">
                <Calendar className="w-4 h-4 text-emerald-400" />
                DAILY QUESTS
              </h3>
              <span className="text-[8px] text-zinc-500 font-bold uppercase font-mono">RESETS DAILY</span>
            </div>

            {/* Daily Task List */}
            <div className="flex flex-col gap-2.5 min-h-[140px] max-h-[280px] overflow-y-auto pr-1">
              {dailies.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center my-auto py-6">
                  Quest list is currently empty. Summon a new quest below!
                </div>
              ) : (
                dailies.map((daily) => (
                  <div 
                    key={daily.id}
                    onMouseEnter={() => !daily.completed && onSetActiveEnemy({ id: daily.id, name: daily.name, difficulty: 'easy' })}
                    className={`flex justify-between items-center p-3 border-2 border-zinc-900 bg-zinc-900/60 transition-all ${daily.completed ? 'opacity-50 border-zinc-950 bg-zinc-950/40' : 'hover:border-zinc-800 hover:bg-zinc-900'}`}
                  >
                    <div className="flex items-start gap-3 max-w-[70%]">
                      <input 
                        type="checkbox" 
                        checked={daily.completed}
                        readOnly
                        className="mt-1 accent-emerald-500 h-4 w-4 shrink-0 rounded-none cursor-not-allowed"
                      />
                      <span className={`text-[13px] leading-relaxed break-words font-medium ${daily.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                        {daily.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!daily.completed ? (
                        <button
                          onClick={() => {
                            onSetActiveEnemy({ id: daily.id, name: daily.name, difficulty: 'easy' });
                            onCompleteDaily(daily.id);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 text-[8px] font-bold text-zinc-950 px-2.5 py-1.5 flex items-center gap-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          SLASH
                        </button>
                      ) : (
                        <span className="text-[7px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-1 font-pressstart">
                          DONE (+10 GP)
                        </span>
                      )}

                      <button
                        onClick={() => onDeleteDaily(daily.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors focus:outline-none"
                        title="Delete Quest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form: Add Daily Task */}
            <form onSubmit={handleAddDailySubmit} className="mt-1 pt-3 border-t border-zinc-900 flex gap-2.5">
              <input 
                type="text"
                placeholder="Quest baru..."
                value={newDailyName}
                onChange={(e) => setNewDailyName(e.target.value)}
                className="flex-1 bg-zinc-900 border-2 border-zinc-800 text-[13px] px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
              />
              <button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-850 border-2 border-zinc-700 text-[8px] font-bold text-amber-400 px-3.5 py-2 flex items-center gap-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
              >
                <Plus className="w-4 h-4 text-amber-500" />
                ADD
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Guild Board */}
        {activeTab === 'guild' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-[9px] font-bold text-red-500 flex items-center gap-2 font-pressstart">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                GUILD CHALLENGES
              </h3>
              <span className="text-[8px] text-zinc-500 font-bold uppercase font-mono">BOS BOARD</span>
            </div>

            {/* Special Quests List */}
            <div className="flex flex-col gap-2.5 min-h-[140px] max-h-[280px] overflow-y-auto pr-1">
              {guildBoard.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center my-auto py-6 leading-relaxed">
                  No boss active. Summon a special target below to test your might!
                </div>
              ) : (
                guildBoard.map((quest) => (
                  <div 
                    key={quest.id}
                    onMouseEnter={() => onSetActiveEnemy({ id: quest.id, name: quest.name, difficulty: quest.difficulty })}
                    className="flex flex-col gap-3 p-3 border-2 border-zinc-900 bg-zinc-900/60 hover:border-zinc-800 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-sm font-semibold text-zinc-100">
                        {quest.name}
                      </span>
                      {getDifficultyBadge(quest.difficulty)}
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-950">
                      {/* Rewards breakdown */}
                      <div className="flex gap-3">
                        <span className="text-[10px] text-purple-400 font-bold flex items-center gap-1 font-mono">
                          <Award className="w-3.5 h-3.5 text-purple-500" />
                          +{quest.expReward} XP
                        </span>
                        <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-1 font-mono">
                          <Award className="w-3.5 h-3.5 text-yellow-500" />
                          +{quest.pointsReward} GP
                        </span>
                      </div>

                      {/* Fight Button */}
                      <button
                        onClick={() => {
                          onSetActiveEnemy({ id: quest.id, name: quest.name, difficulty: quest.difficulty });
                          onDefeatSpecialQuest(quest.id);
                        }}
                        className="bg-red-700 hover:bg-red-600 border-2 border-red-500 text-[8px] font-bold text-white px-3 py-1.5 flex items-center gap-1.5 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
                      >
                        <Swords className="w-3.5 h-3.5 text-red-200" />
                        DEFEAT
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form: Summon Special Boss */}
            <form onSubmit={handleAddSpecialSubmit} className="mt-1 pt-3 border-t border-zinc-900 flex flex-col gap-2.5">
              <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest font-pressstart">
                Summon Boss Target
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input 
                  type="text"
                  placeholder="Nama Ujian, Milestone, Project..."
                  value={newSpecialName}
                  onChange={(e) => setNewSpecialName(e.target.value)}
                  className="flex-1 bg-zinc-900 border-2 border-zinc-800 text-[13px] px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
                />
                
                <div className="flex gap-2 items-center justify-between sm:justify-start shrink-0">
                  <div className="flex border-2 border-zinc-800 bg-zinc-900 p-0.5">
                    {['easy', 'medium', 'hard'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setNewSpecialDifficulty(diff)}
                        className={`py-1 px-2.5 text-[8px] font-bold uppercase tracking-wider transition-all font-pressstart focus:outline-none ${newSpecialDifficulty === diff ? 'bg-zinc-800 text-amber-400 border border-zinc-650' : 'text-zinc-600 hover:text-zinc-400'}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-red-800 hover:bg-red-700 border-2 border-red-600 text-[8px] font-bold text-white px-3.5 py-2 flex items-center gap-1 pixel-btn pixel-shadow-sm font-pressstart focus:outline-none"
                  >
                    <Plus className="w-4 h-4 text-red-400" />
                    SUMMON
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
