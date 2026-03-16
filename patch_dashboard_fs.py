import os, glob, re

CANDIDATES = ["dashboard.html"]
TARGET = None
for c in CANDIDATES:
    if os.path.exists(c):
        TARGET = c
        break
if not TARGET:
    found = glob.glob("**/dashboard.html", recursive=True)
    TARGET = found[0] if found else None
if not TARGET:
    print("ERROR: dashboard.html not found.")
    exit(1)

print(f"Patching: {TARGET}")
with open(TARGET, "r", encoding="utf-8") as f:
    html = f.read()

if "msm-awareness-firestore" in html:
    print("SKIP: Firestore awareness already present.")
    exit(0)

# Strip any compat remnants
html = re.sub(r'<style id="msm-assignment-awareness-css">.*?</style>', '', html, flags=re.DOTALL)
html = re.sub(r'<script id="msm-assignment-awareness">.*?</script>', '', html, flags=re.DOTALL)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-app-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-firestore-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-auth-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-database-compat\.js"></script>', '', html)

# Determine correct relative path to firebase-config.js
# dashboard.html is in root, so path is ./firebase-config.js
CONFIG_TAG = '<script type="module" src="firebase-config.js"></script>'

AWARENESS_CSS = """<style id="msm-awareness-firestore-css">
.topic-card{position:relative}
.ae-assigned-badge{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#d4a017,#b8860b);border-radius:3px;color:#0d1b2a;font-family:'Share Tech Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.1em;padding:2px 6px;text-transform:uppercase;z-index:2;pointer-events:none}
.ae-assignments-panel{background:rgba(13,27,42,.7);border:1px solid rgba(212,160,23,.25);border-left:3px solid #d4a017;border-radius:6px;margin:16px 0;padding:16px 20px}
.ae-assignments-panel-title{font-size:10px;letter-spacing:.15em;color:#d4a017;text-transform:uppercase;margin-bottom:10px}
.ae-student-assignment{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-family:'Share Tech Mono',monospace;font-size:12px;color:#bdc3c7}
.ae-student-assignment:last-child{border-bottom:none}
.ae-prog-pill{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.ae-prog-not_started{background:rgba(127,140,141,.2);color:#7f8c8d;border:1px solid rgba(127,140,141,.3)}
.ae-prog-in_progress{background:rgba(212,160,23,.15);color:#d4a017;border:1px solid rgba(212,160,23,.3)}
.ae-prog-complete{background:rgba(30,132,73,.15);color:#1e8449;border:1px solid rgba(30,132,73,.3)}
</style>"""

