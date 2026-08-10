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

const CB='#4dd9ff',CO='#ffb74d',CW='#e0f0ff';
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
el.innerHTML=ico(el.getAttribute('data-ico'),el.getAttribute('data-c')||CB,el.getAttribute('data-s')||15);
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

function init(){injectIcons();applySettings();addDateEditor();buildSets();render();updateStats();updateTiles()}

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
div.innerHTML='<div class="field-head"><span>'+ico('cal',CB)+'Дата</span></div><input id="f_date" placeholder="ДД.ММ.ГГГГ" maxlength="10">';
h2.insertAdjacentElement('afterend',div);
}

/* ===== Экраны и кнопка «назад» ===== */
function openView(id){document.getElementById(id).classList.add('open');try{history.pushState({aqua:id},'');}catch(e){}}
function dismiss(id){document.getElementById(id).classList.remove('open');if(id==='calView')calOpen=false;}
function closeView(id){
if(document.getElementById(id).classList.contains('open')){dismiss(id);try{history.back();}catch(e){}}
}
window.addEventListener('popstate',function(){
const order=['settingsView','infoView','calView','diaryView'];
for(let i=0;i<order.length;i++){
if(document.getElementById(order[i]).classList.contains('open')){dismiss(order[i]);return;}
}
});
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
document.getElementById('bannerLine').textContent='записей: '+entries.length+' · фото: '+entries.filter(e=>e.photo).length;
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
let total=0;costs.forEach(c=>{total+=Number(c.sum)||0;});
document.getElementById('tcVal').textContent=total+' р';
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
function updateCalNext(){
const el=document.getElementById('calNext');
const label=calMode==='water'?'Следующая подмена воды':'Следующий разгрузочный день';
const info=nextInfo(calMode);
if(!info){el.textContent='Пока нет данных для этого календаря';el.className='cal-next';return;}
const extra=info.diff>0?' (через '+info.diff+' дн.)':(info.diff===0?' (сегодня!)':' (просрочено на '+(-info.diff)+' дн.)');
el.textContent=label+': '+info.next.toLocaleDateString('ru-RU')+extra;
el.className='cal-next'+(info.diff<0?' late':'');
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
updateCalNext();
}

function openInfo(){openView('infoView');renderInfo();renderCosts();}
function hideInfo(){closeView('infoView');document.getElementById('infoForm').style.display='none';}
function renderInfo(){
const m=String(aquaInfo.size).match(/\d+/g);
let vol='';
if(m&&m.length>=3){vol=' (≈ '+Math.round(m[0]*m[1]*m[2]/1000)+' л)';}
document.getElementById('infoText').innerHTML=
fld(ico('search',CB),'Размер',aquaInfo.size+vol)+
fld(ico('bolt',CO),'Свет',aquaInfo.light)+
fld(ico('wrench',CB),'Фильтр',aquaInfo.filter)+
fld(ico('tank',CB),'Грунт',aquaInfo.grunt);
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
document.getElementById('infoForm').style.display='none';
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
document.getElementById('c_name').value='';
document.getElementById('c_sum').value='';
document.getElementById('c_note').value='';
renderCosts();updateTiles();
}
function removeCost(i){
if(confirm('Удалить покупку «'+costs[i].name+'»?')){
costs.splice(i,1);
localStorage.setItem('aquaCosts',JSON.stringify(costs));
renderCosts();updateTiles();
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
if(entries.length===0){list.innerHTML='<div class="empty"><div class="icon">'+ico('fish',CB,48)+'</div><p>Пока нет записей.<br>Нажми «+» или ↓ «добавить таблицу»!</p></div>';}
else{list.innerHTML='<div class="empty"><div class="icon">'+ico('search',CB,48)+'</div><p>Ничего не нашлось по запросу «'+searchQuery+'»</p></div>';}
return;
}
list.innerHTML=items.map(function(it){
const e=it.e,i=it.i;
return '<div class="entry-card">'+
'<div class="entry-date"><span>'+ico('cal',CB,13)+' '+e.date+'</span><button class="edit-btn" onclick="openEdit('+i+')">'+ico('pencil',CO,20)+'</button></div>'+
fld(ico('wrench',CB),'Действия',e.actions)+
fld(ico('bolt',CO),'Активность',e.activity)+
fld(ico('plate',CO),'Аппетит',e.appetite)+
fld(ico('fish',CB),'Плавники',e.fins)+
fld(ico('pencil',CW),'Заметка',e.text)+
(e.photo?'<div class="entry-photo"><img src="'+e.photo+'" loading="lazy"></div>':'')+
'<div class="card-foot"><button class="del-btn" onclick="deleteEntry('+i+')">'+ico('trash',CW,14)+' удалить запись</button></div>'+
'</div>';
}).join('');
}
