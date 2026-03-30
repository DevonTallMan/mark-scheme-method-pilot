(function(){
'use strict';
function getCC(){return new URLSearchParams(window.location.search).get('class')||'5MFH4P';}
function daysSince(ts){if(!ts)return 0;var d=ts.toDate?ts.toDate():new Date(ts.seconds?ts.seconds*1000:ts);return Math.floor((Date.now()-d.getTime())/86400000);}
function statusBadge(rv){var next=rv.nextReviewDate;if(!next)return null;var d=next.toDate?next.toDate():new Date(next.seconds?next.seconds*1000:next);var diff=Math.floor((d-new Date())/86400000);if(diff<0)return{cls:'overdue',label:'Overdue '+Math.abs(diff)+'d'};if(diff===0)return{cls:'today',label:'Due today'};return null;}
function scoreTrend(rv){var diff=(rv.lastScore||0)-(rv.originalScore||0);if(diff>0)return{cls:'up',text:'up '+rv.lastScore+'% (+'+diff+')'};if(diff<0)return{cls:'down',text:'dn '+rv.lastScore+'% ('+diff+')'};return{cls:'same',text:(rv.lastScore||0)+'%'};}
function moduleUrl(id){var cc=getCC();var map={'ca-611':'review-611.html?class='+cc};return map[id]||'review-'+id+'.html?class='+cc;}
function render(reviews){
  var panel=document.getElementById('rm-due-panel');
  if(!panel||!reviews||!reviews.length){if(panel)panel.innerHTML='';return;}
  var shown=reviews.slice(0,3),extra=reviews.length-3;
  var cards=shown.map(function(rv){
    var badge=statusBadge(rv),trend=scoreTrend(rv),days=daysSince(rv.lastReviewDate);
    var meta=rv.reviewCount>0?'Review '+(rv.reviewCount+1)+' - Last '+days+'d ago':'First review - Completed '+daysSince(rv.firstCompleted)+'d ago';
    return '<div class="rm-card"><div class="rm-card-left"><div class="rm-card-module">'+(rv.moduleName||rv.moduleId)+'</div><div class="rm-card-meta">'+meta+'</div>'+(rv.reviewCount>0?'<span class="rm-score-trend '+trend.cls+'" style="font-family:monospace;font-size:11px">'+trend.text+'</span>':'')+'</div><div style="display:flex;align-items:center;gap:10px;flex-shrink:0">'+(badge?'<span class="rm-badge-pill '+badge.cls+'">'+badge.label+'</span>':'')+'<a class="rm-start-btn" href="'+moduleUrl(rv.moduleId)+'">Return Mission</a></div></div>';
  }).join('');
  var extra2=extra>0?'<div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,.3);text-align:center;padding:12px 0">'+extra+' more due</div>':'';
  panel.innerHTML='<div class="rm-panel"><div class="rm-panel-heading">Due for Review</div>'+cards+extra2+'</div>';
}
async function init(){
  if(!window.MSM_ReturnMission)return;
  var wait=function(){return new Promise(function(res){var c=function(){if(window.MSM_APP&&window.MSM_APP.auth&&window.MSM_APP.auth.currentUser)return res();setTimeout(c,400);};c();});};
  await wait();
  try{var due=await window.MSM_ReturnMission.loadDueReviews();render(due);}
  catch(e){console.warn('[RM] hub panel error:',e);}
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(init,1000);});}
else{setTimeout(init,1000);}
})();