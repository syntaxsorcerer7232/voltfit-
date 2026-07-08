import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateWeeklyReportPDF = async (
  userData: any, 
  workoutHistory: any[], 
  domElementToCapture?: HTMLElement | null
) => {
  const doc = new jsPDF();
  
  // Basic Settings
  const margin = 15;
  let y = margin;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Workout Report', margin, y);
  y += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`User: ${userData?.name || 'Athlete'}`, margin, y);
  y += 6;
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, y);
  y += 15;

  // Telemetry Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Telemetry Summary', margin, y);
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const recentWorkouts = workoutHistory.slice(-7);
  doc.text(`Workouts in last 7 days: ${recentWorkouts.length}`, margin, y);
  y += 6;
  const totalSets = recentWorkouts.reduce((acc, w) => {
    return acc + w.exercises.reduce((eAcc: number, e: any) => eAcc + e.sets.length, 0);
  }, 0);
  doc.text(`Total Sets Completed: ${totalSets}`, margin, y);
  y += 15;

  // Recent Workouts Log
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Workouts Log', margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (recentWorkouts.length === 0) {
    doc.text('No workouts logged in the last 7 days.', margin, y);
    y += 10;
  } else {
    recentWorkouts.forEach(workout => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${new Date(workout.date).toLocaleDateString()} - ${workout.name} (${workout.type})`, margin, y);
      y += 5;
      
      doc.setFont('helvetica', 'normal');
      workout.exercises.forEach((ex: any) => {
        doc.text(`- ${ex.name}: ${ex.sets.length} sets`, margin + 5, y);
        y += 5;
      });
      y += 3;

      // Page break check
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    });
  }

  // Visual Chart Capture (if provided)
  if (domElementToCapture) {
    try {
      const canvas = await html2canvas(domElementToCapture, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      if (y > 200) {
        doc.addPage();
        y = margin;
      } else {
        y += 10;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Visual Telemetry Charts', margin, y);
      y += 10;
      
      // Calculate aspect ratio
      const imgWidth = 180;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
    } catch (e) {
      console.error('Could not capture DOM for PDF', e);
    }
  }

  // Save via Blob
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
