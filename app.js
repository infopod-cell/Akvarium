let entries=JSON.parse(localStorage.getItem('aquaEntries')||'[]');
let syncUrl=localStorage.getItem('aquaSyncUrl')||'';
let currentPhoto=null;
let recognition=null;
let isRecording=false;
let currentField=null;
let currentMic=null;
let baseText='';
let finalText='';
let calSets={water:new Set(),hunger:new Set()};
let calDate=new Date();
let calMode='water';
let calOpen=false;
let searchQuery='';
let editingIndex=null;

function pad(n){return String(n).padStart(2,'0')}
function toISO(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function parseDateRU(s){
const m=String(s).match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
return m?new Date(+m[3],+m[2]-1,+m[1]):null;
}

function init(){buildSets();render();updateStats()}

function buildSets(){
calSets={water:new Set(),hunger:new Set()};
entries.forEach(e=>{
const d=parseDateRU(e.date);if(!d)return;
const iso=toISO(d);
const act=e.actions||e.text||'';
const app=e.appetite||'';
if(/подмен|подвен|залита|долив|долил|слил/i.test(act))calSets.water.add(iso);
if(/голод/i.test(app))calSets.hunger.add(iso);
});
}

function persist(){
try{localStorage.setItem('aquaEntries',JSON.stringify(entries));return true}
catch(e){alert('Память телефона заполнена. Удали старые записи с фото.');return false}
}

function updateStats(){
document.getElementById('totalEntries').textContent=entries.length;
let days=0;
const dates=entries.map(e=>parseDateRU(e.date)).filter(d=>d);
if(dates.length){
const first=new Date(Math.min.apply(null,dates));
const now=new Date();
days=Math.floor((now-first)/86400000)+1;
if(days<1)days=1;
}
document.getElementById('totalDays').textContent=days;
document.getElementById('totalPhotos').textContent=entries.filter(e=>e.photo).length;
}

function onSearch(v){searchQuery=v;render()}

function fld(icon,label,v){
if(!v)return'';
return '<div class="fld"><div class="fld-l">'+icon+' '+label+'</div><div class="fld-v">'+v+'</div></div>';
}

function render(){
const list=document.getElementById('entriesList');
const q=searchQuery.trim().toLowerCase();
let items=entries.map((e,i)=>({e:e,i:i}));
if(q){items=items.filter(function(it){return ((it.e.actions||'')+' '+(it.e.activity||'')+' '+(it.e.appetite||'')+' '+(it.e.fins||'')+' '+(it.e.text||'')+' '+(it.e.date||'')).toLowerCase().includes(q)});}
if(items.length===0){
if(entries.length===0){list.innerHTML='<div class="empty"><div class="icon">🐠</div><p>Пока нет записей.<br>Нажми «+» или ↓ «добавить таблицу»!</p></div>';}
else{list.innerHTML='<div class="empty"><div class="icon">🔍</div><p>Ничего не нашлось по запросу «'+searchQuery+'»</p></div>';}
return;
}
list.innerHTML=items.map(function(it){
const e=it.e,i=it.i;
return '<div class="entry-card">'+
'<div class="entry-date"><span>📅 '+e.date+'</span><span><button class="edit-btn" onclick="openEdit('+i+')">✏️</button><button class="del-btn" onclick="deleteEntry('+i+')">🗑</button></span></div>'+
fld('🛠️','Действия',e.actions)+
fld('⚡','Активность',e.activity)+
fld('🍽️','Аппетит',e.appetite)+
fld('🐠','Плавники',e.fins)+
fld('📝','Заметка',e.text)+
(e.photo?'<div class="entry-photo"><img src="'+e.photo+'" loading="lazy"></div>':'')+
'</div>';
}).join('');
}

function showCal(){calOpen=true;document.getElementById('calView').classList.add('open');renderCal()}
function hideCal(){calOpen=false;document.getElementById('calView').classList.remove('open')}
function setCalMode(m,btn){
calMode=m;
document.querySelectorAll('.cal-tab').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
renderCal();
}
function calPrev(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCal()}
function calNext(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCal()}
function renderCal(){
const y=calDate.getFullYear(),m=calDate.getMonth();
document.getElementById('calTitle').textContent=calDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
const lead=(new Date(y,m,1).getDay()+6)%7;
const dim=new Date(y,m+1,0).getDate();
const set=calSets[calMode];
let html='';
['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(w=>{html+='<div class="cal-wd">'+w+'</div>'});
for(let i=0;i<lead;i++)html+='<div></div>';
for(let d=1;d<=dim;d++){
const iso=y+'-'+pad(m+1)+'-'+pad(d);
html+='<div class="cal-day'+(set.has(iso)?' mark-'+calMode:'')+'">'+d+'</div>';
}
document.getElementById('calGrid').innerHTML=html;
}

let touchX=null,touchY=null;
document.addEventListener('touchstart',e=>{touchX=e.touches[0].clientX;touchY=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{
if(touchX===null)return;
const dx=e.changedTouches[0].clientX-touchX;
const dy=e.changedTouches[0].clientY-touchY;
touchX=null;
if(document.getElementById('modalOverlay').classList.contains('active'))return;
if(document.getElementById('syncOverlay').classList.contains('active'))return;
if(document.getElementById('exportOverlay').classList.contains('active'))return;
if(Math.abs(dx)>70&&Math.abs(dy)<60){
if(dx<0&&!calOpen)showCal();
else if(dx>0&&calOpen)hideCal();
}
},{passive:true});

function parseCSV(t){
const rows=[];let row=[],cur='',inQ=false;
for(let i=0;i<t.length;i++){
const c=t[i];
if(inQ){
if(c=='"'){if(t[i+1]=='"'){cur+='"';i++;}else inQ=false;}
else cur+=c;
}else{
if(c=='"')inQ=true;
else if(c==','){row.push(cur);cur='';}
else if(c=='\n'){row.push(cur);rows.push(row);row=[];cur='';}
else if(c!='\r')cur+=c;
}
}
row.push(cur);rows.push(row);
return rows.filter(r=>r.join('').trim()!='');
}

function handleCSV(input){
if(!input.files||!input.files[0])return;
const reader=new FileReader();
reader.onload=(e)=>{
const t=String(e.target.result).replace(/^\uFEFF/,'');
const rows=parseCSV(t);
if(rows.length<2){alert('В файле нет строк с данными.');input.value='';return;}
const head=rows[0].map(h=>String(h).trim().toLowerCase());
const idx={};
head.forEach((h,i)=>{idx[h]=i});
const col=(r,n)=>(idx[n]!==undefined?String(r[idx[n]]||'').trim():'');
const imported=[];
for(let r=1;r<rows.length;r++){
const row=rows[r];
const en={
date:col(row,'дата')||'без даты',
actions:col(row,'действия'),
activity:col(row,'активность'),
appetite:col(row,'аппетит'),
fins:col(row,'плавники'),
photo:null,src:'csv'
};
if(en.actions||en.activity||en.appetite||en.fins)imported.push(en);
}
if(imported.length===0){alert('Не нашлось записей для импорта.');input.value='';return;}
if(!confirm('Найдено записей: '+imported.length+'. Добавить их в дневник? (Если уже импортировал — нажми «Отмена», иначе будут повторы.)')){input.value='';return;}
entries=entries.concat(imported.reverse());
if(persist())alert('Готово! Добавлено записей: '+imported.length);
buildSets();render();updateStats();
input.value='';
};
reader.readAsText(input.files[0]);
}

function openModal(){
editingIndex=null;
document.getElementById('modalTitle').textContent='✍️ Новая запись';
document.getElementById('modalOverlay').classList.add('active');
['actions','activity','appetite','fins'].forEach(k=>{document.getElementById('f_'+k).value=''});
document.getElementById('photoPreview').style.display='none';
currentPhoto=null;
}

function openEdit(i){
editingIndex=i;
const e=entries[i];
document.getElementById('modalTitle').textContent='✏️ Редактирование';
document.getElementById('modalOverlay').classList.add('active');
document.getElementById('f_actions').value=e.actions||'';
document.getElementById('f_activity').value=e.activity||'';
document.getElementById('f_appetite').value=e.appetite||'';
document.getElementById('f_fins').value=e.fins||'';
currentPhoto=e.photo||null;
const preview=document.getElementById('photoPreview');
if(currentPhoto){preview.src=currentPhoto;preview.style.display='block'}else{preview.style.display='none'}
}

function closeModal(){
document.getElementById('modalOverlay').classList.remove('active');
if(isRecording)stopVoice();
editingIndex=null;
}

function closeModalOutside(e){if(e.target===e.currentTarget)closeModal()}

function startFieldVoice(field,btn){
if(isRecording&&currentField===field){stopVoice();return}
if(isRecording)stopVoice();
if(!('webkitSpeechRecognition'in window)&&!('SpeechRecognition'in window)){
alert('Голосовой ввод работает в Chrome. Открой приложение в Chrome.');
return;
}
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
recognition=new SR();
recognition.lang='ru-RU';
recognition.continuous=true;
recognition.interimResults=true;
currentField=field;
currentMic=btn;
const ta=document.getElementById('f_'+field);
baseText=ta.value.trim()?ta.value.trim()+' ':'';
finalText='';
recognition.onstart=()=>{isRecording=true;btn.classList.add('recording');btn.textContent='⏹ стоп'};
recognition.onresult=(e)=>{
let interim='';
for(let i=e.resultIndex;i<e.results.length;i++){
const t=e.results[i][0].transcript;
if(e.results[i].isFinal)finalText+=t+' ';else interim+=t;
}
ta.value=baseText+finalText+interim;
};
recognition.onerror=(e)=>{
if(e.error==='not-allowed'){stopVoice();alert('Разреши доступ к микрофону в настройках браузера.');}
};
recognition.onend=()=>{if(isRecording){try{recognition.start()}catch(err){stopVoice()}}};
try{recognition.start()}catch(err){alert('Не удалось включить микрофон');}
}

function stopVoice(){
isRecording=false;
if(recognition){recognition.onend=null;recognition.stop();recognition=null}
if(currentMic){currentMic.classList.remove('recording');currentMic.textContent='🎤 говорить'}
currentField=null;currentMic=null;
}

function handlePhoto(input){
if(!input.files||!input.files[0])return;
const file=input.files[0];
const reader=new FileReader();
reader.onload=(e)=>{
const img=new Image();
img.onload=()=>{
const canvas=document.createElement('canvas');
const maxW=800;
let w=img.width,h=img.height;
if(w>maxW){h=h*(maxW/w);w=maxW}
canvas.width=w;canvas.height=h;
canvas.getContext('2d').drawImage(img,0,0,w,h);
currentPhoto=canvas.toDataURL('image/jpeg',0.7);
const preview=document.getElementById('photoPreview');
preview.src=currentPhoto;
preview.style.display='block';
};
img.src=e.target.result;
};
reader.readAsDataURL(file);
}

function saveEntry(){
const a=document.getElementById('f_actions').value.trim();
const ac=document.getElementById('f_activity').value.trim();
const ap=document.getElementById('f_appetite').value.trim();
const f=document.getElementById('f_fins').value.trim();
if(!a&&!ac&&!ap&&!f&&!currentPhoto){alert('Заполни или наговори хотя бы одну графу');return}
if(editingIndex!==null){
const e=entries[editingIndex];
e.actions=a;e.activity=ac;e.appetite=ap;e.fins=f;e.photo=currentPhoto;e.synced=false;
persist();closeModal();buildSets();render();updateStats();
if(syncUrl)sendRows([e],true);
return;
}
const date=new Date().toLocaleDateString('ru-RU');
const en={date,actions:a,activity:ac,appetite:ap,fins:f,photo:currentPhoto,src:'app',synced:false};
entries.unshift(en);
if(!persist()){entries.shift();return}
closeModal();
buildSets();render();updateStats();
if(syncUrl)sendRows([en],true);
}

function deleteEntry(i){
if(confirm('Удалить эту запись?')){
entries.splice(i,1);
persist();buildSets();render();updateStats();
}
}

function exportToSheet(){
if(!syncUrl){document.getElementById('syncUrlInput').value='';document.getElementById('syncOverlay').classList.add('active');return}
const pending=entries.filter(e=>e.src!=='csv'&&!e.synced);
if(pending.length===0){alert('Всё уже отправлено в таблицу ✅');return}
document.getElementById('exportOverlay').classList.add('active');
}

function doSendNow(){
closeExport();
const pending=entries.filter(e=>e.src!=='csv'&&!e.synced);
if(pending.length===0){alert('Всё уже отправлено в таблицу ✅');return}
sendRows(pending,false);
}

function openSyncFromExport(){
closeExport();
document.getElementById('syncUrlInput').value=syncUrl;
document.getElementById('syncOverlay').classList.add('active');
}

function closeExport(){document.getElementById('exportOverlay').classList.remove('active')}

function sendRows(list,silent){
const rows=list.map(e=>({date:e.date,actions:e.actions||e.text||'',activity:e.activity||'',appetite:e.appetite||'',fins:e.fins||''}));
fetch(syncUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(rows)})
.then(()=>{list.forEach(e=>e.synced=true);persist();if(!silent)alert('Отправлено в таблицу: '+list.length);})
.catch(()=>{if(!silent)alert('Не получилось отправить. Попробуй ещё раз кнопкой ↑.');});
}

function saveSyncUrl(){
const v=document.getElementById('syncUrlInput').value.trim();
if(!v.startsWith('https://')){alert('Ссылка должна начинаться с https://');return}
syncUrl=v;
localStorage.setItem('aquaSyncUrl',syncUrl);
closeSync();
alert('Ссылка сохранена!');
}

function closeSync(){document.getElementById('syncOverlay').classList.remove('active')}

init();
