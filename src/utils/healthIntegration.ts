// Capacitor Health integration mockup
// In a real native build, you would run:
// npm install @capacitor/core
// npm install @awesome-cordova-plugins/health cordova-plugin-health
// And then use the actual native plugins. Since this is a browser preview,
// we provide a mock implementation that simulates fetching this data.

export async function requestHealthPermissions(): Promise<boolean> {
  console.log('[Native Health] Requesting permissions for HealthKit / Google Fit...');
  
  // Simulate network/native prompt delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In a real app we'd check Capacitor.isNativePlatform() and request using the plugin
  console.log('[Native Health] Permissions granted (mock).');
  return true;
}

export async function fetchDailySteps(): Promise<number> {
  console.log('[Native Health] Fetching daily steps...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return 0 - ensure user must manually enter steps in the browser preview
  return 0;
}

export async function fetchCompletedWorkouts(): Promise<any[]> {
  console.log('[Native Health] Fetching completed workouts...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return empty array - ensure user must manually log workouts
  return [];
}
