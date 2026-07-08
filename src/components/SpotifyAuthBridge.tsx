import React from 'react';

export default function SpotifyAuthBridge() {
  const handleDiagnosticRedirect = async () => {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      console.log('====== SPOTIFY AUTH BRIDGE DIAGNOSTICS ======');
      console.log('1. Current window.location.origin:', window.location.origin);
      console.log('2. Calculated redirect_uri:', redirectUri);
      
      const response = await fetch(`https://ais-pre-pukf7am6c6fm6ry5qdobwt-273387987006.asia-southeast1.run.app/api/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();
      
      console.log('3. Full Authorization URL (returned from server):');
      console.log(url);
      console.log('=============================================');
      console.log('Initiating redirect in 3s to allow console inspection. Make sure the redirect_uri in the URL exactly matches your Spotify Developer Dashboard configuration.');
      
      alert('Auth URL logged to console. Redirecting in 3 seconds...');
      
      setTimeout(() => {
        window.location.href = url;
      }, 3000);
      
    } catch (error) {
      console.error('Bridge error:', error);
      alert('Error during bridge diagnostic: ' + (error as Error).message);
    }
  };

  return (
    <button 
      onClick={handleDiagnosticRedirect}
      className="bg-purple-500 text-white px-3 py-1 rounded-full font-sans font-bold text-xs"
    >
      Bridge Mode
    </button>
  );
}
