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
let aquaInfo=JSON.parse(localStorage.getItem('aquaInfo')||'null')||{size:'Длина 41 см, Ширина 18 см, Высота 27 см',light:'Kodak e14, 6500K, 630лм, 7Вт',filter:'Naribo F-200, 3вт, 150 л/с',grunt:'морская галька N2 12-20 мм, обкатанная, Prime'};
let costs=JSON.parse(localStorage.getItem('aquaCosts')||'null')||[{name:'Лампа',sum:300,note:'3 шт'},{name:'Грунт',sum:226,note:''},{name:'Фильтр',sum:360,note:''},{name:'Мох',sum:200,note:'100 + 100'},{name:'Анубиас',sum:300,note:''},{name:'Элодея',sum:200,note:''},{name:'Сифон',sum:200,note:''},{name:'Шприц для флейты',sum:50,note:'3 шт'}];
let settings=JSON.parse(localStorage.getItem('aquaSettings')||'null')||{fs:1,theme:'dark',water:7,hunger:10};

const CB='#4dd9ff',CO='#ffb74d',CW='#e0f0ff',OR='#ff9432';
const ICONS={
drop:'<path d="M12 3c-3.5 4.5-6 8-6 11a6 6 0 0 0 12 0c0-3-2.5-6.5-6-11z"/>',
plate:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8.5 7L10 4.5h4L15.5 7"/>',
book:'<path d="M12 6c-2-1.8-5.5-2-8-1v14c2.5-1 6-.8 8 1 2-1.8 5.5-2 8-1V5c-2.5-1-6-.8-8 1z"/><path d="M12 6v14"/>',
tank:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10c3-2 6 2 9 0s6-2 9 0"/>',
wrench:'<path d="M20.7 6.4a5 5 0 0 1-6.6 4.7L7 18.2a1.8 1.8 0 0 1-2.6-2.6l7.1-7.1a5 5 0 0 1 6.3-6.2l-2.9 2.9.7 2.6 2.6.7 2.9-2.9c.1.4.1.8.1.8z"/>',
bolt:'<path fill="currentColor" stroke="none" d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"/>',
cal:'<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v5M15 3v5"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6"/>',
pencil:'<path d="M4 20l4.5-1L20 7.5 16.5 4 5 15.5 4 20z"/><path d="M13.5 7l3.5 3.5"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
image:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9.5" cy="10" r="1.5"/><path d="M6 17l4-4 3 3 3-3 4 4"/>',
search:'<circle cx="11" cy="11" r="6"/><path d="M16.5 16.5L21 21"/>',
fish:'<path fill="currentColor" stroke="none" d="M4 12s4-6 10-6c4 0 6 3 6 6s-2 6-6 6C8 18 4 12 4 12z"/><path fill="currentColor" stroke="none" d="M18 12l4-4v8z"/><circle cx="8" cy="11" r="1.2" fill="#0a1628" stroke="none"/>',
rub:'<path d="M9 20V4h5a4 4 0 0 1 0 8H9M7 15h8M7 12h8"/>',
gear:'<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>'
};
function ico(n,c,s){
s=s||15;
return '<svg class="ico" style="color:'+c+';width:'+s+'px;height:'+s+'px" viewBox="0 0 24 24">'+ICONS[n]+'</svg>';
}
function injectIcons(){
document.querySelectorAll('[data-ico]').forEach(function(el){
const c=el.getAttribute('data-c');
el.innerHTML=ico(el.getAttribute('data-ico'),c==='currentColor'?'currentColor':OR,el.getAttribute('data-s')||15);
});
}
function micHTML(){return ico('mic','currentColor',12)+' говорить'}
function plural(n,one,few,many){
const m10=n%10,m100=n%100;
if(m10===1&&m100!==11)return one;
if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;
return many;
}

