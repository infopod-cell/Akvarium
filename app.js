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

/* ===== Тесты воды: карточки, график, парсер, поиск ===== */
(function(){
var st=document.createElement('style');
st.textContent='body *{font-weight:400!important}'+
'.search-row{position:relative}'+
'.search-row input{padding-right:36px}'+
'#searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.5);font-size:15px;padding:6px;cursor:pointer;display:none}'+
'.wt-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'+
'.wt-grid input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px;color:#e0f0ff;font-size:13px}'+
'.wt-card{margin:12px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px}'+
'.wt-title{font-size:15px;color:#fff;margin-bottom:10px}'+
'.wt-gridcards{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
'.wtc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;text-align:center}'+
'.wtc-n{font-size:12px;color:rgba(255,255,255,.6)}'+
'.wtc-v{font-size:24px;margin:2px 0}'+
'.wtc-u{font-size:11px;color:rgba(255,255,255,.45)}'+
'.wtc-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;margin-top:4px}'+
'.wtc-d{font-size:11px;color:rgba(255,255,255,.4);margin-top:4px}'+
'.wt-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}'+
'.wt-chip{padding:6px 11px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#e0f0ff;font-size:12px;cursor:pointer}'+
'.wt-chip.active{border-color:#4dd9ff;color:#4dd9ff}'+
'.wt-empty{font-size:13px;color:rgba(255,255,255,.4)}'+
'.wt-gl{stroke:rgba(255,255,255,.12)}.wt-lb{fill:rgba(255,255,255,.45);font-size:8px}.wt-ln{stroke:#4dd9ff;stroke-width:2;fill:none}.wt-dt{fill:#4dd9ff}.wt-vl{fill:#e0f0ff;font-size:8px}'+
'body.light .wt-card{background:#fff;border-color:#dce7f0}body.light .wt-title{color:#16324a}body.light .wtc{background:#fff;border-color:#dce7f0}body.light .wtc-n{color:#6a8098}body.light .wtc-u{color:#93a7b8}body.light .wtc-d{color:#93a7b8}body.light .wt-chip{background:#fff;border-color:#cfdcea;color:#16324a}body.light .wt-chip.active{border-color:#0077aa;color:#0077aa}body.light .wt-grid input{background:#fff;border-color:#cfdcea;color:#16324a}body.light .wt-lb{fill:#93a7b8}body.light .wt-vl{fill:#16324a}body.light .wt-ln{stroke:#0077aa}body.light .wt-dt{fill:#0077aa}body.light .wt-gl{stroke:rgba(22,50,74,.15)}body.light #searchClear{color:#93a7b8}';
document.head.appendChild(st);

var modal=document.querySelector('#modalOverlay .modal');
if(!document.getElementById('t_ph')){
var photoBtn=modal.querySelector('.photo-btn');
var tb=document.createElement('div');
tb.className='field-block';
tb.innerHTML='<div class="field-head"><span>'+ico('drop',OR)+'Тесты воды (необязательно)</span></div><div class="wt-grid"><input id="t_ph" placeholder="pH" inputmode="decimal"><input id="t_kh" placeholder="Карбонат (KH)" inputmode="numeric"><input id="t_gh" placeholder="Жёсткость (GH)" inputmode="numeric"><input id="t_cl" placeholder="Хлор" inputmode="decimal"><input id="t_no3" placeholder="Нитрат" inputmode="numeric"><input id="t_no2" placeholder="Нитрит" inputmode="decimal"></div>';
photoBtn.insertAdjacentElement('beforebegin',tb);
}

var cv=document.getElementById('calView');
var wrap=document.createElement('div');
wrap.innerHTML='<div class="wt-card"><div class="wt-title">Последние тесты воды</div><div class="wt-gridcards" id="wtGrid"></div></div><div class="wt-card"><div class="wt-title">График тестов</div><div class="wt-chips" id="wtChips"></div><div id="wtChart"></div></div>';
cv.appendChild(wrap);

var PARAMS=[
{k:'ph',n:'pH',min:6,max:8},
{k:'gh',n:'Жёсткость',unit:1,deg:'°dH',min:50,max:150},
{k:'kh',n:'Карбонат',unit:1,deg:'°dKH',min:40,max:150},
{k:'cl',n:'Хлор',unit:1,min:0,max:0},
{k:'no3',n:'Нитрат',unit:1,min:0,max:25,warn:50},
{k:'no2',n:'Нитрит',unit:1,min:0,max:0,warn:0.3}
];
var COL={ok:'#3ddc84',warn:'#ffb74d',lo:'#ffb74d',hi:'#ff6b6b'};
var TXT={ok:'норма',warn:'внимание',lo:'низко',hi:'высоко'};
var curChart='no3';
function num(s){return Number(String(s).replace(',','.'));}
function statusOf(p,v){
if(p.k==='cl')return v===0?'ok':'hi';
if(p.k==='no2')return v===0?'ok':(v<=(p.warn||0.3)?'warn':'hi');
if(p.k==='no3')return v<=p.max?'ok':(v<=(p.warn||50)?'warn':'hi');
if(v<p.min)return 'lo';
if(v>p.max)return 'hi';
return 'ok';
}

function parseTests(text){
var t=String(text||''),res={},m;
function ok(k,v){
if(v===undefined||isNaN(v))return false;
if(k==='ph')return v>=4&&v<=10;
if(k==='gh'||k==='kh')return v>=1&&v<=600;
if(k==='no3')return v<=200;
if(k==='no2')return v<=10;
if(k==='cl')return v<=10;
return true;
}
m=t.match(/(?:ph|рн)[^\d\n]{0,15}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('ph',num(m[1])))res.ph=num(m[1]);
m=t.match(/нитрат[а-я]*[^\d\n]{0,15}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('no3',num(m[1])))res.no3=num(m[1]);
m=t.match(/нитрит[а-я]*[^\d\n]{0,15}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('no2',num(m[1])))res.no2=num(m[1]);
m=t.match(/хлор[а-я]*[^\d\n]{0,10}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('cl',num(m[1])))res.cl=num(m[1]);
m=t.match(/(?:^|[^а-я])кн[^\d\n]{0,10}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('kh',num(m[1])))res.kh=num(m[1]);
m=t.match(/карбонат[а-я]*[^\d\n]{0,20}?(\d+(?:[.,]\d+)?)/i);
if(m&&ok('kh',num(m[1])))res.kh=num(m[1]);
var seg=t.match(/карбонат[а-я]*[^\n]{0,60}/i);
if(seg){var dm=seg[0].match(/с\s*(\d+(?:[.,]\d+)?)\s*до\s*(\d+(?:[.,]\d+)?)/);if(dm&&ok('kh',num(dm[2])))res.kh=num(dm[2]);}
var re=/ж[её]сткость/gi,mm2;
while((mm2=re.exec(t))){
var before=t.slice(Math.max(0,mm2.index-20),mm2.index);
var after=t.slice(mm2.index,mm2.index+60);
var dm2=after.match(/с\s*(\d+(?:[.,]\d+)?)\s*до\s*(\d+(?:[.,]\d+)?)/);
var vm=after.match(/(\d+(?:[.,]\d+)?)/);
var val=dm2?num(dm2[2]):(vm?num(vm[1]):null);
if(val===null)continue;
if(/карбонат/i.test(before)){if(ok('kh',val))res.kh=val;}
else{if(ok('gh',val))res.gh=val;}
}
return res;
}

function collectSeries(){
var series={ph:[],gh:[],kh:[],cl:[],no3:[],no2:[]};
for(var i=entries.length-1;i>=0;i--){
var e=entries[i];
var t=parseTests((e.actions||'')+' '+(e.text||''));
for(var k in series){
var v=(e.tests&&e.tests[k]!==undefined)?e.tests[k]:t[k];
if(v!==undefined)series[k].push({d:e.date,v:v});
}
}
return series;
}

function renderWtChart(series){
var box=document.getElementById('wtChart');
var arr=series[curChart]||[];
if(arr.length<2){box.innerHTML='<div class="wt-empty">Для графика нужно хотя бы два теста этого параметра.</div>';return;}
var W=340,H=150,PL=34,PR=10,PT=14,PB=26;
var vs=arr.map(function(a){return a.v});
var min=Math.min.apply(null,vs),max=Math.max.apply(null,vs);
if(min===max){min-=1;max+=1;}
var pad=(max-min)*0.15;min-=pad;max+=pad;
var n=arr.length;
function x(i){return PL+i*(W-PL-PR)/(n-1);}
function y(v){return PT+(H-PT-PB)*(1-(v-min)/(max-min));}
var pts=arr.map(function(a,i){return x(i)+','+y(a.v)}).join(' ');
var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
for(var g=0;g<=2;g++){
var gv=min+(max-min)*g/2,gy=y(gv);
svg+='<line class="wt-gl" x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'"/>';
svg+='<text class="wt-lb" x="'+(PL-4)+'" y="'+(gy+3)+'" text-anchor="end">'+(Math.round(gv*10)/10)+'</text>';
}
svg+='<polyline class="wt-ln" points="'+pts+'"/>';
arr.forEach(function(a,i){
svg+='<circle class="wt-dt" cx="'+x(i)+'" cy="'+y(a.v)+'" r="3"/>';
svg+='<text class="wt-vl" x="'+x(i)+'" y="'+(y(a.v)-6)+'" text-anchor="middle">'+a.v+'</text>';
});
arr.forEach(function(a,i){
var yy=(i%2===0)?(H-6):(H-15);
svg+='<text class="wt-lb" x="'+x(i)+'" y="'+yy+'" text-anchor="middle">'+a.d.slice(0,5)+'</text>';
});
svg+='</svg>';
box.innerHTML=svg;
}

function renderWaterTests(){
var series=collectSeries();
var html='';
PARAMS.forEach(function(p){
var arr=series[p.k];
if(!arr.length){html+='<div class="wtc"><div class="wtc-n">'+p.n+'</div><div class="wtc-v" style="color:rgba(255,255,255,.3)">—</div><div class="wtc-u">'+(p.unit?'мг/л':'')+'</div><div class="wtc-d">нет данных</div></div>';return;}
var last=arr[arr.length-1];
var prev=arr.length>1?arr[arr.length-2]:null;
var s=statusOf(p,last.v);
var arrow=prev?(last.v>prev.v?' ↑':(last.v<prev.v?' ↓':'')):'';
var extra='';
if(p.deg)extra=' ≈ '+(last.v/17.86).toFixed(1)+p.deg;
html+='<div class="wtc"><div class="wtc-n">'+p.n+'</div>'+
'<div class="wtc-v" style="color:'+COL[s]+'">'+last.v+'</div>'+
'<div class="wtc-u">'+(p.unit?'мг/л'+extra:'')+'</div>'+
'<span class="wtc-badge" style="color:'+COL[s]+';background:'+COL[s]+'22">'+TXT[s]+arrow+'</span>'+
'<div class="wtc-d">'+last.d.slice(0,5)+'</div></div>';
});
document.getElementById('wtGrid').innerHTML=html;
document.getElementById('wtChips').innerHTML=PARAMS.map(function(p){
return '<button class="wt-chip'+(p.k===curChart?' active':'')+'" onclick="setWtChart(\''+p.k+'\')">'+p.n+'</button>';
}).join('');
renderWtChart(series);
}
window.setWtChart=function(k){curChart=k;renderWaterTests();};

function readTestInputs(){
var t={},ids={ph:'t_ph',kh:'t_kh',gh:'t_gh',cl:'t_cl',no3:'t_no3',no2:'t_no2'};
for(var k in ids){
var v=document.getElementById(ids[k]).value.trim();
if(v!=='')t[k]=num(v);
}
return t;
}
function clearTestInputs(){['t_ph','t_kh','t_gh','t_cl','t_no3','t_no2'].forEach(function(id){document.getElementById(id).value=''});}
function fillTestInputs(i){
clearTestInputs();
var t=entries[i].tests||{},ids={ph:'t_ph',kh:'t_kh',gh:'t_gh',cl:'t_cl',no3:'t_no3',no2:'t_no2'};
for(var k in ids){if(t[k]!==undefined)document.getElementById(ids[k]).value=t[k];}
}

var origOpenModal=openModal;
openModal=function(){origOpenModal();clearTestInputs();};
var origOpenEdit=openEdit;
openEdit=function(i){origOpenEdit(i);fillTestInputs(i);};
var origSave=saveEntry;
saveEntry=function(){
var t=readTestInputs(),ei=editingIndex;
var wasOpen=document.getElementById('modalOverlay').classList.contains('active');
origSave();
var stillOpen=document.getElementById('modalOverlay').classList.contains('active');
if(wasOpen&&stillOpen)return;
if(Object.keys(t).length){
var target=(ei!==null)?entries[ei]:entries[0];
if(target){target.tests=t;persist();}
}
};
var origRender=render;
render=function(){origRender();renderWaterTests();};

/* крестик в поиске + автосброс */
var sr=document.querySelector('.search-row');
if(sr&&!document.getElementById('searchClear')){
var cb=document.createElement('button');
cb.id='searchClear';cb.textContent='✕';
sr.appendChild(cb);
cb.onclick=function(){
var inp=document.getElementById('searchInput');
inp.value='';searchQuery='';cb.style.display='none';render();
};
}
var origOnSearch=onSearch;
onSearch=function(v){origOnSearch(v);var c=document.getElementById('searchClear');if(c)c.style.display=v.trim()?'block':'none';};
var origDismiss=dismiss;
dismiss=function(id){origDismiss(id);if(id==='diaryView'){var inp=document.getElementById('searchInput');if(inp)inp.value='';searchQuery='';var c=document.getElementById('searchClear');if(c)c.style.display='none';render();}};

renderWaterTests();
})();

