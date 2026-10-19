/* Knee Quest 2.0 - deterministic, independently testable planning and calendar core. */
const KQ = (() => {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const MODES = ['force', 'power', 'endurance'];
  const uid = () => (globalThis.crypto?.randomUUID?.() || 'kq-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  function validDate(s) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')) return false;
    const d=new Date(s+'T12:00:00Z'); return !isNaN(d) && d.toISOString().slice(0,10)===s;
  }
  function dateKey(d=new Date(),tz='Europe/Luxembourg') {
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${o.year}-${o.month}-${o.day}`;
  }
  function weekKey(date) {
    if(!validDate(date)) throw Error('Date invalide');
    const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);
  }
  function plusDays(s,n) {const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  function num(v,fallback=null) {if(v===''||v==null)return fallback;const n=Number(v);return Number.isFinite(n)?n:fallback;}
  function validDose(d) {return !!d && d.ready!==false && Number.isInteger(d.sets) && d.sets>0 && d.sets<=30 && ((Number.isInteger(d.reps)&&d.reps>0&&d.reps<=500)|| (Number.isFinite(d.seconds)&&d.seconds>0&&d.seconds<=3600)) && (d.kg==null || (Number.isFinite(d.kg)&&d.kg>=0&&d.kg<=500)) && (d.rest==null || (Number.isFinite(d.rest)&&d.rest>=0&&d.rest<=1800));}
  function modeDose(e,mode,strictUpper=false) {
    // The complete upper circuit is fixed, irrespective of the lower-body mode.
    if(e.block==='haut') {
      if(validDose(e.variants.base))return {dose:e.variants.base,mode:'base'};
      return validDose(e.variants.force)?{dose:e.variants.force,mode:'force'}:null;
    }
    if(e.block==='gainage'||e.fixed)return validDose(e.variants.base)?{dose:e.variants.base,mode:'base'}:null;
    return validDose(e.variants[mode])?{dose:e.variants[mode],mode}:null;
  }
  function eligible(e,mode,strictUpper=false) {return e.approved && e.enabled && e.frequency>0 && modeDose(e,mode,strictUpper);}
  function weighted(pool,rng=Math.random) {
    if(!pool.length)return null;
    const weights=pool.map(e=>Math.max(.05,e.frequency||1)*(e.favorite?2:1));let r=rng()*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<pool.length;i++){r-=weights[i];if(r<0)return pool[i];}return pool.at(-1);
  }
  function pickMany(pool,n,rng) {const out=[];pool=pool.slice();while(pool.length&&out.length<n){const e=weighted(pool,rng);out.push(e);pool=pool.filter(x=>x.id!==e.id);}return out;}
  function estimateItem(item,restDefault=60) {
    const d=item.dose, rounds=d.sets, sides=item.unilateral&&item.sides!=='single'?2:1;
    const work=d.seconds||d.reps*3; // Logistics only, NOT a prescribed exercise tempo.
    return work*rounds*sides + (rounds-1)*(d.rest??restDefault) + (sides===2?15*rounds:0);
  }
  function estimate(items,rest=60) {return Math.ceil((300+60+items.reduce((a,e)=>a+estimateItem(e,rest),0)+Math.max(0,items.length-1)*20)/60);}
  function historyForWeek(history,date) {return history.filter(s=>validDate(s.date)&&weekKey(s.date)===weekKey(date)&&s.status!=='discarded');}
  function itemFrom(e,mode,strict,rng=Math.random) {
    const v=modeDose(e,mode,strict);return {id:e.id,name:e.name,block:e.block,group:e.group,pose:e.pose,mode:v.mode,dose:clone(v.dose),bonus:e.bonus,unilateral:e.unilateral,sides:e.sides,image:e.image||'',video:e.video||'',source:e.source,notes:e.notes,caution:e.caution,original:e.original,choice:e.choices?.length?e.choices[Math.floor(rng()*e.choices.length)]:'',setsDone:0,skipped:false,log:[]};
  }
  function completedItem(e) {return !e.skipped && Number(e.setsDone||0)>=Number(e.dose?.sets||Infinity);}
  function workedItem(e) {return Number(e.setsDone||0)>0;}
  function lowerItems(s) {return (s.items||[]).filter(e=>e.block==='bas'&&!e.bonus);}
  function rotation(history,allowed=MODES) {
    const modes=MODES.filter(m=>allowed.includes(m));
    const latest=history.filter(s=>s.status!=='discarded'&&lowerItems(s).some(workedItem))
      .slice().sort((a,b)=>(b.completedAt||b.startedAt||0)-(a.completedAt||a.startedAt||0))[0];
    if(!latest)return {mode:modes[0]||'endurance',advanced:false,complete:0,total:0,pending:[]};
    const lower=lowerItems(latest),complete=lower.filter(completedItem).length;
    const pending=lower.filter(e=>!completedItem(e));
    if(pending.length&&modes.includes(latest.mode))return {mode:latest.mode,advanced:false,complete,total:lower.length,pending,from:latest.id};
    const cycle=MODES.slice(MODES.indexOf(latest.mode)+1).concat(MODES.slice(0,MODES.indexOf(latest.mode)+1));
    return {mode:cycle.find(m=>modes.includes(m))||modes[0]||'endurance',advanced:!pending.length,complete,total:lower.length,pending:[],from:latest.id};
  }
  function autoMode(history,date,allowed=['endurance']) {return rotation(history,allowed).mode;}
  function signature(s) {return JSON.stringify([s.mode,(s.lowerGroups||[s.lowerGroup]).slice().sort(),s.items.filter(e=>!e.bonus).map(e=>[e.id,e.choice||'']).sort()]);}
  function weekUsage(exercises,history,date) {
    const wh=historyForWeek(history,date);
    const current=new Map(exercises.map(e=>[e.id,e]));
    const done=wh.flatMap(s=>(s.items||[]).filter(completedItem));
    return {wh,usedIds:new Set(done.map(e=>e.id)),usedLower:new Set(done.filter(e=>e.block==='bas'&&!e.bonus).map(e=>current.get(e.id)?.group||e.group))};
  }
  function chooseChoice(e,history,date,rng) {
    if(!e.choices?.length)return '';
    const used=new Set(historyForWeek(history,date).flatMap(s=>(s.items||[]).filter(i=>i.id===e.id&&completedItem(i)).map(i=>i.choice)));
    const choices=e.choices.filter(c=>!used.has(c));
    const pool=choices.length?choices:e.choices;return pool[Math.floor(rng()*pool.length)];
  }
  function addBonus(session,exercises,history,block='random',rng=Math.random) {
    const s=clone(session);s.items=s.items.filter(i=>!i.bonus);s.withBonus=block!=='none';s.bonusBlock=block;
    if(block==='none'){s.estimatedMinutes=estimate(s.items,s.restDefault);return s;}
    const usage=weekUsage(exercises,history,s.date);
    const pool=exercises.filter(e=>e.bonus&&eligible(e,s.mode)&&
      (block==='random'||e.block===block)&&!s.items.some(i=>i.id===e.id)&&
      (!usage.usedIds.has(e.id)||e.repeatAllowed)&&
      (e.block!=='bas'||!usage.usedLower.has(e.group)));
    const e=weighted(pool,rng);
    if(e){const i=itemFrom(e,s.mode,false,rng);i.choice=chooseChoice(e,history,s.date,rng);s.items.push(i);}
    else s.warnings.push('Bonus demande, mais aucune fiche bonus autorisee et dosee ne convient. Aucun exercice invente ou active automatiquement.');
    s.estimatedMinutes=estimate(s.items,s.restDefault);return s;
  }
  function generate(exercises,history,options={},rng=Math.random) {
    const opts={date:dateKey(),mode:'endurance',quick:false,bonusBlock:'none',lowerCount:2,restDefault:60,...options};
    if(!MODES.includes(opts.mode))throw Error('Modalite invalide.');
    if(!validDate(opts.date))throw Error('Date invalide.');
    const {wh,usedIds,usedLower}=weekUsage(exercises,history,opts.date);
    const lower=exercises.filter(e=>e.block==='bas'&&!e.bonus&&eligible(e,opts.mode)&&
      (!usedIds.has(e.id)||e.repeatAllowed)&&!usedLower.has(e.group));
    const fixed=exercises.filter(e=>['haut','gainage'].includes(e.block)&&!e.bonus&&e.enabled);
    const missing=fixed.filter(e=>!modeDose(e,opts.mode));
    const issues=[];
    if(!lower.length)issues.push('Aucun groupe du bas non termine cette semaine ne dispose du dosage autorise pour ce mode. Ajoute une variante validee ou choisis un autre mode autorise.');
    if(!fixed.some(e=>e.block==='haut'))issues.push('Le circuit haut du corps ne contient aucun exercice actif.');
    if(!fixed.some(e=>e.block==='gainage'))issues.push('Le circuit gainage ne contient aucun exercice actif.');
    if(missing.length)issues.push('Dosage fixe manquant pour : '+missing.map(e=>e.name).join(', ')+'. Renseigne-le dans la bibliotheque.');
    if(issues.length)return {ok:false,issues};
    const groups=[...new Set(lower.map(e=>e.group))],count=Math.min(Math.max(1,Math.min(4,Number(opts.lowerCount)||2)),groups.length);
    const pending=rotation(history,[opts.mode]).pending;
    for(let attempt=0;attempt<100;attempt++){
      const pool=lower.slice(),selected=[];
      for(let n=0;n<count;n++){
        const candidates=pool.filter(e=>!selected.some(i=>i.group===e.group));
        const priority=candidates.filter(e=>pending.some(i=>i.id===e.id));
        const e=weighted(priority.length?priority:candidates,rng);if(e)selected.push(e);
      }
      const gains=fixed.filter(e=>e.block==='gainage'),upper=fixed.filter(e=>e.block==='haut');
      const items=[...selected,...gains,...upper].map(e=>{
        const i=itemFrom(e,opts.mode,false,rng);i.choice=chooseChoice(e,history,opts.date,rng);
        if(!e.approved){i.needsReview=true;i.reviewReason='Identification / validation de cette fiche a confirmer. Ne pas executer avant confirmation.';}
        return i;
      });
      const warnings=[];
      const disabled=exercises.filter(e=>!e.bonus&&['haut','gainage'].includes(e.block)&&!e.enabled);
      if(disabled.length)warnings.push('Exclusions manuelles du circuit fixe : '+disabled.map(e=>e.name).join(', ')+'.');
      if(items.some(e=>e.needsReview))warnings.push('Fiche(s) a confirmer : elles restent visibles dans le circuit mais leur execution est bloquee avant identification dans la bibliotheque.');
      if(count<opts.lowerCount)warnings.push('Il ne reste que '+count+' groupe(s) du bas compatible(s) et non termine(s) cette semaine. Aucun groupe deja termine ne sera repete.');
      const s={id:uid(),date:opts.date,mode:opts.mode,quick:opts.quick,lowerGroup:selected[0].group,lowerGroups:selected.map(e=>e.group),upperGroup:'circuit-complet',items,restDefault:opts.restDefault,estimatedMinutes:estimate(items,opts.restDefault),warnings,createdAt:Date.now(),status:'prepared',ruleVersion:2};
      if(opts.quick&&s.estimatedMinutes>35)s.warnings.push('Programme complet estime a '+s.estimatedMinutes+' min : Quick mettra la seance en pause a 35 min. Il ne supprime pas le haut / gainage et ne raccourcit aucune dose.');
      s.signature=signature(s);
      // A merely opened or interrupted session must not consume an unperformed plan.
      if(wh.some(h=>lowerItems(h).length&&lowerItems(h).every(completedItem)&&signature(h)===s.signature))continue;
      return {ok:true,session:opts.bonusBlock==='none'?s:addBonus(s,exercises,history,opts.bonusBlock,rng)};
    }
    return {ok:false,issues:['Aucune nouvelle combinaison compatible cette semaine.']};
  }
  function migrate(state) {
    const s=clone(state);if(s.version==='2.0.0')return s;
    s.settings={...defaultState([]).settings,...s.settings,strictUpper:false};
    for(const e of s.exercises){
      e.originalGroup=e.originalGroup||e.group;
      if(e.id==='wall-sit')e.choices=['Standard','Montee alternee des talons','Statique, talons maintenus hauts','Elastique autour des genoux'];
    }
    // Never modify an active exercise or an old recorded prescription.
    s.draft=null;s.version='2.0.0';s.ruleVersion=2;return s;
  }
  // Convert wall time in an IANA timezone to UTC; reject nonexistent DST times.
  function zonedDate(date,time,tz='Europe/Luxembourg') {
    if(!validDate(date)||!/^\d{2}:\d{2}$/.test(time))throw Error('Date ou heure invalide.');
    const [h,m]=time.split(':').map(Number);if(h>23||m>59)throw Error('Heure invalide.');
    const wanted=Date.parse(date+'T'+time+':00Z');let t=wanted;
    const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    for(let i=0;i<4;i++){const p=Object.fromEntries(fmt.formatToParts(new Date(t)).map(v=>[v.type,v.value]));const asUTC=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);const diff=wanted-asUTC;if(!diff)return new Date(t);t+=diff;}
    throw Error('Cette heure n\'existe pas lors du changement d\'heure. Choisis une autre heure.');
  }
  const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const escICS=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function fold(line) {let out='',n=0;for(const c of line){const b=new TextEncoder().encode(c).length;if(n+b>73){out+='\r\n ';n=1;}out+=c;n+=b;}return out;}
  function ics(events,tz='Europe/Luxembourg') {
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KneeQuest//Agenda 1.0//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Knee Quest'];
    events.forEach(e=>{const start=zonedDate(e.date,e.time,tz),end=new Date(+start+(e.duration||35)*60000);
      lines.push('BEGIN:VEVENT',`UID:${e.id}@kneequest.local`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SEQUENCE:${e.revision||0}`,`SUMMARY:${escICS('Knee Quest - '+e.title+' ['+e.id.slice(0,6)+']')}`,`DESCRIPTION:${escICS('Seance personnelle. Ouvrir Knee Quest. Horaires : '+tz+'. Les modifications dans l\'application ne se synchronisent pas automatiquement.')}`,'STATUS:CONFIRMED');
      if(e.reminder!==false)lines.push('BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:Knee Quest','END:VALARM');
      lines.push('END:VEVENT');});lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
  }
  function googleURL(e,tz='Europe/Luxembourg') {
    const start=zonedDate(e.date,e.time,tz);const params=new URLSearchParams({action:'TEMPLATE',text:'Knee Quest - '+e.title+' ['+e.id.slice(0,6)+']',dates:stamp(start)+'/'+stamp(new Date(+start+(e.duration||35)*60000)),ctz:tz,details:'Seance personnelle. Ouvrir Knee Quest. Modifier ou supprimer cet evenement directement dans Google Agenda si le planning change.'});
    return 'https://calendar.google.com/calendar/render?'+params;
  }
  function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
  function defaultState(exercises) {return {schema:1,version:'2.0.0',exercises:clone(exercises).map(e=>({...e,originalGroup:e.originalGroup||e.group,...(e.id==='wall-sit'?{choices:['Standard','Montee alternee des talons','Statique, talons maintenus hauts','Elastique autour des genoux']}: {})})),history:[],events:[],draft:null,active:null,settings:{target:3,modePermissions:{endurance:true,force:false,power:false},resumeCleared:false,strictUpper:false,autoMode:true,lowerCount:2,restDefault:60,theme:'aurora',reducedMotion:false,sound:false,reminders:false,timeZone:'Europe/Luxembourg'},game:{secret:false},savedAt:Date.now(),lastBackup:null};}
  function validateState(s) {
    const fail=msg=>{throw Error(msg||'Sauvegarde invalide. Aucune donnee n\'a ete remplacee.');};
    const ident=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
    const text=(v,n=6000)=>v==null||(typeof v==='string'&&v.length<=n);
    const number=(v,min=0,max=1e15)=>v==null||(typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max);
    const checkDose=d=>{
      if(!d||typeof d!=='object'||Array.isArray(d))fail('Dosage invalide.');
      if(!number(d.sets,1,30)||!number(d.reps,0,500)||!number(d.seconds,0,3600)||!number(d.kg,0,500)||!number(d.rest,0,1800))fail('Valeurs de dosage invalides.');
      if(d.sets!=null&&!Number.isInteger(d.sets))fail('Nombre de series invalide.');
      if(d.reps!=null&&!Number.isInteger(d.reps))fail('Nombre de repetitions invalide.');
      if(d.ready!=null&&typeof d.ready!=='boolean')fail('Statut de dosage invalide.');
    };
    const checkItem=e=>{
      if(!e||!ident(e.id)||!text(e.name,200)||typeof e.name!=='string'||!['bas','gainage','haut'].includes(e.block)||!text(e.group,100)||typeof e.group!=='string')fail('Exercice invalide.');
      for(const k of ['notes','original','caution','equipment','video','sourceURL','source','choice','skipReason'])if(!text(e[k],10000))fail('Texte de fiche invalide.');
      if(!text(e.image,2000000)||!text(e.pose,60)||!number(e.setsDone,0,30))fail('Image ou serie invalide.');
      if(e.sides!=null&&!['not_specified','single','both'].includes(e.sides))fail('Cote invalide.');
      if(e.dose)checkDose(e.dose);
      if(e.log){if(!Array.isArray(e.log)||e.log.length>100)fail('Journal de series invalide.');for(const l of e.log)if(!number(l.set,0,30)||!number(l.reps,0,500)||!number(l.seconds,0,3600)||!number(l.kg,0,500)||!text(l.at,100))fail('Serie reelle invalide.');}
    };
    const checkEvent=e=>{
      if(!e||!ident(e.id)||!validDate(e.date)||!text(e.title,200)||typeof e.title!=='string'||(typeof e.duration!=='number'||!number(e.duration,10,240))||!number(e.revision,0,1e6)||!text(e.googleLink,2000))fail('Evenement invalide.');
      zonedDate(e.date,e.time,s.settings.timeZone||'Europe/Luxembourg');
    };
    if(!s||s.schema!==1||!Array.isArray(s.exercises)||!Array.isArray(s.history)||!Array.isArray(s.events)||!s.settings)fail('Fichier Knee Quest invalide ou version incompatible.');
    if(s.exercises.length>1000||s.history.length>10000||s.events.length>5000)fail('Fichier trop volumineux.');
    const st=s.settings;
    if(![2,3].includes(st.target)||!['aurora','arcade','zen'].includes(st.theme)||!number(st.restDefault,10,900)||!st.modePermissions)fail('Reglages invalides.');
    for(const k of ['resumeCleared','strictUpper','sound','reminders','reducedMotion'])if(typeof st[k]!=='boolean')fail('Autorisation ou preference invalide.');
    for(const m of MODES)if(typeof st.modePermissions[m]!=='boolean')fail('Autorisation de modalite invalide.');
    if(!text(st.clearanceNote,6000)||!text(st.timeZone,80))fail('Consignes invalides.');
    new Intl.DateTimeFormat('fr-FR',{timeZone:st.timeZone||'Europe/Luxembourg'});
    const ids=new Set();for(const e of s.exercises){
      checkItem(e);if(ids.has(e.id)||!e.variants||typeof e.variants!=='object'||Array.isArray(e.variants))fail('Fiche dupliquee ou variantes invalides.');ids.add(e.id);
      if(!number(e.frequency,0,10))fail('Frequence invalide.');
      for(const k of ['approved','enabled','bonus','favorite','repeatAllowed','unilateral','fixed','custom'])if(e[k]!=null&&typeof e[k]!=='boolean')fail('Drapeau de fiche invalide.');
      for(const [m,d] of Object.entries(e.variants)){if(!['base',...MODES].includes(m))fail('Modalite inconnue.');checkDose(d);}
      if(e.choices&&(!Array.isArray(e.choices)||e.choices.length>100||!e.choices.every(c=>text(c,300))))fail('Variantes de mouvement invalides.');
    }
    const checkSession=x=>{
      if(!x||!ident(x.id)||!validDate(x.date)||!MODES.includes(x.mode)||!Array.isArray(x.items)||!x.items.length||x.items.length>100||!text(x.lowerGroup,100)||!text(x.upperGroup,100))fail('Seance invalide.');
      x.items.forEach(e=>{checkItem(e);if(!validDose(e.dose)||!['base',...MODES].includes(e.mode)||!Number.isInteger(e.setsDone)||e.setsDone<0||e.setsDone>e.dose.sets||!Array.isArray(e.log))fail('Prescription ou progression de seance invalide.');});
      if(!number(x.startedAt)||!number(x.pausedAt)||!number(x.pausedMs)||!number(x.durationSeconds)||!number(x.estimatedMinutes,0,100000))fail('Duree de seance invalide.');
      for(const f of [x.checkin,x.feedback,x.nextDay])if(f){if(!number(f.knee,0,10)||!number(f.overall,0,10)||!number(f.effort,0,10)||!text(f.note,6000))fail('Ressenti invalide.');}
      if(x.nextDay&&!validDate(x.nextDay.date))fail('Date du suivi invalide.');
      if(x.timer&&(!number(x.timer.remaining,0,3600)||!number(x.timer.total,0,3600)||!number(x.timer.deadline)||typeof x.timer.running!=='boolean'))fail('Chrono invalide.');
      if(x.warnings&&(!Array.isArray(x.warnings)||!x.warnings.every(w=>text(w,2000))))fail('Avertissement invalide.');
    };
    s.history.forEach(checkSession);s.events.forEach(checkEvent);
    if(s.externalCleanup){if(!Array.isArray(s.externalCleanup)||s.externalCleanup.length>5000)fail('Agenda invalide.');s.externalCleanup.forEach(checkEvent);}
    if(s.game&&(typeof s.game!=='object'||Array.isArray(s.game)||(s.game.secret!=null&&typeof s.game.secret!=='boolean')))fail('Preferences de jeu invalides.');
    if(s.active){checkSession(s.active);if(!Number.isInteger(s.active.index)||s.active.index<0||s.active.index>=s.active.items.length||typeof s.active.startedAt!=='number')fail('Position de seance invalide.');}
    if(s.draft)checkSession(s.draft);
    return clone(s);
  }
  function xp(history) {
    const byDay={};history.forEach(s=>{let n=30+(s.feedback?10:0)+(s.bonusReviewed?5:0)+(s.nextDay?5:0);byDay[s.date]=Math.max(byDay[s.date]||0,n);});return Object.values(byDay).reduce((a,b)=>a+b,0);
  }
  return {completedItem,workedItem,lowerItems,rotation,weekUsage,chooseChoice,addBonus,migrate,clone,MODES,uid,num,validDate,dateKey,weekKey,plusDays,validDose,modeDose,eligible,weighted,estimateItem,estimate,historyForWeek,itemFrom,signature,generate,autoMode,zonedDate,ics,googleURL,safeURL,defaultState,validateState,xp};
})();
if(typeof module!=='undefined')module.exports=KQ;