function pad(n){return String(n).padStart(2,'0')}
function toISO(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function parseDateRU(s){
const m=String(s).match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
return m?new Date(+m[3],+m[2]-1,+m[1]):null;
}

function init(){injectIcons();applyBranding();applySettings();addDateEditor();buildSets();render();updateStats();updateTiles()}

function applyBranding(){
document.title='Мой Аквариум';
document.querySelectorAll('.cal-close').forEach(b=>b.remove());
const s=document.querySelector('.h-sub');if(s)s.remove();
}

function applySettings(){
document.body.style.zoom=settings.fs;
document.body.classList.toggle('light',settings.theme==='light');
document.querySelectorAll('[data-fs]').forEach(b=>b.classList.toggle('active',Number(b.getAttribute('data-fs'))===Number(settings.fs)));
document.querySelectorAll('[data-th]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-th')===settings.theme));
const w=document.getElementById('setWater');if(w)w.value=settings.water;
const h=document.getElementById('setHunger');if(h)h.value=settings.hunger;
}
function setFS(v){settings.fs=v;localStorage.setItem('aquaSettings',JSON.stringify(settings));applySettings();}
function setTheme(t){settings.theme=t;localStorage.setItem('aquaSettings',JSON.stringify(settings));applySettings();}
function savePeriods(){
const w=Math.max(1,Math.min(60,Number(document.getElementById('setWater').value)||7));
const h=Math.max(1,Math.min(60,Number(document.getElementById('setHunger').value)||10));
settings.water=w;settings.hunger=h;
localStorage.setItem('aquaSettings',JSON.stringify(settings));
applySettings();updateTiles();
if(calOpen)renderCal();
alert('Сохранено: подмена каждые '+w+' '+plural(w,'день','дня','дней')+', разгрузка каждые '+h+' '+plural(h,'день','дня','дней'));
}

function addDateEditor(){
const modal=document.querySelector('#modalOverlay .modal');
const h2=modal.querySelector('h2');
const div=document.createElement('div');
div.className='field-block';
div.id='dateBlock';
div.style.display='none';
div.innerHTML='<div class="field-head"><span>'+ico('cal',OR)+'Дата</span></div><input id="f_date" placeholder="ДД.ММ.ГГГГ" maxlength="10">';
h2.insertAdjacentElement('afterend',div);
}

/* ===== Слои и кнопка «назад» ===== */
function pushLayer(){try{history.pushState({aqua:1},'');}catch(e){}}
function topLayer(){
if(document.getElementById('lightbox').classList.contains('open'))return 'lightbox';
if(document.getElementById('modalOverlay').classList.contains('active'))return 'modal';
if(document.getElementById('syncOverlay').classList.contains('active'))return 'sync';
if(document.getElementById('exportOverlay').classList.contains('active'))return 'export';
const order=['settingsView','infoView','calView','diaryView'];
for(let i=0;i<order.length;i++){if(document.getElementById(order[i]).classList.contains('open'))return order[i];}
return null;
}
function dismissLayer(l){
if(l==='lightbox'){if(window.closeLightbox)window.closeLightbox();return;}
if(l==='modal'){dismissModal();return;}
if(l==='sync'){dismissSync();return;}
if(l==='export'){dismissExport();return;}
dismiss(l);
}
window.addEventListener('popstate',function(){const l=topLayer();if(l)dismissLayer(l);});
function openView(id){document.getElementById(id).classList.add('open');pushLayer();}
function dismiss(id){document.getElementById(id).classList.remove('open');if(id==='calView')calOpen=false;}
function closeView(id){if(document.getElementById(id).classList.contains('open')){dismiss(id);try{history.back();}catch(e){}}}
function dismissModal(){const el=document.getElementById('modalOverlay');if(el.classList.contains('active')){el.classList.remove('active');if(isRecording)stopVoice();editingIndex=null;}}
function closeModal(){if(document.getElementById('modalOverlay').classList.contains('active')){dismissModal();try{history.back();}catch(e){}}}
function dismissSync(){document.getElementById('syncOverlay').classList.remove('active');}
function closeSync(){if(document.getElementById('syncOverlay').classList.contains('active')){dismissSync();try{history.back();}catch(e){}}}
function dismissExport(){document.getElementById('exportOverlay').classList.remove('active');}
function closeExport(){if(document.getElementById('exportOverlay').classList.contains('active')){dismissExport();try{history.back();}catch(e){}}}
function goHome(){closeView('calView');closeView('diaryView');closeView('infoView');closeView('settingsView');}
function openDiary(){openView('diaryView')}
function hideDiary(){closeView('diaryView')}
function openSettings(){openView('settingsView')}
function hideSettings(){closeView('settingsView')}