/* ===== Календарь в карточке, сегменты, график по тапу, скролл сверху ===== */
(function(){
var st=document.createElement('style');
st.textContent='.cal-card{padding:8px 6px 12px}'+
'.cal-card .cal-counter{padding:4px 10px 0}'+
'.cal-card .cal-nav{padding:6px 8px 10px}'+
'.cal-card .cal-grid{padding:0 8px}'+
'.cc-bar{display:flex;gap:3px;height:8px;margin:12px 10px 6px;background:none;overflow:visible}'+
'.cc-fill{display:none}'+
'.cc-seg{flex:1;border-radius:4px;background:rgba(255,255,255,.12)}'+
'.cc-seg.on{background:linear-gradient(90deg,#0077aa,#4dd9ff);box-shadow:0 0 6px rgba(77,217,255,.4)}'+
'#calCounter.hunger .cc-seg.on{background:linear-gradient(90deg,#cc7000,#ffb74d);box-shadow:0 0 6px rgba(255,183,77,.4)}'+
'#calCounter.late .cc-seg.on{background:#ff6b6b;box-shadow:0 0 6px rgba(255,107,107,.4)}'+
'#wtChips{display:none}'+
'.wtc{cursor:pointer}'+
'.wtc.active{border-color:#4dd9ff;box-shadow:0 0 10px rgba(77,217,255,.25)}'+
'body.light .cc-bar{background:none}'+
'body.light .cc-seg{background:rgba(22,50,74,.12)}'+
'body.light .cc-seg.on{background:#0077aa;box-shadow:none}'+
'body.light .wtc.active{border-color:#0077aa}';
document.head.appendChild(st);

var cc=document.getElementById('calCounter');
if(cc&&cc.parentNode.className.indexOf('wt-card')===-1){
var card=document.createElement('div');
card.className='wt-card cal-card';
cc.parentNode.insertBefore(card,cc);
card.appendChild(cc);
card.appendChild(document.querySelector('.cal-nav'));
card.appendChild(document.getElementById('calGrid'));
}
var bar=document.querySelector('.cc-bar');
if(bar&&!bar.id)bar.id='ccBar';

updateCalCounter=function(){
var box=document.getElementById('calCounter');
var cap=document.getElementById('ccCap');
var numEl=document.getElementById('ccNum');
var wordEl=document.getElementById('ccWord');
var thrEl=document.getElementById('ccThrough');
var dateEl=document.getElementById('ccDate');
cap.textContent=calMode==='water'?'следующая подмена воды':'следующий разгрузочный день';
box.classList.toggle('hunger',calMode==='hunger');
var info=nextInfo(calMode);
var period=calMode==='water'?settings.water:settings.hunger;
var b=document.getElementById('ccBar');
if(!info){
dateEl.textContent='нет данных';
thrEl.textContent='';numEl.textContent='—';wordEl.textContent='';
box.classList.remove('late');
if(b)b.innerHTML='';
return;
}
dateEl.textContent=info.next.toLocaleDateString('ru-RU');
if(info.diff>0){thrEl.textContent='через';numEl.textContent=info.diff;wordEl.textContent=plural(info.diff,'день','дня','дней');}
else if(info.diff===0){thrEl.textContent='';numEl.textContent='сегодня!';wordEl.textContent='';}
else{thrEl.textContent='просрочено на';numEl.textContent=-info.diff;wordEl.textContent=plural(-info.diff,'день','дня','дней');}
box.classList.toggle('late',info.diff<0);
if(b){
b.innerHTML='';
var elapsed=period-info.diff;
if(elapsed<0)elapsed=0;
if(elapsed>period)elapsed=period;
var segs=Math.min(period,15);
var filled=Math.round(elapsed/period*segs);
for(var i=0;i<segs;i++){
var s=document.createElement('div');
s.className='cc-seg'+(i<filled?' on':'');
b.appendChild(s);
}
}
};

var KEYS=['ph','gh','kh','cl','no3','no2'];
var NAMES={ph:'pH',gh:'Жёсткость',kh:'Карбонат',cl:'Хлор',no3:'Нитрат',no2:'Нитрит'};
var sel='no3';
function markActive(){
var grid=document.getElementById('wtGrid');
if(!grid)return;
for(var i=0;i<grid.children.length;i++){
grid.children[i].classList.toggle('active',KEYS[i]===sel);
}
var ch=document.getElementById('wtChart');
if(ch&&ch.closest){
var card2=ch.closest('.wt-card');
if(card2){var t=card2.querySelector('.wt-title');if(t)t.textContent='График тестов: '+NAMES[sel];}
}
}
var origSet=window.setWtChart;
window.setWtChart=function(k){sel=k;origSet(k);markActive();};
document.addEventListener('click',function(e){
var c=e.target&&e.target.closest?e.target.closest('.wtc'):null;
if(c&&c.parentNode&&c.parentNode.id==='wtGrid'){
var idx=Array.prototype.indexOf.call(c.parentNode.children,c);
if(idx>=0&&KEYS[idx])window.setWtChart(KEYS[idx]);
}
});
var origRender=render;
render=function(){origRender();markActive();};

var origOpenView=openView;
openView=function(id){origOpenView(id);var v=document.getElementById(id);if(v)v.scrollTop=0;};

markActive();
if(document.getElementById('calView').classList.contains('open'))updateCalCounter();
})();

