/**
 * Utopia Engine 本地版 · UI 冒烟测试
 * 用法： node test-ui.mjs
 * 用最小假 DOM 加载整份 <script>（含渲染层），跑 400 局并断言渲染出的 HTML 里没有 undefined / NaN / [object Object]。
 */
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync(new URL('./utopia-engine.html', import.meta.url), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const store = {};
const els = {};
function el(id){ if(!els[id]) els[id] = { id, _html:'', set innerHTML(v){ this._html = v; }, get innerHTML(){ return this._html; }, scrollTop:0, scrollHeight:10, value:'0' }; return els[id]; }
global.document = {
  getElementById: id => el(id),
  addEventListener(){}, 
};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k,v) => { store[k]=v; } };
global.alert = () => {};
vm.runInThisContext(code, { filename: 'ue-full.js' });
const UE = globalThis.UE;
const AB=[[1,3],[5,0],[4,3],[0,1],[3,2],[3,5]], C=[0,1,2,3,4,5], RC=[0,1,3,2,4,5];
const step=x=>x>0?Math.max(0,x-10):x;
const cost=r=>r===0?-4:(r>=1&&r<=10)?-3:(r>=11&&r<=99)?-2:1+(r>0?Math.min(5,Math.floor(r/100)):(r>=-100?1:r>=-200?2:r>=-300?3:r>=-400?4:5));
function bestAct(slots,circles,d){let bk=-1,bv=-1e9;for(let k=0;k<8;k++){if(slots[k]!=null||circles[k>>1]!=null)continue;const n=slots.slice();n[k]=d;const bi=k>>1,t=n[bi*2],b=n[bi*2+1];let v;if(t!=null&&b!=null){const df=t-b;v=df===5?40:df===4?30:df===0?12:df>0?-8:-40;}else{const o=t!=null?b:t;const ok=o==null?true:(k%2===0?(o-4>=1||o-5>=1):(o+4<=6||o+5>=6));v=(ok?6:-10)+(k%2===0?(d-3.5)*2:(3.5-d)*2);}if(v>bv){bv=v;bk=k;}}return bk;}
function bestLink(b,d){let bk=-1,bv=-1e9;for(let k=0;k<6;k++){if(b.cells[k]!=null||b.circles[k>>1]!=null)continue;const n=b.cells.slice();n[k]=d;const bi=k>>1,t=n[bi*2],o=n[bi*2+1];let v;if(t!=null&&o!=null){const df=t-o;v=df<0?-120:40-df*8;}else v=8+(k%2===0?(3.5-d)*3:(d-3.5)*3);if(v>bv){bv=v;bk=k;}}for(let k=0;k<2;k++)if(b.waste[k]==null){const wv=b.circles.filter(x=>x!=null).length>=2?-20:-2;if(wv>bv){bv=wv;bk=6+k;}}return bk;}
let seed=5; const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
let rendered = 0, wins = 0;
for (let g = 0; g < 400; g++){
  UE.newGame({ seed: g * 8123 + 11, sacrifice: g % 4 });
  let n = 0;
  while (UE.S().mode !== 'over' && n++ < 4000){
    const S = UE.S();
    rendered = Math.max(rendered, el('center').innerHTML.length);
    if (S.mode === 'search'){ for(let z=0;z<2;z++){ const h=UE.hint(); if(!h.length) break; UE.placeSearch(h[0].cell); } continue; }
    if (S.mode === 'resolve'){
      const raw=S.box.raw, cand=UE.legal().filter(x=>x.startsWith('mod:')).map(x=>x.slice(4));
      let bestK=[],bestC=cost(raw);
      for(let mask=1;mask<(1<<cand.length);mask++){let v=raw,ks=[];for(let i=0;i<cand.length;i++)if(mask&(1<<i)){v=step(v);ks.push(cand[i]);}const c=cost(v);if(c<bestC){bestC=c;bestK=ks;}}
      bestK.forEach(k=>UE.toggleMod(k));
      if(UE.legal().includes('rod')) UE.useRod();
      UE.resolveSearch(); continue;
    }
    if (S.mode === 'combat'){ if(UE.legal().includes('moonlace')){UE.ignoreEncounter();continue;} if(UE.legal().includes('wand')&&S.combat.lvl>=3)UE.useWand(); UE.combatRoll(); continue; }
    if (S.mode === 'activate'){ if(UE.legal().includes('charm'))UE.useCharm(); UE.placeActivate(bestAct(S.box.slots,S.box.circles,S.dice.find(x=>!x.used).v)); continue; }
    if (S.mode === 'link'){ UE.placeLink(bestLink(S.box,S.dice.find(x=>!x.used).v)); continue; }
    if (S.mode === 'final'){ if(rnd()<.3)UE.spendHp(1); else UE.finalRoll(); continue; }
    const unfound=[0,1,2,3,4,5].filter(i=>!S.found[i]);
    const need=[];for(let i=0;i<6;i++)if(S.links[i]==null&&S.comps[C[i]]<2)need.push(C[i]);
    if (S.loc>=0){
      if(S.trk[S.loc]>=6&&!S.found[S.loc]){UE.extensiveSearch();continue;}
      const my=RC[S.loc],mine=[0,1,2,3,4,5].some(i=>S.links[i]==null&&C[i]===my);
      if(S.hp<=2){UE.rest(2);continue;}
      if(!S.found[S.loc]||(mine&&S.comps[my]<2)){UE.beginSearch();continue;}
      UE.travelTo(-1);continue;
    }
    if(UE.canFinal()){UE.beginFinal();continue;}
    if(S.gh>=3&&S.delay<7){UE.godsHand();continue;}
    const todoA=[0,1,2,3,4,5].filter(i=>S.found[i]&&!S.act[i]);
    if(S.hp<5&&!todoA.length){UE.rest(2);continue;}
    if(todoA.length){UE.beginActivate(todoA[0]);continue;}
    const todoL=[0,1,2,3,4,5].filter(i=>S.links[i]==null&&S.found[AB[i][0]]&&S.found[AB[i][1]]&&S.comps[C[i]]>0);
    if(todoL.length){UE.beginLink(todoL[0]);continue;}
    if(unfound.length){UE.travelTo(unfound[0]);continue;}
    if(need.length){UE.travelTo(RC.indexOf(need[0]));continue;}
    UE.travelTo(0);
  }
  if (UE.S().over.win) wins++;
  // 顺带检查渲染产物包含关键区块
  const c = el('center').innerHTML, l = el('left').innerHTML;
  if (!c.length || !l.includes('时间轨')) throw new Error('渲染缺失：' + g);
  if (/undefined|NaN|\[object Object\]/.test(c + l)) throw new Error('渲染里出现 undefined/NaN @game' + g + '：' + (c.match(/.{0,80}(undefined|NaN).{0,40}/)||[])[0]);
}
console.log('UI 冒烟测试通过：400 局全程渲染无异常，通关', wins, '局，最大中心面板 HTML 长度', rendered, '，localStorage 自动存档', Object.keys(store).join(','));
