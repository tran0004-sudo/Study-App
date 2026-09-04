(function(){
'use strict';

function kstDateKey(offsetDays){
  var d=new Date(Date.now()+(offsetDays||0)*86400000);
  try{
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),m={};
    parts.forEach(function(p){if(p.type!=='literal')m[p.type]=p.value;});
    return m.year+'-'+m.month+'-'+m.day;
  }catch(e){
    var k=new Date(d.getTime()+9*3600000);
    return k.getUTCFullYear()+'-'+('0'+(k.getUTCMonth()+1)).slice(-2)+'-'+('0'+k.getUTCDate()).slice(-2);
  }
}

function kstDayNumber(){
  var key=kstDateKey(0).split('-');
  return Math.floor(Date.UTC(+key[0],+key[1]-1,+key[2])/86400000);
}

function hash32(s){
  var h=2166136261>>>0;
  for(var i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function rng(seed){
  var x=seed>>>0;
  return function(){
    x+=0x6D2B79F5;
    var t=x;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function seededShuffle(arr,seedText){
  var out=arr.slice(),r=rng(hash32(seedText));
  for(var i=out.length-1;i>0;i--){
    var j=Math.floor(r()*(i+1)),tmp=out[i];out[i]=out[j];out[j]=tmp;
  }
  return out;
}

function validMissionEntry(e){
  if(!e||!e.q)return false;
  var q=e.q,c=q.c,a=q.a;
  if(typeof q.q!=='string'||!q.q.trim())return false;
  if(!Array.isArray(c)||c.length<2)return false;
  if(typeof a!=='number'||a!==Math.floor(a)||a<0||a>=c.length)return false;
  var seen={};
  for(var i=0;i<c.length;i++){
    var v=String(c[i]==null?'':c[i]).trim();
    if(!v||seen[v])return false;
    seen[v]=true;
  }
  return String(c[a]).trim().length>0;
}

missionQuestions=function(subject){
  var pool=eligibleConcept(subject).filter(validMissionEntry);
  if(!pool.length)return [];

  var grade=(typeof S!=='undefined'&&S&&S.grade!=null)?String(S.grade):'';
  var ordered=seededShuffle(pool,'daily-mission-v3|'+grade+'|'+subject);
  var n=ordered.length,count=Math.min(3,n);
  var off=((kstDayNumber()*3)%n+n)%n,out=[];
  for(var i=0;i<count;i++)out.push(ordered[(off+i)%n]);
  return out;
};

window.__dailyMissionPatch={version:3,dateKey:kstDateKey,validMissionEntry:validMissionEntry};
})();
