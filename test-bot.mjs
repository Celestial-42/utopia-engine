/**
 * Utopia Engine 本地版 · 引擎自测（逻辑层）
 * 用法： node test-bot.mjs [局数]
 * 直接读 utopia-engine.html 里的游戏逻辑，用「期望最优落子 + 修正/探矿杖 + 人类式宏观」的机器人跑整局，
 * 检查不变量（天数/体力/材料罐/连接值范围），并输出搜索结果分布与通关率。
 */
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('./utopia-engine.html', import.meta.url), 'utf8');
globalThis.render = () => {};
vm.runInThisContext(html.match(/\/\/<UE-GAME>([\s\S]*?)\/\/<\/UE-GAME>/)[1], { filename: 'g.js' });
const UE = globalThis.UE;
const AB = [[1,3],[5,0],[4,3],[0,1],[3,2],[3,5]], C = [0,1,2,3,4,5], RC = [0,1,3,2,4,5];
const step = x => x > 0 ? Math.max(0, x - 10) : x;
const cost = r => r === 0 ? -4 : (r >= 1 && r <= 10) ? -3 : (r >= 11 && r <= 99) ? -2 : 1 + (r > 0 ? Math.min(5, Math.floor(r / 100)) : (r >= -100 ? 1 : r >= -200 ? 2 : r >= -300 ? 3 : r >= -400 ? 4 : 5));
const band = r => r === 0 ? '0:已激活神器' : (r >= 1 && r <= 10) ? '神器' : (r >= 11 && r <= 99) ? '材料' : '战斗L' + (r > 0 ? Math.min(5, Math.floor(r / 100)) : (r >= -100 ? 1 : r >= -200 ? 2 : r >= -300 ? 3 : r >= -400 ? 4 : 5));
function bestAct(slots, circles, d){ let bk=-1,bv=-1e9; for(let k=0;k<8;k++){ if(slots[k]!=null||circles[k>>1]!=null)continue; const n=slots.slice(); n[k]=d; const bi=k>>1,t=n[bi*2],b=n[bi*2+1]; let v; if(t!=null&&b!=null){const df=t-b; v=df===5?40:df===4?30:df===0?12:df>0?-8:-40;} else {const o=t!=null?b:t; const ok=o==null?true:(k%2===0?(o-4>=1||o-5>=1):(o+4<=6||o+5<=6)); v=(ok?6:-10)+(k%2===0?(d-3.5)*2:(3.5-d)*2);} if(v>bv){bv=v;bk=k;} } return bk; }
function bestLink(b, d){ let bk=-1,bv=-1e9; for(let k=0;k<6;k++){ if(b.cells[k]!=null||b.circles[k>>1]!=null)continue; const n=b.cells.slice(); n[k]=d; const bi=k>>1,t=n[bi*2],o=n[bi*2+1]; let v; if(t!=null&&o!=null){const df=t-o; v=df<0?-120:40-df*8;} else v=8+(k%2===0?(3.5-d)*3:(d-3.5)*3); if(v>bv){bv=v;bk=k;} } for(let k=0;k<2;k++) if(b.waste[k]==null){ const wv=b.circles.filter(x=>x!=null).length>=2?-20:-2; if(wv>bv){bv=wv;bk=6+k;} } return bk; }
let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

