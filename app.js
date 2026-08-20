/* ===== Мой Аквариум — app.js (чистая сборка, часть 1) ===== */
let entries=JSON.parse(localStorage.getItem('aquaEntries')||'[]');
let currentPhoto=null,currentPhotos=[],recognition=null,isRecording=false,currentField=null,currentMic=null,baseText='',finalText='';
let calSets={water:new Set(),hunger:new Set()};
let calDate=new Date(),calMode='water',calOpen=false,searchQuery='',editingIndex=null;
let aquaInfo=JSON.parse(localStorage.getItem('aquaInfo')||'null')||{size:'Длина 41 см, Ширина 18 см, Высота 27 см',light:'Kodak e14, 6500K, 630лм, 7Вт',filter:'Naribo F-200, 3вт, 150 л/с',grunt:'морская галька N2 12-20 мм, обкатанная, Prime'};
let costs=JSON.parse(localStorage.getItem('aquaCosts')||'null')||[{name:'Лампа',sum:300,note:'3 шт'},{name:'Грунт',sum:226,note:''},{name:'Фильтр',sum:360,note:''},{name:'Мох',sum:200,note:'100 + 100'},{name:'Анубиас',sum:300,note:''},{name:'Элодея',sum:200,note:''},{name:'Сифон',sum:200,note:''},{name:'Шприц для флейты',sum:50,note:'3 шт'}];
let settings=JSON.parse(localStorage.getItem('aquaSettings')||'null')||{fs:1,theme:'dark',water:7,hunger:10};
const OR='#ff9432';
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
function ico(n,c,s){s=s||15;return '<svg class="ico" style="color:'+c+';width:'+s+'px;height:'+s+'px" viewBox="0 0 24 24">'+ICONS[n]+'</svg>';}
function injectIcons(){document.querySelectorAll('[data-ico]').forEach(function(el){const c=el.getAttribute('data-c');el.innerHTML=ico(el.getAttribute('data-ico'),c==='currentColor'?'currentColor':OR,el.getAttribute('data-s')||15);});}
function micHTML(){return ico('mic','currentColor',12)+' говорить'}
function plural(n,one,few,many){const m10=n%10,m100=n%100;if(m10===1&&m100!==11)return one;if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;return many;}
function pad(n){return String(n).padStart(2,'0')}
function toISO(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function parseDateRU(s){const m=String(s).match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):null;}
function pd(s){const m=String(s).match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):new Date(0);}
/* ===== Брендинг и настройки ===== */
function applyBranding(){document.title='Мой Аквариум';document.querySelectorAll('.cal-close').forEach(b=>b.remove());const s=document.querySelector('.h-sub');if(s)s.remove();}
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
div.className='field-block';div.id='dateBlock';div.style.display='none';
div.innerHTML='<div class="field-head"><span>'+ico('cal',OR)+'Дата</span></div><input id="f_date" placeholder="ДД.ММ.ГГГГ" maxlength="10">';
h2.insertAdjacentElement('afterend',div);
}
/* ===== Слои и кнопка «назад» ===== */
function pushLayer(){try{history.pushState({aqua:1},'');}catch(e){}}
function topLayer(){
if(document.getElementById('lightbox').classList.contains('open'))return 'lightbox';
if(document.getElementById('modalOverlay').classList.contains('active'))return 'modal';
if(galOpen)return 'gallery';
const order=['settingsView','infoView','calView','diaryView'];
for(let i=0;i<order.length;i++){if(document.getElementById(order[i]).classList.contains('open'))return order[i];}
return null;
}
function dismissLayer(l){
if(l==='lightbox'){closeLightbox();return;}
if(l==='modal'){dismissModal();return;}
if(l==='gallery'){hideGallery();return;}
dismiss(l);
}
window.addEventListener('popstate',function(){const l=topLayer();if(l)dismissLayer(l);});
let swX=0,swY=0;
document.addEventListener('touchstart',function(e){if(e.touches.length===1){swX=e.touches[0].clientX;swY=e.touches[0].clientY;}else{swX=0;swY=0;}},{passive:true});
document.addEventListener('touchend',function(e){
if(!swX)return;
const dx=e.changedTouches[0].clientX-swX,dy=e.changedTouches[0].clientY-swY;
swX=0;
if(dx>70&&Math.abs(dy)<60){
const l=topLayer();
if(l!=='lightbox'&&((wpOv&&wpOpen)||l)){try{history.back();}catch(err){}}
}
},{passive:true});
function openView(id){document.getElementById(id).classList.add('open');pushLayer();var v=document.getElementById(id);if(v)v.scrollTop=0;}
function dismiss(id){document.getElementById(id).classList.remove('open');if(id==='calView')calOpen=false;if(id==='diaryView'){var inp=document.getElementById('searchInput');if(inp)inp.value='';searchQuery='';var c=document.getElementById('searchClear');if(c)c.style.display='none';render();}}
function closeView(id){if(document.getElementById(id).classList.contains('open')){dismiss(id);try{history.back();}catch(e){}}}
function dismissModal(){const el=document.getElementById('modalOverlay');if(el.classList.contains('active')){el.classList.remove('active');if(isRecording)stopVoice();editingIndex=null;currentPhotos=[];const pr=document.getElementById('photoRow');if(pr){pr.innerHTML='';pr.style.display='none';}}}
function closeModal(){if(document.getElementById('modalOverlay').classList.contains('active')){dismissModal();currentPhotos=[];const pr=document.getElementById('photoRow');if(pr){pr.innerHTML='';pr.style.display='none';}try{history.back();}catch(e){}}}
function goHome(){closeView('calView');closeView('diaryView');closeView('infoView');closeView('settingsView');}
function openDiary(){openView('diaryView')}
function hideDiary(){closeView('diaryView')}
function openSettings(){openView('settingsView')}
function hideSettings(){closeView('settingsView')}
/* ===== Данные ===== */
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
/* ===== Счётчик дней и праздники ===== */
function testParam(name){try{const p=new URLSearchParams(location.search).get(name);if(p&&Number(p)>0)return Math.floor(Number(p));}catch(e){}return null;}
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
function addMileLine(){
const row=document.querySelector('.h-row');
if(!row||document.getElementById('headMile'))return;
const div=document.createElement('div');
div.className='h-mile';div.id='headMile';div.style.display='none';
row.insertAdjacentElement('afterend',div);
}
function updateStats(){
let first=null;
const dates=entries.map(e=>parseDateRU(e.date)).filter(d=>d);
if(dates.length)first=new Date(Math.min.apply(null,dates));
const td=testParam('testdays'),tm=testParam('testmonths');
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
if(me){if(mile){me.textContent=mile.txt;me.style.display='block';}else{me.style.display='none';}}
}
/* ===== Плитки главного ===== */
function nextInfo(mode){
const set=mode==='water'?calSets.water:calSets.hunger;
const period=mode==='water'?settings.water:settings.hunger;
if(!set||set.size===0)return null;
let last=null;
set.forEach(s=>{let d;if(String(s).indexOf('-')===4){d=new Date(+String(s).slice(0,4),+String(s).slice(5,7)-1,+String(s).slice(8,10));}else{d=parseDateRU(s);}if(d&&(!last||d>last))last=d;}); 
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
refreshWpTile();
}
let galleryPhotos=[],galleryCurrentIndex=0,galOpen=false,lbFromGallery=false;
function tilePhoto(){openGallery();}
function buildGalleryList(cb){
getAllPhotos().then(function(dbPhotos){
const byId={};dbPhotos.forEach(function(p){byId[p.id]=p;});
const list=[];
entries.forEach(function(e){
if(e.photo)list.push({dataUrl:e.photo,date:e.date});
(e.photos||[]).forEach(function(pid){
const rec=byId[pid];
list.push(rec?{dataUrl:rec.dataUrl,photoId:pid,date:e.date}:{photoId:pid,date:e.date});
});
});
dbPhotos.forEach(function(p){
let used=false;
for(let i=0;i<entries.length;i++){if((entries[i].photos||[]).indexOf(p.id)!==-1){used=true;break;}}
if(!used)list.push({dataUrl:p.dataUrl,photoId:p.id,date:p.date});
});
list.sort(function(a,b){return pd(b.date)-pd(a.date);});
cb(list);
});
}
function openGallery(){buildGalleryList(function(list){galleryPhotos=list;renderGallery();});}
function openLightboxForPhoto(id,src){
buildGalleryList(function(list){
galleryPhotos=list;
let idx=0;
for(let i=0;i<list.length;i++){if((id&&list[i].photoId===id)||(src&&list[i].dataUrl===src)){idx=i;break;}}
openLightboxFromGallery(idx);
});
}
function renderGallery(){
let gv=document.getElementById('galleryView');
if(!gv){
gv=document.createElement('div');gv.id='galleryView';
gv.style.cssText='position:fixed;inset:0;background:#0a1428;z-index:998;overflow-y:auto;padding:16px;box-sizing:border-box;transform:translateX(100%);transition:transform .3s ease';
document.body.appendChild(gv);
}
const byDate={};
galleryPhotos.forEach(function(p,i){
if(!byDate[p.date])byDate[p.date]=[];
byDate[p.date].push({photo:p,index:i});
});
let html='<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><button onclick="closeGallery()" style="background:none;border:none;color:#4dd9ff;font-size:20px;cursor:pointer">←</button><h2 style="margin:0;color:#eaf6ff;font-size:18px">Фотоальбом</h2></div>';
const dates=Object.keys(byDate).sort(function(a,b){return pd(b)-pd(a);});
if(!dates.length)html+='<div style="color:rgba(255,255,255,.5);font-size:13px">Пока нет фото. Добавь первое через «+»!</div>';
dates.forEach(function(date){
html+='<div style="margin-bottom:16px"><div style="color:#4dd9ff;font-size:13px;margin-bottom:8px">'+date+'</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
byDate[date].forEach(function(item){
const src=item.photo.dataUrl||'';
html+='<div onclick="openLightboxFromGallery('+item.index+')" style="aspect-ratio:1;background:rgba(255,255,255,.08);border-radius:8px;overflow:hidden;cursor:pointer">'+(src?'<img src="'+src+'" style="width:100%;height:100%;object-fit:cover">':'')+'</div>';
});
html+='</div></div>';
});
gv.innerHTML=html;
gv.style.transform='translateX(0)';galOpen=true;
pushLayer();
}
function hideGallery(){const gv=document.getElementById('galleryView');if(gv)gv.style.transform='translateX(100%)';galOpen=false;}
function closeGallery(){hideGallery();try{history.back();}catch(e){}}
function openLightboxFromGallery(index){
galleryCurrentIndex=index;lbFromGallery=true;
const p=galleryPhotos[index];
if(p.dataUrl){window.openLightbox(p.dataUrl);}
else if(p.photoId){getPhoto(p.photoId).then(function(rec){if(rec&&rec.dataUrl)window.openLightbox(rec.dataUrl);});}
updateLightboxArrows();
}
function delCurrentPhoto(){
const p=galleryPhotos[galleryCurrentIndex];
if(!p)return;
if(!confirm('Удалить это фото?'))return;
if(p.photoId){
const id=p.photoId;
delPhoto(id);
entries.forEach(function(e){if(e.photos){const ix=e.photos.indexOf(id);if(ix!==-1)e.photos.splice(ix,1);}});
}else{
entries.forEach(function(e){if(e.photo&&e.photo===p.dataUrl)e.photo=null;});
}
persist();
galleryPhotos.splice(galleryCurrentIndex,1);
buildSets();render();updateStats();updateTiles();
renderGallery();
if(!galleryPhotos.length){window.closeLightbox();return;}
if(galleryCurrentIndex>=galleryPhotos.length)galleryCurrentIndex=galleryPhotos.length-1;
openLightboxFromGallery(galleryCurrentIndex);
}
function prevPhoto(){if(galleryCurrentIndex>0)openLightboxFromGallery(galleryCurrentIndex-1);}
function nextPhoto(){if(galleryCurrentIndex<galleryPhotos.length-1)openLightboxFromGallery(galleryCurrentIndex+1);}
function updateLightboxArrows(){
const lb=document.getElementById('lightbox');
if(!lb)return;
let prevBtn=document.getElementById('lbPrev');
let nextBtn=document.getElementById('lbNext');
if(!prevBtn){
prevBtn=document.createElement('button');prevBtn.id='lbPrev';
prevBtn.style.cssText='position:fixed;left:12px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:20px;z-index:401;cursor:pointer';
prevBtn.textContent='‹';
prevBtn.onclick=prevPhoto;
lb.appendChild(prevBtn);
}
if(!nextBtn){
nextBtn=document.createElement('button');nextBtn.id='lbNext';
nextBtn.style.cssText='position:fixed;right:12px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:20px;z-index:401;cursor:pointer';
nextBtn.textContent='›';
nextBtn.onclick=nextPhoto;
lb.appendChild(nextBtn);
}
let delBtn=document.getElementById('lbDel');
if(!delBtn){
delBtn=document.createElement('button');delBtn.id='lbDel';
delBtn.style.cssText='position:fixed;top:12px;right:64px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:16px;z-index:1201;cursor:pointer';
delBtn.textContent='🗑';
delBtn.onclick=delCurrentPhoto;
lb.appendChild(delBtn);
}
prevBtn.style.display=(lbFromGallery&&galleryCurrentIndex>0)?'block':'none';
nextBtn.style.display=(lbFromGallery&&galleryCurrentIndex<galleryPhotos.length-1)?'block':'none';
delBtn.style.display=lbFromGallery?'block':'none';
}
/* ===== Мой Аквариум — app.js (чистая сборка, часть 2) ===== */
/* ===== Календарь ===== */
function showCal(){calOpen=true;openView('calView');renderCal();}
function hideCal(){closeView('calView');}
function openCal(mode){calMode=mode;document.querySelectorAll('.cal-tab').forEach(b=>b.classList.toggle('active',b.getAttribute('data-mode')===mode));showCal();}
function setCalMode(m,btn){calMode=m;document.querySelectorAll('.cal-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderCal();}
function calPrev(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCal();}
function calNext1(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCal();}
function updateCalCounter(){
const box=document.getElementById('calCounter');
const cap=document.getElementById('ccCap');
const numEl=document.getElementById('ccNum');
const wordEl=document.getElementById('ccWord');
const thrEl=document.getElementById('ccThrough');
const dateEl=document.getElementById('ccDate');
cap.textContent=calMode==='water'?'следующая подмена воды':'следующий разгрузочный день';
box.classList.toggle('hunger',calMode==='hunger');
const info=nextInfo(calMode);
const period=calMode==='water'?settings.water:settings.hunger;
const b=document.getElementById('ccBar');
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
let elapsed=period-info.diff;
if(elapsed<0)elapsed=0;if(elapsed>period)elapsed=period;
const segs=Math.min(period,15);
const filled=Math.round(elapsed/period*segs);
for(let i=0;i<segs;i++){const s=document.createElement('div');s.className='cc-seg'+(i<filled?' on':'');b.appendChild(s);}
}
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
/* ===== Аквариум и затраты ===== */
function openInfo(){openView('infoView');renderInfo();renderCosts();}
function hideInfo(){closeView('infoView');closeInfoEdit();closeCostForm();}
function closeInfoEdit(){document.getElementById('infoForm').style.display='none';}
function closeCostForm(){document.getElementById('costForm').style.display='none';['c_name','c_sum','c_note'].forEach(id=>{document.getElementById(id).value=''});}
function renderInfo(){
const m=String(aquaInfo.size).match(/\d+/g);
let vol='';
if(m&&m.length>=3){vol=' (≈ '+Math.round(m[0]*m[1]*m[2]/1000)+' л)';}
document.getElementById('infoText').innerHTML=
fld(ico('search',OR),'Размер',aquaInfo.size+vol)+
fld(ico('bolt',OR),'Свет',aquaInfo.light)+
fld(ico('wrench',OR),'Фильтр',aquaInfo.filter)+
fld(ico('tank',OR),'Грунт',aquaInfo.grunt)+
(aquaInfo.extra||[]).map(function(x){return fld(ico('wrench',OR),x.n,x.v);}).join('');
}
function toggleInfoEdit(){
const f=document.getElementById('infoForm');
if(f.style.display==='none'){
document.getElementById('i_size').value=aquaInfo.size;
document.getElementById('i_light').value=aquaInfo.light;
document.getElementById('i_filter').value=aquaInfo.filter;
document.getElementById('i_grunt').value=aquaInfo.grunt;
let ex=document.getElementById('i_extra');
if(!ex){
ex=document.createElement('div');ex.id='i_extra';
const addB=document.createElement('button');
addB.type='button';addB.textContent='+ добавить параметр';
addB.style.cssText='display:block;width:100%;margin:0 0 10px;padding:10px;border-radius:12px;border:1px dashed #4dd9ff;background:none;color:#4dd9ff;cursor:pointer';
addB.onclick=function(){ex.appendChild(extraRow('',''));};
const btns=f.querySelectorAll('button');let saveBtn=null;
for(let i=0;i<btns.length;i++){if(btns[i].textContent.indexOf('Сохранить')!==-1){saveBtn=btns[i];break;}}
f.insertBefore(ex,saveBtn);f.insertBefore(addB,saveBtn);
}
ex.innerHTML='';
(aquaInfo.extra||[]).forEach(function(x){ex.appendChild(extraRow(x.n,x.v));});
f.style.display='block';
}else{f.style.display='none';}
}
function saveInfo(){
const ex=document.getElementById('i_extra');
const extra=[];
if(ex)for(let i=0;i<ex.children.length;i++){
const nm=ex.children[i].querySelector('input');
const ta=ex.children[i].querySelector('textarea');
const n=nm?nm.value.trim():'';const v=ta?ta.value.trim():'';
if(n||v)extra.push({n:n,v:v});
}
aquaInfo={size:document.getElementById('i_size').value.trim(),light:document.getElementById('i_light').value.trim(),filter:document.getElementById('i_filter').value.trim(),grunt:document.getElementById('i_grunt').value.trim(),extra:extra};
localStorage.setItem('aquaInfo',JSON.stringify(aquaInfo));
closeInfoEdit();renderInfo();
}
function extraRow(n,v){
const w=document.createElement('div');
const nm=document.createElement('input');
nm.value=n||'';nm.placeholder='Название';
nm.style.cssText='display:block;width:100%;box-sizing:border-box;background:none;border:none;color:#4dd9ff;font-size:14px;padding:0;margin:0 0 6px';
const t=document.getElementById('i_size').cloneNode();
t.id='';t.value=v||'';t.placeholder='Значение';
const del=document.createElement('button');
del.type='button';del.textContent='✕ удалить';
del.style.cssText='margin:6px 0 10px;background:none;border:none;color:#ff8a80;cursor:pointer;font-size:12px';
del.onclick=function(){w.remove();};
w.appendChild(nm);w.appendChild(t);w.appendChild(del);
return w;
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
closeCostForm();renderCosts();
}
function removeCost(i){
if(confirm('Удалить покупку «'+costs[i].name+'»?')){costs.splice(i,1);localStorage.setItem('aquaCosts',JSON.stringify(costs));renderCosts();}
}
/* ===== Дневник и поиск ===== */
function fld(icon,label,v){
if(!v)return'';
return '<div class="fld"><div class="fld-l">'+icon+label+'</div><div class="fld-v">'+v+'</div></div>';
}
function fillEntryPhotos(){
document.querySelectorAll('[data-photos]').forEach(function(box){
box.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin:8px 0';
const ids=box.getAttribute('data-photos').split(',');
ids.forEach(function(id){
getPhoto(id).then(function(rec){
if(rec&&rec.dataUrl){
const im=document.createElement('img');
im.src=rec.dataUrl;
im.style.cssText='width:100px;height:100px;object-fit:cover;border-radius:10px;display:block;cursor:pointer';
im.onclick=function(){openLightboxForPhoto(id,null);};
box.appendChild(im);
}
});
});
});
}
function onSearch(v){searchQuery=v;const c=document.getElementById('searchClear');if(c)c.style.display=v.trim()?'block':'none';render();}
function render(){
const list=document.getElementById('entriesList');
const q=searchQuery.trim().toLowerCase();
let items=entries.map((e,i)=>({e:e,i:i}));
if(q){items=items.filter(function(it){return ((it.e.actions||'')+' '+(it.e.activity||'')+' '+(it.e.appetite||'')+' '+(it.e.fins||'')+' '+(it.e.text||'')+' '+(it.e.date||'')).toLowerCase().includes(q)});}
if(items.length===0){
if(entries.length===0){list.innerHTML='<div class="empty"><div class="icon">'+ico('fish',OR,48)+'</div><p>Пока нет записей.<br>Нажми «+»!</p></div>';}
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
((e.photos&&e.photos.length)?'<div class="entry-photo" data-photos="'+e.photos.join(',')+'"></div>':'')+
'<div class="card-foot"><button class="del-btn" onclick="deleteEntry('+i+')">'+ico('trash',OR,14)+' удалить запись</button></div>'+
'</div>';
}).join('');
fillEntryPhotos();
renderWaterTests();
markActive();
}
/* ===== Фотохранилище (IndexedDB) ===== */
let photoDB=null;
function openPhotoDB(){
return new Promise(function(res,rej){
if(photoDB){res(photoDB);return;}
const rq=indexedDB.open('aquaPhotos',1);
rq.onupgradeneeded=function(){const db=rq.result;if(!db.objectStoreNames.contains('photos')){db.createObjectStore('photos',{keyPath:'id'});}};
rq.onsuccess=function(){photoDB=rq.result;res(photoDB);};
rq.onerror=function(){rej(rq.error);};
});
}
function putPhoto(rec){
return openPhotoDB().then(function(db){return new Promise(function(res,rej){
const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(rec);
tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};
});});
}
function getPhoto(id){
return openPhotoDB().then(function(db){return new Promise(function(res,rej){
const rq=db.transaction('photos').objectStore('photos').get(id);
rq.onsuccess=function(){res(rq.result||null);};rq.onerror=function(){rej(rq.error);};
});});
}
function getAllPhotos(){
return openPhotoDB().then(function(db){return new Promise(function(res,rej){
const rq=db.transaction('photos').objectStore('photos').getAll();
rq.onsuccess=function(){res(rq.result||[]);};rq.onerror=function(){rej(rq.error);};
});});
}
function delPhoto(id){
return openPhotoDB().then(function(db){return new Promise(function(res,rej){
const tx=db.transaction('photos','readwrite');tx.objectStore('photos').delete(id);
tx.oncomplete=function(){res();};tx.onerror=function(){rej(tx.error);};
});});
}
function newPhotoId(){return 'p'+Date.now()+'_'+Math.floor(Math.random()*100000);}