AWARENESS_JS = """<script type="module" id="msm-awareness-firestore">
import { collection, getDocs, doc, setDoc, updateDoc, getDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function getDB(){return window.MSM_DB||null;}
function getCC(){
  if(typeof CLASS_CODE!=='undefined'&&CLASS_CODE)return CLASS_CODE;
  return new URLSearchParams(window.location.search).get('class')||'5MFH4P';
}
function getUID(){return localStorage.getItem('msm_uid')||null;}
function getCompletedModules(){
  var badges=JSON.parse(localStorage.getItem('msm_badges')||'[]');
  var map={'611':'6-1-1','612':'6-1-2','613':'6-1-3','62':'6-2','63':'6-3','64':'6-4'};
  return badges.map(function(b){return map[b]||b;}).filter(Boolean);
}
function addAssignedBadge(card){
  if(card.querySelector('.ae-assigned-badge'))return;
  var b=document.createElement('span');
  b.className='ae-assigned-badge';
  b.textContent='Assigned';
  if(window.getComputedStyle(card).position==='static')card.style.position='relative';
  card.appendChild(b);
}
function badgeTopicCards(assignedModules){
  var mods=new Set(assignedModules);
  document.querySelectorAll('[data-module]').forEach(function(card){
    if(mods.has(card.dataset.module))addAssignedBadge(card);
  });
  document.querySelectorAll('.topic-card,.module-card').forEach(function(card){
    var a=card.querySelector('a[href]');
    var href=a?a.getAttribute('href'):'';
    mods.forEach(function(m){if(href.includes(m))addAssignedBadge(card);});
  });
}
async function writeProgress(db,classCode,uid,assignmentId,status){
  try{
    var studentRef=doc(db,'classes',classCode,'students',uid);
    var snap=await getDoc(studentRef);
    var existing=snap.exists()?(snap.data().assignmentProgress||{}):{};
    if(existing[assignmentId]===status)return;
    existing[assignmentId]=status;
    if(snap.exists()){await updateDoc(studentRef,{assignmentProgress:existing});}
    else{await setDoc(studentRef,{assignmentProgress:existing},{merge:true});}
  }catch(e){console.warn('Awareness: writeProgress failed',e);}
}
function renderPanel(assignments,db,classCode,uid){
  var anchors=[
    document.querySelector('.dashboard-topbar'),
    document.querySelector('#dashboard-topbar'),
    document.querySelector('.topic-grid'),
    document.querySelector('#topic-cards'),
    document.querySelector('main'),
    document.querySelector('.container'),
    document.body
  ];
  var anchor=anchors.find(function(a){return a!==null;});
  if(!anchor)return;
  var old=document.getElementById('ae-student-panel');
  if(old)old.remove();
  var panel=document.createElement('div');
  panel.id='ae-student-panel';
  panel.className='ae-assignments-panel';
  var title=document.createElement('div');
  title.className='ae-assignments-panel-title';
  title.textContent='Assigned Work';
  panel.appendChild(title);
  if(assignments.length===0){
    var empty=document.createElement('div');
    empty.style.cssText='font-size:12px;color:#7f8c8d;';
    empty.textContent='No assignments set yet.';
    panel.appendChild(empty);
  }else{
    assignments.forEach(function(entry){
      var id=entry[0],a=entry[1];
      var studentRef=doc(db,'classes',classCode,'students',uid);
      getDoc(studentRef).then(function(snap){
        var prog=snap.exists()?((snap.data().assignmentProgress||{})[id]||'not_started'):'not_started';
        var row=document.createElement('div');
        row.className='ae-student-assignment';
        var due=a.dueDate?new Date(a.dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
        var label=document.createElement('span');
        label.style.flex='1';
        label.textContent=a.title+'  |  Module '+a.module+(due?'  |  Due '+due:'');
        var pill=document.createElement('span');
        pill.className='ae-prog-pill ae-prog-'+prog;
        pill.textContent=prog.replace(/_/g,' ');
        row.appendChild(label);
        row.appendChild(pill);
        panel.appendChild(row);
      });
    });
  }
  if(anchor.firstChild){
    anchor.insertBefore(panel,anchor.firstChild.nextSibling||anchor.firstChild);
  }else{anchor.appendChild(panel);}
}
async function run(){
  var db=getDB();
  if(!db){setTimeout(run,100);return;}
  var classCode=getCC();
  var uid=getUID();
  if(!uid)return;
  var completed=getCompletedModules();
  try{
    var snap=await getDocs(collection(db,'classes',classCode,'assignments'));
    if(snap.empty)return;
    var assignments=[];
    snap.forEach(function(d){assignments.push([d.id,d.data()]);});
    renderPanel(assignments,db,classCode,uid);
    var assignedModules=assignments.map(function(e){return e[1].module;});
    badgeTopicCards(assignedModules);
    assignments.forEach(function(entry){
      if(completed.includes(entry[1].module))
        writeProgress(db,classCode,uid,entry[0],'complete');
    });
  }catch(e){console.error('Awareness: failed to load assignments',e);}
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',run);
}else{run();}
</script>"""

# Inject firebase-config.js module before </head> if not already present
if "firebase-config.js" not in html:
    if "</head>" in html:
        html = html.replace("</head>", CONFIG_TAG + "\n</head>")
        print("  Injected firebase-config.js module script tag")
    else:
        html = CONFIG_TAG + "\n" + html

# Inject awareness CSS before </head>
if "</head>" in html:
    html = html.replace("</head>", AWARENESS_CSS + "\n</head>")

# Inject awareness JS before </body>
if "</body>" in html:
    html = html.replace("</body>", AWARENESS_JS + "\n</body>")
else:
    html += "\n" + AWARENESS_JS

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(html)
print(f"PATCHED: {TARGET}")
