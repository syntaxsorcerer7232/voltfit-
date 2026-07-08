import React, { useState, useEffect } from 'react';
import { useAppContext, useAppLogs } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, ScanBarcode, Search, X, Calendar as CalendarIcon, Trash2, Edit3, Check } from 'lucide-react';
import { cn } from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import SupplementTracker from '../components/SupplementTracker';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import DietCalendarModal from '../components/DietCalendarModal';
import BarcodeScanner from '../components/BarcodeScanner';
import { FOOD_DATABASE } from '../data/foods';

export default function Diet() {
  const { user, updateUser, disciplineMode, awardPoints, isDataLoading, addMeal, removeMeal, showToast } = useAppContext();
  const { meals } = useAppLogs();
  const [date, setDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState<string | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [formMealTime, setFormMealTime] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Snacks');
  const [foodQuantity, setFoodQuantity] = useState(1);

  const [stapleIds, setStapleIds] = useState<string[]>(['f_bev_1', 'f_bev_3', 'f_bev_5', 'f_ind_1', 'f_ind_2', 'f_ind_3']);
  const [showStaplesEditor, setShowStaplesEditor] = useState(false);
  const [stapleSearchQuery, setStapleSearchQuery] = useState('');

  const COMBINED_FOOD_DATABASE = [...FOOD_DATABASE, ...(user.customFoods || [])];

  useEffect(() => {
    const saved = localStorage.getItem('voltfit_custom_staples');
    if (saved) {
      try { setStapleIds(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const updateStaples = (newIds: string[]) => {
    setStapleIds(newIds);
    localStorage.setItem('voltfit_custom_staples', JSON.stringify(newIds));
  };


  useEffect(() => {
    if (showSearchModal && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(showSearchModal)) {
       setFormMealTime(showSearchModal as any);
    } else if (showSearchModal) {
       const currentHour = new Date().getHours();
       setFormMealTime(currentHour < 11 ? 'Breakfast' : currentHour < 16 ? 'Lunch' : currentHour < 21 ? 'Dinner' : 'Snacks');
    }
  }, [showSearchModal]);

  const handlePrevDay = () => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    setDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    setDate(next);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const dateStrForFiltering = date.toISOString().split('T')[0];
  const dayMeals = meals.filter((m: any) => m.date === dateStrForFiltering);

  useEffect(() => {
    setShowWarning(false);
    if (!isToday(date)) {
      if (dayMeals.length === 0) {
         const timer = setTimeout(() => {
            setShowWarning(true);
         }, 2 * 60 * 60 * 1000);
         return () => clearTimeout(timer);
      }
    }
  }, [date, dayMeals]);

  const consumedProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const consumedCarbs = dayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const consumedFats = dayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);
  const totalCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  
  const macroData = [
    { name: 'Protein', value: consumedProtein * 4, color: '#84cc16' },
    { name: 'Carbs', value: consumedCarbs * 4, color: '#06b6d4' },
    { name: 'Fats', value: consumedFats * 9, color: '#8b5cf6' },
  ];

  const calorieLimit = user.calorieGoal || 2000;
  const isOverLimit = totalCalories > calorieLimit;

  const handleScanStart = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setIsFetchingBarcode(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      setIsFetchingBarcode(false);
      
      if (data.status === 1 && data.product) {
         const p = data.product;
         const nut = p.nutriments || {};
         const newId = `scanned_${barcode}`;
         
         const newCustomFood = {
           id: newId,
           name: p.product_name || 'Scanned Food',
           calories: Math.round(nut['energy-kcal_100g'] || nut['energy-kcal'] || 0),
           protein: Math.round(nut.proteins_100g || nut.proteins || 0),
           carbs: Math.round(nut.carbohydrates_100g || nut.carbohydrates || 0),
           fats: Math.round(nut.fat_100g || nut.fat || 0),
           portion: p.serving_size || '100g'
         };
         
         const customFoods = user.customFoods || [];
         if (!customFoods.some(c => c.id === newId)) {
             updateUser({ customFoods: [...customFoods, newCustomFood] });
         }
         
         // Select the new food!
         setSelectedFoodId(newId);
         setShowSearchModal('Scanned Item');
      } else {
         showToast("Barcode not found in database", "error");
      }
    } catch (e) {
      setIsFetchingBarcode(false);
      showToast("Error fetching product data", "error");
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex flex-col space-y-4 pt-safe pb-6 min-h-[90vh]">
         <header className="px-4 pt-6 pb-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Diet & Macros</h1>
         </header>
         <div className="px-4">
            <Skeleton className="w-full h-16 rounded-2xl" />
         </div>
         <div className="px-4">
            <Skeleton className="w-full h-64 rounded-3xl" />
         </div>
         <div className="px-4 flex flex-col space-y-4">
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-24" />
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 space-y-4 pt-safe pb-32">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -z-10 pointer-events-none" />
      <header className="px-6 pt-12 pb-6 flex justify-between items-end">
        <div className="flex flex-col">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 opacity-50">Log / Transmission</span>
           <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Diet & Macros</h1>
        </div>
      </header>

      {/* Date Selector widget */}
      <div className="px-4">
        <div className="flex justify-between items-center glass-card px-4 py-3 rounded-2xl">
           <button onClick={handlePrevDay} className="p-2 hover:bg-primary/5 rounded-lg transition-colors border border-card-border">
             <ChevronLeft size={18} />
           </button>
           <div 
             className="flex flex-col items-center cursor-pointer hover:bg-primary/5 px-4 py-1 rounded-lg transition-colors"
             onClick={() => setShowCalendarModal(true)}
           >
             <div className="flex items-center space-x-1">
               <span className="font-extrabold text-sm tracking-tight text-foreground">
                 {isToday(date) ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}, {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
               </span>
               <CalendarIcon size={14} className="text-muted" />
             </div>
             {isToday(date) && <span className="text-[10px] text-primary font-black uppercase tracking-widest mt-0.5">Logging Active</span>}
           </div>
           <button onClick={handleNextDay} className="p-2 hover:bg-primary/5 rounded-lg transition-colors border border-card-border">
             <ChevronRight size={18} />
           </button>
        </div>
      </div>

      {showWarning && (
         <div className="px-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start space-x-3">
             <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
             <div>
               <h4 className="text-red-500 font-bold text-sm tracking-wide">Are you logging for the correct day?</h4>
               <p className="text-red-500/70 text-xs mt-1">You've been viewing a past date with no logs for over 2 hours.</p>
               <button onClick={() => { setDate(new Date()); setShowWarning(false); }} className="mt-3 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors">
                  Return to Today
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Goal Status Banners */}
      <div className="px-4 space-y-2">
        {isOverLimit && (
          <div className={cn("p-4 rounded-2xl border flex items-center text-xs font-black uppercase tracking-widest shadow-lg", disciplineMode ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-amber-500/10 border-amber-500/50 text-amber-500')}>
            <AlertTriangle size={18} className="mr-3 shrink-0 shadow-glow" />
            <span>{disciplineMode ? 'OVER LIMIT - Tactical Discipline Required' : 'Calorie target exceeded - Flux Detected'}</span>
          </div>
        )}
      </div>

      {/* Macro Summary - Stacked for Tablet stretch */}
      <div className="px-4 md:px-8 space-y-6">
        {/* Macro Pie Chart */}
        <div className="bg-surface-elevated/40 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 flex flex-col relative border border-card-border shadow-2xl overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] -z-10" />
           
           <div className="h-64 md:h-80 w-full relative pointer-events-none mb-4">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroData} innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl md:text-6xl font-black text-foreground italic tracking-tighter drop-shadow-md">{totalCalories}</span>
                 <span className="text-[10px] md:text-xs text-primary font-black tracking-[0.3em] uppercase italic opacity-80 shadow-glow">Kcal</span>
                 <div className="mt-2 h-px w-8 bg-card-border" />
                 <span className={cn("text-[8px] md:text-[10px] font-black mt-2 uppercase tracking-widest italic", totalCalories > calorieLimit ? "text-rose-500 animate-pulse" : "text-muted opacity-60")}>
                   {totalCalories > calorieLimit ? "Limit Exceeded" : `${calorieLimit - totalCalories} remain`}
                 </span>
              </div>
           </div>

            {/* Macro Progress Bars underneath */}
            <div className="grid grid-cols-3 gap-4 md:gap-10 mt-10 px-2">
               <div className="flex flex-col group">
                 <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-[#84cc16] opacity-80 italic">Pro</span>
                    <span className="text-[9px] font-black text-[#84cc16] opacity-40">{Math.round((consumedProtein/user.proteinGoal)*100)}%</span>
                 </div>
                 <span className="text-xs md:text-lg font-black text-foreground">{consumedProtein}<span className="text-[10px] opacity-40 italic ml-1">/{user.proteinGoal}G</span></span>
                 <div className="w-full h-2 md:h-2.5 bg-background mt-2 rounded-full border border-card-border overflow-hidden p-0.5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#84cc16] to-[#a3e635] rounded-full shadow-glow-sm" style={{width: `${Math.min(100, (consumedProtein/user.proteinGoal)*100)}%`}} />
                 </div>
               </div>
               <div className="flex flex-col group">
                 <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-[#06b6d4] opacity-80 italic">Crb</span>
                    <span className="text-[9px] font-black text-[#06b6d4] opacity-40">{Math.round((consumedCarbs/user.carbsGoal)*100)}%</span>
                 </div>
                 <span className="text-xs md:text-lg font-black text-foreground">{consumedCarbs}<span className="text-[10px] opacity-40 italic ml-1">/{user.carbsGoal}G</span></span>
                 <div className="w-full h-2 md:h-2.5 bg-background mt-2 rounded-full border border-card-border overflow-hidden p-0.5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] rounded-full shadow-glow-sm" style={{width: `${Math.min(100, (consumedCarbs/user.carbsGoal)*100)}%`}} />
                 </div>
               </div>
               <div className="flex flex-col group">
                 <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-[#8b5cf6] opacity-80 italic">Fat</span>
                    <span className="text-[9px] font-black text-[#8b5cf6] opacity-40">{Math.round((consumedFats/user.fatsGoal)*100)}%</span>
                 </div>
                 <span className="text-xs md:text-lg font-black text-foreground">{consumedFats}<span className="text-[10px] opacity-40 italic ml-1">/{user.fatsGoal}G</span></span>
                 <div className="w-full h-2 md:h-2.5 bg-background mt-2 rounded-full border border-card-border overflow-hidden p-0.5 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] rounded-full shadow-glow-sm" style={{width: `${Math.min(100, (consumedFats/user.fatsGoal)*100)}%`}} />
                 </div>
               </div>
            </div>
        </div>

        {/* Quick Add Staples section */}
        <div className="px-4 md:px-8">
          <div className="flex justify-between items-center mb-4 px-2">
             <h3 className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted ml-1 italic opacity-60">Master Staples</h3>
             <button 
               onClick={() => setShowStaplesEditor(true)}
               className="text-[10px] text-primary uppercase font-black tracking-widest flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all active:scale-95 shadow-sm"
             >
               <Edit3 size={14} /> Edit
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4 pb-2">
            {COMBINED_FOOD_DATABASE.filter(f => stapleIds.includes(f.id)).map(staple => (
              <button 
                key={staple.id}
                onClick={() => {
                  if (disciplineMode && isOverLimit) return;
                  setSelectedFoodId(staple.id);
                  setShowSearchModal('Quick Add');
                }}
                className="bg-surface-elevated/40 p-5 md:p-8 rounded-[2rem] border border-card-border overflow-hidden relative group flex flex-col text-left hover:border-primary/50 transition-all active:scale-95 h-full min-h-[140px] justify-between shadow-xl"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative z-10">
                  <div className="font-black text-sm md:text-lg mb-1 truncate text-foreground uppercase tracking-tight italic group-hover:text-primary transition-colors">{staple.name}</div>
                  <div className="text-[10px] md:text-xs text-muted font-bold tracking-[0.1em] mb-2 opacity-50 uppercase italic">{staple.portion}</div>
                </div>
                <div className="flex justify-between items-center mt-auto relative z-10">
                  <div className="font-black text-xs md:text-sm text-primary font-mono italic shadow-glow">{staple.calories} <span className="text-[8px] opacity-60">KCAL</span></div>
                  <div className="bg-primary text-black p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Plus size={16} strokeWidth={3} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meals Grid - Stacked stretch */}
      <div className="px-4 md:px-8 space-y-6 mt-6 pb-6">
         {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(mealTime => {
           const specificMeals = dayMeals.filter(m => m.mealTime === mealTime);
            const totalKcal = specificMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
            
            const mealConfig: any = {
               Breakfast: { color: 'amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
               Lunch: { color: 'blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
               Dinner: { color: 'violet-500', bg: 'bg-violet-500/5', border: 'border-violet-500/20' },
               Snacks: { color: 'rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/20' }
            };
            const config = mealConfig[mealTime] || { color: 'primary', bg: 'bg-primary/5', border: 'border-primary/20' };

            const totalProtein = specificMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
           const totalCarbs = specificMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
           const totalFats = specificMeals.reduce((acc, m) => acc + (m.fats || 0), 0);
           
           const groupedMealsMap = new Map();
           specificMeals.forEach(m => {
              if (groupedMealsMap.has(m.name)) {
                  const existing = groupedMealsMap.get(m.name);
                  existing.ids.push(m.id);
                  existing.quantity += (m.quantity || 1);
                  existing.calories += m.calories || 0;
                  existing.protein += m.protein || 0;
                  existing.carbs += m.carbs || 0;
                  existing.fats += m.fats || 0;
              } else {
                  groupedMealsMap.set(m.name, { ...m, ids: [m.id], quantity: m.quantity || 1 });
              }
           });
           const groupedMeals = Array.from(groupedMealsMap.values());

           return (
           <div key={mealTime} className={cn("rounded-[2.5rem] p-7 border flex flex-col shadow-2xl relative overflow-hidden transition-all hover:border-opacity-50", config.bg, config.border)}>
              <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 opacity-20 transition-colors", `bg-${config.color}`)} />
              <div className="flex flex-col mb-6">
                 <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-2 h-8 rounded-full shadow-glow-sm transition-colors", `bg-${config.color}`)} />
                       <h3 className="font-black text-lg uppercase tracking-tighter italic text-foreground">{mealTime}</h3>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic px-4 py-1.5 rounded-full border shadow-sm transition-all", `bg-${config.color}/10 border-${config.color}/30 text-${config.color}`)}>
                       {Math.round(totalKcal)} <span className="opacity-60 ml-0.5">Kcal</span>
                    </span>
                 </div>
                 {specificMeals.length > 0 && (
                   <div className="text-[10px] text-muted mt-4 uppercase tracking-[0.2em] font-black flex items-center gap-3 px-1 opacity-60 italic">
                      <span>{Math.round(totalProtein)}G P</span>
                      <span className="w-1 h-1 bg-muted rounded-full opacity-30" />
                      <span>{Math.round(totalCarbs)}G C</span>
                      <span className="w-1 h-1 bg-muted rounded-full opacity-30" />
                      <span>{Math.round(totalFats)}G F</span>
                   </div>
                 )}
              </div>
              
              <div className="space-y-3 mb-6">
                 {groupedMeals.length > 0 ? groupedMeals.map(mealItem => (
                   <div key={mealItem.ids[0]} className="flex justify-between items-center text-sm border-b border-card-border/50 pb-3 group">
                     <div className="flex-1">
                       <div className="font-black text-foreground flex items-center gap-2 uppercase tracking-tight text-xs">
                         {mealItem.name}
                         {mealItem.quantity > 1 && <span className="text-[9px] bg-primary text-black px-2 py-0.5 rounded-full font-black">X{mealItem.quantity}</span>}
                       </div>
                       <div className="text-[9px] text-muted font-bold tracking-widest uppercase mt-1 opacity-60">{Math.round(mealItem.protein)}P • {Math.round(mealItem.carbs)}C • {Math.round(mealItem.fats)}F</div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="font-black font-mono text-primary italic">{Math.round(mealItem.calories)}</div>
                        <button 
                           onClick={() => mealItem.ids.forEach((id: string) => removeMeal(id))}
                           className="text-muted hover:text-red-500 transition-all p-2 bg-black/5 dark:bg-white/5 rounded-lg active:scale-90"
                           title="Delete all logged instances of this food"
                        >
                           <Trash2 size={13} />
                        </button>
                     </div>
                   </div>
                 )) : (
                    <div className="text-[10px] text-muted font-black uppercase tracking-widest py-8 italic opacity-40 text-center">Empty plate...</div>
                 )}
              </div>

              <div className="flex gap-3 mt-auto">
                 <button onClick={() => setShowSearchModal(mealTime)} className={cn("flex-1 py-4 border rounded-2xl flex items-center justify-center text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-opacity-20 active:scale-95 shadow-xl italic text-foreground", `bg-${config.color}/10 border-${config.color}/30`)}>
                    <Plus size={16} className={cn("mr-2 transition-colors", `text-${config.color}`)} /> Add Log
                 </button>
                 <button onClick={handleScanStart} className="w-14 bg-surface-elevated border border-card-border justify-center rounded-2xl flex items-center transition-all hover:bg-primary/5 text-muted hover:text-primary active:scale-95 shadow-xl">
                    <ScanBarcode size={20} />
                 </button>
              </div>
           </div>
         )})}
      </div>

      <div className="px-4 pt-2">
         <SupplementTracker />
         <button 
           onClick={() => setShowNutritionModal(true)}
           className="w-full bg-surface-elevated border border-card-border text-muted font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-primary/10 transition-all active:scale-95 shadow-lg italic"
         >
           View Detailed Intelligence
         </button>
      </div>

      {/* Nutrition Details Modal */}
      <AnimatePresence>
        {showNutritionModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col pt-safe px-6"
          >
            <header className="py-6 flex items-center justify-between border-b border-card-border">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase grayscale brightness-200">Metabolic Intel</h2>
              <button onClick={() => setShowNutritionModal(false)} className="p-2 border border-card-border bg-surface-elevated rounded-full"><X size={20} /></button>
            </header>
            
            <div className="flex-1 overflow-y-auto py-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Saturated Fat', value: '12g', goal: '20g' },
                  { label: 'Sodium', value: '1200mg', goal: '2300mg' },
                  { label: 'Sugar', value: '34g', goal: '50g' },
                  { label: 'Fiber', value: '25g', goal: '38g' },
                  { label: 'Cholesterol', value: '150mg', goal: '300mg' },
                  { label: 'Potassium', value: '2100mg', goal: '4700mg' },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-elevated/40 p-4 rounded-2xl border border-card-border shadow-md">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1 opacity-60">{stat.label}</span>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-black text-foreground">{stat.value}</span>
                      <span className="text-[10px] text-muted font-mono opacity-40">/ {stat.goal}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface-elevated/40 p-6 rounded-3xl border border-card-border shadow-lg">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-5 italic">Essential Micronutrients</h3>
                <div className="space-y-6">
                  {[
                    { name: 'Vitamin D', pct: 45 },
                    { name: 'Calcium', pct: 80 },
                    { name: 'Iron', pct: 60 },
                    { name: 'Magnesium', pct: 30 },
                  ].map((v, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-black mb-1 uppercase tracking-widest opacity-60 italic">
                        <span>{v.name}</span>
                        <span>{v.pct}% DV</span>
                      </div>
                      <div className="h-1.5 bg-background border border-card-border rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary shadow-glow" style={{ width: `${v.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {showBarcodeScanner && (
           <BarcodeScanner
             onScan={handleBarcodeScanned}
             onClose={() => setShowBarcodeScanner(false)}
           />
        )}
      </AnimatePresence>
      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed inset-0 z-50 bg-background flex flex-col pt-safe shader-bg">
             <div className="px-4 py-4 flex items-center justify-between border-b border-card-border bg-surface-elevated/20">
                <div className="flex items-center space-x-2">
                  {selectedFoodId && (
                    <button onClick={() => setSelectedFoodId(null)} className="p-2 border border-card-border bg-surface-elevated rounded-full mr-2 hover:bg-surface-elevated/80 transition-all active:scale-90">
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Log {showSearchModal}</h2>
                </div>
                <button onClick={() => { setShowSearchModal(null); setSelectedFoodId(null); }} className="p-2 border border-card-border bg-surface-elevated rounded-full hover:bg-surface-elevated/80 transition-all active:scale-90"><X size={18} /></button>
             </div>
             <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                {selectedFoodId ? (() => {
                  const f = COMBINED_FOOD_DATABASE.find(item => item.id === selectedFoodId);
                  if (!f) return null;
                  return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pt-4">
                       <div className="text-center pb-6 border-b border-card-border/50">
                         <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">{f.name}</h3>
                         <p className="text-muted font-black uppercase tracking-[0.2em] text-[10px] mt-2 opacity-50">{f.portion}</p>
                         <div className="text-5xl font-black text-primary font-mono mt-8 mb-1 italic shadow-glow">{Math.round(f.calories * foodQuantity)}</div>
                         <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-black italic opacity-60">Kcal Transmission</div>
                       </div>
                       
                       <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-6 px-2 opacity-40 italic">Macro Breakdown</h4>
                         <div className="grid grid-cols-3 gap-3">
                           <div className="bg-surface-elevated flex flex-col items-center justify-center py-5 rounded-2xl border border-card-border shadow-lg">
                              <span className="text-2xl font-black italic text-foreground">{Math.round(f.protein * foodQuantity)}g</span>
                              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#84cc16] mt-1 opacity-80">Protein</span>
                           </div>
                           <div className="bg-surface-elevated flex flex-col items-center justify-center py-5 rounded-2xl border border-card-border shadow-lg">
                              <span className="text-2xl font-black italic text-foreground">{Math.round(f.carbs * foodQuantity)}g</span>
                              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#06b6d4] mt-1 opacity-80">Carbs</span>
                           </div>
                           <div className="bg-surface-elevated flex flex-col items-center justify-center py-5 rounded-2xl border border-card-border shadow-lg">
                              <span className="text-2xl font-black italic text-foreground">{Math.round(f.fats * foodQuantity)}g</span>
                              <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#8b5cf6] mt-1 opacity-80">Fats</span>
                           </div>
                         </div>
                       </div>
 
                       <div className="flex justify-between items-center mt-8 px-2">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted italic opacity-40">Adjust Portions</h4>
                         <div className="flex items-center gap-6 bg-surface-elevated border border-card-border rounded-full px-2 py-1.5 shadow-inner">
                            <button 
                               onClick={() => setFoodQuantity(Math.max(0.5, foodQuantity - 0.5))}
                               className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-card-border text-foreground font-black text-lg active:scale-90 transition-all"
                            >-</button>
                            <span className="font-black font-mono text-xl min-w-[40px] text-center italic">{foodQuantity}</span>
                            <button 
                               onClick={() => setFoodQuantity(foodQuantity + 0.5)}
                               className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-black font-black text-lg shadow-lg shadow-primary/20 active:scale-90 transition-all border border-primary/20"
                            >+</button>
                         </div>
                       </div>
 
                       <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-4 mt-8 px-2 opacity-40 italic">Designate Time</h4>
                         <div className="grid grid-cols-4 gap-2">
                           {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
                             <button
                               key={m}
                               onClick={() => setFormMealTime(m as any)}
                               className={cn("py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border", formMealTime === m ? "bg-primary text-black border-primary shadow-lg shadow-primary/10" : "bg-surface-elevated border-card-border text-muted hover:text-foreground")}
                             >
                               {m}
                             </button>
                           ))}
                         </div>
                       </div>
 
                       <button 
                           onClick={() => {
                               addMeal({
                                 name: f.name,
                                 calories: Math.round(f.calories * foodQuantity),
                                 protein: Math.round(f.protein * foodQuantity),
                                 carbs: Math.round(f.carbs * foodQuantity),
                                 fats: Math.round(f.fats * foodQuantity),
                                 type: 'food',
                                 mealTime: formMealTime,
                                 quantity: foodQuantity,
                                 unit: f.portion
                               });
                               awardPoints(10, false, 'Meal Logged');
                               showToast("Meal Logged", "success");
                               setSelectedFoodId(null);
                               setShowSearchModal(null);
                               setFoodQuantity(1);
                           }}
                           className="w-full bg-foreground text-background font-black py-5 rounded-[2rem] mt-8 text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-2xl hover:scale-[1.02] italic"
                       >
                           Add {foodQuantity}x to Log
                       </button>
                    </motion.div>
                  );
                })() : (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="relative mb-8 pt-2">
                      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-40" />
                      <input 
                        type="text" 
                        placeholder="Search Food Database..." 
                        className="w-full bg-surface-elevated border-b-2 border-card-border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary transition-all text-sm font-bold placeholder:text-muted placeholder:opacity-30 shadow-inner" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus 
                      />
                    </div>
                    
                    <h3 className="font-black text-[10px] tracking-[0.3em] uppercase text-muted mb-6 px-2 opacity-40 italic">{searchQuery ? 'Intel Matches' : 'Primary Database'}</h3>
                    <div className="space-y-4">
                      {COMBINED_FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((f) => (
                        <div 
                           key={f.id} 
                           className="flex justify-between items-center bg-surface-elevated/40 border border-card-border rounded-[1.5rem] p-4.5 cursor-pointer hover:border-primary/40 hover:-translate-y-1 transition-all group shadow-md"
                           onClick={() => setSelectedFoodId(f.id)}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors truncate">{f.name}</div>
                            <div className="text-[9px] text-muted font-black uppercase tracking-widest mt-1 opacity-50 whitespace-nowrap">{f.portion} • P: {f.protein}G / C: {f.carbs}G / F: {f.fats}G</div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="font-black font-mono text-foreground text-lg italic opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">{f.calories}</div>
                             <button className="text-muted group-hover:text-primary p-2 bg-background/50 border border-card-border rounded-lg group-hover:border-primary/20 transition-all">
                                <ChevronRight size={18} strokeWidth={3} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
           <DietCalendarModal 
             date={date} 
             onSelect={(d) => setDate(d)} 
             onClose={() => setShowCalendarModal(false)} 
           />
        )}
      </AnimatePresence>

      {/* Staples Editor Modal */}
      <AnimatePresence>
        {showStaplesEditor && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-3xl flex flex-col pt-safe-top"
          >
            <div className="flex justify-between items-center px-6 py-6 border-b border-card-border bg-surface-elevated/40 backdrop-blur-2xl sticky top-0 z-10">
               <h2 className="text-2xl font-black italic tracking-tighter uppercase grayscale brightness-200">Staple Command</h2>
               <button onClick={() => setShowStaplesEditor(false)} className="p-2 border border-card-border bg-surface-elevated rounded-full hover:bg-surface-elevated/80 transition-all active:scale-90 shadow-md">
                 <X size={24} strokeWidth={3} />
               </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto no-scrollbar pb-32">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted mb-6 px-2 opacity-50 italic">Active Staples</h3>
              <div className="space-y-4 mb-12">
                 {COMBINED_FOOD_DATABASE.filter(f => stapleIds.includes(f.id)).map(staple => (
                    <div key={staple.id} className="flex justify-between items-center bg-surface-elevated border border-card-border rounded-[1.5rem] p-5 shadow-lg group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors truncate">{staple.name}</div>
                        <div className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-50">{staple.calories} KCAL • {staple.portion}</div>
                      </div>
                      <button 
                        onClick={() => updateStaples(stapleIds.filter(id => id !== staple.id))} 
                        className="text-muted hover:text-red-500 p-2.5 bg-background border border-card-border rounded-xl hover:border-red-500/20 transition-all active:scale-90 shadow-md"
                      >
                        <Trash2 size={16} strokeWidth={3} />
                      </button>
                    </div>
                 ))}
                 {stapleIds.length === 0 && (
                    <div className="text-[10px] text-muted font-black uppercase tracking-[0.3em] py-16 text-center italic opacity-30">No Staples In Manifest.</div>
                 )}
              </div>

              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted mb-6 px-2 opacity-50 italic">Recon New Items</h3>
              <div className="relative mb-8">
                 <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-40" />
                 <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={stapleSearchQuery}
                    onChange={e => setStapleSearchQuery(e.target.value)}
                    className="w-full bg-surface-elevated border-b-2 border-card-border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-primary transition-all shadow-inner"
                 />
              </div>

              <div className="space-y-4">
                 {COMBINED_FOOD_DATABASE
                   .filter(f => !stapleIds.includes(f.id) && f.name.toLowerCase().includes(stapleSearchQuery.toLowerCase()))
                   .map(f => (
                    <div key={f.id} className="flex justify-between items-center bg-surface-elevated/40 border border-card-border rounded-[1.5rem] p-5 shadow-md group">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors truncate">{f.name}</div>
                        <div className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-50">{f.calories} KCAL • P:{f.protein}G C:{f.carbs}G</div>
                      </div>
                      <button 
                        onClick={() => updateStaples([...stapleIds, f.id])} 
                        className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 border border-primary/20 transition-all active:scale-95 shadow-md"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
