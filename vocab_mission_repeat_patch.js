(function(){
'use strict';
function sh(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function makeBase(c,all,idx){
  var others=sh(all.filter(function(x){return x.kor.word!==c.kor.word;}));
  var opts=sh([c.kor.word,others[0].kor.word,others[1].kor.word,others[2].kor.word]);
  return {def:c.kor.def,c:opts,a:opts.indexOf(c.kor.word),word:c.kor.word,theme:c.theme,_vqi:idx};
}

/* 한국 시간(KST) 기준 날짜 키. 브라우저/기기 타임존이 달라도 같은 날에는 같은 미션을 보여 준다. */
function missionDateKey(){
  var now=new Date();
  var kst=new Date(now.getTime()+9*60*60*1000);
  return kst.getUTCFullYear()+'-'+('0'+(kst.getUTCMonth()+1)).slice(-2)+'-'+('0'+kst.getUTCDate()).slice(-2);
}

/* 문자열을 32비트 시드로 변환 */
function hashSeed(str){
  var h=2166136261>>>0;
  for(var i=0;i<str.length;i++){
    h^=str.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

/* 날짜별로 재현 가능한 난수 생성기 */
function seededRandom(seed){
  var s=seed>>>0;
  return function(){
    s+=0x6D2B79F5;
    var t=s;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function seededShuffle(arr,seed){
  var out=arr.slice(),rnd=seededRandom(seed);
  for(var i=out.length-1;i>0;i--){
    var j=Math.floor(rnd()*(i+1)),t=out[i];out[i]=out[j];out[j]=t;
  }
  return out;
}

function pickDaily3(){
  if(typeof syncGradeVocab==='function') syncGradeVocab();
  if(!VOCAB||VOCAB.length<4)return [];

  /*
   * 기존 (dayIndex()*3)%n 방식은 n이 3의 배수일 때 일부 시작점만 순환할 수 있었다.
   * 날짜+학년+학기를 시드로 전체 목록을 섞은 뒤 앞의 3개를 사용하면
   * 매일 다른 조합이 나오면서 같은 날짜에는 항상 동일한 미션을 유지한다.
   */
  var grade=(typeof S!=='undefined'&&S.grade!=null)?String(S.grade):'';
  var sem=(typeof S!=='undefined'&&S.vocabSem!=null)?String(S.vocabSem):'';
  var seed=hashSeed(missionDateKey()+'|'+grade+'|'+sem+'|'+VOCAB.length);
  return seededShuffle(VOCAB,seed).slice(0,3);
}
startVocabMission=function(){
  var picked=pickDaily3(); if(!picked.length){S.screen={type:'vocab'};render();return;}
  var bases=picked.map(function(c,i){return makeBase(c,VOCAB,i);}),list=[];
  ['mc','ox','written'].forEach(function(fmt){
    bases.forEach(function(b){
      var o={def:b.def,c:b.c.slice(),a:b.a,word:b.word,theme:b.theme,_fmt:fmt,_vqi:b._vqi};
      if(fmt==='ox'){
        var showCorrect=Math.random()<0.5;
        if(showCorrect){o._cand=o.word;o._oxTrue=true;}
        else{var wrong=o.c.filter(function(x){return x!==o.word;});o._cand=wrong[Math.floor(Math.random()*wrong.length)];o._oxTrue=false;}
      }
      list.push(o);
    });
  });
  S.vq={list:list,i:0,picked:null,correct:0,done:false,mission:true};
  S.vqMission=true; S.screen={type:'vocabquiz'}; render();
};

var oldVqPick=vqPick;
vqPick=function(idx){
  var vq=S.vq,cur=vq&&vq.list[vq.i];
  if(cur&&cur._fmt==='ox'){
    if(vq.picked!==null)return; vq.picked=idx;
    var ok=(idx===1)===cur._oxTrue; if(ok){vq.correct++;sndCorrect();floatStar('+10 ⭐');}else sndWrong(); render(); return;
  }
  oldVqPick(idx);
};
window.vqWrittenSubmit=function(){
  var vq=S.vq,cur=vq&&vq.list[vq.i]; if(!cur||vq.picked!==null)return;
  var el=document.getElementById('vqWrittenInput'),val=el?el.value.trim():''; if(!val)return;
  var ok=normAns(val)===normAns(cur.word); vq.picked=ok?1:0; vq._written=val;
  if(ok){vq.correct++;sndCorrect();floatStar('+10 ⭐');}else sndWrong(); render();
};

var oldView=viewVocabQuiz;
viewVocabQuiz=function(){
  var vq=S.vq,cur=vq&&!vq.done?vq.list[vq.i]:null;
  if(!cur||!cur._fmt)return oldView();
  var fmt=cur._fmt,fb='';
  if(fmt==='mc')return oldView().replace('📖 어휘 퀴즈','📖 어휘 반복미션 · 객관식');
  if(fmt==='ox'){
    if(vq.picked!==null){var ok=((vq.picked===1)===cur._oxTrue);fb='<div class="feedback fadein '+(ok?'ok':'no')+'"><b>'+(ok?'정답이에요! 🎯':'아쉬워요 😅')+'</b><br>'+esc(cur.word)+' · '+esc(cur.def)+'</div><div style="padding:0 18px 24px"><button class="btn" data-act="vqNext">다음 문제 ▶</button></div>';}
    return '<div class="app"><div class="quiz-top"><button class="qx" data-act="openVocab">✕</button><div class="qbar"><i style="width:'+(vq.i/vq.list.length*100)+'%"></i></div><span class="mini" style="font-weight:700">'+(vq.i+1)+'/'+vq.list.length+'</span></div><div class="scroll" style="padding-bottom:20px"><div class="qcard fadein"><span class="qtag" style="background:var(--kor)">📖 어휘 반복미션 · O/X</span><div class="qunit">🔖 뜻과 낱말이 맞는지 확인하기</div><div class="qtext">\''+esc(cur.def)+'\'<br><br>이 뜻의 낱말은 <b>'+esc(cur._cand)+'</b>이다.</div><div class="ox-row"><button class="choice ox-btn" data-act="vqPick" data-v="1"><span class="ox-mark">⭕</span>맞아요</button><button class="choice ox-btn" data-act="vqPick" data-v="0"><span class="ox-mark">❌</span>아니에요</button></div></div>'+fb+'</div></div>';
  }
  if(vq.picked!==null){var wok=vq.picked===1;fb='<div class="feedback fadein '+(wok?'ok':'no')+'"><b>'+(wok?'정답이에요! 🎯':'아쉬워요 😅')+'</b><br>정답: '+esc(cur.word)+' · '+esc(cur.def)+'</div><div style="padding:0 18px 24px"><button class="btn" data-act="vqNext">'+(vq.i+1<vq.list.length?'다음 문제 ▶':'결과 보기')+'</button></div>';}
  return '<div class="app"><div class="quiz-top"><button class="qx" data-act="openVocab">✕</button><div class="qbar"><i style="width:'+(vq.i/vq.list.length*100)+'%"></i></div><span class="mini" style="font-weight:700">'+(vq.i+1)+'/'+vq.list.length+'</span></div><div class="scroll" style="padding-bottom:20px"><div class="qcard fadein"><span class="qtag" style="background:var(--kor)">📖 어휘 반복미션 · 서술형</span><div class="qunit">✍️ 뜻을 보고 낱말 직접 쓰기</div><div class="qtext">\''+esc(cur.def)+'\' 을 뜻하는 낱말을 써 보세요.</div>'+(vq.picked===null?'<input id="vqWrittenInput" autocomplete="off" style="width:100%;margin-top:18px;padding:15px;border:2px solid var(--line);border-radius:16px;font-size:17px;box-sizing:border-box" placeholder="낱말 입력"><button class="btn" style="margin-top:12px" data-act="vqWrittenSubmit">정답 확인</button>':'')+'</div>'+fb+'</div></div>';
};

document.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('[data-act="vqWrittenSubmit"]');if(!t)return;ev.preventDefault();vqWrittenSubmit();});

var oldHome=viewHome;
viewHome=function(){
  var html=oldHome();
  if(typeof rawPool==='function'&&rawPool().length){
    html=html.replace('하루 3문제 · 낱말·영어·사자성어 뜻','하루 3낱말 · 첨부 어휘 퀴즈 · 객관식→O/X→서술형 반복');
  }
  return html;
};
})();