function buildSets(){
calSets={water:new Set(),hunger:new Set()};
entries.forEach(e=>{
const d=parseDateRU(e.date);if(!d)return;
const iso=toISO(d);
const act=e.actions||e.text||'';
const app=e.appetite||'';
if(/подмен|подвен|залита|долив|долил|слил/i.test(act))calSets.water.add(iso);
if(/голод|разгруз/i.test(app))calSets.hunger.add(iso);
});
}

function persist(){
try{localStorage.setItem('aquaEntries',JSON.stringify(entries));return true}
catch(e){alert('Память телефона заполнена. Удали старые записи с фото.');return false}
}

function updateStats(){
let days=0;
const dates=entries.map(e=>parseDateRU(e.date)).filter(d=>d);
if(dates.length){
const first=new Date(Math.min.apply(null,dates));
const now=new Date();
days=Math.floor((now-first)/86400000)+1;
if(days<1)days=1;
}
document.getElementById('headDaysNum').textContent=days;
document.getElementById('headDaysWord').textContent=plural(days,'день','дня','дней');
}

function nextInfo(mode){
const set=mode==='water'?calSets.water:calSets.hunger;
const period=mode==='water'?settings.water:settings.hunger;
if(!set||set.size===0)return null;
let last=null;
set.forEach(s=>{
let d;
if(String(s).indexOf('-')===4){d=new Date(+String(s).slice(0,4),+String(s).slice(5,7)-1,+String(s).slice(8,10));}
else{d=parseDateRU(s);}
if(d&&(!last||d>last))last=d;
});
if(!last)return null;
const next=new Date(last.getTime()+period*86400000);
const today=new Date();today.setHours(0,0,0,0);
const diff=Math.round((next-today)/86400000);
return {last:last,next:next,diff:diff};
}

function updateTiles(){
const w=nextInfo('water');
if(w){
document.getElementById('twVal').textContent=w.diff>0?'через '+w.diff+' дн.':(w.diff===0?'сегодня!':'просрочено '+(-w.diff)+' дн.');
document.getElementById('twSub').textContent='последняя '+w.last.toLocaleDateString('ru-RU');
document.getElementById('tileWater').classList.toggle('late',w.diff<0);
}else{document.getElementById('twVal').textContent='—';document.getElementById('twSub').textContent='нет данных';}
const h=nextInfo('hunger');
if(h){
document.getElementById('thVal').textContent=h.diff>0?'через '+h.diff+' дн.':(h.diff===0?'сегодня!':'просрочено '+(-h.diff)+' дн.');
document.getElementById('thSub').textContent='последний '+h.last.toLocaleDateString('ru-RU');
document.getElementById('tileHunger').classList.toggle('late',h.diff<0);
}else{document.getElementById('thVal').textContent='—';document.getElementById('thSub').textContent='нет данных';}
const box=document.getElementById('tpBox');
let ph=null;
for(let i=0;i<entries.length;i++){if(entries[i].photo){ph=entries[i];break;}}
if(ph){box.innerHTML='<img src="'+ph.photo+'">';}else{box.innerHTML='<div class="t-v">пока нет</div>';}
if(entries.length){
const le=entries[0];
document.getElementById('tdVal').textContent=le.date;
document.getElementById('tdSub').textContent=(le.actions||le.text||le.activity||'открыть ленту').slice(0,70);
}else{
document.getElementById('tdVal').textContent='пока пусто';
document.getElementById('tdSub').textContent='нажми «+», чтобы начать';
}
}

function tilePhoto(){
for(let i=0;i<entries.length;i++){
if(entries[i].photo){openLightbox(entries[i].photo);return;}
}
alert('Пока нет ни одного фото. Добавь первое через «+»!');
}