/* ===== Локальный режим: запросы к роботу отключены ===== */
(function(){
var of=window.fetch;
window.fetch=function(u){
if(typeof u==='string'&&u.indexOf('script.google.com')!==-1){return Promise.resolve(new Response('{}',{status:200}));}
return of.apply(this,arguments);
};
var ox=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u){
if(typeof u==='string'&&u.indexOf('script.google.com')!==-1){this.__block=true;}
return ox.apply(this,arguments);
};
var os=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send=function(){
if(this.__block){var self=this;setTimeout(function(){if(self.onload)self.onload();if(self.onreadystatechange)self.onreadystatechange();},10);return;}
return os.apply(this,arguments);
};
})();

/* ===== Настройки: без таблицы + напоминание о копии ===== */
(function(){
function findBtn(t){
var bs=document.querySelectorAll('button');
for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()===t)return bs[i];}
return null;
}
function ancestorWith(el,txts){
var p=el;
while(p&&p!==document.body){
var ok=true;
for(var i=0;i<txts.length;i++){if(p.textContent.indexOf(txts[i])===-1){ok=false;break;}}
if(ok)return p;
p=p.parentElement;
}
return null;
}
var st=document.createElement('style');
st.textContent='#bkInfo{font-size:12px;margin-top:10px;text-align:center}';
document.head.appendChild(st);

var b1=findBtn('Отправить в таблицу');
if(b1){var card=ancestorWith(b1,['Таблица','Ссылка робота']);if(card)card.style.display='none';}

