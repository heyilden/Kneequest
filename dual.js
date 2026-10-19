/* Dual-task arcade: locally generated cognitive prompts, no posture detection. */
const KQDual=(()=>{
'use strict';
const colors=[{id:'blue',label:'BLEU',shape:'CERCLE',glyph:'\u25cf',number:1,hex:'#74b5ff'},{id:'coral',label:'CORAIL',shape:'TRIANGLE',glyph:'\u25b2',number:2,hex:'#ff938b'},{id:'gold',label:'JAUNE',shape:'CARRE',glyph:'\u25a0',number:3,hex:'#f4ce69'},{id:'mint',label:'MENTHE',shape:'LOSANGE',glyph:'\u25c6',number:4,hex:'#77e5b2'}];
const games={colors:{name:'Balises chromatiques',icon:'\u25c6',description:'Associe la couleur ou la forme affichee a sa balise.'},stroop:{name:'Le mot menteur',icon:'Aa',description:'Choisis la couleur de l encre, pas le mot que tu lis.'},math:{name:'Calcul en orbite',icon:'\u2211',description:'Une petite operation pendant un mouvement deja maitrise.'},memory:{name:'Memoire des constellations',icon:'\u2726',description:'Observe la sequence, puis reproduis-la sans te presser.'}};
const movements={
 seated:{name:'Assis : levees douces des talons',equipment:'Chaise stable sans roulettes, telephone pose a portee.',instructions:'Reste assis, pieds au sol. A ton propre rythme, leve puis repose doucement les talons. Amplitude et quantite selon tes consignes. Tu peux repondre en restant assis, sans te pencher.',pose:'sitstand',standing:false},
 shifts:{name:'Debout : petits transferts d appui',equipment:'Plan de travail fixe ou barre stable, telephone pose devant toi.',instructions:'Deux pieds au sol, une main garde un appui stable. Transfere doucement une petite partie du poids d un cote a l autre, sans soulever le pied ni tourner le genou. Stabilise-toi pour toucher l ecran.',pose:'stand',standing:true},
 heels:{name:'Debout : levees bilaterales des talons',equipment:'Support fixe a hauteur de main, sol plat, telephone pose.',instructions:'Avec un appui stable et les deux pieds au sol, monte et repose les talons doucement selon tes consignes. Pas de bonds. Ne supprime pas ton appui pour repondre.',pose:'calf',standing:true},
 targets:{name:'Assis : pointe vers les balises',equipment:'Chaise stable, quatre reperes de couleur OU numerotes fixes au sol, telephone pose.',instructions:'Assis, place des reperes proches et accessibles, fixes sans bord qui glisse. Designe lentement la balise de ta reponse avec la pointe du pied puis reviens au centre. Ne tends pas la jambe au maximum. Le choix sur ecran enregistre la reponse, pas le mouvement.',pose:'sitstand',standing:false}
};
function validate(c){if(!c||!games[c.game]||!movements[c.movement])throw Error('Choisis un jeu et un mouvement.');for(const [k,min,max] of [['minutes',5,10],['work',10,60],['rest',10,90],['interval',6,30],['level',1,3]])if(!Number.isInteger(c[k])||c[k]<min||c[k]>max)throw Error('Parametre double tache invalide : '+k);return true;}
const choose=(a,r)=>a[Math.floor(r()*a.length)];
function question(c,rng=Math.random){
 const q={id:KQ.uid(),game:c.game,answered:false,correct:null,sequenceIndex:0,responses:[],label:'',target:'',shown:false};
 if(c.game==='colors'){const t=choose(colors,rng);q.target=t.id;q.visual=t;q.label=c.level>1?t.shape:t.label;q.prompt=c.level>1?'Retrouve cette forme.':'Retrouve cette balise.';q.options=colors.map(x=>({id:x.id,label:x.label,glyph:x.glyph,hex:x.hex}));}
 if(c.game==='stroop'){const ink=choose(colors,rng),word=choose(colors.filter(x=>x.id!==ink.id),rng);q.target=ink.id;q.visual=ink;q.label=word.label;q.prompt='La couleur de l encre, pas le mot.';q.options=colors.map(x=>({id:x.id,label:x.label,glyph:x.glyph,hex:x.hex}));}
 if(c.game==='math'){const a=1+Math.floor(rng()*(c.level===3?20:9)),b=1+Math.floor(rng()*9),sub=c.level>1&&rng()<.5;const answer=sub?Math.max(a,b)-Math.min(a,b):a+b;q.target=String(answer);q.label=sub?Math.max(a,b)+' - '+Math.min(a,b):a+' + '+b;q.prompt='Quel est le resultat ?';const options=new Set([answer]);let tries=0;while(options.size<4&&tries++<100)options.add(Math.max(0,answer+Math.floor(rng()*11)-5));for(let n=0;options.size<4;n++)options.add(n);q.options=[...options].sort((a,b)=>a-b).map(n=>({id:String(n),label:String(n)}));}
 if(c.game==='memory'){q.sequence=Array.from({length:c.level+1},()=>choose(colors,rng).id);q.label='Memorise la sequence';q.prompt='Observe, puis reproduis dans le meme ordre.';q.options=colors.map(x=>({id:x.id,label:x.label,glyph:x.glyph,hex:x.hex}));q.revealSeconds=3;}
 return q;
}
function create(c,now=Date.now()){validate(c);return {id:KQ.uid(),config:JSON.parse(JSON.stringify(c)),createdAt:now,remaining:c.minutes*60000,total:c.minutes*60000,phase:'ready',phaseRemaining:c.work*1000,questionRemaining:c.interval*1000,question:null,running:false,lastTick:null,correct:0,answered:0,skipped:0,rounds:0,log:[]};}
function start(a,now=Date.now(),rng=Math.random){if(a.phase==='finished')return a;if(a.phase==='ready'){a.phase='work';a.phaseRemaining=Math.min(a.remaining,a.config.work*1000);a.question=question(a.config,rng);a.questionRemaining=a.config.interval*1000;a.rounds++;}a.running=true;a.lastTick=now;return a;}
function pause(a,now=Date.now()){if(a.running)tick(a,now);a.running=false;a.lastTick=null;return a;}
function next(a,rng=Math.random){if(a.question&&!a.question.answered)a.skipped++;a.question=question(a.config,rng);a.questionRemaining=a.config.interval*1000;}
function answer(a,id){const q=a.question;if(!a.running||a.phase!=='work'||!q||q.answered)return {accepted:false};
 if(q.game==='memory'&&a.questionRemaining>(a.config.interval-q.revealSeconds)*1000)return {accepted:false};
 if(!q.options.some(o=>o.id===String(id)))return {accepted:false};
 if(q.game==='memory'){q.responses.push(String(id));if(id!==q.sequence[q.sequenceIndex]){q.correct=false;q.answered=true;}else{q.sequenceIndex++;if(q.sequenceIndex===q.sequence.length){q.correct=true;q.answered=true;}}}
 else{q.answered=true;q.correct=String(id)===q.target;}
 if(q.answered){a.answered++;if(q.correct)a.correct++;a.log.push({question:q.game,correct:q.correct});if(a.log.length>500)a.log.shift();}
 return {accepted:true,complete:q.answered,correct:q.correct};
}
function tick(a,now=Date.now(),rng=Math.random){
 if(!a.running||a.lastTick==null)return {changed:false};
 // Browser suspension must not consume an entire physical bout unseen.
 let delta=Math.max(0,now-a.lastTick);a.lastTick=now;
 if(delta>5000){a.running=false;a.lastTick=null;return {changed:true,suspended:true};}
 a.remaining=Math.max(0,a.remaining-delta);a.phaseRemaining=Math.max(0,a.phaseRemaining-delta);
 if(a.remaining<=0){a.phase='finished';a.running=false;a.lastTick=null;return {changed:true,finished:true};}
 if(a.phaseRemaining<=0){
  if(a.phase==='work'){if(a.question&&!a.question.answered)a.skipped++;a.phase='rest';a.phaseRemaining=Math.min(a.remaining,a.config.rest*1000);a.question=null;}
  else{a.phase='ready';a.phaseRemaining=Math.min(a.remaining,a.config.work*1000);a.running=false;a.lastTick=null;}
  return {changed:true};
 }
 if(a.phase==='work'){const old=a.questionRemaining;a.questionRemaining=Math.max(0,old-delta);if(a.questionRemaining<=0){next(a,rng);return {changed:true};}
  if(a.question?.game==='memory'&&old>(a.config.interval-a.question.revealSeconds)*1000&&a.questionRemaining<=(a.config.interval-a.question.revealSeconds)*1000)return {changed:true};}
 return {changed:false};
}
return {colors,games,movements,validate,question,create,start,pause,next,answer,tick};
})();
if(typeof module!=='undefined')module.exports=KQDual;
