const fs = require('fs');
let c = fs.readFileSync('src/components/MusicMenu.tsx', 'utf8');

// remove track search
const start = c.indexOf('         {/* Track Search */}');
const end = c.indexOf('         {/* Local Audio Playlist Section */}');
const snippet = c.substring(start, end);
c = c.replace(snippet, '');

// place track search above User Playlists
const target = c.indexOf('         {/* User Playlists */}');
c = c.substring(0, target) + snippet + c.substring(target);

fs.writeFileSync('src/components/MusicMenu.tsx', c);
