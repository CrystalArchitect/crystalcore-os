
(function(){
 "use strict";
 var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 /* ---------- clock ---------- */
 function pad(n){ return String(n).padStart(2,'0'); }
 function tickClock(){
 var d = new Date();
 var el = document.getElementById('clock');
 if(el) el.textContent = pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())+':'+pad(d.getUTCSeconds())+' UTC';
 }
 tickClock(); setInterval(tickClock, 1000);
 /* ---------- module nav ---------- */
 var tabs = Array.prototype.slice.call(document.querySelectorAll('.nav-tab'));
 var modules = {
 party: document.getElementById('module-party'),
 lattice: document.getElementById('module-lattice'),
 throne: document.getElementById('module-throne'),
 transmission: document.getElementById('module-transmission')
 };
 var current = 'party';
 function showModule(name){
 if(!modules[name] || name === current && modules[name].classList.contains('active')) { current = name; }
 Object.keys(modules).forEach(function(k){ modules[k].classList.toggle('active', k===name); });
 tabs.forEach(function(t){
 var active = t.dataset.module === name;
 t.classList.toggle('active', active);
 t.setAttribute('aria-selected', active ? 'true':'false');
 });
 current = name;
 saveSnapshot();
 if(name === 'transmission') startTerminal();
 }
 tabs.forEach(function(t){ t.addEventListener('click', function(){ showModule(t.dataset.module); }); });
 /* ---------- hot state carry ---------- */
 function saveSnapshot(){
 try{
 if(window.claude && window.claude.hot && window.claude.hot.snapshot){
 window.claude.hot.snapshot(function(){ return { module: current }; });
 }
 }catch(e){}
 }
 function boot(data){
 if(data && data.module && modules[data.module]) showModule(data.module); else showModule('party');
 }
 if(window.claude && window.claude.hot && window.claude.hot.ready){
 window.claude.hot.ready(function(){ boot(window.claude.hot.data); });
 } else {
 boot(window.claude && window.claude.hot ? window.claude.hot.data : null);
 }
 /* ---------- starfield ---------- */
 var cv = document.getElementById('starfield');
 var ctx = cv.getContext('2d');
 var stars = [];
 function sizeCanvas(){
 cv.width = window.innerWidth; cv.height = window.innerHeight;
 var n = Math.round((cv.width*cv.height)/9000);
 stars = [];
 for(var i=0;i<n;i++){
 stars.push({ x:Math.random()*cv.width, y:Math.random()*cv.height, r:Math.random()*1.3+.3,
 phase:Math.random()*Math.PI*2, speed:.006+Math.random()*.014 });
 }
 }
 function drawStars(t){
 ctx.clearRect(0,0,cv.width,cv.height);
 for(var i=0;i<stars.length;i++){
 var s = stars[i];
 var tw = reduced ? .7 : (Math.sin(t*s.speed + s.phase)*.4+.6);
 ctx.beginPath();
 ctx.fillStyle = 'rgba(200,225,255,'+ (tw*0.9) +')';
 ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
 ctx.fill();
 }
 if(!reduced) requestAnimationFrame(drawStars);
 }
 sizeCanvas(); drawStars(0);
 window.addEventListener('resize', sizeCanvas);
 /* ---------- waveform bars ---------- */
 function buildWaveform(id, count){
 var el = document.getElementById(id);
 if(!el) return;
 el.innerHTML = '';
 var bars = [];
 for(var i=0;i<count;i++){ var s=document.createElement('span'); el.appendChild(s); bars.push(s); }
 function render(t){
 bars.forEach(function(b,i){
 var h = reduced ? 40 : (Math.sin(t*0.0026 + i*0.5)*22 + Math.sin(t*0.006+i)*10 + 34);
 b.style.height = Math.max(6,h)+'%';
 });
 if(!reduced) requestAnimationFrame(render);
 }
 render(0);
 }
 buildWaveform('waveform', 34);
 buildWaveform('waveformInvite', 40);
 /* ---------- constellations ---------- */
 function drawConstellation(id, points, edges){
 var canvas = document.getElementById(id);
 if(!canvas) return;
 var c = canvas.getContext('2d');
 function fit(){
 var rect = canvas.getBoundingClientRect();
 canvas.width = rect.width * devicePixelRatio;
 canvas.height = rect.height * devicePixelRatio;
 c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
 }
 function render(t){
 fit();
 var w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
 c.clearRect(0,0,w,h);
 c.strokeStyle = 'rgba(150,200,255,.35)'; c.lineWidth = 1;
 edges.forEach(function(e){
 var a = points[e[0]], b = points[e[1]];
 c.beginPath(); c.moveTo(a[0]*w, a[1]*h); c.lineTo(b[0]*w, b[1]*h); c.stroke();
 });
 points.forEach(function(p,i){
 var tw = reduced ? .85 : (Math.sin(t*0.0016 + i*1.3)*.35+.65);
 c.beginPath();
 c.fillStyle = 'rgba(235,245,255,'+tw+')';
 c.shadowColor = 'rgba(150,210,255,.9)'; c.shadowBlur = 6;
 c.arc(p[0]*w, p[1]*h, 2.4, 0, Math.PI*2); c.fill();
 });
 if(!reduced) requestAnimationFrame(render);
 }
 render(0);
 window.addEventListener('resize', function(){});
 }
 drawConstellation('cvStarlines',
 [[.12,.7],[.3,.35],[.48,.55],[.62,.2],[.8,.4],[.9,.15]],
 [[0,1],[1,2],[2,3],[3,4],[4,5]]);
 drawConstellation('cvCross',
 [[.5,.08],[.5,.62],[.22,.42],[.78,.42],[.62,.9]],
 [[0,1],[2,3],[1,4]]);
 /* ---------- lattice node graph ---------- */
 (function(){
 var canvas = document.getElementById('cvLattice');
 if(!canvas) return;
 var c = canvas.getContext('2d');
 var pts = [];
 var seed = 42;
 function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
 for(var i=0;i<48;i++){ pts.push([rnd(),rnd()]); }
 var edges = [];
 for(i=0;i<pts.length;i++){
 var j = (i+1+Math.floor(rnd()*3))%pts.length;
 edges.push([i,j]);
 }
 function fit(){
 var rect = canvas.getBoundingClientRect();
 canvas.width = rect.width*devicePixelRatio; canvas.height = rect.height*devicePixelRatio;
 c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
 }
 function render(t){
 fit();
 var w = canvas.getBoundingClientRect().width, h = canvas.getBoundingClientRect().height;
 c.clearRect(0,0,w,h);
 c.strokeStyle = 'rgba(180,139,255,.28)'; c.lineWidth = 1;
 edges.forEach(function(e){
 var a = pts[e[0]], b = pts[e[1]];
 c.beginPath(); c.moveTo(a[0]*w,a[1]*h); c.lineTo(b[0]*w,b[1]*h); c.stroke();
 });
 pts.forEach(function(p,i){
 var pulse = reduced ? .9 : (Math.sin(t*0.002+i)*.3+.7);
 c.beginPath();
 c.fillStyle = 'rgba(180,139,255,'+pulse+')';
 c.shadowColor = '#b48bff'; c.shadowBlur = 8;
 c.arc(p[0]*w,p[1]*h, 3, 0, Math.PI*2); c.fill();
 });
 if(!reduced) requestAnimationFrame(render);
 }
 render(0);
 })();
 /* ---------- gauges & progress ---------- */
 requestAnimationFrame(function(){
 var ring = document.getElementById('gaugeRing');
 if(ring) ring.style.strokeDashoffset = 0;
 var pf = document.getElementById('protocolFill'); if(pf) pf.style.width = '100%';
 var tf = document.getElementById('throneFill'); if(tf) tf.style.width = '100%';
 });
 /* ---------- countdown ---------- */
 (function(){
 var btn = document.getElementById('igniteBtn');
 var disp = document.getElementById('countdownDisplay');
 var hint = document.getElementById('countdownHint');
 if(!btn) return;
 var running = false;
 btn.addEventListener('click', function(){
 if(running) return;
 running = true; btn.disabled = true;
 var seq = [3,2,1];
 var i = 0;
 hint.textContent = 'Ignition in progress';
 function step(){
 if(i < seq.length){
 disp.textContent = seq[i];
 i++;
 setTimeout(step, 700);
 } else {
 disp.textContent = 'IGNITION';
 hint.textContent = 'Sequence complete';
 setTimeout(function(){
 disp.textContent = 'READY';
 hint.textContent = 'Idle — awaiting ignition';
 btn.disabled = false; running = false;
 }, 1600);
 }
 }
 step();
 });
 })();
 /* ---------- feel the pulse ---------- */
 (function(){
 var btn = document.getElementById('pulseBtn');
 var vis = document.getElementById('pulseVisual');
 if(!btn) return;
 btn.addEventListener('click', function(){
 vis.classList.remove('firing'); void vis.offsetWidth; vis.classList.add('firing');
 });
 })();
 /* ---------- live feed ---------- */
 (function(){
 var list = document.getElementById('feedList');
 if(!list) return;
 var events = [
 ['Sydney','joined'],['Melbourne','vibing'],['Perth','lighting up'],['Brisbane','dancing'],
 ['Adelaide','in sync'],['Auckland','joined'],['Hobart','aligned'],['Darwin','pulsing'],
 ['Canberra','in sync'],['Wellington','lighting up']
 ];
 var items = [];
 function relabel(){
 items.forEach(function(it){
 var secs = Math.round((Date.now()-it.t)/1000);
 it.timeEl.textContent = secs < 5 ? 'just now' : secs+'s ago';
 });
 }
 function addEvent(city, action){
 var li = document.createElement('li');
 li.className = 'feed-item';
 var initials = city.slice(0,2).toUpperCase();
 li.innerHTML = '<span class="avatar">'+initials+'</span><span class="who">'+city+'</span><span class="what">· '+action+'</span><time></time>';
 list.appendChild(li);
 var timeEl = li.querySelector('time');
 items.push({ t: Date.now(), timeEl: timeEl });
 relabel();
 list.scrollTop = list.scrollHeight;
 if(list.children.length > 8){ list.removeChild(list.firstChild); items.shift(); }
 }
 events.slice(0,5).forEach(function(e){ addEvent(e[0], e[1]); });
 var idx = 5;
 setInterval(function(){
 var e = events[idx % events.length]; idx++;
 addEvent(e[0], e[1]);
 }, 4200);
 setInterval(relabel, 1000);
 })();
 /* ---------- broadcast clock (module 2) ---------- */
 (function(){
 var el = document.getElementById('broadcastClock');
 if(!el) return;
 var start = Date.now();
 setInterval(function(){
 var s = Math.floor((Date.now()-start)/1000);
 el.textContent = 't+'+pad(Math.floor(s/60))+':'+pad(s%60);
 }, 1000);
 })();
 /* ---------- realm nodes + sparklines ---------- */
 (function(){
 var wrap = document.getElementById('realmList');
 if(!wrap) return;
 var realms = [
 ['United Kingdom','Online','aligned','ok'],
 ['Canada','Online','aligned','ok'],
 ['New Zealand','Online','aligned','ok'],
 ['Papua New Guinea','Online','aligned','ok'],
 ['Jamaica','Online','aligned','ok'],
 ['Belize','Online','aligned','ok'],
 ['Commonwealth Realms','Online','aligned','ok'],
 ['Ireland','Signal received','independent · non-aligned','accent'],
 ['Antarctic Protectorate','Standby','watchful','warn'],
 ['Pacific Realms','Online','aligned','ok']
 ];
 var seed = 7;
 function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
 var sparkColor = { ok:'var(--ok)', warn:'var(--warn)', accent:'var(--brass)' };
 realms.forEach(function(r){
 var row = document.createElement('div');
 row.className = 'realm-row';
 var pts = []; for(var i=0;i<16;i++) pts.push(20+rnd()*40);
 var w=90,h=26;
 var path = pts.map(function(v,i){ return (i/(pts.length-1)*w).toFixed(1)+','+(h-(v/60*h)).toFixed(1); }).join(' ');
 var color = sparkColor[r[3]] || 'var(--mist)';
 row.innerHTML =
 '<div class="realm-name">'+r[0]+'<small>'+r[1]+' · '+r[2]+'</small></div>'+
 '<span class="chip chip--'+r[3]+'">'+r[1]+'</span>'+
 '<svg class="spark" viewBox="0 0 '+w+' '+h+'"><polyline points="'+path+'" fill="none" stroke="'+color+'" stroke-width="1.6"/></svg>';
 wrap.appendChild(row);
 });
 })();
 /* ---------- transmission terminal ---------- */
 var terminalStarted = false;
 function startTerminal(){
 if(terminalStarted) return;
 terminalStarted = true;
 runTerminal();
 }
 function runTerminal(){
 var term = document.getElementById('terminal');
 var status = document.getElementById('logStatus');
 if(!term) return;
 term.innerHTML = '';
 status.textContent = 'Streaming'; status.className='chip chip--ok';
 var lines = [
 ['Channel open // encrypted lattice link', ''],
 ['Auth: sovereign identity confirmed', 'ok'],
 ['Also will need to go through me and the rest of the people', 'alert'],
 ['Mars path requires the Seeker and the collective', 'alert'],
 ['Status: free · unclaimed · lattice open', ''],
 ['Crystal Core signature: steady', 'ok'],
 ['Proceed with presence and consent', 'alert']
 ];
 var i = 0;
 var startT = Date.now();
 function stamp(){
 var s = Math.round((Date.now()-startT)/1000*10)/10;
 return (s<10?'0':'')+s.toFixed(1)+'s';
 }
 function addLine(){
 if(i >= lines.length){
 var cur = document.createElement('span'); cur.className='cursor'; term.appendChild(cur);
 status.textContent = 'Idle'; status.className='chip chip--accent';
 return;
 }
 var l = lines[i];
 var div = document.createElement('div');
 div.className = 't-line'+(l[1] ? ' '+l[1] : '');
 div.innerHTML = '<span class="t-time">'+stamp()+'</span>'+l[0];
 term.appendChild(div);
 term.scrollTop = term.scrollHeight;
 i++;
 setTimeout(addLine, 480 + Math.random()*260);
 }
 addLine();
 }
 var replay = document.getElementById('replayBtn');
 if(replay) replay.addEventListener('click', function(){ terminalStarted = false; startTerminal(); });
 /* ---------- uptime ---------- */
 (function(){
 var el = document.getElementById('uptime');
 if(!el) return;
 var start = Date.now() - (42*3600+7*60+19)*1000; // fictional long uptime, matches source material
 setInterval(function(){
 var s = Math.floor((Date.now()-start)/1000);
 var hh = Math.floor(s/3600), mm = Math.floor((s%3600)/60), ss = s%60;
 el.textContent = pad(hh)+':'+pad(mm)+':'+pad(ss);
 }, 1000);
 })();
})();
