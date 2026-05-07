import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';

const initialChar = {
  name: '', class: '', level: 1, background: '', race: '', alignment: '', xp: 0,
  proficiencyBonus: 2,
  attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
  savingThrows: { STR: false, DEX: false, CON: false, INT: false, WIS: false, CHA: false },
  skills: {
      Acrobatics: { stat: 'DEX', prof: false }, Animal_Handling: { stat: 'WIS', prof: false },
      Arcana: { stat: 'INT', prof: false }, Athletics: { stat: 'STR', prof: false },
      Deception: { stat: 'CHA', prof: false }, History: { stat: 'INT', prof: false },
      Insight: { stat: 'WIS', prof: false }, Intimidation: { stat: 'CHA', prof: false },
      Investigation: { stat: 'INT', prof: false }, Medicine: { stat: 'WIS', prof: false },
      Nature: { stat: 'INT', prof: false }, Perception: { stat: 'WIS', prof: false },
      Performance: { stat: 'CHA', prof: false }, Persuasion: { stat: 'CHA', prof: false },
      Religion: { stat: 'INT', prof: false }, Sleight_of_Hand: { stat: 'DEX', prof: false },
      Stealth: { stat: 'DEX', prof: false }, Survival: { stat: 'WIS', prof: false }
  },
  combat: { hpMax: 10, hpCurrent: 10, hpTemp: 0, ac: 10, speed: 30, initiative: 0, hitDiceTotal: '1d10', hitDiceCurrent: '1d10' },
  deathSaves: { successes: 0, failures: 0 },
  equipment: '', roleplay: { traits: '', ideals: '', bonds: '', flaws: '' },
  spells: ''
};

