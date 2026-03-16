import os, glob, re

# Correct filename is teacher.html
CANDIDATES = ["teacher.html", "teacher-dashboard.html"]
TARGET = None
for c in CANDIDATES:
    if os.path.exists(c):
        TARGET = c
        break
if not TARGET:
    for c in CANDIDATES:
        found = glob.glob(f"**/{c}", recursive=True)
        if found:
            TARGET = found[0]
            break
if not TARGET:
    print("ERROR: teacher.html not found.")
    exit(1)

print(f"Patching: {TARGET}")
with open(TARGET, "r", encoding="utf-8") as f:
    html = f.read()

if "msm-ae-firestore" in html:
    print("SKIP: Firestore Assignment Engine already present.")
    exit(0)

# Strip any compat remnants from Stage 1 attempts
html = re.sub(r'<style id="msm-assignment-engine-css">.*?</style>', '', html, flags=re.DOTALL)
html = re.sub(r'<!-- MSM ASSIGNMENT ENGINE.*?<!-- END MSM ASSIGNMENT ENGINE -->', '', html, flags=re.DOTALL)
html = re.sub(r'<script id="msm-assignment-engine-js">.*?</script>', '', html, flags=re.DOTALL)

# Remove dead compat SDK scripts (nothing in the modular setup uses them)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-app-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-firestore-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-auth-compat\.js"></script>', '', html)
html = re.sub(r'\s*<script src="https://www\.gstatic\.com/firebasejs/[^"]+/firebase-database-compat\.js"></script>', '', html)
print("  Removed compat SDK script tags (replaced by modular firebase-config.js)")

AE_CSS = """<style id="msm-ae-firestore-css">
#msm-assignment-engine{font-family:'Share Tech Mono','Courier New',monospace;margin:24px 0}
.ae-panel{background:rgba(13,27,42,.85);border:1px solid rgba(212,160,23,.35);border-radius:8px;padding:24px;margin-bottom:20px}
.ae-panel-title{font-size:11px;letter-spacing:.15em;color:#d4a017;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid rgba(212,160,23,.2);padding-bottom:8px}
.ae-form-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.ae-form-row label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#7f8c8d;text-transform:uppercase;letter-spacing:.1em;flex:1;min-width:160px}
.ae-form-row input,.ae-form-row select{background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.3);border-radius:4px;color:#ecf0f1;font-family:inherit;font-size:13px;padding:8px 10px;outline:none;transition:border-color .2s}
.ae-form-row input:focus,.ae-form-row select:focus{border-color:#d4a017}
.ae-form-row select option{background:#0d1b2a}
.ae-btn{background:linear-gradient(135deg,#d4a017,#b8860b);border:none;border-radius:4px;color:#0d1b2a;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;letter-spacing:.1em;padding:10px 20px;text-transform:uppercase;transition:opacity .2s}
.ae-btn:hover{opacity:.85}
.ae-btn-danger{background:transparent;border:1px solid rgba(169,50,38,.5);border-radius:4px;color:#e74c3c;cursor:pointer;font-family:inherit;font-size:11px;padding:4px 10px;transition:all .2s}
.ae-btn-danger:hover{background:rgba(169,50,38,.15)}
.ae-assignment-list{display:flex;flex-direction:column;gap:10px}
.ae-assignment-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-left:3px solid #d4a017;border-radius:6px;padding:14px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.ae-card-meta{flex:1}
.ae-card-title{font-size:14px;color:#ecf0f1;font-weight:600;margin-bottom:4px}
.ae-card-detail{font-size:11px;color:#7f8c8d;margin-bottom:6px}
.ae-card-progress{display:inline-block;background:rgba(30,132,73,.2);border:1px solid rgba(30,132,73,.4);border-radius:3px;color:#1e8449;font-size:11px;padding:2px 8px}
.ae-empty{color:#7f8c8d;font-size:13px;text-align:center;padding:20px 0}
.ae-status-msg{font-size:12px;padding:8px 12px;border-radius:4px;margin-top:10px;display:none}
.ae-status-ok{background:rgba(30,132,73,.15);color:#1e8449;border:1px solid rgba(30,132,73,.3)}
.ae-status-err{background:rgba(169,50,38,.15);color:#e74c3c;border:1px solid rgba(169,50,38,.3)}
</style>"""