function showCal(){calOpen=true;openView('calView');renderCal()}
function hideCal(){closeView('calView')}
function openCal(mode){
calMode=mode;
document.querySelectorAll('.cal-tab').forEach(b=>b.classList.toggle('active',b.getAttribute('data-mode')===mode));
showCal();
}
function setCalMode(m,btn){
calMode=m;
document.querySelectorAll('.cal-tab').forEach(b=>b.classList.remove('active'));
btn.classList.add('active');
renderCal();
}
function calPrev(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCal()}
function calNext1(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCal()}
function updateCalCounter(){
const box=document.getElementById('calCounter');
const cap=document.getElementById('ccCap');
const numEl=document.getElementById('ccNum');
const wordEl=document.getElementById('ccWord');
const thrEl=document.getElementById('ccThrough');
const dateEl=document.getElementById('ccDate');
const fill=document.getElementById('ccFill');
cap.textContent=calMode==='water'?'следующая подмена воды':'следующий разгрузочный день';
box.classList.toggle('hunger',calMode==='hunger');
const info=nextInfo(calMode);
if(!info){
dateEl.textContent='нет данных';
thrEl.textContent='';numEl.textContent='—';wordEl.textContent='';
fill.style.width='0%';
box.classList.remove('late');
return;
}
dateEl.textContent=info.next.toLocaleDateString('ru-RU');
if(info.diff>0){
thrEl.textContent='через';
numEl.textContent=info.diff;
wordEl.textContent=plural(info.diff,'день','дня','дней');
}else if(info.diff===0){
thrEl.textContent='';
numEl.textContent='сегодня!';
wordEl.textContent='';
}else{
thrEl.textContent='просрочено на';
numEl.textContent=-info.diff;
wordEl.textContent=plural(-info.diff,'день','дня','дней');
}
box.classList.toggle('late',info.diff<0);
const span=info.next-info.last;
let pct=span>0?Math.round(((new Date()-info.last)/span)*100):100;
if(pct<0)pct=0;if(pct>100)pct=100;
fill.style.width=pct+'%';
}
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
updateCalCounter();
}

function openInfo(){openView('infoView');renderInfo();renderCosts();}
function hideInfo(){closeView('infoView');closeInfoEdit();closeCostForm();}
function closeInfoEdit(){document.getElementById('infoForm').style.display='none';}
function closeCostForm(){
document.getElementById('costForm').style.display='none';
['c_name','c_sum','c_note'].forEach(id=>{document.getElementById(id).value=''});
}
function renderInfo(){
const m=String(aquaInfo.size).match(/\d+/g);
let vol='';
if(m&&m.length>=3){vol=' (≈ '+Math.round(m[0]*m[1]*m[2]/1000)+' л)';}
document.getElementById('infoText').innerHTML=
fld(ico('search',OR),'Размер',aquaInfo.size+vol)+
fld(ico('bolt',OR),'Свет',aquaInfo.light)+
fld(ico('wrench',OR),'Фильтр',aquaInfo.filter)+
fld(ico('tank',OR),'Грунт',aquaInfo.grunt);
}
function toggleInfoEdit(){
const f=document.getElementById('infoForm');
if(f.style.display==='none'){
document.getElementById('i_size').value=aquaInfo.size;
document.getElementById('i_light').value=aquaInfo.light;
document.getElementById('i_filter').value=aquaInfo.filter;
document.getElementById('i_grunt').value=aquaInfo.grunt;
f.style.display='block';
}else{f.style.display='none';}
}
function saveInfo(){
aquaInfo={size:document.getElementById('i_size').value.trim(),light:document.getElementById('i_light').value.trim(),filter:document.getElementById('i_filter').value.trim(),grunt:document.getElementById('i_grunt').value.trim()};
localStorage.setItem('aquaInfo',JSON.stringify(aquaInfo));
closeInfoEdit();
renderInfo();
}
function renderCosts(){
let total=0;
document.getElementById('costList').innerHTML=costs.map(function(c,i){
total+=Number(c.sum)||0;
return '<div class="cost-row"><span>'+c.name+(c.note?' <span style="opacity:.5">('+c.note+')</span>':'')+'</span><span class="c-sum">'+(Number(c.sum)||0)+' р <button class="cost-del" onclick="removeCost('+i+')">✕</button></span></div>';
}).join('');
document.getElementById('costTotal').textContent='Итого: '+total+' р';
}
function toggleCostForm(){const f=document.getElementById('costForm');f.style.display=f.style.display==='none'?'block':'none';}
function addCost(){
const n=document.getElementById('c_name').value.trim();
const s=Number(String(document.getElementById('c_sum').value).replace(',','.'))||0;
const note=document.getElementById('c_note').value.trim();
if(!n){alert('Впиши название покупки');return;}
costs.push({name:n,sum:s,note:note});
localStorage.setItem('aquaCosts',JSON.stringify(costs));
closeCostForm();
renderCosts();
}
function removeCost(i){
if(confirm('Удалить покупку «'+costs[i].name+'»?')){
costs.splice(i,1);
localStorage.setItem('aquaCosts',JSON.stringify(costs));
renderCosts();
}
}

