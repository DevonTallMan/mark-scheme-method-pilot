(function(){
'use strict';
var INTERVALS=[1,3,7,14,30];
var THRESHOLDS=[60,60,70,70,80];
function nextInterval(rc,passed){if(!passed)return INTERVALS[0];return INTERVALS[Math.min(rc+1,INTERVALS.length-1)];}
function passThreshold(rc){return THRESHOLDS[Math.min(rc,THRESHOLDS.length-1)];}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function getDB(){return window.MSM_DB||window._MSM_DB||null;}
function getCC(){return new URLSearchParams(window.location.search).get('class')||'5MFH4P';}
async function getUID(){
  try{
    var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    var auth=m.getAuth(window.MSM_APP);
    if(auth.currentUser)return auth.currentUser.uid;
    return new Promise(function(res){m.onAuthStateChanged(auth,function(u){res(u?u.uid:null);});});
  }catch(e){return null;}
}
async function writeFirstCompletion(moduleId,moduleName,score,nei){
  var db=getDB(),uid=await getUID(),cc=getCC();
  if(!db||!uid)return;
  var now=new Date(),next=addDays(now,INTERVALS[0]);
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  await m.setDoc(m.doc(db,'classes',cc,'students',uid,'reviews',moduleId),
    {moduleId:moduleId,moduleName:moduleName,firstCompleted:now,lastReviewDate:null,nextReviewDate:next,
     intervalDays:INTERVALS[0],reviewCount:0,lastScore:score,originalScore:score,passStreak:0,
     neiBreakdown:nei||{n:0,e:0,i:0}},{merge:false});
  console.log('[ReturnMission] First completion written for',moduleId,'uid',uid);
}
async function writeReviewResult(moduleId,score,nei){
  var db=getDB(),uid=await getUID(),cc=getCC();
  if(!db||!uid)return null;
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  var ref=m.doc(db,'classes',cc,'students',uid,'reviews',moduleId);
  var snap=await m.getDoc(ref);
  var data=snap.exists()?snap.data():{reviewCount:0,passStreak:0};
  var rc=data.reviewCount||0,passed=score>=passThreshold(rc);
  var days=nextInterval(rc,passed),now=new Date(),next=addDays(now,days);
  await m.updateDoc(ref,{lastReviewDate:now,nextReviewDate:next,intervalDays:days,reviewCount:rc+1,
    lastScore:score,passStreak:passed?(data.passStreak||0)+1:0,neiBreakdown:nei||data.neiBreakdown});
  return{nextReviewDate:next,intervalDays:days,passed:passed};
}
async function loadDueReviews(){
  var db=getDB(),uid=await getUID(),cc=getCC();
  if(!db||!uid)return[];
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  var q=m.query(m.collection(db,'classes',cc,'students',uid,'reviews'),
    m.where('nextReviewDate','<=',new Date()),m.orderBy('nextReviewDate','asc'));
  return(await m.getDocs(q)).docs.map(function(d){return Object.assign({id:d.id},d.data());});
}
async function loadAllReviews(){
  var db=getDB(),uid=await getUID(),cc=getCC();
  if(!db||!uid)return[];
  var m=await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
  return(await m.getDocs(m.collection(db,'classes',cc,'students',uid,'reviews'))).docs.map(function(d){return Object.assign({id:d.id},d.data());});
}
window.MSM_ReturnMission={writeFirstCompletion:writeFirstCompletion,writeReviewResult:writeReviewResult,
  loadDueReviews:loadDueReviews,loadAllReviews:loadAllReviews,passThreshold:passThreshold,INTERVALS:INTERVALS};
})();