AE_HTML = """<!-- MSM ASSIGNMENT ENGINE (Firestore) injected by Stage 1 workflow -->
<section id="msm-assignment-engine">
<div class="ae-panel">
<div class="ae-panel-title">Create Assignment</div>
<div class="ae-form-row">
<label>Assignment Title<input type="text" id="ae-title" placeholder="e.g. NEI Practice Module 6.1" maxlength="80"></label>
<label>Module<select id="ae-module"><option value="">Select module</option><option value="6-1-1">6.1.1 Big Data</option><option value="6-1-2">6.1.2 Data Formats</option><option value="6-1-3">6.1.3 How Data is Generated</option><option value="6-2">6.2 Data Architecture</option><option value="6-3">6.3 Coming Soon</option><option value="6-4">6.4 Coming Soon</option></select></label>
<label>Due Date<input type="date" id="ae-due"></label>
<label>Class Code<input type="text" id="ae-classcode" placeholder="5MFH4P" style="text-transform:uppercase" maxlength="12"></label>
</div>
<button class="ae-btn" onclick="window.aeCreateAssignment()">+ Create Assignment</button>
<div id="ae-status" class="ae-status-msg"></div>
</div>
<div class="ae-panel">
<div class="ae-panel-title">Active Assignments</div>
<div class="ae-assignment-list" id="ae-list">
<div class="ae-empty" id="ae-empty">No assignments yet. Create one above.</div>
</div>
</div>
</section>
<!-- END MSM ASSIGNMENT ENGINE -->"""

