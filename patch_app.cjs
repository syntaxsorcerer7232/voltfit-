const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const handleDragEnd = \(_: any, info: PanInfo\) => \{/,
  `const handleDragEnd = (e: any, info: PanInfo) => {
    const target = e.target as HTMLElement;
    if (target && typeof target.closest === 'function' && (target.closest('[data-no-swipe="true"]') || target.closest('canvas') || target.closest('.no-swipe'))) {
      return;
    }`
);
fs.writeFileSync('src/App.tsx', code);