function onSearch(v){searchQuery=v;render()}

function fld(icon,label,v){
if(!v)return'';
return '<div class="fld"><div class="fld-l">'+icon+label+'</div><div class="fld-v">'+v+'</div></div>';
}

function render(){
const list=document.getElementById('entriesList');
const q=searchQuery.trim().toLowerCase();
let items=entries.map((e,i)=>({e:e,i:i}));
if(q){items=items.filter(function(it){return ((it.e.actions||'')+' '+(it.e.activity||'')+' '+(it.e.appetite||'')+' '+(it.e.fins||'')+' '+(it.e.text||'')+' '+(it.e.date||'')).toLowerCase().includes(q)});}
if(items.length===0){
if(entries.length===0){list.innerHTML='<div class="empty"><div class="icon">'+ico('fish',OR,48)+'</div><p>Пока нет записей.<br>Нажми «+» или добавь таблицу в настройках!</p></div>';}
else{list.innerHTML='<div class="empty"><div class="icon">'+ico('search',OR,48)+'</div><p>Ничего не нашлось по запросу «'+searchQuery+'»</p></div>';}
return;
}
list.innerHTML=items.map(function(it){
const e=it.e,i=it.i;
return '<div class="entry-card">'+
'<div class="entry-date"><span>'+ico('cal',OR,13)+' '+e.date+'</span><button class="edit-btn" onclick="openEdit('+i+')">'+ico('pencil',OR,20)+'</button></div>'+
fld(ico('wrench',OR),'Действия',e.actions)+
fld(ico('bolt',OR),'Активность',e.activity)+
fld(ico('plate',OR),'Аппетит',e.appetite)+
fld(ico('fish',OR),'Плавники',e.fins)+
fld(ico('pencil',OR),'Заметка',e.text)+
(e.photo?'<div class="entry-photo"><img src="'+e.photo+'" loading="lazy"></div>':'')+
'<div class="card-foot"><button class="del-btn" onclick="deleteEntry('+i+')">'+ico('trash',OR,14)+' удалить запись</button></div>'+
'</div>';
}).join('');
                 }
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
buildSets();render();updateStats();updateTiles();
input.value='';
};
reader.readAsText(input.files[0]);
}

function openModal(){
editingIndex=null;
document.getElementById('modalTitle').innerHTML=ico('pencil',OR,18)+' Новая запись';
document.getElementById('modalOverlay').classList.add('active');
pushLayer();
document.getElementById('dateBlock').style.display='none';
['actions','activity','appetite','fins'].forEach(k=>{document.getElementById('f_'+k).value=''});
document.getElementById('photoPreview').style.display='none';
currentPhoto=null;
}

