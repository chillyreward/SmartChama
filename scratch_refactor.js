const fs = require('fs');

function refactorFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Emojis
  content = content.replace(/💡 /g, '');
  content = content.replace(/🚀 /g, '');
  content = content.replace(/📋 /g, '');
  content = content.replace(/💰 /g, '');
  content = content.replace(/🏛️ /g, '');
  content = content.replace(/📊 /g, '');
  content = content.replace(/🏢 /g, '');

  // Containers and Layout
  content = content.replace(/className="space-y-8 pb-20"/g, 'className="p-6 max-w-[1280px] mx-auto w-full font-inter space-y-8 pb-20"');
  
  // Typography mapping
  content = content.replace(/text-3xl font-black text-white/g, 'text-headline-lg font-geist font-bold text-on-surface');
  content = content.replace(/text-2xl font-bold text-white/g, 'text-headline-sm font-geist font-bold text-on-surface');
  content = content.replace(/text-xl font-bold text-white/g, 'text-headline-sm font-geist font-bold text-on-surface');
  
  // Slate dark colors -> White / Light gray
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-950/g, 'bg-surface-container-lowest');
  content = content.replace(/border-slate-800/g, 'border-[#E5E7EB]');
  content = content.replace(/border-slate-700/g, 'border-[#E5E7EB]');
  content = content.replace(/bg-slate-800/g, 'bg-surface-container-low');
  
  // Text colors
  content = content.replace(/text-slate-400/g, 'text-secondary');
  content = content.replace(/text-slate-500/g, 'text-secondary');
  content = content.replace(/text-slate-300/g, 'text-on-surface-variant');
  content = content.replace(/text-slate-600/g, 'text-secondary');
  content = content.replace(/text-white/g, 'text-on-surface');
  
  // Amber / Dark mode accents -> Primary Green
  content = content.replace(/text-amber-500/g, 'text-[#22C55E]');
  content = content.replace(/text-amber-400/g, 'text-[#22C55E]');
  content = content.replace(/bg-amber-500\/10/g, 'bg-surface-container-low');
  content = content.replace(/bg-amber-500\/20/g, 'bg-surface-container-low');
  content = content.replace(/bg-amber-500/g, 'bg-[#22C55E]');
  content = content.replace(/border-amber-500\/20/g, 'border-[#E5E7EB]');
  content = content.replace(/border-amber-500\/30/g, 'border-[#E5E7EB]');
  content = content.replace(/border-amber-500/g, 'border-[#22C55E]');
  content = content.replace(/hover:text-amber-500/g, 'hover:text-[#22C55E]');
  content = content.replace(/hover:border-amber-500\/50/g, 'hover:border-[#22C55E]');
  content = content.replace(/hover:border-amber-500/g, 'hover:border-[#22C55E]');
  content = content.replace(/hover:bg-amber-500\/5/g, 'hover:bg-surface-container-low');
  content = content.replace(/hover:bg-amber-500/g, 'hover:bg-[#22C55E]');
  content = content.replace(/hover:bg-amber-400/g, 'hover:bg-[#006e2f]');
  content = content.replace(/hover:text-amber-300/g, 'hover:text-[#006e2f]');
  
  // Modals backgrounds
  content = content.replace(/bg-black\/90/g, 'bg-[#0B0F0C]/80');
  content = content.replace(/bg-\[\#020617\]/g, 'bg-white');
  
  // Gradients and Neons
  content = content.replace(/bg-gradient-to-br from-amber-500\/10 to-orange-500\/10/g, 'bg-white');
  content = content.replace(/bg-gradient-to-br from-purple-500\/10 to-pink-500\/10/g, 'bg-white');
  content = content.replace(/bg-gradient-to-r from-purple-500\/20 to-pink-500\/20/g, 'bg-surface-container-low');
  content = content.replace(/bg-gradient-to-r from-purple-500 to-pink-500/g, 'bg-[#22C55E]');
  content = content.replace(/hover:from-purple-400 hover:to-pink-400/g, 'hover:bg-[#006e2f]');
  
  content = content.replace(/shadow-\[0_0_20px_rgba\(251,191,36,0\.3\)\]/g, 'shadow-sm');
  
  // Other accents
  content = content.replace(/text-emerald-400/g, 'text-[#22C55E]');
  content = content.replace(/text-emerald-500/g, 'text-[#22C55E]');
  content = content.replace(/bg-emerald-500\/10/g, 'bg-surface-container-low');
  content = content.replace(/bg-emerald-500/g, 'bg-[#22C55E]');
  content = content.replace(/border-emerald-500\/20/g, 'border-[#E5E7EB]');
  content = content.replace(/border-emerald-500/g, 'border-[#22C55E]');
  content = content.replace(/hover:border-emerald-500/g, 'hover:border-[#22C55E]');
  content = content.replace(/hover:bg-emerald-400/g, 'hover:bg-[#006e2f]');
  
  content = content.replace(/text-blue-400/g, 'text-[#22C55E]');
  content = content.replace(/text-blue-500/g, 'text-[#22C55E]');
  content = content.replace(/text-purple-400/g, 'text-[#22C55E]');
  content = content.replace(/text-purple-500/g, 'text-[#22C55E]');
  
  // Clean up primary buttons text (was black on amber)
  content = content.replace(/text-black font-bold/g, 'text-white font-medium');

  fs.writeFileSync(path, content, 'utf8');
  console.log('Refactored ' + path);
}

refactorFile('src/app/admin/dashboard/chamas/page.tsx');
refactorFile('src/app/admin/dashboard/chamas/[id]/page.tsx');
refactorFile('src/app/admin/dashboard/smartgrow/page.tsx');
refactorFile('src/app/dashboard/smartgrow/page.tsx');
