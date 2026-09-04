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
  var fallback=(typeof VOCAB!=='undefined'&&VOCAB)?VOCAB:[];
  return fallback.filter(function(c){return c&&c.kor&&c.kor.word&&c.kor.def;});
}

function kstDateKey(){
  var k=new Date(Date.now()+9*60*60*1000);
  return k.getUTCFullYear()+'-'+('0'+(k.getUTCMonth()+1)).slice(-2)+'-'+('0'+k.getUTCDate()).slice(-2);
}
function hashSeed(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRandom(seed){var s=seed>>>0;return function(){s+=0x6D2B79F5;var t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function seededShuffle(arr,seed){var out=arr.slice(),r=seededRandom(seed);for(var i=out.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}return out;}

function isRepeatMission(){
  var vq=S.vq,cur=vq&&vq.list&&vq.list[vq.i];
  return !!(vq&&vq.mission&&cur&&cur._fmt);
}

startVocabMission=function(){
  var pool=missionPool();
  if(pool.length<4){S.screen={type:'vocab'};render();return;}

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

/* 일반 어휘 퀴즈는 기존 로직 유지, 반복미션만 독립 처리한다. */
var baseVqPick=vqPick;
vqPick=function(idx){
  if(!isRepeatMission())return baseVqPick(idx);
  var vq=S.vq,cur=normalizeMissionCard(vq.list[vq.i]);
  if(vq.picked!==null||cur._fmt==='written')return;

  var ok=false;
  if(cur._fmt==='ox'){
    vq.picked=idx;
    ok=((idx===1)===cur._oxTrue);
  }else{
    vq.picked=idx;
    ok=(idx===cur.a);
  }
  if(ok){vq.correct++;sndCorrect();floatStar('+10 ⭐');}else sndWrong();
  render();

  /* 반복미션에서는 정답 확인 뒤 자동으로 다음 문제로 이동한다. */
  var answeredIndex=vq.i;
  setTimeout(function(){
    if(S.vq===vq&&vq.mission&&!vq.done&&vq.i===answeredIndex&&vq.picked!==null){
      vqNext();
    }
  },900);
};

var baseVqNext=vqNext;
vqNext=function(){
  if(!isRepeatMission())return baseVqNext();
  var vq=S.vq;
  if(!vq||vq.picked===null)return;
  sndClick();
  if(vq.i+1<vq.list.length){
    vq.i++;
    vq.picked=null;
    vq._written='';
    normalizeMissionCard(vq.list[vq.i]);
    render();
  }else{
    vocabFinish();
  }
};

/* 객관식도 기존 어휘 퀴즈 렌더러를 재사용하지 않고 전용 화면으로 그린다. */
var baseViewVocabQuiz=viewVocabQuiz;
viewVocabQuiz=function(){
  if(!isRepeatMission())return baseViewVocabQuiz();
  var vq=S.vq,cur=normalizeMissionCard(vq.list[vq.i]);
  if(cur._fmt!=='mc')return baseViewVocabQuiz();

  var choices='';
  cur.c.forEach(function(ch,idx){
    var cls='choice';
    if(vq.picked!==null){
      if(idx===cur.a)cls+=' correct';
      else if(idx===vq.picked)cls+=' wrong';
      else cls+=' dim';
    }
    choices+='<button class="'+cls+'" data-act="vqPick" data-v="'+idx+'"><span class="kdot">'+['가','나','다','라'][idx]+'</span>'+esc(ch)+'</button>';
  });

  var fb='';
  if(vq.picked!==null){
    var ok=vq.picked===cur.a;
    fb='<div class="feedback fadein '+(ok?'ok':'no')+'"><b>'+(ok?'정답이에요! 🎯':'아쉬워요 😅')+'</b><br>정답: '+esc(cur.word)+' · '+esc(cur.def)+'</div>'+
       '<div style="padding:0 18px 24px"><button class="btn" data-act="vqNext">다음 문제 ▶</button></div>';
  }

  return '<div class="app"><div class="quiz-top"><button class="qx" data-act="openVocab">✕</button><div class="qbar"><i style="width:'+(vq.i/vq.list.length*100)+'%"></i></div><span class="mini" style="font-weight:700">'+(vq.i+1)+'/'+vq.list.length+'</span></div><div class="scroll" style="padding-bottom:20px"><div class="qcard fadein"><span class="qtag" style="background:var(--kor)">📖 어휘 반복미션 · 객관식</span><div class="qunit">🔖 뜻에 맞는 낱말 고르기</div><div class="qtext">\''+esc(cur.def)+'\' 을 뜻하는 낱말은?</div><div class="choices">'+choices+'</div></div>'+fb+'</div></div>';
};

window.__vocabMissionNavigationFix='v6';
})();