AE_JS = """<script type="module" id="msm-ae-firestore">
import { collection, addDoc, onSnapshot, doc, deleteDoc, getDocs, writeBatch }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function getDB(){ return window.MSM_DB || null; }
function getCC(){
  if(typeof CLASS_CODE!=='undefined'&&CLASS_CODE)return CLASS_CODE;
  return new URLSearchParams(window.location.search).get('class')||'5MFH4P';
}
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showStatus(msg,ok){
  var el=document.getElementById('ae-status');
  if(!el)return;
  el.textContent=msg;
  el.className='ae-status-msg '+(ok?'ae-status-ok':'ae-status-err');
  el.style.display='block';
  setTimeout(function(){el.style.display='none';},4000);
}

async function loadStats(db,classCode,assignmentId){
  var el=document.getElementById('ae-prog-'+assignmentId);
  try{
    var snap=await getDocs(collection(db,'classes',classCode,'students'));
    var total=0,complete=0,inProg=0;
    snap.forEach(function(d){
      total++;
      var prog=(d.data().assignmentProgress||{})[assignmentId];
      if(prog==='complete')complete++;
      else if(prog==='in_progress')inProg++;
    });
    if(el)el.textContent=complete+'/'+total+' complete  |  '+inProg+' in progress';
  }catch(e){if(el)el.textContent='Stats unavailable';}
}

function renderCard(db,classCode,id,a,container){
  var due=a.dueDate
    ?new Date(a.dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
    :'No due date';
  var card=document.createElement('div');
  card.className='ae-assignment-card';
  card.dataset.assignmentId=id;
  card.innerHTML=
    '<div class="ae-card-meta">'+
      '<div class="ae-card-title">'+esc(a.title)+'</div>'+
      '<div class="ae-card-detail">Module: '+esc(a.module)+'  |  Due: '+due+'  |  Class: '+esc(classCode)+'</div>'+
      '<div class="ae-card-progress" id="ae-prog-'+id+'">Loading...</div>'+
    '</div>'+
    '<button class="ae-btn-danger" data-class="'+esc(classCode)+'" data-id="'+esc(id)+'">Delete</button>';
  card.querySelector('.ae-btn-danger').addEventListener('click',function(){
    window.aeDeleteAssignment(this.dataset.class,this.dataset.id);
  });
  container.appendChild(card);
  loadStats(db,classCode,id);
}

function attachListener(db,classCode){
  var ref=collection(db,'classes',classCode,'assignments');
  onSnapshot(ref,function(snap){
    var list=document.getElementById('ae-list');
    var empty=document.getElementById('ae-empty');
    if(!list)return;
    Array.from(list.querySelectorAll('.ae-assignment-card')).forEach(function(el){el.remove();});
    if(snap.empty){if(empty)empty.style.display='block';return;}
    if(empty)empty.style.display='none';
    var docs=[];
    snap.forEach(function(d){docs.push([d.id,d.data()]);});
    docs.sort(function(a,b){return(b[1].createdAt||0)-(a[1].createdAt||0);});
    docs.forEach(function(e){renderCard(db,classCode,e[0],e[1],list);});
  },function(err){
    console.error('AE listener error:',err);
    showStatus('Could not load assignments. Check Firestore rules.',false);
  });
}

window.aeCreateAssignment=async function(){
  var db=getDB();
  if(!db)return showStatus('Firebase not ready. Reload the page.',false);
  var title=(document.getElementById('ae-title').value||'').trim();
  var module=document.getElementById('ae-module').value;
  var dueDate=document.getElementById('ae-due').value;
  var classCode=(document.getElementById('ae-classcode').value||'').trim().toUpperCase()||getCC();
  if(!title)return showStatus('Enter an assignment title.',false);
  if(!module)return showStatus('Select a module.',false);
  if(!dueDate)return showStatus('Choose a due date.',false);
  try{
    await addDoc(collection(db,'classes',classCode,'assignments'),
      {title,module,dueDate,classCode,createdAt:Date.now()});
    showStatus('Assignment created.',true);
    document.getElementById('ae-title').value='';
    document.getElementById('ae-module').value='';
    document.getElementById('ae-due').value='';
  }catch(err){
    console.error('AE create error:',err);
    showStatus('Failed to create. Check Firestore permissions.',false);
  }
};

window.aeDeleteAssignment=async function(classCode,assignmentId){
  if(!confirm('Delete this assignment? Student progress entries will also be removed.'))return;
  var db=getDB();
  if(!db)return;
  try{
    await deleteDoc(doc(db,'classes',classCode,'assignments',assignmentId));
    var studentSnap=await getDocs(collection(db,'classes',classCode,'students'));
    var batch=writeBatch(db);
    studentSnap.forEach(function(studentDoc){
      var prog=studentDoc.data().assignmentProgress||{};
      if(assignmentId in prog){
        delete prog[assignmentId];
        batch.update(doc(db,'classes',classCode,'students',studentDoc.id),{assignmentProgress:prog});
      }
    });
    await batch.commit();
    showStatus('Assignment deleted.',true);
  }catch(err){
    console.error('AE delete error:',err);
    showStatus('Failed to delete. Check Firestore permissions.',false);
  }
};

function init(){
  var db=getDB();
  if(!db){setTimeout(init,100);return;}
  var cc=getCC();
  var ccField=document.getElementById('ae-classcode');
  if(ccField)ccField.value=cc;
  attachListener(db,cc);
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{init();}
</script>"""

if "</head>" in html:
    html = html.replace("</head>", AE_CSS + "\n</head>")

injected = False
for marker in ['<div class="dashboard-main"','<main','<div class="main-content"','<div id="main"','<div class="container"','<body']:
    if marker in html:
        idx = html.find(marker)
        end = html.find('>', idx) + 1
        html = html[:end] + "\n" + AE_HTML + "\n" + html[end:]
        injected = True
        print(f"  Injected HTML after: {marker}>")
        break
if not injected:
    html = html.replace("</body>", AE_HTML + "\n</body>")
    print("  Injected HTML before </body> (fallback)")

if "</body>" in html:
    html = html.replace("</body>", AE_JS + "\n</body>")
else:
    html += "\n" + AE_JS

with open(TARGET, "w", encoding="utf-8") as f:
    f.write(html)
print(f"PATCHED: {TARGET}")