function openEdit(i){
editingIndex=i;
const e=entries[i];
document.getElementById('modalTitle').innerHTML=ico('pencil',OR,18)+' Редактирование';
document.getElementById('modalOverlay').classList.add('active');
pushLayer();
document.getElementById('dateBlock').style.display='block';
document.getElementById('f_date').value=e.date;
document.getElementById('f_actions').value=e.actions||'';
document.getElementById('f_activity').value=e.activity||'';
document.getElementById('f_appetite').value=e.appetite||'';
document.getElementById('f_fins').value=e.fins||'';
currentPhoto=e.photo||null;
const preview=document.getElementById('photoPreview');
if(currentPhoto){preview.src=currentPhoto;preview.style.display='block'}else{preview.style.display='none'}
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
recognition.interimResults=false;
recognition.maxAlternatives=1;
currentField=field;
currentMic=btn;
const ta=document.getElementById('f_'+field);
baseText=ta.value.trim()?ta.value.trim()+' ':'';
finalText='';
recognition.onstart=()=>{isRecording=true;btn.classList.add('recording');btn.textContent='стоп';};
recognition.onresult=(e)=>{
for(let i=e.resultIndex;i<e.results.length;i++){
if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+' ';
}
ta.value=(baseText+finalText).trim();
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
if(currentMic){currentMic.classList.remove('recording');currentMic.innerHTML=micHTML();}
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
const dv=document.getElementById('f_date').value.trim();
if(dv){
if(!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dv)){alert('Дата должна быть в формате ДД.ММ.ГГГГ');return;}
e.date=dv;
}
e.actions=a;e.activity=ac;e.appetite=ap;e.fins=f;e.photo=currentPhoto;e.synced=false;
persist();closeModal();buildSets();render();updateStats();updateTiles();
if(syncUrl)sendRows([e],true);
return;
}
const date=new Date().toLocaleDateString('ru-RU');
const en={date,actions:a,activity:ac,appetite:ap,fins:f,photo:currentPhoto,src:'app',synced:false};
entries.unshift(en);
if(!persist()){entries.shift();return}
closeModal();
buildSets();render();updateStats();updateTiles();
if(syncUrl)sendRows([en],true);
}

function deleteEntry(i){
if(confirm('Удалить эту запись?')){
entries.splice(i,1);
persist();buildSets();render();updateStats();updateTiles();
}
}

function exportToSheet(){
if(!syncUrl){document.getElementById('syncUrlInput').value='';document.getElementById('syncOverlay').classList.add('active');pushLayer();return}
const pending=entries.filter(e=>e.src!=='csv'&&!e.synced);
if(pending.length===0){alert('Всё уже отправлено в таблицу ✅');return}
document.getElementById('exportOverlay').classList.add('active');
pushLayer();
}

function doSendNow(){
closeExport();
const pending=entries.filter(e=>e.src!=='csv'&&!e.synced);
if(pending.length===0){alert('Всё уже отправлено в таблицу ✅');return}
sendRows(pending,false);
}

function openSyncFromExport(){
closeExport();
openSyncFromSettings();
}

function openSyncFromSettings(){
document.getElementById('syncUrlInput').value=syncUrl;
document.getElementById('syncOverlay').classList.add('active');
pushLayer();
}

function sendRows(list,silent){
const rows=list.map(e=>({date:e.date,actions:e.actions||e.text||'',activity:e.activity||'',appetite:e.appetite||'',fins:e.fins||''}));
fetch(syncUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(rows)})
.then(()=>{list.forEach(e=>e.synced=true);persist();if(!silent)alert('Отправлено в таблицу: '+list.length);})
.catch(()=>{if(!silent)alert('Не получилось отправить. Попробуй ещё раз через Настройки → Таблица.');});
}

function saveSyncUrl(){
const v=document.getElementById('syncUrlInput').value.trim();
if(!v.startsWith('https://')){alert('Ссылка должна начинаться с https://');return}
syncUrl=v;
localStorage.setItem('aquaSyncUrl',syncUrl);
closeSync();
alert('Ссылка сохранена!');
}

function backupSave(){
const data={entries:entries,costs:costs,aquaInfo:aquaInfo,settings:settings};
const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
const a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download='aqua-backup-'+new Date().toISOString().slice(0,10)+'.json';
a.click();
setTimeout(function(){URL.revokeObjectURL(a.href)},5000);
alert('Резервная копия сохранена в «Загрузки».');
}

function backupRestore(input){
if(!input.files||!input.files[0])return;
const r=new FileReader();
r.onload=function(e){
try{
const d=JSON.parse(String(e.target.result));
if(!d.entries){alert('В файле нет записей.');return;}
if(!confirm('Восстановить из копии? Текущие данные будут заменены.'))return;
entries=d.entries||[];
if(d.costs)costs=d.costs;
if(d.aquaInfo)aquaInfo=d.aquaInfo;
if(d.settings)settings=d.settings;
localStorage.setItem('aquaEntries',JSON.stringify(entries));
localStorage.setItem('aquaCosts',JSON.stringify(costs));
localStorage.setItem('aquaInfo',JSON.stringify(aquaInfo));
localStorage.setItem('aquaSettings',JSON.stringify(settings));
applySettings();buildSets();render();updateStats();updateTiles();renderCosts();
alert('Восстановлено записей: '+entries.length);
}catch(err){alert('Файл копии не читается.');}
};
r.readAsText(input.files[0]);
input.value='';
}