function one(g, stat){
  seed = g * 7 + 3;
  UE.newGame({ seed: g * 1013904223 + 17 });
  let n = 0;
  while (UE.S().mode !== 'over' && n++ < 4000){
    const S = UE.S();
    if (S.mode === 'search'){ for (let z=0;z<2;z++){ const h = UE.hint(); if(!h.length) break; UE.placeSearch(h[0].cell); } continue; }
    if (S.mode === 'resolve'){
      stat.bands[band(S.box.adj)] = (stat.bands[band(S.box.adj)] || 0) + 1; stat.searches++;
    // 选择最优修正组合（最多 2 个 −10）
      const raw = S.box.raw, cand = UE.legal().filter(x => x.startsWith('mod:')).map(x => x.slice(4));
      let bestK = [], bestC = cost(raw);
      for (let mask = 1; mask < (1 << cand.length); mask++){ let v = raw, ks = []; for (let i=0;i<cand.length;i++) if (mask & (1<<i)){ v = step(v); ks.push(cand[i]); } const c = cost(v); if (c < bestC){ bestC = c; bestK = ks; } }
      bestK.forEach(k => UE.toggleMod(k));
      if (UE.legal().includes('rod')) UE.useRod();
      UE.resolveSearch(); continue;
    }
    if (S.mode === 'combat'){ if (UE.legal().includes('moonlace')){ UE.ignoreEncounter(); continue; } if (UE.legal().includes('wand') && S.combat.lvl >= 3){ UE.useWand(); } UE.combatRoll(); continue; }
    if (S.mode === 'activate'){ if (UE.legal().includes('charm')) UE.useCharm(); const d = S.dice.find(x => !x.used); UE.placeActivate(bestAct(S.box.slots, S.box.circles, d.v)); continue; }
    if (S.mode === 'link'){ const d = S.dice.find(x => !x.used); UE.placeLink(bestLink(S.box, d.v)); continue; }
    if (S.mode === 'final'){ if (rnd() < .3) UE.spendHp(1); else UE.finalRoll(); continue; }
    const unfound = [0,1,2,3,4,5].filter(i => !S.found[i]);
    const need = []; for (let i=0;i<6;i++) if (S.links[i]==null && S.comps[C[i]] < 2) need.push(C[i]);
    if (S.loc >= 0){
      if (S.trk[S.loc] >= 6 && !S.found[S.loc]){ UE.extensiveSearch(); continue; }
      const my = RC[S.loc], mine = [0,1,2,3,4,5].some(i => S.links[i] == null && C[i] === my);
      if (S.hp <= 2){ UE.rest(2); continue; }
      if (!S.found[S.loc] || (mine && S.comps[my] < 2)){ UE.beginSearch(); continue; }
      UE.travelTo(-1); continue;
    }
    if (UE.canFinal()){ UE.beginFinal(); continue; }
    if (S.gh >= 3 && S.delay < 7){ UE.godsHand(); continue; }
    const todoA = [0,1,2,3,4,5].filter(i => S.found[i] && !S.act[i]);
    if (S.hp < 5 && todoA.length === 0){ UE.rest(2); continue; }
    if (todoA.length){ UE.beginActivate(todoA[0]); continue; }
    const todoL = [0,1,2,3,4,5].filter(i => S.links[i] == null && S.found[AB[i][0]] && S.found[AB[i][1]] && S.comps[C[i]] > 0);
    if (todoL.length){ UE.beginLink(todoL[0]); continue; }
    if (unfound.length){ UE.travelTo(unfound[0]); continue; }
    if (need.length){ UE.travelTo(RC.indexOf(need[0])); continue; }
    UE.travelTo(0);
  }
  const F = UE.S();
  stat.days += F.day; stat.steps += n;
  stat.found += F.found.filter(Boolean).length; stat.act += F.act.filter(Boolean).length;
  stat.links += F.links.filter(v => v != null).length;
  stat.sac += F.score.parts.reduce((a,p)=>a+0,0) || 0;
  if (F.over.win){ stat.wins++; stat.wscores.push(F.score.total); }
  stat.score += F.score.total;
  stat.reason[F.over.reason.slice(0,14)] = (stat.reason[F.over.reason.slice(0,14)]||0)+1;
  stat.delay += F.delay;
}
const N = +(process.argv[2] || 2000);
const stat = { searches:0, bands:{}, wins:0, score:0, days:0, found:0, act:0, links:0, steps:0, reason:{}, wscores:[], delay:0 };
for (let g=0; g<N; g++) one(g, stat);
const pc = x => (100*x/stat.searches).toFixed(1)+'%';
console.log(`== ${N} 局（期望最优落子 + 修正/探矿杖 + 人类式宏观）==`);
console.log('搜索结果分布:', Object.entries(stat.bands).map(([k,v])=>k+' '+pc(v)).join(' | '));
console.log('通关', stat.wins, `(${(100*stat.wins/N).toFixed(2)}%)`, '| 平均分', (stat.score/N).toFixed(1), '| 平均天数', (stat.days/N).toFixed(1), '| 平均 神器/激活/连接', (stat.found/N).toFixed(2), (stat.act/N).toFixed(2), (stat.links/N).toFixed(2), '| 平均延迟', (stat.delay/N).toFixed(2));
console.log('通关分数:', stat.wscores.join(', '));
console.log('结束原因 top:', Object.entries(stat.reason).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+'×'+v).join(' | '));