/* ===== Форма записи ===== */
function openModal(){
editingIndex=null;
document.getElementById('modalTitle').innerHTML=ico('pencil',OR,18)+' Новая запись';
document.getElementById('modalOverlay').classList.add('active');
pushLayer();
document.getElementById('dateBlock').style.display='none';
['actions','activity','appetite','fins'].forEach(k=>{document.getElementById('f_'+k).value=''});
clearTestInputs();
const tv=document.getElementById('tempInput');if(tv)tv.value='';
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
fillTestInputs(i);
const tv=document.getElementById('tempInput');if(tv)tv.value='';
currentPhoto=e.photo||null;
const preview=document.getElementById('photoPreview');
if(currentPhoto){preview.src=currentPhoto;preview.style.display='block';}else{preview.style.display='none';}
}
function closeModalOutside(e){if(e.target===e.currentTarget)closeModal();}
function startFieldVoice(field,btn){
if(isRecording&&currentField===field){stopVoice();return;}
if(isRecording)stopVoice();
if(!('webkitSpeechRecognition'in window)&&!('SpeechRecognition'in window)){alert('Голосовой ввод работает в Chrome. Открой приложение в Chrome.');return;}
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
recognition.onstart=function(){isRecording=true;btn.classList.add('recording');btn.textContent='стоп';};
recognition.onresult=function(e){
for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+' ';}
ta.value=(baseText+finalText).trim();
};
recognition.onerror=function(e){if(e.error==='not-allowed'){stopVoice();alert('Разреши доступ к микрофону в настройках браузера.');}};
recognition.onend=function(){if(isRecording){try{recognition.start();}catch(err){stopVoice();}}};
try{recognition.start();}catch(err){alert('Не удалось включить микрофон');}
}
function stopVoice(){
isRecording=false;
if(recognition){recognition.onend=null;recognition.stop();recognition=null;}
if(currentMic){currentMic.classList.remove('recording');currentMic.innerHTML=micHTML();}
currentField=null;currentMic=null;
}
function handlePhoto(inp){
const files=Array.prototype.slice.call(inp.files);
if(!files.length)return;
let left=files.length;
files.forEach(function(file){
const reader=new FileReader();
reader.onload=function(e){
const img=new Image();
img.onload=function(){
const canvas=document.createElement('canvas');
const maxW=800;
let w=img.width,h=img.height;
if(w>maxW){h=h*(maxW/w);w=maxW;}
canvas.width=w;canvas.height=h;
canvas.getContext('2d').drawImage(img,0,0,w,h);
currentPhotos.push(canvas.toDataURL('image/jpeg',0.7));
left--;
if(left===0)renderPhotoPreview();
};
img.src=e.target.result;
};
reader.readAsDataURL(file);
});
inp.value='';
}
function photoRow(){
let r=document.getElementById('photoRow');
if(!r){
r=document.createElement('div');r.id='photoRow';
r.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0';
const p=document.getElementById('photoPreview');
p.parentNode.insertBefore(r,p.nextSibling);
}
return r;
}
function renderPhotoPreview(){
const img=document.getElementById('photoPreview');
img.style.display='none';
const r=photoRow();
r.innerHTML='';
currentPhotos.forEach(function(d,i){
const w=document.createElement('div');
w.style.cssText='position:relative';
const im=document.createElement('img');
im.src=d;im.style.cssText='width:64px;height:64px;object-fit:cover;border-radius:10px;display:block';
const x=document.createElement('button');
x.type='button';x.textContent='✕';
x.style.cssText='position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(10,20,40,.8);color:#ff8a80;font-size:11px;cursor:pointer';
x.onclick=function(){currentPhotos.splice(i,1);renderPhotoPreview();};
w.appendChild(im);w.appendChild(x);
r.appendChild(w);
});
r.style.display=currentPhotos.length?'flex':'none';
}
document.querySelectorAll('input[type="file"]').forEach(function(i){if((i.accept||'').indexOf('image')!==-1){i.multiple=true;}});
function saveEntry(){
const a=document.getElementById('f_actions').value.trim();
const ac=document.getElementById('f_activity').value.trim();
const ap=document.getElementById('f_appetite').value.trim();
const f=document.getElementById('f_fins').value.trim();
if(!a&&!ac&&!ap&&!f&&!currentPhoto&&!currentPhotos.length){alert('Заполни или наговори хотя бы одну графу');return;}
const t=readTestInputs();
const hasTests=Object.keys(t).length>0;
const tv=document.getElementById('tempInput');
const tempV=tv?tv.value.trim().replace(',','.'):'';
const tempN=parseFloat(tempV);
const shots=currentPhotos.slice();
const finish=function(ids){
if(editingIndex!==null){
const e=entries[editingIndex];
const dv=document.getElementById('f_date').value.trim();
if(dv){
if(!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dv)){alert('Дата должна быть в формате ДД.ММ.ГГГГ');return;}
e.date=dv;
}
e.actions=a;e.activity=ac;e.appetite=ap;e.fins=f;e.synced=false;
if(ids.length)e.photos=(e.photos||[]).concat(ids);
if(hasTests)e.tests=t;
persist();closeModal();buildSets();render();updateStats();updateTiles();
}else{
const date=new Date().toLocaleDateString('ru-RU');
const en={date:date,actions:a,activity:ac,appetite:ap,fins:f,photo:shots[0]||null,src:'app',synced:false};
if(ids.length)en.photos=ids;
if(hasTests)en.tests=t;
entries.unshift(en);
if(!persist()){entries.shift();return;}
closeModal();
buildSets();render();updateStats();updateTiles();
}
if(tempV&&tempN>=15&&tempN<=40){
const n=new Date();
putTPad(n.getDate()+'-'+(n.getMonth()+1)+'-'+n.getFullYear(),tempN);
refreshWpTile();
}
};
if(shots.length){
const ids=shots.map(function(){return newPhotoId();});
Promise.all(shots.map(function(d,i){return putPhoto({id:ids[i],date:new Date().toLocaleDateString('ru-RU'),ts:Date.now(),dataUrl:d});}))
.then(function(){finish(ids);})
.catch(function(){finish([]);});
}else{finish([]);}
}
function deleteEntry(i){
if(confirm('Удалить эту запись?')){entries.splice(i,1);persist();buildSets();render();updateStats();updateTiles();}
}
/* ===== Резервные копии ===== */
function backupSave(){
const data={entries:entries,costs:costs,aquaInfo:aquaInfo,settings:settings};
const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
const a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download='aqua-backup-'+new Date().toISOString().slice(0,10)+'.json';
a.click();
setTimeout(function(){URL.revokeObjectURL(a.href);},5000);
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
function initLightbox(){
const st=document.createElement('style');
st.textContent='#lightbox{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:1200;display:none;align-items:center;justify-content:center}'+
'#lightbox.open{display:flex}'+
'#lbImg{max-width:100%;max-height:100vh;touch-action:none;user-select:none;-webkit-user-select:none}'+
'#lbClose{position:fixed;top:12px;right:12px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:18px;z-index:1201;cursor:pointer}'+
'#lbHint{position:fixed;bottom:14px;left:0;right:0;text-align:center;color:rgba(255,255,255,.5);font-size:11px;z-index:1201}';
document.head.appendChild(st);
const lb=document.createElement('div');
lb.id='lightbox';
lb.innerHTML='<button id="lbClose">✕</button><img id="lbImg" alt=""><div id="lbHint">щипок или двойной тап — зум · палец — двигать · «назад» или тап по фону — закрыть</div>';
document.body.appendChild(lb);
const img=lb.querySelector('#lbImg');
let scale=1,x=0,y=0;
const pointers=new Map();
let lastDist=0,pinchStartScale=1,panStartX=0,panStartY=0,panBaseX=0,panBaseY=0,panning=false,lastTap=0;
function apply(){img.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';}
function reset(){scale=1;x=0;y=0;apply();}
function close(){lb.classList.remove('open');img.src='';}
function closeLB(){if(lb.classList.contains('open')){close();try{history.back();}catch(e){}}}
window.openLightbox=function(src){img.src=src;reset();lb.classList.add('open');pushLayer();};
window.closeLightbox=close;
lb.addEventListener('click',function(e){if(e.target===lb)closeLB();});
lb.querySelector('#lbClose').addEventListener('click',closeLB);
document.addEventListener('click',function(e){
const t=e.target.closest?e.target.closest('.entry-photo img'):null;
if(t){openLightboxForPhoto(null,t.getAttribute('src'));}
});
function dist(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
img.addEventListener('pointerdown',function(e){
img.setPointerCapture(e.pointerId);
pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(pointers.size===1){
const now=Date.now();
if(now-lastTap<300){
if(scale>1){reset();}else{scale=2.5;apply();}
lastTap=0;panning=false;
return;
}
lastTap=now;
panning=true;panStartX=e.clientX;panStartY=e.clientY;panBaseX=x;panBaseY=y;
}else if(pointers.size===2){
panning=false;
const ps=[];pointers.forEach(p=>ps.push(p));
lastDist=dist(ps[0],ps[1]);
pinchStartScale=scale;
}
});
img.addEventListener('pointermove',function(e){
if(!pointers.has(e.pointerId))return;
pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
if(pointers.size===2){
const ps=[];pointers.forEach(p=>ps.push(p));
const d=dist(ps[0],ps[1]);
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
let gswX=0,gswY=0;
img.addEventListener('touchstart',function(e){if(e.touches.length===1){gswX=e.touches[0].clientX;gswY=e.touches[0].clientY;}else{gswX=0;gswY=0;}},{passive:true});
img.addEventListener('touchend',function(e){
if(!gswX||!lbFromGallery)return;
const dx=e.changedTouches[0].clientX-gswX,dy=e.changedTouches[0].clientY-gswY;
gswX=0;
if(Math.abs(dx)>70&&Math.abs(dy)<60){if(dx>0)prevPhoto();else nextPhoto();}
},{passive:true});
}
/* ===== Тесты воды ===== */
const PARAMS=[
{k:'ph',n:'pH',min:6,max:8},
{k:'gh',n:'Жёсткость',unit:1,deg:'°dH',min:50,max:150},
{k:'kh',n:'Карбонат',unit:1,deg:'°dKH',min:40,max:150},
{k:'cl',n:'Хлор',unit:1,min:0,max:0},
{k:'no3',n:'Нитрат',unit:1,min:0,max:25,warn:50},
{k:'no2',n:'Нитрит',unit:1,min:0,max:0,warn:0.3}
];
const COL={ok:'#3ddc84',warn:'#ffb74d',lo:'#ffb74d',hi:'#ff6b6b'};
const TXT={ok:'норма',warn:'внимание',lo:'низко',hi:'высоко'};
let curChart='no3';
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
const t=String(text||'');const res={};let m;
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
const seg=t.match(/карбонат[а-я]*[^\n]{0,60}/i);
if(seg){const dm=seg[0].match(/с\s*(\d+(?:[.,]\d+)?)\s+до\s+(\d+(?:[.,]\d+)?)/);if(dm&&ok('kh',num(dm[2])))res.kh=num(dm[2]);}
const re=/ж[её]сткость/gi;let mm2;
while((mm2=re.exec(t))){
const before=t.slice(Math.max(0,mm2.index-20),mm2.index);
const after=t.slice(mm2.index,mm2.index+60);
const dm2=after.match(/с\s*(\d+(?:[.,]\d+)?)\s+до\s+(\d+(?:[.,]\d+)?)/);
const vm=after.match(/(\d+(?:[.,]\d+)?)/);
const val=dm2?num(dm2[2]):(vm?num(vm[1]):null);
if(val===null)continue;
if(/карбонат/i.test(before)){if(ok('kh',val))res.kh=val;}
else{if(ok('gh',val))res.gh=val;}
}
return res;
}
function collectSeries(){
const series={ph:[],gh:[],kh:[],cl:[],no3:[],no2:[]};
for(let i=entries.length-1;i>=0;i--){
const e=entries[i];
const t=parseTests((e.actions||'')+' '+(e.text||''));
for(const k in series){
const v=(e.tests&&e.tests[k]!==undefined)?e.tests[k]:t[k];
if(v!==undefined)series[k].push({d:e.date,v:v});
}
}
return series;
}
function renderWtChart(series){
const box=document.getElementById('wtChart');
const arr=series[curChart]||[];
if(arr.length<2){box.innerHTML='<div class="wt-empty">Для графика нужно хотя бы два теста этого параметра.</div>';return;}
const W=340,H=150,PL=34,PR=10,PT=14,PB=26;
const vs=arr.map(a=>a.v);
let min=Math.min.apply(null,vs),max=Math.max.apply(null,vs);
if(min===max){min-=1;max+=1;}
const padv=(max-min)*0.15;min-=padv;max+=padv;
const n=arr.length;
function x(i){return PL+i*(W-PL-PR)/(n-1);}
function y(v){return PT+(H-PT-PB)*(1-(v-min)/(max-min));}
const pts=arr.map((a,i)=>x(i)+','+y(a.v)).join(' ');
let svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">';
for(let g=0;g<=2;g++){
const gv=min+(max-min)*g/2,gy=y(gv);
svg+='<line class="wt-gl" x1="'+PL+'" y1="'+gy+'" x2="'+(W-PR)+'" y2="'+gy+'"/>';
svg+='<text class="wt-lb" x="'+(PL-4)+'" y="'+(gy+3)+'" text-anchor="end">'+(Math.round(gv*10)/10)+'</text>';
}
svg+='<polyline class="wt-ln" points="'+pts+'"/>';
arr.forEach(function(a,i){
svg+='<circle class="wt-dt" cx="'+x(i)+'" cy="'+y(a.v)+'" r="3"/>';
svg+='<text class="wt-vl" x="'+x(i)+'" y="'+(y(a.v)-6)+'" text-anchor="middle">'+a.v+'</text>';
});
arr.forEach(function(a,i){
const yy=(i%2===0)?(H-6):(H-15);
svg+='<text class="wt-lb" x="'+x(i)+'" y="'+yy+'" text-anchor="middle">'+a.d.slice(0,5)+'</text>';
});
svg+='</svg>';
box.innerHTML=svg;
}
function renderWaterTests(){
const grid=document.getElementById('wtGrid');
if(!grid)return;
const series=collectSeries();
let html='';
PARAMS.forEach(function(p){
const arr=series[p.k];
if(!arr.length){html+='<div class="wtc"><div class="wtc-n">'+p.n+'</div><div class="wtc-v" style="color:rgba(255,255,255,.3)">—</div><div class="wtc-u">'+(p.unit?'мг/л':'')+'</div><div class="wtc-d">нет данных</div></div>';return;}
const last=arr[arr.length-1];
const prev=arr.length>1?arr[arr.length-2]:null;
const s=statusOf(p,last.v);
const arrow=prev?(last.v>prev.v?' ↑':(last.v<prev.v?' ↓':'')):'';
let extra='';
if(p.deg)extra=' ≈ '+(last.v/17.86).toFixed(1)+p.deg;
html+='<div class="wtc"><div class="wtc-n">'+p.n+'</div>'+
'<div class="wtc-v" style="color:'+COL[s]+'">'+last.v+'</div>'+
'<div class="wtc-u">'+(p.unit?'мг/л'+extra:'')+'</div>'+
'<span class="wtc-badge" style="color:'+COL[s]+';background:'+COL[s]+'22">'+TXT[s]+arrow+'</span>'+
'<div class="wtc-d">'+last.d.slice(0,5)+'</div></div>';
});
grid.innerHTML=html;
document.getElementById('wtChips').innerHTML=PARAMS.map(function(p){
return '<button class="wt-chip'+(p.k===curChart?' active':'')+'" onclick="setWtChart(\''+p.k+'\')">'+p.n+'</button>';
}).join('');
renderWtChart(series);
}
function setWtChart(k){curChart=k;const tc=document.getElementById('wpTempCard');if(tc)tc.classList.remove('active');renderWaterTests();markActive();} 
function markActive(){
const grid=document.getElementById('wtGrid');
if(!grid)return;
const KEYS=['ph','gh','kh','cl','no3','no2'];
const NAMES={ph:'pH',gh:'Жёсткость',kh:'Карбонат',cl:'Хлор',no3:'Нитрат',no2:'Нитрит'};
for(let i=0;i<grid.children.length;i++){grid.children[i].classList.toggle('active',KEYS[i]===curChart);}
const ch=document.getElementById('wtChart');
if(ch&&ch.closest){
const card=ch.closest('.wt-card');
if(card){const t=card.querySelector('.wt-title');if(t)t.textContent='График тестов: '+NAMES[curChart];}
}
}
function readTestInputs(){
const t={},ids={ph:'t_ph',kh:'t_kh',gh:'t_gh',cl:'t_cl',no3:'t_no3',no2:'t_no2'};
for(const k in ids){
const v=document.getElementById(ids[k]).value.trim();
if(v!=='')t[k]=num(v);
}
return t;
}
function clearTestInputs(){['t_ph','t_kh','t_gh','t_cl','t_no3','t_no2'].forEach(id=>{document.getElementById(id).value=''});}
function fillTestInputs(i){
clearTestInputs();
const t=entries[i].tests||{},ids={ph:'t_ph',kh:'t_kh',gh:'t_gh',cl:'t_cl',no3:'t_no3',no2:'t_no2'};
for(const k in ids){if(t[k]!==undefined)document.getElementById(ids[k]).value=t[k];}
}
function initWaterTestsUI(){
const st=document.createElement('style');
st.textContent='body *{font-weight:400!important}'+
'.search-row{position:relative}'+
'.search-row input{padding-right:36px}'+
'#searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.5);font-size:15px;padding:6px;cursor:pointer;display:none}'+
'.wt-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'+
'.wt-grid input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:8px;color:#e0f0ff;font-size:13px}'+
'.wt-card{margin:12px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px}'+
'.wt-title{font-size:15px;color:#fff;margin-bottom:10px}'+
'.wt-gridcards{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
'.wtc{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;text-align:center;cursor:pointer}'+
'.wtc.active{border-color:#4dd9ff;box-shadow:0 0 10px rgba(77,217,255,.25)}'+
'#wpTempCard.active{background:linear-gradient(160deg,rgba(255,255,255,.50),rgba(255,255,255,.28) 50%,rgba(120,220,255,.22))!important;}'+
'.wtc-n{font-size:12px;color:rgba(255,255,255,.6)}'+
'.wtc-v{font-size:24px;margin:2px 0}'+
'.wtc-u{font-size:11px;color:rgba(255,255,255,.45)}'+
'.wtc-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;margin-top:4px}'+
'.wtc-d{font-size:11px;color:rgba(255,255,255,.4);margin-top:4px}'+
'.wt-chips{display:none}'+
'.wt-empty{font-size:13px;color:rgba(255,255,255,.4)}'+
'.wt-gl{stroke:rgba(255,255,255,.12)}.wt-lb{fill:rgba(255,255,255,.45);font-size:8px}.wt-ln{stroke:#4dd9ff;stroke-width:2;fill:none}.wt-dt{fill:#4dd9ff}.wt-vl{fill:#e0f0ff;font-size:8px}'+
'.cal-card{padding:8px 6px 12px}.cal-card .cal-counter{padding:4px 10px 0}.cal-card .cal-nav{padding:6px 8px 10px}.cal-card .cal-grid{padding:0 8px}'+
'.cc-bar{display:flex;gap:3px;height:8px;margin:12px 10px 6px;background:none;overflow:visible}'+
'.cc-fill{display:none}'+
'.cc-seg{flex:1;border-radius:4px;background:rgba(255,255,255,.12)}'+
'.cc-seg.on{background:linear-gradient(90deg,#0077aa,#4dd9ff);box-shadow:0 0 6px rgba(77,217,255,.4)}'+
'#calCounter.hunger .cc-seg.on{background:linear-gradient(90deg,#cc7000,#ffb74d);box-shadow:0 0 6px rgba(255,183,77,.4)}'+
'#calCounter.late .cc-seg.on{background:#ff6b6b;box-shadow:0 0 6px rgba(255,107,107,.4)}'+
'body.light .wt-card{background:#fff;border-color:#dce7f0}body.light .wt-title{color:#16324a}body.light .wtc{background:#fff;border-color:#dce7f0}body.light .wtc-n{color:#6a8098}body.light .wtc-u{color:#93a7b8}body.light .wtc-d{color:#93a7b8}body.light .wtc.active{border-color:#0077aa}body.light .wt-grid input{background:#fff;border-color:#cfdcea;color:#16324a}body.light .wt-lb{fill:#93a7b8}body.light .wt-vl{fill:#16324a}body.light .wt-ln{stroke:#0077aa}body.light .wt-dt{fill:#0077aa}body.light .wt-gl{stroke:rgba(22,50,74,.15)}body.light #searchClear{color:#93a7b8}body.light .cc-bar{background:none}body.light .cc-seg{background:rgba(22,50,74,.12)}body.light .cc-seg.on{background:#0077aa;box-shadow:none}';
document.head.appendChild(st);
const modal=document.querySelector('#modalOverlay .modal');
if(modal&&!document.getElementById('t_ph')){
const photoBtn=modal.querySelector('.photo-btn');
if(photoBtn){
const tb=document.createElement('div');
tb.className='field-block';
tb.innerHTML='<div class="field-head"><span>'+ico('drop',OR)+'Тесты воды (необязательно)</span></div><div class="wt-grid"><input id="t_ph" placeholder="pH" inputmode="decimal"><input id="t_kh" placeholder="Карбонат (KH)" inputmode="numeric"><input id="t_gh" placeholder="Жёсткость (GH)" inputmode="numeric"><input id="t_cl" placeholder="Хлор" inputmode="decimal"><input id="t_no3" placeholder="Нитрат" inputmode="numeric"><input id="t_no2" placeholder="Нитрит" inputmode="numeric"><input id="tempInput" placeholder="Температура, °C" inputmode="decimal" style="grid-column:1/-1"></div>';
photoBtn.insertAdjacentElement('beforebegin',tb);
}
}
const cv=document.getElementById('calView');
if(cv&&!document.getElementById('wtGrid')){
const wrap=document.createElement('div');
wrap.innerHTML='<div class="wt-card"><div class="wt-title">Последние тесты воды</div><div class="wt-gridcards" id="wtGrid"></div></div><div class="wt-card"><div class="wt-title">График тестов</div><div class="wt-chips" id="wtChips"></div><div id="wtChart"></div></div>';
cv.appendChild(wrap);
}
const sr=document.querySelector('.search-row');
if(sr&&!document.getElementById('searchClear')){
const cb=document.createElement('button');
cb.id='searchClear';cb.textContent='✕';
cb.onclick=function(){const inp=document.getElementById('searchInput');inp.value='';onSearch('');cb.style.display='none';};
sr.appendChild(cb);
}
document.addEventListener('click',function(e){
const c=e.target&&e.target.closest?e.target.closest('.wtc'):null;
if(c&&c.parentNode&&c.parentNode.id==='wtGrid'){
const KEYS=['ph','gh','kh','cl','no3','no2'];
const idx=Array.prototype.indexOf.call(c.parentNode.children,c);
if(idx>=0&&KEYS[idx])setWtChart(KEYS[idx]);
}
});
}

/* ===== Календарь в карточке ===== */
function initCalCard(){
const cc=document.getElementById('calCounter');
if(cc&&cc.parentNode.className.indexOf('wt-card')===-1){
const card=document.createElement('div');
card.className='wt-card cal-card';
cc.parentNode.insertBefore(card,cc);
card.appendChild(cc);
card.appendChild(document.querySelector('.cal-nav'));
card.appendChild(document.getElementById('calGrid'));
}
const bar=document.querySelector('.cc-bar');
if(bar&&!bar.id)bar.id='ccBar';
if(calOpen)updateCalCounter();
}
/* ===== Настройки: без таблицы + напоминание о копии ===== */
function initSettingsClean(){
function findBtn(t){
const bs=document.querySelectorAll('button');
for(let i=0;i<bs.length;i++){if(bs[i].textContent.trim()===t)return bs[i];}
return null;
}
function ancestorWith(el,txts){
let p=el;
while(p&&p!==document.body){
let ok=true;
for(let i=0;i<txts.length;i++){if(p.textContent.indexOf(txts[i])===-1){ok=false;break;}}
if(ok)return p;
p=p.parentElement;
}
return null;
}
const st=document.createElement('style');
st.textContent='#bkInfo{font-size:12px;margin-top:10px;text-align:center}';
document.head.appendChild(st);
const b1=findBtn('Отправить в таблицу');
if(b1){const card=ancestorWith(b1,['Таблица','Ссылка робота']);if(card)card.style.display='none';}
const nodes=document.querySelectorAll('div,p,span');
for(let i=0;i<nodes.length;i++){
const n=nodes[i];
if(n.children.length===0&&n.textContent.indexOf('таблица,')!==-1){n.textContent=n.textContent.replace('таблица, ','');}
}
const b2=findBtn('Сохранить в файл');
if(b2){
const card2=ancestorWith(b2,['Резервная копия']);
if(card2&&!document.getElementById('bkInfo')){
const info=document.createElement('div');
info.id='bkInfo';
card2.appendChild(info);
}
}
function updBk(){
const el=document.getElementById('bkInfo');
if(!el)return;
const t=Number(localStorage.getItem('aquaLastBackup')||0);
if(!t){el.textContent='⚠️ Копия — твоя единственная страховка. Нажми «Сохранить в файл»!';el.style.color='#ffb74d';return;}
const d=Math.round((new Date(new Date().setHours(0,0,0,0))-new Date(new Date(t).setHours(0,0,0,0)))/86400000); 
if(d<=0){el.textContent='✅ Копия сделана сегодня';el.style.color='#3ddc84';}
else if(d<=7){el.textContent='✅ Копия сделана '+d+' дн. назад';el.style.color='#3ddc84';}
else{el.textContent='⚠️ Копия была '+d+' дн. назад — обнови её!';el.style.color='#ff6b6b';}
}
document.addEventListener('click',function(e){
const t=e.target&&e.target.closest?e.target.closest('button'):null;
if(t&&t.textContent.trim()==='Сохранить в файл'){
localStorage.setItem('aquaLastBackup',String(Date.now()));
setTimeout(updBk,500);
}
});
updBk();
setInterval(updBk,60000);
}
/* ===== Локальный режим ===== */
function enableLocalMode(){
const of=window.fetch;
window.fetch=function(u){
if(typeof u==='string'&&u.indexOf('script.google.com')!==-1){return Promise.resolve(new Response('{}',{status:200}));}
return of.apply(this,arguments);
};
const ox=XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open=function(m,u){
if(typeof u==='string'&&u.indexOf('script.google.com')!==-1){this.__block=true;}
return ox.apply(this,arguments);
};
const os=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send=function(){
if(this.__block){const self=this;setTimeout(function(){if(self.onload)self.onload();if(self.onreadystatechange)self.onreadystatechange();},10);return;}
return os.apply(this,arguments);
};
}
/* ===== Параметры воды: плитка, экран, температура ===== */
function lastTemp(){const a=localStorage.getItem('aquaTemps');if(a){try{const j=JSON.parse(a);return j.length?j[j.length-1]:null;}catch(e){}}return null;}
function fmtT(t){return (Math.round(t*10)/10).toString().replace('.',',')+'°C';}
function loadT(){const a=localStorage.getItem('aquaTemps');if(a){try{return JSON.parse(a);}catch(e){}}return [];}
function saveT(arr){arr.sort(function(a,b){return pd(a.d)-pd(b.d);});localStorage.setItem('aquaTemps',JSON.stringify(arr));}
function putT(d,t){const arr=loadT();let f=null;for(let i=0;i<arr.length;i++){if(arr[i].d===d){f=arr[i];break;}}if(f){f.t=t;}else{arr.push({d:d,t:t});}saveT(arr);}
function leaf(text){const all=document.querySelectorAll('*');for(let i=0;i<all.length;i++){const t=(all[i].textContent||'').trim();if(t===text)return all[i];}return null;}
function cardOf(el,test){let n=el;while(n&&n!==document.body){if(test(n.textContent||''))return n;n=n.parentElement;}return null;}
function minDiv(ok){const all=document.querySelectorAll('div');let best=null;for(let i=0;i<all.length;i++){const t=all[i].textContent||'';if(ok(t)){if(!best||t.length<best.textContent.length)best=all[i];}}return best;}
let wpFCard=null,wpWCard=null,wpOv=null,wpGraphCard=null;
function wpRefs(){
if(!wpFCard){const fl=leaf('Голодный день');if(fl)wpFCard=cardOf(fl,function(t){return t.indexOf('последний')!==-1;});}
if(!wpWCard){const wl=leaf('Подмена воды');if(wl)wpWCard=cardOf(wl,function(t){return t.indexOf('последняя')!==-1;});}
return !!wpFCard;
}
function buildWpTile(){
if(document.getElementById('wpTile'))return true;
if(!wpRefs())return false;
const dl=leaf('Дневник');if(!dl)return false;
const dCard=cardOf(dl,function(t){return /\d{2}\.\d{2}\.\d{4}/.test(t);});
if(!dCard)return false;
dCard.className=wpFCard.className;
const ai=wpFCard.cloneNode(true);
ai.id='wpTile';ai.style.cursor='pointer';
const ch=ai.children;
const sp=wpWCard?wpWCard.querySelector('span'):null;
ch[0].innerHTML=(sp?sp.outerHTML:'')+'<span>Параметры и тесты воды</span>';
ch[1].id='wpBig';ch[2].id='wpSub';
ai.onclick=function(){openWP();};
dCard.parentElement.insertBefore(ai,dCard.nextSibling);
refreshWpTile();
return true;
}
function refreshWpTile(){
const lt=lastTemp();
const b=document.getElementById('wpBig');if(b)b.textContent=lt?fmtT(lt.t):'—';
const s=document.getElementById('wpSub');if(s)s.textContent=lt?('замер '+lt.d):'нет замеров';
const v=document.getElementById('wpTempV');if(v)v.textContent=lt?fmtT(lt.t):'—';
const d=document.getElementById('wpTempD');if(d)d.textContent=lt?('замер '+lt.d):'';
}
let wpOpen=false;
function openWP(){
if(!wpOv)buildWP();
if(!wpOpen){wpOpen=true;wpOv.style.transform='translateX(0)';try{history.pushState({wp:1},'');}catch(e){}}
refreshWpTile();
}
window.addEventListener('popstate',function(){if(wpOv&&wpOpen){wpOpen=false;wpOv.style.transform='translateX(100%)';}});
function buildWP(){
wpOv=document.createElement('div');wpOv.id='wpOv';
wpOv.style.cssText='position:fixed;inset:0;background:#0a1428;z-index:999;overflow-y:auto;padding:16px;box-sizing:border-box;transform:translateX(100%);transition:transform .3s ease'; 
wpOv.innerHTML='';
document.body.appendChild(wpOv);
if(wpRefs()){
const tc=wpFCard.cloneNode(true);
tc.id='wpTempCard';
tc.classList.add('wtc');
tc.style.cssText='width:100%;box-sizing:border-box;margin:0 0 10px;cursor:pointer;display:flex;align-items:center;gap:10px;padding:10px 14px;min-height:0';
const c=tc.children;
c[0].innerHTML='<span>🌡️</span><span>Температура воды</span>';
c[0].style.cssText='font-size:13px';
c[1].id='wpTempV';c[1].style.cssText='font-size:18px;margin:0';
c[2].id='wpTempD';c[2].style.cssText='font-size:11px;margin:0 0 0 auto';
tc.onclick=function(){drawTemp();markTempActive();};
wpOv.appendChild(tc);
}
const host=document.createElement('div');host.id='wpHost';wpOv.appendChild(host);
const tests=minDiv(function(t){return t.indexOf('Последние тесты воды')!==-1&&t.indexOf('pH')!==-1&&t.length<2000;});
if(tests){tests.parentNode.removeChild(tests);tests.style.cssText='width:100%;box-sizing:border-box;margin:0';host.appendChild(tests);}
const gh=minDiv(function(t){return t.indexOf('График тестов')!==-1&&t.length<2000;});
if(gh){
let g=gh;
while(g&&g!==document.body&&!g.querySelector('svg'))g=g.parentElement;
if(g&&g!==document.body){g.parentNode.removeChild(g);g.style.cssText='width:100%;box-sizing:border-box;margin:14px 0 0';host.appendChild(g);wpGraphCard=g;}
}
}
function markTempActive(){
const tc=document.getElementById('wpTempCard');
if(tc)tc.classList.add('active');
const g=document.getElementById('wtGrid');
if(g)for(let i=0;i<g.children.length;i++)g.children[i].classList.remove('active');
}
function drawTemp(){
if(!wpGraphCard)return;
const ds=wpGraphCard.querySelectorAll('div');
for(let i=0;i<ds.length;i++){
const t=(ds[i].textContent||'').trim();
if(t.indexOf('График')===0&&t.length<40){ds[i].textContent='График температуры';break;}
}
const old=wpGraphCard.querySelector('svg');
const pts=loadT();
const W=340,H=150,PL=34,PR=10,PT=14,PB=26;
let out='<svg viewBox="0 0 340 150" style="width:100%;display:block">';
if(!pts.length){
out+='<text x="'+PL+'" y="'+(H/2)+'" fill="#88aabb" font-size="9">замеров температуры пока нет</text></svg>';
}else{
const vals=[];for(let i=0;i<pts.length;i++)vals.push(pts[i].t);
let mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
if(mx===mn){mx+=1;mn-=1;}
const n=pts.length;
function X(i){return n<=1?W/2:PL+(i/(n-1))*(W-PL-PR);}
function Y(v){return PT+(1-(v-mn)/(mx-mn))*(H-PT-PB);}
for(let g=0;g<3;g++){
const vv=mn+(mx-mn)*g/2,yy=Y(vv);
out+='<line x1="'+PL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-PR)+'" y2="'+yy.toFixed(1)+'" stroke="#22364a" stroke-width="1"/><text x="0" y="'+(yy+3).toFixed(1)+'" fill="#88aabb" font-size="8">'+(Math.round(vv*10)/10)+'</text>';
}
let d='';
for(let i=0;i<n;i++){d+=(i?' L':'M')+X(i).toFixed(1)+' '+Y(vals[i]).toFixed(1);}
out+='<path d="'+d+'" fill="none" stroke="#ff9432" stroke-width="2"/>';
for(let i=0;i<n;i++){
out+='<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(vals[i]).toFixed(1)+'" r="3" fill="#ff9432"/><text x="'+X(i).toFixed(1)+'" y="'+(Y(vals[i])-5).toFixed(1)+'" fill="#ffd9b0" font-size="8" text-anchor="middle">'+fmtT(vals[i])+'</text>';
}
const step=Math.max(1,Math.floor(n/5));
for(let i=0;i<n;i+=step){out+='<text x="'+X(i).toFixed(1)+'" y="'+(H-8)+'" fill="#88aabb" font-size="8" text-anchor="middle">'+pts[i].d.slice(0,5)+'</text>';}
out+='</svg>';
}
if(old)old.outerHTML=out;else wpGraphCard.insertAdjacentHTML('beforeend',out);
}
function harvestTemps(){
if(localStorage.getItem('aquaTempHarvestV3'))return;
const have=loadT(),map={};
have.forEach(function(p){map[p.d]=1;});
let o=null;
try{o=JSON.parse(localStorage.getItem('aquaEntries')||'null');}catch(e){}
if(!o||!o.length){localStorage.setItem('aquaTempHarvestV3','1');return;}
o.forEach(function(en){
let s='';
for(const f in en){if(typeof en[f]==='string')s+=' '+en[f];}
const m=s.match(/температур\w*[^0-9]{0,25}(\d{2}(?:[.,]\d)?)/i)||s.match(/(\d{2}(?:[.,]\d)?)\s*градус/i);
if(!m)return;
const t=parseFloat(m[1].replace(',','.'));
if(t<15||t>40)return;
if(!map[en.date]){putT(en.date,t);map[en.date]=1;}
});
localStorage.setItem('aquaTempHarvestV3','1');
refreshWpTile();
}
function initParams(){
if(!buildWpTile()){
let n=0;
const iv=setInterval(function(){n++;if(buildWpTile()||n>20)clearInterval(iv);},150);
}
if(!wpOv)buildWP();
harvestTemps();
refreshWpTile();
}
/* ===== Старт ===== */
function init(){
injectIcons();
applyBranding();
applySettings();
addDateEditor();
initLightbox();
initWaterTestsUI();
initCalCard();
initSettingsClean();
enableLocalMode();
addMileLine();
buildSets();
render();
updateStats();
updateTiles();
initParams();
}
init();

setTimeout(function(){var s=document.getElementById('splash');if(s){s.classList.add('hide');setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s);},500);}},1000);
/* ===== Дневник для ИИ: файл контекста ===== */
(function(){
function buildCtx(){
var L=[];
L.push('МОЙ АКВАРИУМ — контекст для консультации.');
L.push('Сегодня: '+new Date().toLocaleDateString('ru-RU'));
L.push('');
L.push('Параметры аквариума: '+aquaInfo.size+' | свет: '+aquaInfo.light+' | фильтр: '+aquaInfo.filter+' | грунт: '+aquaInfo.grunt);
L.push('Периоды: подмена каждые '+settings.water+' дн., разгрузка каждые '+settings.hunger+' дн.');
L.push('');
L.push('ДНЕВНИК ('+entries.length+' записей):');
for(var i=entries.length-1;i>=0;i--){
var e=entries[i];
var s=e.date||'';
if(e.actions)s+=' — '+e.actions;
if(e.activity)s+='; активность: '+e.activity;
if(e.appetite)s+='; аппетит: '+e.appetite;
if(e.fins)s+='; плавники: '+e.fins;
var t=e.tests||parseTests((e.actions||'')+' '+(e.text||''));
var tk=['ph','kh','gh','cl','no3','no2'];
for(var q=0;q<tk.length;q++){if(t[tk[q]]!==undefined)s+='; '+tk[q]+'='+t[tk[q]];}
L.push(s);
}
var temps=loadT();
if(temps.length){
L.push('');
L.push('ТЕМПЕРАТУРА ВОДЫ:');
for(var i=0;i<temps.length;i++){L.push(temps[i].d+' — '+temps[i].t+'°C');}
}
return L.join('\n');
}
function addCtxBtn(){
if(document.getElementById('ctxBtn'))return;
var b=null,bs=document.querySelectorAll('button');
for(var i=0;i<bs.length;i++){if(bs[i].textContent.trim()==='Сохранить в файл'){b=bs[i];break;}}
if(!b)return;
var card=b;
while(card&&card!==document.body&&card.textContent.indexOf('Резервная копия')===-1)card=card.parentElement;
if(!card||card===document.body)return;
var nb=document.createElement('button');
nb.id='ctxBtn';
nb.style.cssText='display:block;width:100%;margin:10px 0 0;padding:12px;border-radius:12px;border:1px solid #2b4a66;background:#16283c;color:#eaf6ff;font-size:14px';
nb.textContent='📄 Дневник для ИИ';
nb.onclick=function(){
var txt=buildCtx();
var bl=new Blob([txt],{type:'text/plain;charset=utf-8'});
var a=document.createElement('a');
a.href=URL.createObjectURL(bl);
a.download='Дневник для ИИ '+new Date().toISOString().slice(0,10)+'.txt';
document.body.appendChild(a);a.click();
setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
};
card.appendChild(nb);
}
setTimeout(addCtxBtn,800);
setInterval(addCtxBtn,2000);
})();
