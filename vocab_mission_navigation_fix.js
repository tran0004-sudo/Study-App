(function(){
'use strict';

function shuffle(a){
  a=a.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;
  }
  return a;
}

function normalizeMissionCard(o){
  if(!o)return o;
  if(o.hanja==null)o.hanja='';
  if(o.eng==null)o.eng='';
  if(!o.idiom)o.idiom={hanja:'',read:'',def:''};
  if(o.idiom.hanja==null)o.idiom.hanja='';
  if(o.idiom.read==null)o.idiom.read='';
  if(o.idiom.def==null)o.idiom.def='';
  return o;
}

function missionPool(){
  var raw=[];
  if(typeof window.getGradeVocab==='function'){
    raw=window.getGradeVocab(Number(S.grade||0),Number(S.vocabSem||1))||[];
  }
  if(raw.length){
    return raw.map(function(r){
      return {theme:r[0]||'',kor:{word:r[1]||'',def:r[2]||''}};
    }).filter(function(c){return c.kor.word&&c.kor.def;});
  }
  return (window.VOCAB||VOCAB||[]).filter(function(c){return c&&c.kor&&c.kor.word&&c.kor.def;});
}

function kstDateKey(){
  var k=new Date(Date.now()+9*60*60*1000);
  return k.getUTCFullYear()+'-'+('0'+(k.getUTCMonth()+1)).slice(-2)+'-'+('0'+k.getUTCDate()).slice(-2);
}
function hashSeed(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRandom(seed){var s=seed>>>0;return function(){s+=0x6D2B79F5;var t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function seededShuffle(arr,seed){var out=arr.slice(),r=seededRandom(seed);for(var i=out.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}return out;}

/* 어휘 반복미션 진입을 전역 VOCAB 동기화 상태에 의존하지 않고 직접 구성한다. */
startVocabMission=function(){
  var pool=missionPool();
  if(pool.length<4){
    S.screen={type:'vocab'};
    render();
    return;
  }

  var grade=String(S.grade||''),sem=String(S.vocabSem||1);
  var picked=seededShuffle(pool,hashSeed(kstDateKey()+'|'+grade+'|'+sem+'|'+pool.length)).slice(0,3);
  var bases=picked.map(function(c,idx){
    var others=shuffle(pool.filter(function(x){return x.kor.word!==c.kor.word;}));
    var opts=shuffle([c.kor.word,others[0].kor.word,others[1].kor.word,others[2].kor.word]);
    return {def:c.kor.def,c:opts,a:opts.indexOf(c.kor.word),word:c.kor.word,theme:c.theme||'',_vqi:idx};
  });

  var list=[];
  ['mc','ox','written'].forEach(function(fmt){
    bases.forEach(function(b){
      var o=normalizeMissionCard({
        def:b.def,c:b.c.slice(),a:b.a,word:b.word,theme:b.theme,
        _fmt:fmt,_vqi:b._vqi,hanja:'',eng:'',idiom:{hanja:'',read:'',def:''}
      });
      if(fmt==='ox'){
        var showCorrect=Math.random()<0.5;
        if(showCorrect){o._cand=o.word;o._oxTrue=true;}
        else{
          var wrong=o.c.filter(function(x){return x!==o.word;});
          o._cand=wrong[Math.floor(Math.random()*wrong.length)];
          o._oxTrue=false;
        }
      }
      list.push(o);
    });
  });

  S.vq={list:list,i:0,picked:null,correct:0,done:false,mission:true};
  S.vqMission=true;
  S.screen={type:'vocabquiz'};
  render();
};

/* 정답 클릭/다음 문제에서도 카드 형태를 항상 보정한다. */
var oldVqPick=vqPick;
vqPick=function(idx){
  var cur=S.vq&&S.vq.list&&S.vq.list[S.vq.i];
  normalizeMissionCard(cur);
  return oldVqPick(idx);
};

var oldVqNext=vqNext;
vqNext=function(){
  var result=oldVqNext();
  var cur=S.vq&&S.vq.list&&S.vq.list[S.vq.i];
  normalizeMissionCard(cur);
  return result;
};

window.__vocabMissionNavigationFix='v5';
})();