export default function CharacterSheet({ characterId, chatRollRef }) {
  const [char, setChar] = useState(initialChar);
  const { token } = useAuthStore();

  useEffect(() => {
    if (characterId) {
      axios.get(`http://localhost:3001/api/characters/${characterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
         // Merge with initialChar to ensure all new fields exist
         setChar({ ...initialChar, ...res.data });
      }).catch(console.error);
    }
  }, [characterId, token]);

  const saveChar = async () => {
    if (!characterId) return;
    try {
      await axios.put(`http://localhost:3001/api/characters/${characterId}`, char, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Character saved!');
    } catch (e) {
      console.error(e);
    }
  };

  const getMod = (val) => Math.floor((val - 10) / 2);
  const getModString = (val) => {
      const mod = getMod(val);
      return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleRollClick = (attrName, attrVal, addProf = false) => {
      if (chatRollRef && chatRollRef.current) {
          let mod = getMod(attrVal);
          if (addProf) mod += (char.proficiencyBonus || 2);
          const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
          chatRollRef.current(`1d20${modStr}`, `${attrName} Check`);
      }
  };

  const handleChange = (field, value, nested) => {
    if (nested) {
      setChar(prev => ({ ...prev, [nested]: { ...prev[nested], [field]: value } }));
    } else {
      setChar(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleProficiency = (skillName, type) => {
      if (type === 'save') {
          handleChange(skillName, !char.savingThrows[skillName], 'savingThrows');
      } else {
          setChar(prev => ({
             ...prev,
             skills: {
                 ...prev.skills,
                 [skillName]: { ...prev.skills[skillName], prof: !prev.skills[skillName].prof }
             }
          }));
      }
  };

  return (
    <div className="bg-white text-black p-6 rounded shadow-lg max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center bg-red-800 text-white p-4 rounded shadow">
        <h2 className="text-2xl font-bold font-serif">D&D 5e Character Sheet</h2>
        <button onClick={saveChar} className="bg-yellow-600 px-4 py-2 rounded text-black font-bold hover:bg-yellow-500 transition-colors">Save</button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 gap-4 border-2 border-gray-300 p-4 rounded shadow-sm">
        <div className="col-span-1">
          <label className="block text-sm font-bold uppercase text-gray-500">Character Name</label>
          <input type="text" className="w-full border-b border-gray-400 focus:outline-none text-xl font-bold text-red-900"
                 value={char.name} onChange={e => handleChange('name', e.target.value)} />
        </div>
        <div className="col-span-2 grid grid-cols-3 gap-4 bg-gray-100 p-2 rounded border border-gray-200">
          <div><label className="text-xs uppercase font-bold text-gray-600">Class & Level</label><input type="text" className="w-full bg-transparent border-b border-gray-400" value={char.class} onChange={e => handleChange('class', e.target.value)} /></div>
          <div><label className="text-xs uppercase font-bold text-gray-600">Background</label><input type="text" className="w-full bg-transparent border-b border-gray-400" value={char.background} onChange={e => handleChange('background', e.target.value)} /></div>
          <div><label className="text-xs uppercase font-bold text-gray-600">Race</label><input type="text" className="w-full bg-transparent border-b border-gray-400" value={char.race} onChange={e => handleChange('race', e.target.value)} /></div>
          <div><label className="text-xs uppercase font-bold text-gray-600">Alignment</label><input type="text" className="w-full bg-transparent border-b border-gray-400" value={char.alignment} onChange={e => handleChange('alignment', e.target.value)} /></div>
          <div><label className="text-xs uppercase font-bold text-gray-600">Experience Points</label><input type="number" className="w-full bg-transparent border-b border-gray-400" value={char.xp} onChange={e => handleChange('xp', parseInt(e.target.value))} /></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Attributes, Saves, Skills */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center border-2 border-gray-300 rounded p-2 bg-gray-50">
             <div className="text-xl font-bold mr-4 border p-2 rounded bg-white">{char.proficiencyBonus}</div>
             <div className="text-sm font-bold uppercase text-gray-600">Proficiency Bonus</div>
          </div>

          <div className="flex gap-4">
              <div className="bg-gray-100 p-4 rounded border flex flex-col gap-4 shadow-inner w-24 shrink-0">
                {Object.keys(char.attributes).map(attr => (
                  <div key={attr} className="flex flex-col items-center border p-2 rounded bg-white relative shadow-sm">
                    <span className="text-xs font-bold uppercase text-gray-700">{attr}</span>
                    <span
                        className="text-xl font-bold cursor-pointer hover:text-red-600 transition-colors"
                        title="Roll Check"
                        onClick={() => handleRollClick(attr, char.attributes[attr])}
                    >
                      {getModString(char.attributes[attr])}
                    </span>
                    <input type="number" className="w-12 text-center text-sm border rounded mt-1 bg-gray-50"
                           value={char.attributes[attr]} onChange={e => handleChange(attr, parseInt(e.target.value), 'attributes')} />
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col gap-4">
                 {/* Saving Throws */}
                 <div className="border-2 border-gray-300 rounded p-3 bg-gray-50">
                    <span className="text-xs font-bold uppercase text-gray-500 block mb-2 border-b pb-1">Saving Throws</span>
                    {Object.keys(char.attributes).map(attr => {
                        const isProf = char.savingThrows[attr];
                        const totalMod = getMod(char.attributes[attr]) + (isProf ? char.proficiencyBonus : 0);
                        return (
                            <div key={`save-${attr}`} className="flex items-center text-sm mb-1">
                               <input type="checkbox" className="mr-2" checked={isProf} onChange={() => toggleProficiency(attr, 'save')} />
                               <span className="w-6 inline-block font-bold cursor-pointer hover:text-red-600" onClick={() => handleRollClick(`${attr} Save`, char.attributes[attr], isProf)}>
                                   {totalMod >= 0 ? `+${totalMod}` : totalMod}
                               </span>
                               <span>{attr}</span>
                            </div>
                        );
                    })}
                 </div>

                 {/* Skills */}
                 <div className="border-2 border-gray-300 rounded p-3 bg-gray-50 flex-1">
                    <span className="text-xs font-bold uppercase text-gray-500 block mb-2 border-b pb-1">Skills</span>
                    {Object.keys(char.skills).map(skill => {
                        const { stat, prof } = char.skills[skill];
                        const totalMod = getMod(char.attributes[stat]) + (prof ? char.proficiencyBonus : 0);
                        const displaySkill = skill.replace(/_/g, ' ');
                        return (
                            <div key={`skill-${skill}`} className="flex items-center text-xs mb-1">
                               <input type="checkbox" className="mr-2" checked={prof} onChange={() => toggleProficiency(skill, 'skill')} />
                               <span className="w-6 inline-block font-bold cursor-pointer hover:text-red-600" onClick={() => handleRollClick(displaySkill, char.attributes[stat], prof)}>
                                   {totalMod >= 0 ? `+${totalMod}` : totalMod}
                               </span>
                               <span className="text-gray-400 w-8 inline-block">({stat.substring(0,3)})</span>
                               <span>{displaySkill}</span>
                            </div>
                        );
                    })}
                 </div>
              </div>
          </div>
        </div>

        {/* Middle Column: Combat Stats */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-gray-100 p-4 rounded border flex gap-4 shadow-inner">
             <div className="border p-2 text-center rounded bg-white shadow-sm flex-1 flex flex-col justify-center">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Armor Class</span>
               <input type="number" className="w-full text-center text-2xl font-bold bg-transparent" value={char.combat.ac} onChange={e => handleChange('ac', parseInt(e.target.value), 'combat')} />
             </div>
             <div className="border p-2 text-center rounded bg-white shadow-sm flex-1 flex flex-col justify-center">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Initiative</span>
               <input type="number" className="w-full text-center text-2xl font-bold bg-transparent" value={char.combat.initiative} onChange={e => handleChange('initiative', parseInt(e.target.value), 'combat')} />
             </div>
             <div className="border p-2 text-center rounded bg-white shadow-sm flex-1 flex flex-col justify-center">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Speed</span>
               <input type="number" className="w-full text-center text-2xl font-bold bg-transparent" value={char.combat.speed} onChange={e => handleChange('speed', parseInt(e.target.value), 'combat')} />
             </div>
          </div>

          <div className="border-2 border-gray-300 rounded bg-gray-50 p-4 flex flex-col gap-4">
              <div className="bg-white border rounded p-2">
                 <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1 border-b">
                   <span>Hit Point Maximum <input type="number" className="w-12 bg-transparent text-right" value={char.combat.hpMax} onChange={e => handleChange('hpMax', parseInt(e.target.value), 'combat')} /></span>
                 </div>
                 <input type="number" className="w-full text-center text-4xl font-bold bg-transparent py-2" value={char.combat.hpCurrent} onChange={e => handleChange('hpCurrent', parseInt(e.target.value), 'combat')} />
                 <span className="text-center block text-[10px] font-bold text-gray-500 uppercase">Current Hit Points</span>
              </div>
              <div className="bg-white border rounded p-2">
                 <input type="number" className="w-full text-center text-xl font-bold bg-transparent py-1" value={char.combat.hpTemp} onChange={e => handleChange('hpTemp', parseInt(e.target.value), 'combat')} />
                 <span className="text-center block text-[10px] font-bold text-gray-500 uppercase">Temporary Hit Points</span>
              </div>
          </div>

          <div className="flex gap-4">
              <div className="flex-1 border p-2 rounded bg-gray-50 text-center">
                 <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Hit Dice</span>
                 <input type="text" className="w-full text-center font-bold text-sm bg-white border rounded mb-1" placeholder="Total" value={char.combat.hitDiceTotal} onChange={e => handleChange('hitDiceTotal', e.target.value, 'combat')} />
                 <input type="text" className="w-full text-center font-bold text-lg bg-white border rounded" placeholder="Current" value={char.combat.hitDiceCurrent} onChange={e => handleChange('hitDiceCurrent', e.target.value, 'combat')} />
              </div>
              <div className="flex-1 border p-2 rounded bg-gray-50 text-center flex flex-col justify-between">
                 <span className="text-[10px] font-bold text-gray-500 uppercase block">Death Saves</span>
                 <div className="flex justify-between text-[10px] items-center">
                    <span>SUCCESSES</span>
                    <input type="number" className="w-8 border text-center" min="0" max="3" value={char.deathSaves.successes} onChange={e => handleChange('successes', parseInt(e.target.value), 'deathSaves')} />
                 </div>
                 <div className="flex justify-between text-[10px] items-center">
                    <span>FAILURES</span>
                    <input type="number" className="w-8 border text-center" min="0" max="3" value={char.deathSaves.failures} onChange={e => handleChange('failures', parseInt(e.target.value), 'deathSaves')} />
                 </div>
              </div>
          </div>

          <div className="border p-4 rounded bg-gray-100 shadow-inner h-full flex flex-col mt-2">
            <span className="text-xs uppercase block font-bold mb-2 text-gray-700 border-b pb-1">Attacks & Spellcasting</span>
            <textarea className="w-full h-full min-h-[100px] bg-white border p-2 resize-none shadow-sm rounded flex-1 text-sm font-mono" placeholder="Weapon | Atk Bonus | Damage/Type" value={char.equipment} onChange={e => handleChange('equipment', e.target.value)}></textarea>
          </div>
        </div>

        {/* Right Column: Roleplay & Traits */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="border p-4 rounded bg-gray-100 shadow-inner flex flex-col gap-3">
            <div>
              <span className="text-[10px] uppercase block font-bold text-gray-600 bg-gray-200 px-1 rounded-t border border-b-0 border-gray-300 w-max">Personality Traits</span>
              <textarea className="w-full bg-white border border-gray-300 p-2 resize-none shadow-sm rounded-b rounded-tr text-sm" rows="3" value={char.roleplay.traits} onChange={e => handleChange('traits', e.target.value, 'roleplay')}></textarea>
            </div>
            <div>
              <span className="text-[10px] uppercase block font-bold text-gray-600 bg-gray-200 px-1 rounded-t border border-b-0 border-gray-300 w-max">Ideals</span>
              <textarea className="w-full bg-white border border-gray-300 p-2 resize-none shadow-sm rounded-b rounded-tr text-sm" rows="2" value={char.roleplay.ideals} onChange={e => handleChange('ideals', e.target.value, 'roleplay')}></textarea>
            </div>
            <div>
              <span className="text-[10px] uppercase block font-bold text-gray-600 bg-gray-200 px-1 rounded-t border border-b-0 border-gray-300 w-max">Bonds</span>
              <textarea className="w-full bg-white border border-gray-300 p-2 resize-none shadow-sm rounded-b rounded-tr text-sm" rows="2" value={char.roleplay.bonds} onChange={e => handleChange('bonds', e.target.value, 'roleplay')}></textarea>
            </div>
            <div>
              <span className="text-[10px] uppercase block font-bold text-gray-600 bg-gray-200 px-1 rounded-t border border-b-0 border-gray-300 w-max">Flaws</span>
              <textarea className="w-full bg-white border border-gray-300 p-2 resize-none shadow-sm rounded-b rounded-tr text-sm" rows="2" value={char.roleplay.flaws} onChange={e => handleChange('flaws', e.target.value, 'roleplay')}></textarea>
            </div>
          </div>
          <div className="border p-4 rounded bg-gray-100 shadow-inner flex-1 flex flex-col">
             <span className="text-xs uppercase block font-bold mb-2 text-gray-700 border-b pb-1">Features & Traits</span>
             <textarea className="w-full h-full min-h-[150px] bg-white border p-2 resize-none shadow-sm rounded flex-1 text-sm font-mono" placeholder="Racial Traits, Class Features, Background Features" value={char.spells} onChange={e => handleChange('spells', e.target.value)}></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
