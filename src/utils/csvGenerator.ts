export const generateWorkoutCSV = (workoutHistory: any[]) => {
  const headers = ['Date', 'Workout Name', 'Type', 'Exercise', 'Sets', 'Reps'];
  const rows: string[][] = [];
  
  workoutHistory.forEach(workout => {
    const date = new Date(workout.date).toLocaleDateString();
    if (workout.exercises && workout.exercises.length > 0) {
      workout.exercises.forEach((ex: any) => {
        rows.push([
          date,
          workout.name || '',
          workout.type || '',
          ex.name || '',
          (ex.sets?.length || 0).toString(),
          ex.reps || ''
        ]);
      });
    } else {
       rows.push([date, workout.name || '', workout.type || '', '', '', '']);
    }
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Workout_History_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateDietCSV = (meals: any[]) => {
  const headers = ['Date', 'Meal Time', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)'];
  const rows: string[][] = [];

  meals.forEach(meal => {
     rows.push([
       meal.date || new Date().toISOString().split('T')[0],
       meal.mealTime || 'Snacks',
       meal.name || '',
       (meal.calories || 0).toString(),
       (meal.protein || 0).toString(),
       (meal.carbs || 0).toString(),
       (meal.fats || 0).toString()
     ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(','))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Diet_History_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
