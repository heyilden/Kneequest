/* Original vector interface assets. Schematics are not validated technique tutorials. */
const Art=(()=>{
 const paths={home:'M3 10L12 3l9 7v10H3z M9 20v-7h6v7',cards:'M4 6l12-2 3 16-12 2z M8 3h12v16',book:'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z M12 6v16',calendar:'M4 5h16v16H4z M8 2v6 M16 2v6 M4 10h16 M8 14h2 M14 14h2',chart:'M4 3v18h17 M7 15l4-5 4 3 6-8',settings:'M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',plus:'M12 4v16 M4 12h16',arrow:'M4 12h16 M14 6l6 6-6 6',play:'M8 4l12 8-12 8z',pause:'M8 4v16 M16 4v16',check:'M5 12l4 5L20 5',x:'M5 5l14 14 M19 5L5 19',shield:'M12 2l8 4v7c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',bolt:'M14 2L4 14h8l-2 8 10-13h-8z',heart:'M12 21S1 14 3 7s8-4 9 0c1-4 7-7 9 0s-9 14-9 14z',clock:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v6l4 2',star:'M12 2l3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z',download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',edit:'M14 4l6 6 M3 21l2-7L17 2l5 5L10 19z',search:'M10 3a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M15 15l7 7',trash:'M3 6h18 M8 6V3h8v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',sound:'M3 9h5l6-5v16l-6-5H3z M18 7c4 3 4 7 0 10',moon:'M20 14A9 9 0 0 1 10 3a9 9 0 1 0 10 11',lock:'M6 10h12v11H6z M8 10V6a4 4 0 0 1 8 0v4',save:'M4 3h13l4 4v14H4z M8 3v6h8V3 M8 21v-8h9v8',refresh:'M20 6v6h-6 M4 18v-6h6 M20 12a8 8 0 0 0-14-5 M4 12a8 8 0 0 0 14 5',info:'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 11v6 M12 7v1',bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z M10 21h4',cup:'M7 3h10v9a5 5 0 0 1-10 0z M7 5H3v5c0 3 4 3 4 3 M17 5h4v5c0 3-4 3-4 3 M12 17v4 M8 21h8',expand:'M3 9V3h6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',back:'M20 12H4 M10 6l-6 6 6 6',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z',cloud:'M6 18h13a4 4 0 0 0 0-8A7 7 0 0 0 5 8a5 5 0 0 0 1 10',help:'M9 8a3 3 0 1 1 5 2l-2 2v3 M12 18v1 M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20',copy:'M8 8h13v13H8z M3 16V3h13'};
 function icon(n,s=20){return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.spark}"/></svg>`;}
 function robot(size='') {return `<svg class="robot ${size}" viewBox="0 0 260 250" role="img" aria-label="Orbit, ta mascotte"><ellipse cx="130" cy="224" rx="64" ry="10" fill="currentColor" opacity=".1"/><g class="robot-float"><path d="M129 42V24" stroke="currentColor" stroke-width="5"/><circle cx="129" cy="21" r="7" fill="var(--accent)"/><rect x="62" y="49" width="139" height="104" rx="35" fill="#293744" stroke="#60717e" stroke-width="2"/><rect x="78" y="69" width="107" height="56" rx="19" fill="#0a141e"/><path d="M98 94v8 M164 94v8" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/><path d="M122 109q9 7 17 0" stroke="var(--accent)" fill="none" stroke-width="3" stroke-linecap="round"/><rect x="84" y="158" width="95" height="46" rx="20" fill="#314653" stroke="#60717e"/><path d="M61 130l-18 38 M201 127l18-30" stroke="#91a3ad" stroke-width="14" stroke-linecap="round"/><circle cx="220" cy="91" r="10" fill="var(--accent)"/><path d="M105 200v17 M158 200v17" stroke="#90a3ac" stroke-width="12" stroke-linecap="round"/><circle cx="132" cy="180" r="10" fill="var(--accent)"/><path d="M128 175l8 5-8 5z" fill="#0a141e"/></g><path d="M27 57l4 9 9 4-9 4-4 9-4-9-9-4 9-4z M227 174l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--accent)" opacity=".65"/></svg>`;}
 // Coordinates: head, shoulder, hip, elbow/hand (near, far), knee/foot (near, far).
 const poses={
  stand:[[132,42],[132,73],[130,135],[112,106],[110,136],[155,107],[156,136],[118,173],[116,216],[147,174],[149,216]],
  hipthrust:[[65,101],[83,125],[147,125],[68,143],[51,155],[99,145],[113,158],[187,130],[183,208],[183,96],[217,93]],
  bridge:[[50,175],[76,180],[141,143],[105,199],[129,206],[62,198],[86,210],[184,157],[205,211],[178,107],[222,111]],
  'single-squat':[[115,47],[125,78],[101,137],[154,88],[184,92],[145,101],[174,108],[158,162],[145,215],[133,125],[185,143]],
  deadlift:[[71,85],[99,103],[153,119],[105,139],[118,175],[126,135],[134,176],[149,167],[137,216],[196,119],[236,121]],
  trap:[[117,72],[128,100],[104,145],[118,137],[118,177],[151,137],[156,177],[153,173],[150,214],[81,173],[74,214]],
  split:[[128,50],[127,80],[121,136],[101,112],[94,140],[151,110],[155,139],[167,161],[172,211],[96,177],[60,169]],
  'split-band':[[128,50],[127,80],[121,136],[101,112],[94,140],[151,110],[155,139],[167,161],[172,211],[96,177],[60,169]],
  wall:[[81,43],[79,76],[83,139],[113,99],[150,128],[100,110],[119,130],[151,140],[151,210],[171,144],[174,210]],
  band:[[125,39],[125,71],[123,132],[101,102],[102,128],[148,101],[147,128],[90,165],[69,213],[154,166],[172,213]],
  calf:[[128,30],[128,60],[128,124],[107,92],[108,127],[149,91],[150,121],[118,169],[128,210],[151,147],[174,161]],
  balance:[[118,40],[121,72],[121,132],[87,85],[56,82],[154,86],[184,85],[112,175],[103,214],[160,141],[179,171]],
  slide:[[45,176],[71,186],[129,162],[90,203],[115,213],[62,204],[90,214],[174,182],[217,212],[174,167],[216,189]],
  supine:[[43,179],[70,192],[141,193],[92,204],[121,212],[88,204],[116,214],[181,156],[211,213],[167,149],[193,210]],
  crunch:[[56,145],[74,171],[132,195],[56,171],[54,154],[91,151],[68,141],[176,153],[210,213],[158,150],[196,212]],
  twist:[[114,103],[124,134],[109,190],[157,153],[181,148],[130,158],[181,148],[168,170],[215,203],[156,152],[209,184]],
  plank:[[53,133],[78,149],[146,176],[76,195],[41,212],[93,184],[84,209],[188,190],[224,212],[182,191],[222,214]],
  'plank-knee':[[53,133],[78,149],[137,172],[76,195],[41,212],[93,184],[84,209],[170,213],[213,200],[174,211],[211,191]],
  pushup:[[57,106],[78,136],[146,167],[70,174],[79,213],[110,172],[124,211],[188,188],[220,213],[184,189],[218,214]],
  sideplank:[[62,124],[83,149],[146,177],[75,184],[83,215],[103,106],[106,68],[181,195],[220,213],[174,196],[210,215]],
  abduction:[[53,157],[82,174],[141,188],[105,153],[127,175],[58,188],[65,207],[179,193],[224,206],[179,156],[222,131]],
  adduction:[[53,157],[82,174],[141,188],[105,153],[127,175],[58,188],[65,207],[179,175],[225,171],[178,200],[204,215]],
  clam:[[53,157],[82,174],[141,188],[105,151],[127,172],[58,188],[65,207],[180,210],[218,188],[166,146],[218,188]],
  prone:[[46,173],[76,188],[145,188],[56,200],[34,212],[110,202],[131,212],[184,180],[203,138],[180,200],[225,211]],
  bird:[[62,137],[87,162],[144,165],[60,162],[25,163],[83,188],[82,216],[172,163],[218,162],[144,211],[178,212]],
  step:[[117,44],[117,75],[111,131],[94,107],[102,136],[141,99],[155,77],[156,146],[157,181],[102,174],[86,215]],
  sitstand:[[110,45],[115,75],[99,139],[141,91],[173,95],[143,105],[171,107],[155,141],[165,214],[136,144],[145,211]],
  'curl-leg':[[129,38],[129,69],[129,131],[105,100],[111,135],[154,100],[157,134],[121,173],[116,216],[154,173],[183,144]],
  curl:[[126,40],[126,72],[126,136],[102,109],[96,78],[151,109],[159,77],[111,173],[106,216],[143,173],[146,216]],
  triceps:[[126,42],[126,76],[126,139],[133,33],[160,62],[106,103],[130,67],[110,175],[105,216],[145,175],[149,216]],
  row:[[131,43],[131,77],[131,137],[100,96],[78,96],[163,97],[144,98],[111,176],[104,214],[147,175],[154,214]],
  rotation:[[128,43],[128,75],[128,137],[100,107],[62,107],[156,107],[192,107],[113,173],[108,214],[146,173],[150,214]],
  raise:[[128,44],[128,75],[128,138],[85,81],[45,72],[171,81],[216,72],[111,172],[107,214],[144,174],[149,215]]
 };
 function figure(p){let out='';const pairs=[[1,2],[1,3],[3,4],[1,5],[5,6],[2,7],[7,8],[2,9],[9,10]];pairs.forEach(([a,b],i)=>{out+=`<path d="M${p[a].join(' ')}L${p[b].join(' ')}" stroke="${i===0?'var(--accent)':'currentColor'}" stroke-width="${i===0?17:10}" opacity="${i===3||i===4||i>=7?.45:1}" stroke-linecap="round"/>`;});out+=`<circle cx="${p[0][0]}" cy="${p[0][1]}" r="15" fill="currentColor"/>`;[2,7,9].forEach(i=>out+=`<circle cx="${p[i][0]}" cy="${p[i][1]}" r="5" fill="var(--accent)"/>`);return out;}
 function exercise(key='stand',label='Exercice') {
   const p=poses[key]||poses.stand;let equipment='';
   if(['wall'].includes(key))equipment='<path d="M56 20v197" stroke="#627784" stroke-width="7"/>';
   if(['hipthrust','split','split-band','sitstand','step'].includes(key))equipment=key==='step'?'<path d="M140 220v-36h66v36" stroke="#607782" fill="none" stroke-width="7"/>':'<path d="M45 220v-52h36v52" stroke="#607782" fill="none" stroke-width="7"/>';
   if(key==='hipthrust')equipment='<path d="M56 220v-85h43v85" stroke="#607782" fill="none" stroke-width="7"/>';
   if(key==='band'||key==='split-band')equipment+='<path d="M72 197Q117 214 166 197" stroke="var(--purple)" fill="none" stroke-width="5"/>';
   if(key==='trap')equipment+='<path d="M64 179h135" stroke="var(--purple)" stroke-width="7"/><path d="M64 165v28 M199 165v28" stroke="var(--purple)" stroke-width="13"/>';
   if(key==='unknown')return `<svg viewBox="0 0 260 240" role="img" aria-label="Mouvement a confirmer"><circle cx="130" cy="108" r="62" fill="currentColor" opacity=".06"/><text x="130" y="130" text-anchor="middle" fill="var(--accent)" font-size="68" font-family="sans-serif">?</text><text x="130" y="204" text-anchor="middle" fill="currentColor" font-size="12">Demonstration a confirmer</text></svg>`;
   return `<svg viewBox="0 0 260 240" role="img" aria-label="Schema indicatif de ${String(label).replace(/[<>"&]/g,'')}"><ellipse cx="130" cy="224" rx="104" ry="8" fill="currentColor" opacity=".05"/><path d="M25 224h210" stroke="currentColor" opacity=".15"/>${equipment}<g class="exercise-figure">${figure(p)}</g><circle cx="230" cy="31" r="3" fill="var(--accent)" opacity=".8"/><path d="M21 41h12 M27 35v12" stroke="var(--purple)" opacity=".6"/></svg>`;
 }
 return {icon,robot,exercise,poses:Object.keys(poses).concat(['unknown'])};
})();
