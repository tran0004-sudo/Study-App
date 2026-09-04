(function(){
'use strict';

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

/* 기존 어휘 퀴즈 화면은 객관식 피드백에서 eng/idiom 필드를 참조한다.
 * 반복미션 카드에도 같은 형태를 보장해 정답 선택 후 렌더 오류를 막는다. */
var oldStartVocabMission=startVocabMission;
startVocabMission=function(){
  oldStartVocabMission();
  if(S.vq&&Array.isArray(S.vq.list))S.vq.list.forEach(normalizeMissionCard);
};

/* 이미 미션을 연 상태에서도 정답 클릭 직전에 호환 필드를 보정한다. */
var oldVqPick=vqPick;
vqPick=function(idx){
  var cur=S.vq&&S.vq.list&&S.vq.list[S.vq.i];
  normalizeMissionCard(cur);
  return oldVqPick(idx);
};

/* 다음 문제로 넘어갈 때도 다음 카드의 형태를 먼저 보정한다. */
var oldVqNext=vqNext;
vqNext=function(){
  var result=oldVqNext();
  var cur=S.vq&&S.vq.list&&S.vq.list[S.vq.i];
  normalizeMissionCard(cur);
  return result;
};
})();
