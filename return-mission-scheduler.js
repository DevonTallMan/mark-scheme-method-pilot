(function(){
'use strict';
var INTERVALS=[1,3,7,14,30];
var THRESHOLDS=[60,60,70,70,80];
function nextInterval(rc,passed){var idx=Math.min(rc,INTERVALS.length-1);if(!passed)return INTERVALS[0];return INTERVALS[Math.min(rc+1,INTERVALS.length-1)];}
function passThreshold(rc){return THRESHOLDS[Math.min(rc,THRESHOLDS.length-1)];}
function addDays(date,days){var d=new Date(date);d.setDate(d.getDate()+days);return d;}
function getDB(){return window._MSM_DB;}
function getCC(){return new URLSearchParams(window.location.search).get('class')||'5MFH4P';}
function getUID(){return window.MSM_APP&&window.MSM_APP.auth&&window.MSM_APP.auth.currentUser?window.MSM_APP.auth.currentUser.uid:null;}
async function writeFirstCompletion(moduleId,moduleName,score,neiBreakdown){
  var db=getDB(),uid=getUID(),cc=getCC();
  if(!db||!uid){console.warn('[RM] writeFirstCompletion: no db or uid');return;}
  var now=new Date(),nextRv=addDays(now,INTERVALS[0]);
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  await m.setDoc(m.doc(db,'classes',cc,'students',uid,'reviews',moduleId),{
    moduleId:moduleId,moduleName:moduleName,firstCompleted:now,lastReviewDate:null,
    nextReviewDate:nextRv,intervalDays:INTERVALS[0],reviewCount:0,lastScore:score||0,
    originalScore:score||0,passStreak:0,neiBreakdown:neiBreakdown||{n:0,e:0,i:0}
  },{merge:false});
  console.log('[RM] First completion recorded for',moduleId,'next review:',nextRv.toDateString());
}
async function writeReviewResult(moduleId,score,neiBreakdown){
  var db=getDB(),uid=getUID(),cc=getCC();
  if(!db||!uid)return null;
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  var ref=m.doc(db,'classes',cc,'students',uid,'reviews',moduleId);
  var snap=await m.getDoc(ref);
  var data=snap.exists()?snap.data():{reviewCount:0,passStreak:0};
  var rc=data.reviewCount||0;
  var passed=score>=passThreshold(rc);
  var days=nextInterval(rc,passed);
  var now=new Date(),nextRv=addDays(now,days);
  await m.updateDoc(ref,{lastReviewDate:now,nextReviewDate:nextRv,intervalDays:days,
    reviewCount:rc+1,lastScore:score,passStreak:passed?(data.passStreak||0)+1:0,
    neiBreakdown:neiBreakdown||data.neiBreakdown});
  return{nextReviewDate:nextRv,intervalDays:days,passed:passed};
}
async function loadDueReviews(){
  var db=getDB(),uid=getUID(),cc=getCC();
  if(!db||!uid)return[];
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  var q=m.query(m.collection(db,'classes',cc,'students',uid,'reviews'),
    m.where('nextReviewDate','<=',new Date()),m.orderBy('nextReviewDate','asc'));
  var snap=await m.getDocs(q);
  return snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
}
async function loadAllReviews(){
  var db=getDB(),uid=getUID(),cc=getCC();
  if(!db||!uid)return[];
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  var snap=await m.getDocs(m.collection(db,'classes',cc,'students',uid,'reviews'));
  return snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
}
window.MSM_ReturnMission={
  writeFirstCompletion:writeFirstCompletion,
  writeReviewResult:writeReviewResult,
  loadDueReviews:loadDueReviews,
  loadAllReviews:loadAllReviews,
  passThreshold:passThreshold,
  INTERVALS:INTERVALS
};
})();