(function(){
  'use strict';

  function vocabKey(){
    var g=Number(S.grade||0);
    if(g===1||g===2) return '1-2';
    if(g===4) return '4-'+((S.vocabSem===2)?2:1);
    return '';
  }
  function vocabLabel(){
    var g=Number(S.grade||0);
    if(g===1||g===2) return g+'학년 · 1~2학년 공통 어휘';
    if(g===4) return '4학년 '+((S.vocabSem===2)?'2학기':'1학기')+' 어휘';
    return g+'학년 어휘';
  }
  function rawPool(){
    var k=vocabKey();
    return k && window.__VOCAB_RAW && window.__VOCAB_RAW[k] ? window.__VOCAB_RAW[k] : [];
  }
  function toCard(r){
    return {theme:r[0], kor:{word:r[1],hanja:'',def:r[2]}, eng:{word:'',kor:''}, idiom:{hanja:'',read:'',def:''}, _gradeVocab:true};
  }
  function syncGradeVocab(){
    var k=vocabKey(), raw=rawPool();
    if(window.__activeGradeVocabKey!==k){
      window.__activeGradeVocabKey=k;
      S.vocabI=0;
    }
    VOCAB=raw.map(toCard);
    if(S.vocabI>=VOCAB.length) S.vocabI=Math.max(0,VOCAB.length-1);
    return VOCAB;
  }

  window.getGradeVocab=function(grade,semester){
    var key=(Number(grade)<=2)?'1-2':(Number(grade)===4?'4-'+(semester===2?2:1):'');
    return key && window.__VOCAB_RAW[key] ? window.__VOCAB_RAW[key].slice() : [];
  };

  var originalRender=render;
  render=function(){ syncGradeVocab(); return originalRender(); };

  var originalViewLearn=viewLearn;
  viewLearn=function(){
    var html=originalViewLearn();
    var n=rawPool().length;
    var desc=n ? vocabLabel()+' · '+n+'낱말 · 🔊 읽어주기' : S.grade+'학년 어휘 자료 준비 중';
    return html.replace('국어·영어·사자성어를 한 장씩 · 🔊 읽어주기',desc);
  };

  var originalMissionItems=missionItems;
  missionItems=function(){
    var arr=originalMissionItems().filter(function(x){return x.id!=='vocab';});
    if(rawPool().length) arr.push({id:'vocab',name:'어휘',ic:'📖',color:'linear-gradient(135deg,#FF9F45,#FF7A85)'});
    return arr;
  };

  vocabCur=function(){
    syncGradeVocab();
    if(!VOCAB.length) return null;
    var i=Math.max(0,Math.min(S.vocabI||0,VOCAB.length-1));
    return VOCAB[i];
  };

  viewVocab=function(){
    syncGradeVocab();
    if(!VOCAB.length){
      return '<div class="app"><div class="scroll"><div class="topbar"><button class="backb" data-act="exitToTabs">‹ 뒤로</button><span class="ebs">'+esc(S.grade+'학년 어휘')+'</span></div><div class="wrap"><div class="card" style="margin-top:12px;text-align:center;padding:30px 18px"><div style="font-size:42px">📚</div><div class="jua" style="font-size:20px;margin-top:10px">어휘 자료 준비 중</div><p class="mini" style="margin-top:8px">현재 첨부 자료는 1~2학년과 4학년 어휘가 연결되어 있어요.</p></div></div></div></div>';
    }
    var i=Math.max(0,Math.min(S.vocabI||0,VOCAB.length-1)), c=VOCAB[i], tts=ttsOn();
    var sem='';
    if(Number(S.grade)===4){
      sem='<div class="semtabs" style="margin:8px 0 14px"><button class="semtab '+((S.vocabSem||1)===1?'on':'')+'" data-act="setVocabSem" data-v="1">1학기 · 189개</button><button class="semtab '+(S.vocabSem===2?'on':'')+'" data-act="setVocabSem" data-v="2">2학기 · 224개</button></div>';
    }
    return '<div class="app"><div class="scroll"><div class="topbar"><button class="backb" data-act="exitToTabs">‹ 뒤로</button><span class="ebs">'+esc(vocabLabel())+'</span></div><div class="wrap"><div class="jua" style="font-size:20px;margin:2px 4px 6px">📖 오늘의 어휘</div>'+sem+
      '<div class="vcard pop"><div class="vtheme">🔖 '+esc(c.theme)+'</div>'+
      '<div class="vrow"><div class="vlabel" style="background:var(--kor)">어휘</div><div class="vmain"><div class="vword jua">'+esc(c.kor.word)+'</div><div class="vdef">'+esc(c.kor.def)+'</div></div><button class="vspk" data-act="sayKor">'+(tts?'🔊':'🔇')+'</button></div>'+
      (tts?'<button class="btn mint" style="margin-top:14px" data-act="sayKor">🔊 낱말과 뜻 듣기</button>':'')+'</div>'+
      '<button class="btn gold" style="margin-top:12px" data-act="startVocabQuiz">🎯 어휘 퀴즈 (뜻 보고 낱말 맞히기)</button>'+
      '<div class="vnav"><button class="btn ghost" data-act="vocabPrev"'+(i===0?' disabled':'')+'>‹ 이전</button><span class="jua" style="color:var(--ink-soft)">'+(i+1)+' / '+VOCAB.length+'</span><button class="btn ghost" data-act="vocabNext"'+(i>=VOCAB.length-1?' disabled':'')+'>다음 ›</button></div>'+
      '<p class="mini" style="text-align:center;margin-top:14px">첨부한 학년별 자료의 낱말과 뜻으로 공부해요.</p><div style="height:10px"></div></div></div></div>';
  };

  startVocabQuiz=function(n){
    syncGradeVocab();
    if(VOCAB.length<4){ S.screen={type:'vocab'}; render(); return; }
    function sh(arr){for(var i=arr.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
    var count=Math.min(n||8,VOCAB.length), pool=sh(VOCAB.slice()).slice(0,count);
    var list=pool.map(function(c){
      var others=sh(VOCAB.filter(function(x){return x.kor.word!==c.kor.word;}));
      var opts=sh([c.kor.word,others[0].kor.word,others[1].kor.word,others[2].kor.word]);
      return {def:c.kor.def,c:opts,a:opts.indexOf(c.kor.word),word:c.kor.word,hanja:'',eng:'',idiom:{hanja:'',read:'',def:''}};
    });
    S.vq={list:list,i:0,picked:null,correct:0,done:false};
    S.screen={type:'vocabquiz'}; render();
  };

  var originalViewVocabQuiz=viewVocabQuiz;
  viewVocabQuiz=function(){
    var html=originalViewVocabQuiz();
    return html.replace(/ · 영어\s* · 사자성어\s*\(\)/g,'');
  };

  document.addEventListener('click',function(ev){
    var t=ev.target.closest && ev.target.closest('[data-act]');
    if(!t || t.getAttribute('data-act')!=='setVocabSem') return;
    ev.preventDefault();
    S.vocabSem=parseInt(t.getAttribute('data-v'),10)===2?2:1;
    S.vocabI=0;
    syncGradeVocab();
    render();
  });

  if(!S.vocabSem) S.vocabSem=1;
  syncGradeVocab();
  render();
})();