var nodes=document.querySelectorAll('div,p,span');
for(var i=0;i<nodes.length;i++){
var n=nodes[i];
if(n.children.length===0&&n.textContent.indexOf('таблица,')!==-1){
n.textContent=n.textContent.replace('таблица, ','');
}
}

var b2=findBtn('Сохранить в файл');
if(b2){
var card2=ancestorWith(b2,['Резервная копия']);
if(card2&&!document.getElementById('bkInfo')){
var info=document.createElement('div');
info.id='bkInfo';
card2.appendChild(info);
}
}
function updBk(){
var el=document.getElementById('bkInfo');
if(!el)return;
var t=Number(localStorage.getItem('aquaLastBackup')||0);
if(!t){el.textContent='⚠️ Копия — твоя единственная страховка. Нажми «Сохранить в файл»!';el.style.color='#ffb74d';return;}
var d=Math.floor((Date.now()-t)/86400000);
if(d<=0){el.textContent='✅ Копия сделана сегодня';el.style.color='#3ddc84';}
else if(d<=7){el.textContent='✅ Копия сделана '+d+' дн. назад';el.style.color='#3ddc84';}
else{el.textContent='⚠️ Копия была '+d+' дн. назад — обнови её!';el.style.color='#ff6b6b';}
}
document.addEventListener('click',function(e){
var t=e.target&&e.target.closest?e.target.closest('button'):null;
if(t&&t.textContent.trim()==='Сохранить в файл'){
localStorage.setItem('aquaLastBackup',String(Date.now()));
setTimeout(updBk,500);
}
});
updBk();
setInterval(updBk,60000);
})();

/* ===== ИИ-советник ===== */
(function(){
var KEY_LS='aquaGeminiKey';
function getKey(){return localStorage.getItem(KEY_LS)||'';}
var st=document.createElement('style');
st.textContent='.ai-ov{position:fixed;inset:0;background:#0a1428;z-index:999;overflow-y:auto;padding:16px;box-sizing:border-box}.ai-h{display:flex;justify-content:space-between;align-items:center;font-size:20px;margin-bottom:12px;color:#eaf6ff}.ai-x{background:none;border:1px solid #444;color:#fff;border-radius:10px;padding:6px 12px}.ai-btn{display:block;width:100%;margin:8px 0;padding:12px;border-radius:12px;border:1px solid #2b4a66;background:#16283c;color:#eaf6ff;font-size:15px}.ai-img{width:100%;border-radius:12px;display:none;margin:8px 0}.ai-res{white-space:pre-wrap;font-size:14px;line-height:1.5;background:#122032;border:1px solid #2b4a66;border-radius:12px;padding:12px;margin-top:10px;display:none;color:#eaf6ff}';
document.head.appendChild(st);

function addSettings(){
if(document.getElementById('aiSetCard'))return;
var b=document.querySelectorAll('button'),bk=null;
for(var i=0;i<b.length;i++){if(b[i].textContent.trim()==='Сохранить в файл'){bk=b[i];break;}}
if(!bk)return;
var card=bk;
while(card&&card!==document.body){if(card.textContent.indexOf('Резервная копия')!==-1)break;card=card.parentElement;}
if(!card||card===document.body)return;
var c=document.createElement('div');
c.id='aiSetCard';
c.style.cssText='margin-top:14px;border:1px solid #2b4a66;border-radius:16px;padding:14px';
c.innerHTML='<div style="font-size:16px;margin-bottom:8px;color:#eaf6ff">🤖 ИИ-советник</div><input id="aiKeyInput" placeholder="Вставь ключ AIza..." style="width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #2b4a66;background:#0d1826;color:#eaf6ff;font-size:13px"><button class="ai-btn" id="aiKeySave">Сохранить ключ</button><div id="aiKeyStat" style="font-size:12px"></div>';
card.parentElement.insertBefore(c,card.nextSibling);
document.getElementById('aiKeySave').addEventListener('click',function(){
localStorage.setItem(KEY_LS,document.getElementById('aiKeyInput').value.trim());
document.getElementById('aiKeyStat').textContent='✅ Ключ сохранён в телефоне';
document.getElementById('aiKeyStat').style.color='#3ddc84';
});
}

var ov=null,imgData=null;
function build(){
ov=document.createElement('div');ov.className='ai-ov';ov.style.display='none';
ov.innerHTML='<div class="ai-h"><span>🤖 ИИ-советник</span><button class="ai-x" id="aiClose">✕</button></div><button class="ai-btn" id="aiCam">📷 Сфотографировать</button><button class="ai-btn" id="aiGal">🖼 Выбрать из галереи</button><input type="file" id="aiFileCam" accept="image/*" capture="environment" style="display:none"><input type="file" id="aiFileGal" accept="image/*" style="display:none"><img id="aiImg" class="ai-img"><button class="ai-btn" id="aiGo" style="display:none">🔍 Проанализировать</button><button class="ai-btn" id="aiTest">🔑 Проверить ключ</button><div id="aiStatus" style="font-size:13px;margin-top:6px"></div><div id="aiRes" class="ai-res"></div>';
document.body.appendChild(ov);
document.getElementById('aiClose').onclick=function(){ov.style.display='none';};
document.getElementById('aiCam').onclick=function(){document.getElementById('aiFileCam').click();};
document.getElementById('aiGal').onclick=function(){document.getElementById('aiFileGal').click();};
document.getElementById('aiFileCam').onchange=onFile;
document.getElementById('aiFileGal').onchange=onFile;
document.getElementById('aiGo').onclick=function(){run(true);};
document.getElementById('aiTest').onclick=function(){run(false);};
}
function onFile(e){
var f=e.target.files[0];if(!f)return;
var r=new FileReader();
r.onload=function(){
var img=new Image();
img.onload=function(){
var mx=1024,sc=Math.min(1,mx/Math.max(img.width,img.height));
var cv=document.createElement('canvas');
cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);
cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
imgData=cv.toDataURL('image/jpeg',0.8).split(',')[1];
var pr=document.getElementById('aiImg');
pr.src='data:image/jpeg;base64,'+imgData;
pr.style.display='block';
document.getElementById('aiGo').style.display='block';
status('Фото готово к анализу','#9cd');
};
img.src=r.result;
};
r.readAsDataURL(f);
e.target.value='';
}
function status(t,c){var s=document.getElementById('aiStatus');s.textContent=t;s.style.color=c||'#9cd';}
function callGemini(b64,cb){
var key=getKey();
if(!key){status('⚠️ Нет ключа — вставь его в Настройках','#ff6b6b');return;}
var parts=[{text:'Ты опытный аквариумист. Фото домашнего аквариума с петушком. Оцени: прозрачность воды, состояние рыбки (плавники, окрас, поза), растения, налёт/водоросли, пузыри у поверхности. Ответь по-русски кратко: 3-6 конкретных наблюдений или советов.'}];
if(b64)parts.push({inline_data:{mime_type:'image/jpeg',data:b64}});
var models=['gemini-2.5-flash','gemini-2.0-flash','gemini-1.5-flash'];
var mi=0;
function tryNext(){
if(mi>=models.length){status('❌ Не удалось: '+lastErr,'#ff6b6b');return;}
var m=models[mi++];
fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{
method:'POST',
headers:{'Content-Type':'application/json','x-goog-api-key':key},
body:JSON.stringify({contents:[{parts:parts}]})
}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});}).then(function(o){
if(o.ok&&o.j.candidates&&o.j.candidates[0]){
var txt=o.j.candidates[0].content.parts.map(function(p){return p.text||'';}).join('');
cb(txt);
}else{
lastErr=(o.j.error&&o.j.error.message)||('HTTP '+o.j);
tryNext();
}
}).catch(function(err){lastErr=String(err);tryNext();});
}
var lastErr='';
tryNext();
}
function run(withPhoto){
if(withPhoto&&!imgData){status('⚠️ Сначала выбери фото','#ffb74d');return;}
status('🤔 Думаю...','#9cd');
callGemini(withPhoto?imgData:null,function(txt){
var r=document.getElementById('aiRes');
r.textContent=txt;r.style.display='block';
status('✅ Готово','#3ddc84');
if(withPhoto)localStorage.setItem('aquaAiLast',txt);
});
}
function addTile(){
if(document.getElementById('aiTile'))return;
var leafs=document.querySelectorAll('*');
var leaf=null;
for(var i=0;i<leafs.length;i++){
var el=leafs[i];
if(el.children.length===0&&el.textContent.trim()==='Настройки'){leaf=el;break;}
}
if(!leaf)return;
var tile=leaf;
while(tile&&tile.parentElement&&tile.textContent.indexOf('копия')===-1){tile=tile.parentElement;}
if(!tile)return;
var ai=tile.cloneNode(false);
ai.id='aiTile';
ai.innerHTML='<div style="font-size:16px;color:#eaf6ff">🤖 ИИ-советник</div><div style="font-size:12px;opacity:.7;margin-top:4px">анализ фото аквариума</div>';
ai.style.cursor='pointer';
ai.onclick=function(){if(!ov)build();ov.style.display='block';var l=localStorage.getItem('aquaAiLast');if(l){var r=document.getElementById('aiRes');r.textContent=l;r.style.display='block';}};
tile.parentElement.insertBefore(ai,tile);
}
setTimeout(function(){addSettings();addTile();},300);
})();

