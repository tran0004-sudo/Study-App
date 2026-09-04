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

function entryId(e){
  if(e&&e.qi!==undefined&&e.qi!==null)return 'qi:'+String(e.qi);
  var q=e&&e.q?e.q:{};
  return 'q:'+String(q.q||'')+'|'+String(q.a)+'|'+(q.c||[]).join('|');
}

function pickForDate(pool,subject,dateKey){
  var grade=(typeof S!=='undefined'&&S&&S.grade!=null)?String(S.grade):'';
  return seededShuffle(pool,'daily-mission-v2|'+grade+'|'+subject+'|'+dateKey);
}

missionQuestions=function(subject){
  var pool=eligibleConcept(subject).filter(validMissionEntry);
  if(!pool.length)return [];

  var today=pickForDate(pool,subject,kstDateKey(0));
  if(pool.length<=3)return today.slice(0,Math.min(3,pool.length));

  var yesterday=pickForDate(pool,subject,kstDateKey(-1)).slice(0,Math.min(3,pool.length));
  var prev={};
  yesterday.forEach(function(e){prev[entryId(e)]=true;});

  var fresh=today.filter(function(e){return !prev[entryId(e)];});
  var repeat=today.filter(function(e){return prev[entryId(e)];});
  var chosen=fresh.slice(0,3);

  /* 6문제 이상이면 전날 3문제와 겹치지 않게 보장. 풀 자체가 작을 때만 재사용 허용. */
  if(chosen.length<3){
    var source=pool.length>=6?fresh:repeat;
    for(var i=0;i<source.length&&chosen.length<3;i++){
      if(chosen.indexOf(source[i])<0)chosen.push(source[i]);
    }
  }
  if(chosen.length<3){
    for(var j=0;j<today.length&&chosen.length<3;j++){
      if(chosen.indexOf(today[j])<0)chosen.push(today[j]);
    }
  }
  return chosen;
};

window.__dailyMissionPatch={version:2,dateKey:kstDateKey,validMissionEntry:validMissionEntry};
})();