/* ===== Полноэкранный просмотр фото ===== */
(function(){
var st=document.createElement('style');
st.textContent='#lightbox{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:400;display:none;align-items:center;justify-content:center}'+
'#lightbox.open{display:flex}'+
'#lbImg{max-width:100%;max-height:100vh;touch-action:none;user-select:none;-webkit-user-select:none}'+
'#lbClose{position:fixed;top:12px;right:12px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:18px;z-index:401;cursor:pointer}'+
'#lbHint{position:fixed;bottom:14px;left:0;right:0;text-align:center;color:rgba(255,255,255,.5);font-size:11px;z-index:401}';
document.head.appendChild(st);
var lb=document.createElement('div');
lb.id='lightbox';
lb.innerHTML='<button id="lbClose">✕</button><img id="lbImg" alt=""><div id="lbHint">щипок или двойной тап — зум · палец — двигать · «назад» или тап по фону — закрыть</div>';
document.body.appendChild(lb);
var img=lb.querySelector('#lbImg');
var scale=1,x=0,y=0;
var pointers=new Map();
var lastDist=0,pinchStartScale=1;
var panStartX=0,panStartY=0,panBaseX=0,panBaseY=0,panning=false;
var lastTap=0;
function apply(){img.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';}
function reset(){scale=1;x=0;y=0;apply();}
function close(){lb.classList.remove('open');img.src='';}
function closeLB(){if(lb.classList.contains('open')){close();try{history.back();}catch(e){}}}
window.openLightbox=function(src){img.src=src;reset();lb.classList.add('open');pushLayer();};
window.closeLightbox=close;
lb.addEventListener('click',function(e){if(e.target===lb)closeLB();});
lb.querySelector('#lbClose').addEventListener('click',closeLB);
document.addEventListener('click',function(e){
var t=e.target.closest?e.target.closest('.entry-photo img'):null;
if(t)openLightbox(t.getAttribute('src'));
});
function dist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
img.addEventListener('pointerdown',function(e){
img.setPointerCapture(e.pointerId);
pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(pointers.size===1){
var now=Date.now();
if(now-lastTap<300){
if(scale>1){reset();}else{scale=2.5;apply();}
lastTap=0;panning=false;
return;
}
lastTap=now;
panning=true;panStartX=e.clientX;panStartY=e.clientY;panBaseX=x;panBaseY=y;
}else if(pointers.size===2){
panning=false;
var ps=[];pointers.forEach(function(p){ps.push(p);});
lastDist=dist(ps[0],ps[1]);
pinchStartScale=scale;
}
});
img.addEventListener('pointermove',function(e){
if(!pointers.has(e.pointerId))return;
pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(pointers.size===2){
var ps=[];pointers.forEach(function(p){ps.push(p);});
var d=dist(ps[0],ps[1]);
if(lastDist>0){
scale=Math.min(5,Math.max(1,pinchStartScale*d/lastDist));
if(scale===1){x=0;y=0;}
apply();
}
}else if(pointers.size===1&&panning&&scale>1){
x=panBaseX+(e.clientX-panStartX);
y=panBaseY+(e.clientY-panStartY);
apply();
}
});
function up(e){
pointers.delete(e.pointerId);
if(pointers.size<2)lastDist=0;
if(pointers.size===0)panning=false;
}
img.addEventListener('pointerup',up);
img.addEventListener('pointercancel',up);
})();

init();

/* ===== Праздничные даты ===== */
(function(){
var st=document.createElement('style');
st.textContent='.h-mile{font-size:12px;color:#ffd76a;margin-top:3px;text-shadow:0 0 8px rgba(255,215,106,.5)}'+
'.h-days .num.gold{color:#ffd76a;text-shadow:0 0 14px rgba(255,215,106,.8)}'+
'.header.party .bubbles i{background:rgba(255,215,106,.4)}'+
'.header.big .h-title{font-size:19px}'+
'.header.big .h-days .num{font-size:26px}';
document.head.appendChild(st);
})();
function addMileLine(){
const row=document.querySelector('.h-row');
if(!row||document.getElementById('headMile'))return;
const div=document.createElement('div');
div.className='h-mile';div.id='headMile';div.style.display='none';
row.insertAdjacentElement('afterend',div);
}
function testParam(name){
try{
const p=new URLSearchParams(location.search).get(name);
if(p&&Number(p)>0)return Math.floor(Number(p));
}catch(e){}
return null;
}
function milestoneInfo(days,first){
if(!first||days<1)return null;
if(days%100===0)return{txt:'сегодня аквариуму '+days+' '+plural(days,'день','дня','дней')+'!'};
const now=new Date();
let m=(now.getFullYear()-first.getFullYear())*12+(now.getMonth()-first.getMonth());
if(now.getDate()<first.getDate())m--;
if(m>0&&now.getDate()===first.getDate()){
if(m%12===0)return{txt:'сегодня аквариуму '+(m/12)+' '+plural(m/12,'год','года','лет')+'!'};
return{txt:'сегодня аквариуму '+m+' '+plural(m,'месяц','месяца','месяцев')+'!'};
}
return null;
}
function updateStats(){
let first=null;
const dates=entries.map(e=>parseDateRU(e.date)).filter(d=>d);
if(dates.length)first=new Date(Math.min.apply(null,dates));
const td=testParam('testdays');
const tm=testParam('testmonths');
let days=0;
if(td){first=new Date(Date.now()-(td-1)*86400000);days=td;}
else if(tm){const now=new Date();first=new Date(now.getFullYear(),now.getMonth()-tm,now.getDate());days=Math.floor((now-first)/86400000)+1;}
else if(first){days=Math.floor((new Date()-first)/86400000)+1;if(days<1)days=1;}
document.getElementById('headDaysNum').textContent=days;
document.getElementById('headDaysWord').textContent=plural(days,'день','дня','дней');
const mile=milestoneInfo(days,first);
document.getElementById('headDaysNum').classList.toggle('gold',!!mile);
document.querySelector('.header').classList.toggle('party',!!mile);
document.querySelector('.header').classList.toggle('big',days>=100);
const me=document.getElementById('headMile');
if(me){
if(mile){me.textContent=mile.txt;me.style.display='block';}
else{me.style.display='none';}
}
}
addMileLine();
updateStats();

/* ===== Гирлянда и центральная подпись ===== */
(function(){
var st=document.createElement('style');
st.textContent='#headMile{position:static;text-align:center;margin-top:26px;font-size:13px}'+
'#garland{position:absolute;right:10px;top:52px;width:150px;display:none;pointer-events:none}'+
'.header.party #garland{display:block}'+
'#garland .gl{fill:#ffd76a;filter:drop-shadow(0 0 4px rgba(255,215,106,.9));animation:glow 1.6s ease-in-out infinite}'+
'#garland .g2{animation-delay:.3s}#garland .g3{animation-delay:.6s}#garland .g4{animation-delay:.9s}#garland .g5{animation-delay:1.2s}'+
'@keyframes glow{0%,100%{opacity:.35}50%{opacity:1}}';
document.head.appendChild(st);
var h=document.querySelector('.header');
if(!h)return;
var g=document.createElement('div');
g.id='garland';
g.innerHTML='<svg viewBox="0 0 160 30"><path d="M0 3 Q40 20 80 7 Q120 20 160 3" fill="none" stroke="rgba(255,215,106,.55)" stroke-width="1.5"/><circle class="gl g1" cx="20" cy="10" r="3"/><circle class="gl g2" cx="50" cy="12" r="3"/><circle class="gl g3" cx="80" cy="7" r="3"/><circle class="gl g4" cx="110" cy="12" r="3"/><circle class="gl g5" cx="140" cy="10" r="3"/></svg>';
h.appendChild(g);
})();