/* ===== ИИ-советник v2 ===== */
(function(){
function getKey(){return localStorage.getItem('aquaGeminiKey')||'';}
var ov=null,img2=null;
function st2(t,c){var s=document.getElementById('ai2Status');if(s){s.textContent=t;s.style.color=c||'#9cd';}}
function open2(){
if(!ov)build2();
ov.style.display='block';
var l=localStorage.getItem('aquaAiLast');
if(l){var r=document.getElementById('ai2Res');r.textContent=l;r.style.display='block';}
}
function build2(){
ov=document.createElement('div');
ov.style.cssText='position:fixed;inset:0;background:#0a1428;z-index:999;overflow-y:auto;padding:16px;box-sizing:border-box;display:none';
ov.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;margin-bottom:12px;color:#eaf6ff"><span>🤖 ИИ-советник</span><button id="ai2Close" style="background:none;border:1px solid #444;color:#fff;border-radius:10px;padding:6px 12px">✕</button></div><button class="ai-btn" id="ai2Cam">📷 Сфотографировать</button><button class="ai-btn" id="ai2Gal">🖼 Выбрать из галереи</button><input type="file" id="ai2FC" accept="image/*" capture="environment" style="display:none"><input type="file" id="ai2FG" accept="image/*" style="display:none"><img id="ai2Img" style="width:100%;border-radius:12px;display:none;margin:8px 0"><button class="ai-btn" id="ai2Go" style="display:none">🔍 Проанализировать</button><button class="ai-btn" id="ai2Test">🔑 Проверить ключ</button><div id="ai2Status" style="font-size:13px;margin-top:6px"></div><div id="ai2Res" style="white-space:pre-wrap;font-size:14px;line-height:1.5;background:#122032;border:1px solid #2b4a66;border-radius:12px;padding:12px;margin-top:10px;display:none;color:#eaf6ff"></div>';
document.body.appendChild(ov);
document.getElementById('ai2Close').onclick=function(){ov.style.display='none';};
document.getElementById('ai2Cam').onclick=function(){document.getElementById('ai2FC').click();};
document.getElementById('ai2Gal').onclick=function(){document.getElementById('ai2FG').click();};
document.getElementById('ai2FC').onchange=onF;
document.getElementById('ai2FG').onchange=onF;
document.getElementById('ai2Go').onclick=function(){run2(true);};
document.getElementById('ai2Test').onclick=function(){run2(false);};
}
function onF(e){
var f=e.target.files[0];if(!f)return;
var r=new FileReader();
r.onload=function(){
var im=new Image();
im.onload=function(){
var sc=Math.min(1,1024/Math.max(im.width,im.height));
var cv=document.createElement('canvas');
cv.width=Math.round(im.width*sc);cv.height=Math.round(im.height*sc);
cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
img2=cv.toDataURL('image/jpeg',0.8).split(',')[1];
var p=document.getElementById('ai2Img');
p.src='data:image/jpeg;base64,'+img2;p.style.display='block';
document.getElementById('ai2Go').style.display='block';
st2('Фото готово к анализу');
};
im.src=r.result;
};
r.readAsDataURL(f);
e.target.value='';
}
function call2(b64,cb){
var key=getKey();
if(!key){st2('⚠️ Нет ключа — вставь в Настройках','#ff6b6b');return;}
var parts=[{text:'Ты опытный аквариумист. Фото домашнего аквариума с петушком. Оцени: прозрачность воды, состояние рыбки (плавники, окрас, поза), растения, налёт/водоросли, пузыри у поверхности. Ответь по-русски кратко: 3-6 конкретных наблюдений или советов.'}];
if(b64)parts.push({inline_data:{mime_type:'image/jpeg',data:b64}});
var models=['gemini-2.5-flash','gemini-2.0-flash','gemini-1.5-flash'],mi=0,lastErr='';
(function next(){
if(mi>=models.length){st2('❌ '+lastErr,'#ff6b6b');return;}
var m=models[mi++];
fetch('https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:parts}]})})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j};});})
.then(function(o){
if(o.ok&&o.j.candidates&&o.j.candidates[0]){cb(o.j.candidates[0].content.parts.map(function(p){return p.text||'';}).join(''));}
else{lastErr=(o.j.error&&o.j.error.message)||'HTTP ошибка';next();}
}).catch(function(er){lastErr=String(er);next();});
})();
}
function run2(ph){
if(ph&&!img2){st2('⚠️ Сначала выбери фото','#ffb74d');return;}
st2('🤔 Думаю...');
call2(ph?img2:null,function(txt){
var r=document.getElementById('ai2Res');r.textContent=txt;r.style.display='block';
st2('✅ Готово','#3ddc84');
if(ph)localStorage.setItem('aquaAiLast',txt);
});
}
function addTile2(){
if(document.getElementById('aiTile2'))return;
var all=document.querySelectorAll('*'),leaf=null;
for(var i=0;i<all.length;i++){
var t=all[i].textContent.trim();
if(t.indexOf('Настройки')!==-1&&t.length<=14&&all[i].querySelectorAll('*').length<=1){leaf=all[i];break;}
}
if(!leaf)return;
var tile=leaf;
while(tile&&tile.parentElement&&tile.textContent.indexOf('копия')===-1){tile=tile.parentElement;}
if(!tile)return;
var ai=tile.cloneNode(false);
ai.id='aiTile2';
ai.innerHTML='<div style="font-size:16px;color:#eaf6ff">🤖 ИИ-советник</div><div style="font-size:12px;opacity:.7;margin-top:4px">анализ фото аквариума</div>';
ai.style.cursor='pointer';
ai.onclick=open2;
tile.parentElement.insertBefore(ai,tile);
}
function addBtn2(){
var c=document.getElementById('aiSetCard');
if(!c||document.getElementById('ai2OpenBtn'))return;
var b=document.createElement('button');
b.id='ai2OpenBtn';b.className='ai-btn';
b.textContent='🤖 Открыть советник';
b.onclick=open2;
c.appendChild(b);
}
setTimeout(function(){addTile2();addBtn2();},400);
setTimeout(function(){addTile2();},2000);
})();

/* ===== Переходник: новая версия API Gemini ===== */
(function(){
var f=window.fetch;
window.fetch=function(u,o){
if(typeof u==='string'&&u.indexOf('generativelanguage.googleapis.com')!==-1){
return f.apply(this,arguments).then(function(r){
if(r.ok)return r;
var c=r.clone();
return c.json().then(function(j){
var msg=(j.error&&j.error.message)||'';
if(msg.indexOf('API version')!==-1||msg.indexOf('not found')!==-1){
var nu=u.indexOf('/v1beta/')!==-1?u.replace('/v1beta/','/v1/'):u.replace('/v1/','/v1beta/');
return f(nu,o);
}
return r;
}).catch(function(){return r;});
});
}
return f.apply(this,arguments);
};
})();

/* ===== Советник v3: сам находит живую модель ===== */
(function(){
var f=window.fetch;
function gk(){return localStorage.getItem('aquaGeminiKey')||'';}
window.fetch=function(u,o){
if(typeof u==='string'&&u.indexOf('generativelanguage.googleapis.com')!==-1&&u.indexOf(':generateContent')!==-1){
return f.apply(this,arguments).then(function(r){
if(r.ok)return r;
var c=r.clone();
return c.json().then(function(j){
var msg=(j.error&&j.error.message)||'';
if(msg.indexOf('not found')===-1&&msg.indexOf('API version')===-1&&msg.indexOf('not supported')===-1)return r;
return fix(u,o);
}).catch(function(){return r;});
});
}
return f.apply(this,arguments);
};
function list(ver){
var key=gk();
return f('https://generativelanguage.googleapis.com/'+ver+'/models?key='+key,{headers:{'x-goog-api-key':key}})
.then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});
}
function pick(l){
if(!l||!l.models)return null;
var ms=l.models;
for(var i=0;i<ms.length;i++){if(ms[i].name.indexOf('2.5-flash')!==-1)return ms[i].name;}
for(var i=0;i<ms.length;i++){if(ms[i].name.indexOf('flash')!==-1)return ms[i].name;}
for(var i=0;i<ms.length;i++){if(ms[i].name.indexOf('gemini')!==-1)return ms[i].name;}
return null;
}
function fix(u,o){
return list('v1').then(function(l1){
var nm=pick(l1),ver='v1';
if(!nm){return list('v1beta').then(function(l2){
var n2=pick(l2);
if(!n2)return f(u,o);
var nu2=u.replace(/\/v1(beta)?\/models\/[^:]+:/,'/v1beta/models/'+n2.replace(/^models\//,'')+':');
return f(nu2,o);
});}
var nu=u.replace(/\/v1(beta)?\/models\/[^:]+:/,'/'+ver+'/models/'+nm.replace(/^models\//,'')+':');
return f(nu,o);
});
}
var ks=document.getElementById('aiKeyStat');
if(ks&&gk()){ks.textContent='✅ Ключ сохранён (советник v3)';ks.style.color='#3ddc84';}
})();

/* ===== Советник v4: диагностика на экране ===== */
setTimeout(function(){
var ks=document.getElementById('aiKeyStat');
if(!ks)return;
var key=localStorage.getItem('aquaGeminiKey')||'';
if(!key){ks.textContent='⚠️ Ключ не сохранён';ks.style.color='#ffb74d';return;}
ks.textContent='🔎 Диагностика...';ks.style.color='#9cd';
fetch('https://generativelanguage.googleapis.com/v1/models?key='+key,{headers:{'x-goog-api-key':key}})
.then(function(r){return r.text().then(function(t){return{r:r,t:t};});})
.then(function(o1){
var j=null;try{j=JSON.parse(o1.t);}catch(e){}
var name=null;
if(j&&j.models){for(var i=0;i<j.models.length;i++){if(j.models[i].name.indexOf('flash')!==-1){name=j.models[i].name;break;}}}
if(!name){ks.textContent='❌ v1:'+o1.r.status+' '+(o1.t||'').slice(0,100);ks.style.color='#ff6b6b';return;}
fetch('https://generativelanguage.googleapis.com/v1/models/'+name.replace(/^models\//,'')+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:'ответь одним словом: ок'}]}]})})
.then(function(r){return r.text().then(function(t){return{r:r,t:t};});})
.then(function(o2){
if(o2.r.ok){ks.textContent='✅ Советник v4: связь есть, модель '+name;ks.style.color='#3ddc84';}
else{ks.textContent='❌ '+o2.r.status+' '+(o2.t||'').slice(0,120);ks.style.color='#ff6b6b';}
});
})
.catch(function(e){ks.textContent='❌ сеть: '+e;ks.style.color='#ff6b6b';});
},1200);

/* ===== Чистота: следы ИИ спрятаны ===== */
(function(){
var n=0;
var t=setInterval(function(){
n++;
['aiTile','aiTile2','aiSetCard'].forEach(function(id){
var el=document.getElementById(id);
if(el)el.parentNode.removeChild(el);
});
if(n>8)clearInterval(t);
},700);
})();

/* ===== Файл контекста для нейросети ===== */
(function(){
function build(){
var L=[];
L.push('МОЙ АКВАРИУМ — контекст для консультации.');
L.push('Сегодня: '+new Date().toLocaleDateString('ru-RU'));
var info=localStorage.getItem('aquaInfo');
if(info){L.push('');L.push('Параметры аквариума: '+info);}
var set=localStorage.getItem('aquaSettings');
if(set){L.push('Периоды и настройки: '+set);}
for(var i=0;i<localStorage.length;i++){
var k=localStorage.key(i),v=localStorage.getItem(k);
if(!v||v.charAt(0)!=='[')continue;
var arr=null;try{arr=JSON.parse(v);}catch(e){}
if(!arr||!arr.length||typeof arr[0]!=='object'||!arr[0].date)continue;
L.push('');L.push('ДНЕВНИК ('+arr.length+' записей):');
for(var j=0;j<arr.length;j++){
var e=arr[j],s=(e.date||'');
if(e.text)s+=' — '+e.text;
if(e.activity)s+='; активность: '+e.activity;
if(e.appetite)s+='; аппетит: '+e.appetite;
var tk=['no2','no3','gh','kh','ph','nh3','nh4','cl','t','temp'];
for(var q=0;q<tk.length;q++){if(e[tk[q]]!==undefined&&e[tk[q]]!=='')s+='; '+tk[q]+'='+e[tk[q]];}
if(e.tests&&typeof e.tests==='object'){for(var t2 in e.tests){s+='; '+t2+'='+e.tests[t2];}}
L.push(s);
}
}
return L.join('\n');
}
var b=null,bs=document.querySelectorAll('button');
for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()==='Сохранить в файл'){b=bs[i];break;}}
if(!b)return;
var card=b;
while(card&&card!==document.body&&card.textContent.indexOf('Резервная копия')===-1)card=card.parentElement;
if(!card||card===document.body||document.getElementById('ctxBtn'))return;
var nb=document.createElement('button');
nb.id='ctxBtn';nb.className='ai-btn';
nb.textContent='📄 Дневник для ИИ';
nb.onclick=function(){
var txt=build();
var bl=new Blob([txt],{type:'text/plain;charset=utf-8'});
var a=document.createElement('a');
a.href=URL.createObjectURL(bl);
a.download='Дневник для ИИ '+new Date().toISOString().slice(0,10)+'.txt';
document.body.appendChild(a);a.click();
setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
};
card.appendChild(nb);
})();

/* ===== Сегодня тот самый день! ===== */
(function(){
function parseD(s){var m=s.match(/(\d{2})\.(\d{2})\.(\d{4})/);if(!m)return null;return new Date(+m[3],+m[2]-1,+m[1]);}
function tileOf(word){
var all=document.querySelectorAll('div'),best=null;
for(var i=0;i<all.length;i++){
var t=all[i].textContent||'';
if(t.indexOf(word)!==-1&&t.indexOf('последн')!==-1&&t.length<200){
if(!best||t.length<best.textContent.length)best=all[i];
}
}
return best;
}
function periods(){
var b=null,bs=document.querySelectorAll('button');
for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()==='Сохранить периоды'){b=bs[i];break;}}
if(!b)return null;
var card=b;while(card&&card!==document.body&&card.textContent.indexOf('Периоды')===-1)card=card.parentElement;
if(!card||card===document.body)return null;
var ins=card.querySelectorAll('input');
if(ins.length<2)return null;
return [parseInt(ins[0].value)||7,parseInt(ins[1].value)||10];
}
function fix(word,label){
var t=tileOf(word);if(!t)return;
var P=periods();if(!P)return;
var per=(word.indexOf('Подмена')===0)?P[0]:P[1];
var m=t.textContent.match(/последн\w+\s+(\d{2}\.\d{2}\.\d{4})/);if(!m)return;
var last=parseD(m[1]);if(!last)return;
var now=new Date();var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
var days=Math.floor((today-last)/86400000);
var rem=per-days;
var big=null,els=t.querySelectorAll('*');
for(var i=0;i<els.length;i++){var x=els[i];if(x.children.length===0&&/через|Сегодня|Просрочено/.test(x.textContent)){big=x;break;}}
if(!big)return;
if(rem<=0){
var txt='Сегодня '+label+'!';
if(rem<0)txt+=' (просрочено '+(-rem)+' дн.)';
big.textContent=txt;
big.style.color=rem<0?'#ff6b6b':'#ff9432';
}else{
big.style.color='';
}
}
function tick(){fix('Подмена воды','подмена воды');fix('Голодный день','голодный день');}
setTimeout(tick,600);
setInterval(tick,5000);
})();

/* ===== Параметры воды: плитка + перенос тестов + температура в график ===== */
(function(){
function lastTemp(){var a=localStorage.getItem('aquaTemps');if(a){try{var j=JSON.parse(a);return j.length?j[j.length-1]:null;}catch(e){}}return null;}
function fmtT(t){return (Math.round(t*10)/10).toString().replace('.',',')+'°C';}
function addTile(){
if(document.getElementById('wpTile'))return;
var all=document.querySelectorAll('*'),leaf=null;
for(var i=0;i<all.length;i++){var t=(all[i].textContent||'').trim();if(t==='Дневник'&&all[i].querySelectorAll('*').length<=1){leaf=all[i];break;}}
if(!leaf)return;
var tile=leaf;
while(tile.parentElement){var p=tile.parentElement;if(p.textContent.length<300){tile=p;}else{break;}}
var ai=tile.cloneNode(false);
ai.id='wpTile';
ai.innerHTML='<div style="display:flex;align-items:center;gap:6px;font-size:16px;color:#eaf6ff"><span>💧</span><span>Параметры воды</span></div><div class="t-v" id="wpBig" style="font-size:26px">—</div><div class="t-s" id="wpSub">температура воды</div>';
ai.style.cursor='pointer';
ai.onclick=openWP;
tile.parentElement.insertBefore(ai,tile);
refreshTile();
}
function refreshTile(){
var b=document.getElementById('wpBig'),s=document.getElementById('wpSub');
if(!b)return;
var lt=lastTemp();
b.textContent=lt?fmtT(lt.t):'—';
if(s)s.textContent=lt?('замер '+lt.d):'температура воды';
}
var ov=null;
function openWP(){if(!ov)buildWP();ov.style.display='block';refreshWP();refreshTile();setTimeout(inject,60);}
function findMin(ok){
var all=document.querySelectorAll('div'),best=null;
for(var i=0;i<all.length;i++){var t=all[i].textContent||'';if(ok(t)){if(!best||t.length<best.textContent.length)best=all[i];}}
return best;
}
function buildWP(){
ov=document.createElement('div');ov.id='wpOv';
ov.style.cssText='position:fixed;inset:0;background:#0a1428;z-index:999;overflow-y:auto;padding:16px;box-sizing:border-box;display:none';
ov.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;margin-bottom:12px;color:#eaf6ff"><span>💧 Параметры воды</span><button id="wpClose" style="background:none;border:1px solid #444;color:#fff;border-radius:10px;padding:6px 12px">✕</button></div><div style="border:1px solid #2b4a66;border-radius:16px;padding:14px;margin-bottom:14px;text-align:center"><div style="font-size:14px;opacity:.8">🌡 Температура воды</div><div id="wpTempV" style="font-size:34px;color:#4dc3ff;margin-top:4px">—</div><div id="wpTempD" style="font-size:12px;opacity:.7"></div></div><div id="wpHost"></div>';
document.body.appendChild(ov);
document.getElementById('wpClose').onclick=function(){ov.style.display='none';};
var tests=findMin(function(t){return t.indexOf('Последние тесты воды')!==-1&&t.indexOf('pH')!==-1&&t.length<2000;});
if(tests){tests.parentNode.removeChild(tests);document.getElementById('wpHost').appendChild(tests);}
var graph=findMin(function(t){return t.indexOf('График тестов')!==-1&&t.length<2000;});
if(graph){graph.parentNode.removeChild(graph);document.getElementById('wpHost').appendChild(graph);}
hookGraph();
}
function refreshWP(){
var lt=lastTemp();
var v=document.getElementById('wpTempV');if(v)v.textContent=lt?fmtT(lt.t):'—';
var d=document.getElementById('wpTempD');if(d)d.textContent=lt?('замер '+lt.d):'';
}
var obs=null;
function hookGraph(){
var card=findMin(function(t){return t.indexOf('График тестов')!==-1&&t.length<2000;});
if(!card)return;
obs=new MutationObserver(function(){setTimeout(inject,60);});
obs.observe(card,{childList:true,subtree:true});
}
function inject(){
if(!ov||ov.style.display==='none')return;
var card=findMin(function(t){return t.indexOf('График тестов')!==-1&&t.length<2000;});
if(!card)return;
var svg=card.querySelector('svg');if(!svg)return;
var old=svg.querySelectorAll('.wpTemp');
for(var i=0;i<old.length;i++)old[i].parentNode.removeChild(old[i]);
var a=localStorage.getItem('aquaTemps');if(!a)return;
var pts;try{pts=JSON.parse(a);}catch(e){return;}
if(!pts.length)return;
var W=(svg.viewBox&&svg.viewBox.baseVal&&svg.viewBox.baseVal.width)?svg.viewBox.baseVal.width:(svg.clientWidth||300);
var H=(svg.viewBox&&svg.viewBox.baseVal&&svg.viewBox.baseVal.height)?svg.viewBox.baseVal.height:(svg.clientHeight||150);
var vals=pts.map(function(p){return p.t;});
var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
if(mx===mn){mx+=1;mn-=1;}
var n=pts.length;
function X(i){return n<=1?W/2:20+(i/(n-1))*(W-40);}
function Y(v){return H-((v-mn)/(mx-mn))*(H*0.6)-H*0.2;}
var d='M'+X(0).toFixed(1)+' '+Y(vals[0]).toFixed(1);
for(var i=1;i<n;i++)d+=' L'+X(i).toFixed(1)+' '+Y(vals[i]).toFixed(1);
var path=document.createElementNS('http://www.w3.org/2000/svg','path');
path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('stroke','#ff9432');path.setAttribute('stroke-width','2');path.setAttribute('class','wpTemp');
svg.appendChild(path);
var lab=document.createElementNS('http://www.w3.org/2000/svg','text');
lab.setAttribute('x',X(n-1).toFixed(1));lab.setAttribute('y',(Y(vals[n-1])-5).toFixed(1));lab.setAttribute('fill','#ff9432');lab.setAttribute('font-size','10');lab.setAttribute('class','wpTemp');
lab.textContent=fmtT(vals[n-1]);
svg.appendChild(lab);
}
setTimeout(addTile,500);
setInterval(function(){addTile();refreshTile();},4000);
})();

/* ===== Температура: графа в форме + сбор из старых записей ===== */
(function(){
function pd(s){var m=String(s).match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):new Date(0);}
function loadT(){var a=localStorage.getItem('aquaTemps');if(a){try{return JSON.parse(a);}catch(e){}}return [];}
function saveT(arr){arr.sort(function(x,y){return pd(x.d)-pd(y.d);});localStorage.setItem('aquaTemps',JSON.stringify(arr));}
function todayStr(){var n=new Date();function z(x){return (x<10?'0':'')+x;}return z(n.getDate())+'.'+z(n.getMonth()+1)+'.'+n.getFullYear();}
function putT(d,t){var arr=loadT();var f=null;for(var i=0;i<arr.length;i++){if(arr[i].d===d){f=arr[i];break;}}if(f){f.t=t;}else{arr.push({d:d,t:t});}saveT(arr);}
function addField(){
var h=null,all=document.querySelectorAll('div');
for(var i=0;i<all.length;i++){var t=all[i].textContent||'';if(t.indexOf('Тесты воды')!==-1&&t.length<60&&all[i].offsetParent){h=all[i];break;}}
if(!h||document.getElementById('tempInput'))return;
var ph=null,ins=document.querySelectorAll('input');
for(var i=0;i<ins.length;i++){if(ins[i].placeholder==='pH'){ph=ins[i];break;}}
var inp=ph?ph.cloneNode(false):document.createElement('input');
inp.id='tempInput';inp.placeholder='Температура, °C';inp.value='';inp.type='text';inp.inputMode='decimal';
var wrap=document.createElement('div');wrap.style.cssText='margin:10px 0';wrap.appendChild(inp);
h.parentElement.insertBefore(wrap,h.nextSibling);
}
setInterval(addField,1000);
document.addEventListener('click',function(e){
var t=e.target;
if(t&&t.tagName==='BUTTON'&&t.textContent.trim()==='Сохранить'){
var inp=document.getElementById('tempInput');
if(inp&&inp.value){
var v=parseFloat(inp.value.replace(',','.'));
if(v>=15&&v<=40){setTimeout(function(){putT(todayStr(),v);},400);}
inp.value='';
}
}
},true);
function harvest(){
if(localStorage.getItem('aquaTempHarvested'))return;
var have=loadT(),map={};have.forEach(function(p){map[p.d]=1;});
for(var i=0;i<localStorage.length;i++){
var k=localStorage.key(i),v=localStorage.getItem(k);
if(!v||v.charAt(0)!=='[')continue;
var arr;try{arr=JSON.parse(v);}catch(e){continue;}
if(!arr||!arr.length||typeof arr[0]!=='object'||!arr[0].date)continue;
for(var j=0;j<arr.length;j++){
var en=arr[j],s='';for(var f in en){if(typeof en[f]==='string')s+=' '+en[f];}
var m=s.match(/(?:температур\w*|градус\w*)\s*[:=]?\s*(\d{2}(?:[.,]\d)?)/i)||s.match(/(\d{2}(?:[.,]\d)?)\s*°/);
if(!m)continue;
var t=parseFloat(m[1].replace(',','.'));
if(t<15||t>40)continue;
if(!map[en.date]){putT(en.date,t);map[en.date]=1;}
}
}
localStorage.setItem('aquaTempHarvested','1');
}
setTimeout(harvest,1500);
})();
