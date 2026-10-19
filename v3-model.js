/* Knee Quest 3 - local-only model, editable rulebooks, multi-muscle taxonomy.
   No network calls. All proposed exercise changes are separate from source doses. */
(function (K, D) {
'use strict';
const copy=K.clone;
const baseDefault=K.defaultState, baseValidate=K.validateState;
const BLOCKS=['bas','gainage','haut'];
const taxonomy=[
 ['quadriceps','Quadriceps','muscle'],['fessiers','Fessiers (grand fessier)','muscle'],
 ['ischios','Ischio-jambiers','muscle'],['adducteurs','Adducteurs de hanche','muscle'],
 ['abducteurs','Abducteurs / moyen et petit fessiers','muscle'],['mollets','Mollets (gastrocnemiens + soleaire)','muscle'],
 ['soleaire','Soleaire','muscle'],['tibial','Tibial anterieur','muscle'],['flecheurs-hanche','Flechisseurs de hanche','muscle'],
 ['tronc','Abdominaux / tronc','muscle'],['obliques','Obliques','muscle'],['profond','Stabilisateurs profonds du tronc','muscle'],
 ['lombaires','Extenseurs du rachis','muscle'],['poussee','Pectoraux','muscle'],['tirage','Dos / grand dorsal','muscle'],
 ['epaules','Deltoides / epaules','muscle'],['coiffe','Coiffe des rotateurs','muscle'],['trapezes','Trapezes / rhomboides','muscle'],
 ['denteles','Denteles / stabilisateurs scapulaires','muscle'],['biceps','Biceps / brachial','muscle'],
 ['triceps','Triceps','muscle'],['avant-bras','Avant-bras / prehension','muscle'],
 ['chaine-posterieure','Chaine posterieure','chaine'],['chaine-anterieure','Chaine anterieure','chaine'],
 ['chaine-laterale','Chaine laterale','chaine'],['polyarticulaire','Mouvement polyarticulaire','chaine'],
 ['proprioception','Proprioception / controle moteur','theme'],['stabilite-jambe','Stabilite des jambes / alignement','theme'],
 ['stabilite-hanche','Stabilite du bassin','theme'],['stabilite-tronc','Stabilite du tronc','theme'],
 ['a-confirmer','Identification a confirmer','theme']
].map(([id,label,kind])=>({id,label,kind}));
D.groups=Object.fromEntries(taxonomy.map(t=>[t.id,t.label]));
D.sources.acsmPower={name:'ACSM 2026 - entrainement de la puissance chez les adultes en bonne sante',url:'https://www.acsm.org/resistance-training-guidelines-update-2026/',note:'Principes generaux, pas un protocole pour la chondropathie ou apres PRP. La selection des mouvements est une proposition de classement.'};
D.sources.nhsBalance={name:'NHS - Balance exercises',url:'https://www.nhs.uk/live-well/exercise/balance-exercises/',note:'Base de mouvements controles avec un appui stable. Les mini-jeux ajoutes par Knee Quest ne sont pas un protocole NHS.'};
D.sources.nhsStrength={name:'NHS - Strength exercises',url:'https://www.nhs.uk/live-well/exercise/strength-exercises/',note:'Mouvements lents et controles : ne valide pas une conversion automatique de chaque exercice en explosivite.'};
D.sources.dualPrinciple={name:'Royal Berkshire NHS - Balance exercises, janvier 2026',url:'https://www.royalberkshire.nhs.uk/media/nvnffdnl/balance-exercises_pd-1_jan26.pdf',note:'Exemple du principe moteur + tache mentale, dans un contexte de troubles de l equilibre. Les jeux sont des creations Knee Quest, non valides comme traitement du genou.'};
D.sources.aaosKnee={name:'AAOS - Knee Conditioning Program',url:'https://www.orthoinfo.org/recovery/knee-conditioning-program/'};
const muscleMap={
 'hip-thrust':['fessiers','ischios','chaine-posterieure','stabilite-hanche'],
 'sl-squat':['quadriceps','fessiers','abducteurs','polyarticulaire','stabilite-jambe'],
 'sl-deadlift':['ischios','fessiers','lombaires','chaine-posterieure','stabilite-hanche'],
 'bulgarian':['quadriceps','fessiers','adducteurs','polyarticulaire'],
 'copenhagen':['adducteurs','obliques','stabilite-tronc'],
 'abd-plank':['abducteurs','obliques','stabilite-hanche'],
 'trap-bar':['quadriceps','fessiers','ischios','lombaires','avant-bras','polyarticulaire','chaine-posterieure'],
 'split-band':['quadriceps','fessiers','abducteurs','polyarticulaire','stabilite-jambe'],
 'calf':['mollets','soleaire'], 'slide-curl':['ischios','fessiers','chaine-posterieure'],
 'sl-bridge':['fessiers','ischios','stabilite-hanche'],
 'unstable':['proprioception','ischios','fessiers','stabilite-hanche'],
 'wall-sit':['quadriceps','fessiers','stabilite-jambe'],
 'ankle-band':['abducteurs','fessiers','stabilite-hanche','chaine-laterale'],
 'crunch':['tronc'], 'heel-touch':['obliques','tronc'], 'russian':['obliques','tronc'],
 'pushup':['poussee','triceps','epaules','tronc','polyarticulaire'],
 'biceps':['biceps','avant-bras'], 'rear-arm':['a-confirmer'],
 'plank':['tronc','profond','epaules','stabilite-tronc'],
 'bonus-01':['abducteurs','stabilite-hanche'], 'bonus-02':['adducteurs'],
 'bonus-03':['fessiers','ischios','chaine-posterieure'], 'bonus-04':['abducteurs','stabilite-hanche'],
 'bonus-05':['abducteurs','stabilite-hanche'], 'bonus-06':['quadriceps','fessiers','mollets','polyarticulaire'],
 'bonus-07':['quadriceps','fessiers','polyarticulaire'], 'bonus-08':['mollets','soleaire'],
 'bonus-09':['ischios'], 'bonus-10':['proprioception','mollets','abducteurs','stabilite-jambe'],
 'bonus-11':['profond','lombaires','fessiers','stabilite-tronc'],
 'bonus-12':['obliques','abducteurs','stabilite-tronc'],
 'bonus-13':['fessiers','ischios','stabilite-hanche'],
 'bonus-14':['profond','tronc','stabilite-tronc'], 'bonus-15':['tronc','profond','epaules'],
 'bonus-16':['quadriceps'], 'bonus-17':['tirage','trapezes','biceps'],
 'bonus-18':['coiffe','epaules'], 'bonus-19':['coiffe','poussee'],
 'bonus-20':['triceps'], 'bonus-21':['trapezes','denteles'],
 'bonus-22':['trapezes','denteles'], 'bonus-23':['epaules','trapezes','coiffe'],
 'bonus-24':['trapezes','epaules','coiffe']
};
const powerNotes={
 'hip-thrust':'Extension de hanche avec intention de montee rapide, retour controle. Pas de rebond. Charge a confirmer.',
 'sl-squat':'Remontee avec intention rapide, pied au sol, amplitude et aide prescrites. Aucun saut ajoute.',
 'sl-deadlift':'Extension de hanche avec intention rapide, tronc et appui maitrises. Pas d arrachement de la charge.',
 'bulgarian':'Remontee avec intention rapide sans saut ni changement d appui. Retour controle.',
 'trap-bar':'Intention d acceleration pendant la levee, descente controlee. Aucun saut ni charge deduite des 100 kg de force.',
 'split-band':'Variante dynamique seulement si la technique exacte et l elastique sont confirmes. Sans saut.',
 'calf':'Montee des talons avec intention rapide, redescente controlee, appui stable. Pas de bonds.',
 'sl-bridge':'Extension de hanche avec intention rapide, retour controle. Ne pas accentuer la cambrure.',
 'pushup':'Poussee avec intention rapide sur un support adapte, mains en contact. Aucune pompe claquee ajoutee.',
 'bonus-06':'Montee avec intention rapide sur une marche stable et hauteur validee, redescente controlee. Pas de saut.',
 'bonus-07':'Lever de chaise avec intention rapide, puis assise controlee. Hauteur et aide a confirmer.',
 'bonus-08':'Montee bilaterale des talons avec intention rapide, descente controlee et appui stable.',
 'bonus-17':'Tirage avec intention rapide puis retour controle, fixation de l elastique verifiee. Variante a faire valider.'
};
const manualPower=['copenhagen','abd-plank','unstable','slide-curl','rear-arm','biceps','bonus-20'];
function enrich(e) {
 e=copy(e); e.originalGroup=e.originalGroup||e.group;
 if(!Array.isArray(e.groups))e.groups=[...new Set([e.group,...(muscleMap[e.id]||[])])];
 if(e.id==='rear-arm'&&e.name==='Arriere du biceps'&&e.group==='triceps'&&!e.classificationEdited){e.group='a-confirmer';e.groups=['a-confirmer'];}
 e.classificationNote=e.classificationNote||'Classement fonctionnel propose, non exclusif. Modifiable sans changer la fiche d origine.';
 if(['abd-plank','rear-arm','copenhagen','bonus-05'].includes(e.id)&&!e.classificationNote.includes('La demonstration exacte'))e.classificationNote+=' La demonstration exacte peut modifier ce classement.';
 if(!e.powerInfo){
  const candidate=!!powerNotes[e.id];
  e.powerInfo={status:candidate?'candidate':manualPower.includes(e.id)?'review':'not-applicable',
   note:powerNotes[e.id]||(manualPower.includes(e.id)?'Pas de conversion automatique. Technique, controle et pertinence de la vitesse a confirmer avec le kine.':'Maintien isometrique, controle specifique ou mouvement sans variante de puissance preconfiguree.'),
   source:'acsmPower',origin:e.variants.power?'Dose de la fiche conservee; activation et charge restent a confirmer.':'Suggestion de technique Knee Quest, extrapolee de principes generaux, pas une prescription.',confirmed:!!(e.variants.power?.ready)};
  // No load, series or repetitions are invented for new power variants.
  if(candidate&&!e.variants.power)e.variants.power={sets:null,reps:null,seconds:null,kg:null,rest:null,ready:false};
 }
 return e;
}
function standardRule() {
 return {id:'standard',name:'Standard - ta routine',description:'Haut complet a dosage fixe, deux gainages, bas du corps alterne.',
  blocks:{bas:{enabled:true,selection:'groups',count:2,groups:[],ids:[],modulation:'day'},gainage:{enabled:true,selection:'all',count:2,groups:[],ids:[],modulation:'fixed'},haut:{enabled:true,selection:'all',count:7,groups:[],ids:[],modulation:'fixed'}},
  modes:['force','power','endurance'],cycle:['force','power','endurance'],autoRotate:true,rotationWhen:'lower-complete',rotationScope:'all',
  antiSession:true,antiExercises:true,antiGroups:true,repeatBlocks:['bas'],repeatBasis:'dominant',historyScope:'week',historyDays:7,shortage:'block',allowExceptions:true,
  order:['bas','gainage','haut'],choiceMode:'rotate',bonusPolicy:'ask',bonusBlock:'random',bonusPoints:15,
  quick:{target:35,tolerance:3,min:{bas:1,gainage:1,haut:1},max:{bas:2,gainage:2,haut:4},subsetFixed:true,setCap:0},
  timing:{warmup:5,feedback:1,repSeconds:3,restDefault:60,transition:20,sideTransition:15},
  timer:{countdown:5,devil:true,devilChance:25,devilMin:1,devilMax:4},
  fun:{confetti:true}};
}
function rulesFor(s){return s.rules||[standardRule()];}
function activeRule(s){return rulesFor(s).find(r=>r.id===s.activeRuleId)||rulesFor(s)[0];}
function effectiveModes(s,rule=activeRule(s)){return rule.cycle.filter(m=>rule.modes.includes(m)&&s.settings.modePermissions[m]);}
function normaliseState(raw) {
 const s=copy(raw);const previous=s.version!=='3.0.0';
 s.exercises=s.exercises.map(enrich);
 if(!s.rules){const r=standardRule();r.blocks.bas.count=s.settings.lowerCount||2;r.timing.restDefault=s.settings.restDefault||60;r.autoRotate=s.settings.autoMode!==false;s.rules=[r];}
 s.activeRuleId=s.activeRuleId||s.rules[0].id;
 if(!s.taxonomy)s.taxonomy=copy(taxonomy);
 for(const e of s.exercises)for(const id of [e.group,...(e.groups||[])])if(!s.taxonomy.some(t=>t.id===id))s.taxonomy.push({id,label:id,kind:'personnel'});
 s.dualHistory=s.dualHistory||[];s.dualConfig={game:'colors',movement:'seated',minutes:5,work:30,rest:30,interval:10,level:1,speech:false,...s.dualConfig};
 s.dualActive=s.dualActive||null;s.game=s.game||{};
 s.settings.localOnly=true;
 if(previous){s.draft=null;if(s.active){s.active.quickAcknowledged=true;s.active.rules=s.active.rules||standardRule();}s.migrationNote='V3 : routines locales, nouveau format court. Historique et doses personnelles conserves.';}
 s.version='3.0.0';s.ruleVersion=3;return s;
}
function defaultState(exercises){return normaliseState(baseDefault(exercises));}
function validRule(r){
 const fail=m=>{throw Error('Regle invalide : '+m);};
 const n=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const ints=(v,min,max)=>n(v,min,max)&&Number.isInteger(v);
 const arr=(a,max=1000)=>Array.isArray(a)&&a.length<=max&&a.every(x=>typeof x==='string'&&x.length<120);
 if(!r||typeof r.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>100||typeof r.description!=='string'||r.description.length>2000)fail('nom / identifiant.');
 if(!arr(r.modes,3)||!r.modes.length||r.modes.some(m=>!K.MODES.includes(m))||new Set(r.modes).size!==r.modes.length||!arr(r.cycle,3)||r.cycle.length!==3||new Set(r.cycle).size!==3||r.cycle.some(m=>!K.MODES.includes(m)))fail('modalites.');
 if(!arr(r.order,3)||r.order.length!==3||new Set(r.order).size!==3||r.order.some(b=>!BLOCKS.includes(b)))fail('ordre des circuits.');
 if(!['lower-complete','any-lower','session-complete','manual'].includes(r.rotationWhen)||!['all','profile'].includes(r.rotationScope))fail('rotation.');
 for(const b of BLOCKS){const v=r.blocks?.[b];if(!v||typeof v.enabled!=='boolean'||!['all','count','groups','manual'].includes(v.selection)||!ints(v.count,1,30)||!arr(v.groups)||!arr(v.ids)||!['fixed','day'].includes(v.modulation))fail('circuit '+b);}
 if(!BLOCKS.some(b=>r.blocks[b].enabled))fail('au moins un circuit requis.');
 for(const k of ['autoRotate','antiSession','antiExercises','antiGroups','allowExceptions'])if(typeof r[k]!=='boolean')fail(k);
 if(!arr(r.repeatBlocks,3)||r.repeatBlocks.some(b=>!BLOCKS.includes(b))||!['dominant','all'].includes(r.repeatBasis)||!['week','days'].includes(r.historyScope)||!ints(r.historyDays,1,60)||!['block','allow'].includes(r.shortage)||!['rotate','random','first'].includes(r.choiceMode)||!['off','ask'].includes(r.bonusPolicy)||!['random',...BLOCKS].includes(r.bonusBlock)||!ints(r.bonusPoints,0,30))fail('repetition / bonus.');
 const q=r.quick,t=r.timing,c=r.timer;
 if(!q||!ints(q.target,10,120)||!ints(q.tolerance,0,10)||typeof q.subsetFixed!=='boolean'||!ints(q.setCap,0,30))fail('format court.');
 for(const b of BLOCKS)if(!ints(q.min?.[b],0,20)||!ints(q.max?.[b],1,30)||q.min[b]>q.max[b])fail('min/max Quick '+b);
 if(!t||!n(t.warmup,0,30)||!n(t.feedback,0,15)||!n(t.repSeconds,.5,15)||!ints(t.restDefault,0,900)||!ints(t.transition,0,300)||!ints(t.sideTransition,0,120))fail('estimation de duree.');
 if(!c||!ints(c.countdown,0,30)||typeof c.devil!=='boolean'||!ints(c.devilChance,0,100)||!ints(c.devilMin,1,5)||!ints(c.devilMax,1,5)||c.devilMin>c.devilMax||typeof r.fun?.confetti!=='boolean')fail('chrono / effets.');
 return true;
}
function validateState(raw){
 const s=normaliseState(baseValidate(raw));
 if(s.rules.length>50||!s.rules.length)throw Error('Limite de 50 jeux de regles.');
 s.rules.forEach(validRule);if(new Set(s.rules.map(r=>r.id)).size!==s.rules.length||!s.rules.some(r=>r.id===s.activeRuleId))throw Error('Regles dupliquees ou actives introuvables.');
 if(!Array.isArray(s.taxonomy)||s.taxonomy.length>200||s.taxonomy.some(t=>!t||typeof t.id!=='string'||t.id.length>100||typeof t.label!=='string'||t.label.length>100||typeof t.kind!=='string'||t.kind.length>40)||new Set(s.taxonomy.map(t=>t.id)).size!==s.taxonomy.length)throw Error('Liste de groupes invalide.');
 for(const e of s.exercises){if(!Array.isArray(e.groups)||e.groups.length>80||e.groups.some(g=>typeof g!=='string'||g.length>100))throw Error('Groupes associes invalides.');if(e.powerInfo&&(!['candidate','review','not-applicable'].includes(e.powerInfo.status)||typeof e.powerInfo.note!=='string'||e.powerInfo.note.length>5000))throw Error('Fiche explosivite invalide.');}
 if(!Array.isArray(s.dualHistory)||s.dualHistory.length>10000)throw Error('Historique double tache invalide.');
 for(const h of s.dualHistory){if(!h||typeof h.id!=='string'||!K.validDate(h.date)||typeof h.duration!=='number'||h.duration<0||h.duration>7200||typeof h.correct!=='number'||h.correct<0||typeof h.answered!=='number'||h.answered<0||h.correct>h.answered)throw Error('Bilan double tache invalide.');}
 if(s.active){if(s.active.rules)validRule(s.active.rules);s.active.pausedAt=s.active.pausedAt||Date.now();if(s.active.timer){s.active.timer.running=false;s.active.timer.deadline=null;}}
 if(s.draft?.rules)validRule(s.draft.rules);
 if(s.dualActive){ // A running mini-game is restored paused, never silently restarted.
  if(typeof s.dualActive.remaining!=='number'||s.dualActive.remaining<0||s.dualActive.remaining>1200000)throw Error('Double tache en cours invalide.');
  s.dualActive.running=false;s.dualActive.lastTick=null;
 }
 return s;
}
function doseFor(e,mode,rule=standardRule()){
 const fixed=rule.blocks[e.block]?.modulation==='fixed'||e.block==='gainage'||e.fixed;
 if(fixed){const d=K.validDose(e.variants.base)?{dose:e.variants.base,mode:'base'}:K.validDose(e.variants.force)?{dose:e.variants.force,mode:'force'}:null;return d;}
 const d=e.variants[mode];if(!K.validDose(d))return null;
 if(mode==='power'&&(e.powerInfo?.status==='not-applicable'||d.kg==null||!e.powerInfo?.confirmed))return null;
 return {dose:d,mode};
}
function eligible(e,mode,rule){return !!(e.enabled&&e.approved&&e.frequency>0&&doseFor(e,mode,rule));}
function item(e,mode,rule,history,date,rng=Math.random){const d=doseFor(e,mode,rule);if(!d)return null;return {id:e.id,name:e.name,block:e.block,group:e.group,groups:copy(e.groups||[e.group]),pose:e.pose,mode:d.mode,dose:copy(d.dose),bonus:!!e.bonus,unilateral:!!e.unilateral,sides:e.sides,image:e.image||'',video:e.video||'',source:e.source,notes:e.notes,caution:e.caution,original:e.original,equipment:e.equipment||'',choice:rule.choiceMode==='first'?e.choices?.[0]||'':rule.choiceMode==='random'?(e.choices?.[Math.floor(rng()*e.choices.length)]||''):K.chooseChoice(e,history,date,rng),setsDone:0,skipped:false,log:[],needsReview:!e.approved,powerNote:d.mode==='power'?e.powerInfo?.note||'':''};}
function hist(history,date,r){return history.filter(s=>s.status!=='discarded'&&K.validDate(s.date)&&(r.historyScope==='week'?K.weekKey(s.date)===K.weekKey(date):s.date>=K.plusDays(date,-r.historyDays+1)&&s.date<=date));}
function usage(exercises,history,date,r){
 const h=hist(history,date,r), current=new Map(exercises.map(e=>[e.id,e]));
 const ids=new Set(), groups=new Map(BLOCKS.map(b=>[b,new Set()]));
 for(const s of h)for(const i of s.items||[])if(K.completedItem(i)&&r.repeatBlocks.includes(i.block)){
  ids.add(i.id);const e=current.get(i.id)||i;for(const g of r.repeatBasis==='all'?[...new Set([e.group,...e.groups||[]])]:[e.group])groups.get(i.block).add(g);
 }
 return {h,ids,groups};
}
function repeatSafe(e,u,r){if(!r.repeatBlocks.includes(e.block))return true;if(e.repeatAllowed&&r.allowExceptions)return true;
 if(r.antiExercises&&u.ids.has(e.id))return false;
 return !r.antiGroups||!(r.repeatBasis==='all'?[e.group,...e.groups||[]]:[e.group]).some(g=>u.groups.get(e.block).has(g));
}
function rotation(history,allowed=K.MODES,rule=standardRule()){
 const modes=rule.cycle.filter(m=>allowed.includes(m)&&rule.modes.includes(m));
 const hs=history.filter(s=>s.status!=='discarded'&&(rule.rotationScope!=='profile'||s.ruleId===rule.id||(!s.ruleId&&rule.id==='standard'))&&K.lowerItems(s).some(K.workedItem)).slice().sort((a,b)=>(b.completedAt||b.startedAt||0)-(a.completedAt||a.startedAt||0));
 const h=hs[0];if(!h)return {mode:modes[0]||null,advanced:false,complete:0,total:0,pending:[]};
 const lower=K.lowerItems(h),pending=lower.filter(i=>!K.completedItem(i)), complete=lower.length-pending.length;
 let advance=rule.rotationWhen==='lower-complete'?!pending.length:rule.rotationWhen==='any-lower'?lower.some(K.workedItem):rule.rotationWhen==='session-complete'?h.items.filter(i=>!i.bonus).every(K.completedItem):false;
 if(!rule.autoRotate)advance=false;
 let mode=modes.includes(h.mode)?h.mode:modes[0]||null;
 if(advance){const seq=rule.cycle.slice(rule.cycle.indexOf(h.mode)+1).concat(rule.cycle.slice(0,rule.cycle.indexOf(h.mode)+1));mode=seq.find(m=>modes.includes(m))||mode;}
 return {mode,advanced:advance,complete,total:lower.length,pending:advance?[]:pending,from:h.id};
}
function estimateSeconds(items,rule=standardRule()){
 const t=rule.timing;
 return (t.warmup+t.feedback)*60+items.reduce((sum,i)=>{const d=i.dose,sides=i.unilateral&&i.sides!=='single'?2:1;return sum+(d.seconds||d.reps*t.repSeconds)*d.sets*sides+(d.sets-1)*(d.rest??t.restDefault)+(sides===2?d.sets*t.sideTransition:0)+(d.seconds?d.sets*rule.timer.countdown:0);},0)+Math.max(0,items.length-1)*t.transition;
}
function signature(s){return JSON.stringify([s.mode,s.items.filter(i=>!i.bonus).map(i=>[i.id,i.choice||'',i.dose.sets,i.mode]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);}
function choose(pool,n,distinct,rng,priority=[]){const out=[];let p=pool.slice();while(p.length&&out.length<n){const favored=p.filter(e=>priority.includes(e.id));const e=K.weighted(favored.length?favored:p,rng);out.push(e);p=p.filter(x=>x.id!==e.id&&(!distinct||x.group!==e.group));}return out;}
function generate(exercises,history,options={},rng=Math.random){
 const rule=copy(options.rule||standardRule());validRule(rule);
 const opts={date:K.dateKey(),mode:rule.modes[0],quick:false,...options};
 if(!K.validDate(opts.date)||!K.MODES.includes(opts.mode)||!rule.modes.includes(opts.mode))return {ok:false,issues:['Date ou modalite incompatible avec le jeu de regles.']};
 const u=usage(exercises,history,opts.date,rule), pools={}, issues=[], baseWarnings=[];
 for(const b of BLOCKS){const cfg=rule.blocks[b];if(!cfg.enabled){pools[b]=[];continue;}
  let raw=exercises.filter(e=>!e.bonus&&e.block===b&&e.enabled&&e.frequency>0);
  if(cfg.groups.length)raw=raw.filter(e=>[e.group,...e.groups||[]].some(g=>cfg.groups.includes(g)));
  if(cfg.selection==='manual')raw=raw.filter(e=>cfg.ids.includes(e.id));
  if(cfg.selection==='manual'&&!cfg.ids.length)issues.push('Choisis au moins un exercice pour le circuit '+b+'.');
  let p=raw.filter(e=>doseFor(e,opts.mode,rule)&&(e.approved||cfg.selection==='all'&&b!=='bas'));
  if(cfg.selection==='all')for(const e of raw)if(!p.some(x=>x.id===e.id))issues.push('Dosage compatible manquant pour le circuit complet : '+e.name+'.');
  if(cfg.selection==='manual')for(const id of cfg.ids){if(!p.some(e=>e.id===id))issues.push('Selection manuelle indisponible / non validee : '+(exercises.find(e=>e.id===id)?.name||id)+'.');}
  const safe=p.filter(e=>repeatSafe(e,u,rule));
  if(safe.length!==p.length&&rule.shortage==='allow')baseWarnings.push('Repetitions autorisees par ce profil si necessaire dans le circuit '+b+'.');
  if(rule.shortage==='block'||safe.length)p=safe;
  if(!p.length)issues.push('Aucun exercice disponible pour '+b+' : verifie la dose '+opts.mode+', les confirmations, les filtres et les groupes deja termines.');
  pools[b]=p;
 }
 if(issues.length)return {ok:false,issues:[...new Set(issues)]};
 const pending=rotation(history,[opts.mode],rule).pending.map(i=>i.id);
 let best=null,bestCost=Infinity;const tries=opts.quick?360:100;
 for(let attempt=0;attempt<tries;attempt++){
  let items=[],warnings=baseWarnings.slice();
  for(const b of rule.order){const cfg=rule.blocks[b],pool=pools[b];if(!cfg.enabled)continue;
   let n=cfg.selection==='all'||cfg.selection==='manual'?pool.length:cfg.count;
   if(opts.quick&&(rule.quick.subsetFixed||!['all','manual'].includes(cfg.selection))){const min=Math.min(pool.length,Math.max(1,rule.quick.min[b])),max=Math.min(pool.length,Math.max(min,rule.quick.max[b]));n=min+Math.floor(rng()*(max-min+1));}
   const selected=choose(pool,n,cfg.selection==='groups',rng,b==='bas'?pending:[]);
   if(selected.length<n)warnings.push(b+' : '+selected.length+' exercice(s) disponible(s) pour '+n+' demande(s).');
   for(const e of selected){const i=item(e,opts.mode,rule,history,opts.date,rng);if(opts.quick&&rule.quick.setCap&&i.dose.sets>rule.quick.setCap){i.originalDose=copy(i.dose);i.dose.sets=rule.quick.setCap;i.adaptation='Plafond de series du jeu de regles Quick.';}items.push(i);}
  }
  if(!items.length)continue;
  const s={id:K.uid(),date:opts.date,mode:opts.mode,quick:opts.quick,lowerGroup:items.find(i=>i.block==='bas')?.group||'',lowerGroups:items.filter(i=>i.block==='bas').map(i=>i.group),upperGroup:rule.blocks.haut.enabled?'circuit-complet':'',items,restDefault:rule.timing.restDefault,estimatedMinutes:Math.round(estimateSeconds(items,rule)/60*10)/10,warnings,createdAt:Date.now(),status:'prepared',ruleVersion:3,ruleId:rule.id,ruleName:rule.name,rules:copy(rule),withBonus:false,bonusDecision:'none'};
  s.signature=signature(s);
  if(rule.antiSession&&u.h.some(h=>h.items?.filter(i=>!i.bonus).every(K.completedItem)&&signature(h)===s.signature))continue;
  if(!opts.quick){best=s;break;}
  const delta=s.estimatedMinutes-rule.quick.target;
  const cost=Math.abs(delta)+(delta>rule.quick.tolerance?10000:0);
  if(cost<bestCost){best=s;bestCost=cost;}
 }
 if(!best)return {ok:false,issues:['Aucune combinaison nouvelle ne respecte ces regles. Modifie les filtres ou la repetition dans Regles.']};
 if(opts.quick&&best.estimatedMinutes>rule.quick.target+rule.quick.tolerance)return {ok:false,issues:['La combinaison la plus courte trouvee est estimee a '+best.estimatedMinutes+' min (cible '+rule.quick.target+'). Ajuste les minima, autorise les sous-selections fixes ou change la cible. Aucune acceleration ni pause forcee n est ajoutee.']};
 if(opts.quick){best.warnings.push('Format court : une selection des exercices remplace le circuit complet. Les charges et repetitions sont conservees'+(rule.quick.setCap?', avec le plafond de series que tu as regle.':'.'));if(best.estimatedMinutes<rule.quick.target-rule.quick.tolerance)best.warnings.push('Moins d exercices compatibles : cette selection dure environ '+best.estimatedMinutes+' min. Aucun volume ajoute pour remplir le temps.');}
 if(best.items.some(i=>i.needsReview))best.warnings.push('Une fiche ambigue reste visible mais non executable tant que son identification n est pas confirmee.');
 return {ok:true,session:best};
}
function addBonus(session,exercises,history,block='random',rng=Math.random){
 const s=copy(session),r=s.rules||standardRule();s.items=s.items.filter(i=>!i.bonus);s.withBonus=block!=='none'&&r.bonusPolicy!=='off';s.bonusDecision=s.withBonus?'pending':'none';s.bonusBlock=block;
 if(s.withBonus){const u=usage(exercises,history,s.date,r);let pool=exercises.filter(e=>e.bonus&&eligible(e,s.mode,r)&&(block==='random'||e.block===block)&&!s.items.some(i=>i.id===e.id)&&repeatSafe(e,u,r));
  if(s.quick)pool=pool.filter(e=>estimateSeconds([...s.items,item(e,s.mode,r,history,s.date,rng)],r)/60<=r.quick.target+r.quick.tolerance);
  const e=K.weighted(pool,rng);if(e){const i=item(e,s.mode,r,history,s.date,rng);i.bonusPending=true;s.items.push(i);}else{s.withBonus=false;s.bonusDecision='unavailable';s.warnings.push('Aucun bonus confirme, dose et compatible avec le temps et les regles : aucun ajout.');}
 }
 s.estimatedMinutes=Math.round(estimateSeconds(s.items,r)/60*10)/10;return s;
}
function xp(history){const days={};for(const s of history){const r=s.rules||standardRule();const hasBonus=s.items?.some(i=>i.bonus&&K.completedItem(i));const p=30+(s.feedback?10:0)+(s.nextDay?5:0)+(hasBonus?r.bonusPoints:0);days[s.date]=Math.max(days[s.date]||0,p);}return Object.values(days).reduce((a,b)=>a+b,0);}
Object.assign(K,{taxonomy:copy(taxonomy),enrich,standardRule,rulesFor,activeRule,effectiveModes,validRule,defaultState,validateState,migrate:normaliseState,modeDose:(e,m,r)=>doseFor(e,m,r&&typeof r==='object'?r:standardRule()),doseFor,eligible:(e,m,r)=>eligible(e,m,r&&typeof r==='object'?r:standardRule()),itemV3:item,rotation,autoMode:(h,d,a,r)=>rotation(h,a,r||standardRule()).mode,estimateSeconds,signature,generate,addBonus,xp,usage});
D.exercises=D.exercises.map(enrich);
})(KQ,KQ_DATA);
