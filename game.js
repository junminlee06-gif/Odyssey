const canvas=document.getElementById('screen');
const ctx=canvas.getContext('2d');
const modal=document.getElementById('modal');
const panel=document.getElementById('panel');
const hint=document.getElementById('hint');
const cut=document.getElementById('cut');
const nameNow=document.getElementById('nameNow');
const leftBtn=document.getElementById('leftBtn');
const rightBtn=document.getElementById('rightBtn');
const jumpBtn=document.getElementById('jumpBtn');
const actBtn=document.getElementById('actBtn');
const nameBtn=document.getElementById('nameBtn');
const ticketBtn=document.getElementById('ticketBtn');

const VIEW_W=768,VIEW_H=432,GROUND_Y=356,WORLD_W=4800;
const MAX_SPEED=350,GROUND_ACCEL=2500,AIR_ACCEL=1350,GROUND_FRICTION=3300,AIR_FRICTION=620;
const JUMP_SPEED=790,GRAVITY=2240,COYOTE_TIME=.115,JUMP_BUFFER=.13,CAMERA_LERP=.105;
canvas.width=VIEW_W;canvas.height=VIEW_H;ctx.imageSmoothingEnabled=false;

let playerX=190,playerY=0,playerVX=0,velocityY=0,facing=1,cameraX=0,targetCameraX=0;
let previousTime=performance.now(),currentTime=0,equippedName='귀환병',inspected=false,near=null;
let coyoteTimer=0,jumpBufferTimer=0,wasGrounded=true;
const input={left:false,right:false,jumpHeld:false};
const particles=[];

function img(src){const image=new Image();image.src=src;return image;}
const assets={station:img('./assets/backgrounds/station_far.svg'),train:img('./assets/backgrounds/train_long.svg'),platform:img('./assets/tiles/platform.svg'),heroIdle:img('./assets/characters/odysseus_idle.svg'),heroIdleB:img('./assets/characters/odysseus_idle_b.svg'),heroWalkA:img('./assets/characters/odysseus_walk_a.svg'),heroWalkB:img('./assets/characters/odysseus_walk_b.svg'),heroWalkC:img('./assets/characters/odysseus_walk_c.svg'),heroWalkD:img('./assets/characters/odysseus_walk_d.svg'),heroJump:img('./assets/characters/odysseus_jump.svg'),heroFall:img('./assets/characters/odysseus_fall.svg'),prop:img('./assets/characters/npc_propagandist.svg'),propB:img('./assets/characters/npc_propagandist_idle_b.svg'),survivor:img('./assets/characters/npc_survivor.svg'),survivorB:img('./assets/characters/npc_survivor_idle_b.svg'),inspector:img('./assets/characters/npc_inspector.svg'),inspectorB:img('./assets/characters/npc_inspector_idle_b.svg'),poster:img('./assets/objects/poster.svg'),listBoard:img('./assets/objects/list_board.svg'),cargo:img('./assets/objects/cargo_mark.svg'),checkpoint:img('./assets/objects/checkpoint.svg')};
const heroIdleFrames=[assets.heroIdle,assets.heroIdleB];
const heroWalkFrames=[assets.heroWalkA,assets.heroWalkC,assets.heroWalkB,assets.heroWalkD];
const C={black:'#050403',void:'#101013',gold0:'#9d7a3a',gold1:'#d7b35d',gold2:'#f0d281',paper:'#d1b875',red:'#9f3426',bronze2:'#8d642f',steamA:'rgba(210,198,168,.32)',steamB:'rgba(240,220,180,.18)'};

const entities=[{id:'poster',title:'영웅 포스터',x:340,kind:'object',glyphY:257},{id:'list',title:'귀환병 명단',x:780,kind:'object',glyphY:233},{id:'prop',title:'선전관',x:1240,kind:'npc',glyphY:250},{id:'cargo',title:'화물칸 문',x:1780,kind:'object',glyphY:236},{id:'survivor',title:'트로이 생존자',x:2380,kind:'npc',glyphY:250},{id:'ticket',title:'검표 구역',x:3020,kind:'object',glyphY:233},{id:'inspector',title:'검문관',x:3480,kind:'npc',glyphY:250},{id:'gate',title:'검문 게이트',x:4040,kind:'gate',glyphY:204}];
const objectText={poster:['영웅 포스터','포스터는 열차 창문보다 낮게 붙어 있다.\n\n영웅의 얼굴은 늘 나보다 먼저 고향에 도착한다.'],list:['귀환병 명단','같은 사람처럼 보이는 이름이 여럿 적혀 있다.\n\n전쟁 중에 이름은 탄약보다 자주 갈아 끼웠다.'],cargo:['화물칸 문','이 칸에는 전리품과 유골함이 함께 실려 있다.\n\n오디세우스: 집으로 가는 열차라기보다, 전쟁을 싣고 달리는 관 같다.'],ticket:['검표 구역','검문 도장이 찍히기 전에는 누구도 이 플랫폼의 끝을 지나갈 수 없다.']};

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function text(value,x,y,color=C.paper,size=10){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.fillText(value,Math.round(x),Math.round(y));}
function line(x1,y1,x2,y2,color){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(x1)+.5,Math.round(y1)+.5);ctx.lineTo(Math.round(x2)+.5,Math.round(y2)+.5);ctx.stroke();}
function sx(worldX,parallax=1){return Math.round(worldX-cameraX*parallax);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function approach(value,target,amount){if(value<target)return Math.min(value+amount,target);if(value>target)return Math.max(value-amount,target);return value;}
function drawImage(image,x,y,w,h,flip=false){if(!image.complete||image.naturalWidth===0)return false;ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.scale(-1,1);ctx.drawImage(image,-Math.round(x+w),Math.round(y),Math.round(w),Math.round(h));}else ctx.drawImage(image,Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.restore();return true;}
function drawTiled(image,x,y,tileW,tileH,areaW){if(!image.complete||image.naturalWidth===0)return false;for(let px=x;px<areaW;px+=tileW)ctx.drawImage(image,Math.round(px),Math.round(y),tileW,tileH);return true;}
function prand(n){const s=Math.sin(n*12.9898+78.233)*43758.5453;return s-Math.floor(s);}
function detailMask(x,y){const hx=sx(playerX),hy=GROUND_Y-28;return (Math.abs(x-hx)<76&&Math.abs(y-hy)<82)?0.36:1;}
function tiny(x,y,w,h,color,alpha=1){const m=detailMask(x,y)*alpha;if(m<=0.02)return;ctx.save();ctx.globalAlpha=m;rect(x,y,w,h,color);ctx.restore();}

function emitDust(x,y,count=6,force=1){for(let i=0;i<count;i++)particles.push({x:x+(Math.random()*18-9),y:y+Math.random()*3,vx:(Math.random()*90-45)*force,vy:-(25+Math.random()*42)*force,life:.32+Math.random()*.24,max:.56,size:2+Math.random()*4});}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.vx*=Math.pow(.18,dt);if(p.life<=0)particles.splice(i,1);}}
function drawParticles(){particles.forEach(p=>{const a=clamp(p.life/p.max,0,1);rect(sx(p.x),p.y,p.size,p.size,`rgba(215,179,93,${.12+a*.28})`);});}

function drawFallbackStation(){rect(0,0,VIEW_W,VIEW_H,'#171719');rect(0,0,VIEW_W,120,'#2b3134');rect(0,190,VIEW_W,128,'#10100f');for(let x=-80;x<VIEW_W+160;x+=160){line(x,230,x+92,58,'#5c564c');line(x+92,58,x+184,230,'#5c564c');rect(x+88,204,12,162,'#070605');rect(x+22,260,80,14,'#21170f');}}
function drawBackground(){rect(0,0,VIEW_W,VIEW_H,C.void);const off=-Math.floor(cameraX*.10)%1536;if(!drawTiled(assets.station,off-1536,0,1536,432,VIEW_W+1536))drawFallbackStation();rect(0,0,VIEW_W,VIEW_H,'rgba(0,0,0,.04)');}
function drawStationPixelPass(){const drift=Math.floor(cameraX*.1);for(let i=0;i<240;i++){const x=((i*53-drift)%920)-76,y=18+(i*37)%220,r=prand(i+19);if(r<.34)tiny(x,y,1+(i%3),1,'#6f5428',.45);else if(r<.66)tiny(x,y,2+(i%5),1,'#1b1711',.62);else tiny(x,y,1,6+(i%11),'#0a0908',.35);}for(let i=0;i<96;i++){const x=((i*91-drift*2)%980)-110,y=84+(i*23)%168;tiny(x,y,22+(i%29),1,i%3?'#4a3820':'#d7b35d',i%3?.34:.22);tiny(x+7,y+4,1,18+(i%27),'#080706',.32);}for(let i=0;i<38;i++){const x=((i*143-drift)%1000)-120;line(x,48+(i%5)*18,x+90,134+(i%7)*11,'rgba(97,83,54,.25)');}}
function steamPuff(x,y,size,color){rect(x,y+size*.35,size,size*.45,color);rect(x+size*.2,y,size*.62,size*.7,color);rect(x+size*.55,y+size*.22,size*.55,size*.5,color);}
function drawTrainSteam(){const period=4300,active=1650,local=currentTime%period;if(local>active)return;const baseT=local/active,off=-Math.floor(cameraX*.62)%936;for(let base=off-936;base<VIEW_W+936;base+=936){[base+88,base+408,base+714].forEach((ventX,vi)=>{for(let i=0;i<5;i++){const t=baseT-i*.12-vi*.04;if(t<=0||t>1)continue;const drift=t*(36+i*7),rise=t*(58+i*10),size=9+t*18+i*2;steamPuff(ventX-drift+i*7,238-rise-i*4,size,i%2?C.steamA:C.steamB);}});}}
function drawTrainDepth(y){rect(0,y+118,VIEW_W,11,'rgba(0,0,0,.56)');for(let x=-Math.floor(cameraX*.62)%96-96;x<VIEW_W+120;x+=96){rect(x,y+122,58,5,'rgba(120,83,38,.45)');rect(x+10,y+128,36,2,'rgba(0,0,0,.62)');}}
function drawTrain(){const y=224,off=-Math.floor(cameraX*.62)%936;if(!drawTiled(assets.train,off-936,y,936,132,VIEW_W+936)){rect(0,y+12,VIEW_W,106,'#332012');rect(0,y+28,VIEW_W,3,C.gold0);rect(0,y+94,VIEW_W,3,C.gold0);}drawTrainDepth(y);drawTrainSteam();}
function drawTrainPixelPass(){const off=-Math.floor(cameraX*.62)%120;for(let x=off-120;x<VIEW_W+120;x+=120){for(let j=0;j<10;j++){const y=236+j*9+((x+j)&3);tiny(x+8+j*9,y,16+(j%5)*7,1,j%2?'#d7b35d':'#6a4521',j%2?.18:.36);tiny(x+44+j*5,240+j*8,1,24+(j%4)*8,'#060504',.22);tiny(x+18+j*11,251+j*6,2,2,'#f0d281',.20);tiny(x+24+j*13,270+j*5,3,1,'#9d7a3a',.36);}}for(let i=0;i<84;i++){const x=((i*31-Math.floor(cameraX*.62))%(VIEW_W+90))-45,y=230+(i*47)%105,r=prand(i+401);tiny(x,y,r>.55?4:1,r>.75?1:2,r>.6?'#8d642f':'#090604',r>.6?.35:.42);}}
function drawPlatform(){const off=-Math.floor(cameraX*.95)%768;if(!drawTiled(assets.platform,off-768,GROUND_Y,768,90,VIEW_W+768)){rect(0,GROUND_Y,VIEW_W,VIEW_H-GROUND_Y,'#21170f');rect(0,GROUND_Y,VIEW_W,5,C.gold1);rect(0,GROUND_Y+48,VIEW_W,4,C.gold0);rect(0,GROUND_Y+68,VIEW_W,4,C.gold0);}}
function drawPlatformPixelPass(){const off=-Math.floor(cameraX*.95)%96;for(let x=off-96;x<VIEW_W+96;x+=96){for(let i=0;i<18;i++){const px=x+4+(i*17)%92,py=GROUND_Y+6+(i*11)%74;tiny(px,py,8+(i%7)*6,1,i%3?'#6a4521':'#d7b35d',i%3?.42:.25);tiny(px+4,py+5,1,1,'#f0d281',.22);tiny(px+28,py+13,2,2,'#080604',.5);}tiny(x+12,GROUND_Y+19,68,2,'#050403',.38);tiny(x+22,GROUND_Y+25,42,1,'#9d7a3a',.25);}}

function fallbackPoster(x,y){rect(x,y,66,80,C.black);rect(x+6,y+6,54,68,C.paper);rect(x+22,y+15,23,25,'#6b3326');rect(x+42,y+60,14,10,C.red);}
function fallbackList(x,y){rect(x,y,72,104,C.black);rect(x+7,y+7,58,90,'#3a2515');rect(x+15,y+18,38,5,C.gold1);rect(x+15,y+35,30,3,C.gold0);rect(x+15,y+61,34,3,C.gold0);}
function fallbackCargo(x,y){rect(x,y+8,178,96,C.black);rect(x+10,y+4,154,90,'#4c2a16');rect(x+34,y+34,86,5,C.gold0);rect(x+50,y+56,72,5,C.gold1);}
function fallbackCheckpoint(x,y){rect(x,y+14,220,148,C.black);rect(x+10,y+22,192,128,'#463019');rect(x+24,y+48,150,7,C.gold1);line(x+164,y+22,x+224,y+78,C.gold1);}
function mountShadow(x,y,w,h,type='flat'){rect(x-5,y+h-4,w+10,7,'rgba(0,0,0,.62)');if(type==='gate'){rect(x-10,y+h-2,w+20,8,'rgba(0,0,0,.64)');rect(x-10,y+h+5,w+20,2,C.gold0);return;}rect(x-5,y-5,w+10,h+10,'rgba(0,0,0,.25)');rect(x-2,y-2,w+4,2,'rgba(215,179,93,.22)');rect(x-2,y+h,w+4,2,'rgba(80,54,25,.55)');rect(x+3,y+4,2,2,C.gold0);rect(x+w-6,y+4,2,2,C.gold0);rect(x+3,y+h-8,2,2,C.gold0);rect(x+w-6,y+h-8,2,2,C.gold0);}
function objectPixelFrame(x,y,w,h,type){for(let i=0;i<22;i++){const px=x+4+(i*17)%Math.max(10,w-8),py=y+5+(i*13)%Math.max(10,h-10),r=prand(i+w+h);tiny(px,py,r>.5?8:2,1,r>.55?'#d7b35d':'#0a0705',r>.55?.28:.42);}if(type==='gate'){tiny(x+12,y+18,w-34,3,'#d7b35d',.22);tiny(x+w-28,y+14,4,h-34,'#050403',.55);tiny(x+24,y+h-18,72,3,'#9d7a3a',.36);}else{tiny(x+7,y+7,w-16,2,'#f0d281',.18);tiny(x+7,y+h-10,w-22,2,'#090604',.46);}}
function trainScratches(){const off=-Math.floor(cameraX*.62)%120;for(let x=off-120;x<VIEW_W+120;x+=120){rect(x+16,264,48,2,'rgba(215,179,93,.20)');rect(x+70,312,58,2,'rgba(115,76,34,.34)');rect(x+46,244,1,72,'rgba(0,0,0,.22)');rect(x+98,282,2,2,'rgba(217,179,93,.28)');rect(x+104,282,2,2,'rgba(217,179,93,.20)');}}
function drawForegroundObjects(){trainScratches();const visible=wx=>sx(wx)>-300&&sx(wx)<VIEW_W+300;if(visible(340)){const x=sx(292),y=263;mountShadow(x,y,66,80);if(!drawImage(assets.poster,x,y,66,80))fallbackPoster(x,y);objectPixelFrame(x,y,66,80,'flat');}if(visible(780)){const x=sx(720),y=236;mountShadow(x,y,72,104);if(!drawImage(assets.listBoard,x,y,72,104))fallbackList(x,y);objectPixelFrame(x,y,72,104,'flat');}if(visible(1780)){const x=sx(1650),y=238;mountShadow(x,y,178,104,'gate');if(!drawImage(assets.cargo,x,y,178,104))fallbackCargo(x,y);objectPixelFrame(x,y,178,104,'gate');}if(visible(3020)){const x=sx(2954),y=236;mountShadow(x,y,72,104);if(!drawImage(assets.listBoard,x,y,72,104))fallbackList(x,y);objectPixelFrame(x,y,72,104,'flat');}if(visible(4040)){const x=sx(4020),y=204;mountShadow(x,y,220,148,'gate');if(!drawImage(assets.checkpoint,x,y,220,148))fallbackCheckpoint(x,y);objectPixelFrame(x,y,220,148,'gate');}}
function drawNpc(entity){const x=sx(entity.x);if(x<-160||x>VIEW_W+160)return;const frame=Math.floor((currentTime+entity.x)/720)%2,bob=frame?1:0;let image=frame?assets.propB:assets.prop;if(entity.id==='survivor')image=frame?assets.survivorB:assets.survivor;if(entity.id==='inspector')image=frame?assets.inspectorB:assets.inspector;rect(x-22,GROUND_Y-3,48,5,'rgba(0,0,0,.62)');rect(x-18,GROUND_Y-7,38,3,'rgba(157,122,58,.24)');drawImage(image,x-21,GROUND_Y-58-bob,42,58);}
function drawHero(){const moving=Math.abs(playerVX)>18;let image;if(playerY>2)image=velocityY>0?assets.heroJump:assets.heroFall;else if(moving)image=heroWalkFrames[Math.floor(currentTime/92)%heroWalkFrames.length];else image=heroIdleFrames[Math.floor(currentTime/580)%heroIdleFrames.length];const w=40,h=56,x=sx(playerX)-20,y=GROUND_Y-h-Math.round(playerY);rect(x-4,GROUND_Y-3,46,5,'rgba(0,0,0,.72)');rect(x-3,y-3,46,h+6,'rgba(240,210,129,.06)');if(!drawImage(image,x,y,w,h,facing<0)){rect(x+11,y+2,18,14,C.black);rect(x+8,y+18,24,28,'#12100d');rect(x+17,y+28,7,12,C.gold1);rect(x+13,y+46,6,9,C.black);rect(x+25,y+46,6,9,C.black);}}
function drawGlyph(x,y,active){rect(x-(active?26:15),y-2,active?52:30,active?23:15,C.black);rect(x-(active?24:13),y,active?48:26,active?21:13,active?C.gold1:'#4a3520');rect(x-(active?20:10),y+4,active?40:20,active?13:6,active?'#171008':'#120d08');text(active?'E':'...',x-(active?5:9),y+(active?17:12),active?C.gold2:'#a78b4a',active?12:9);}
function drawAtmosphere(){const phase=Math.floor(currentTime/45);for(let i=0;i<54;i++){const x=(i*87+phase*3)%VIEW_W,y=(i*37+phase*7)%VIEW_H;rect(x,y,1,5,'rgba(215,179,93,.065)');}for(let y=0;y<VIEW_H;y+=3)rect(0,y,VIEW_W,1,'rgba(0,0,0,.035)');}
function drawScene(){drawBackground();drawStationPixelPass();drawTrain();drawTrainPixelPass();drawForegroundObjects();drawPlatform();drawPlatformPixelPass();drawParticles();entities.forEach(e=>{if(e.kind==='npc')drawNpc(e);});drawHero();entities.forEach(e=>{const x=sx(e.x);if(x<-160||x>VIEW_W+160)return;drawGlyph(x,e.glyphY||GROUND_Y-112,near&&near.id===e.id);});drawAtmosphere();}

function queueJump(){jumpBufferTimer=JUMP_BUFFER;input.jumpHeld=true;}
function doJump(){velocityY=JUMP_SPEED;playerY=Math.max(playerY,1);coyoteTimer=0;jumpBufferTimer=0;emitDust(playerX,GROUND_Y-2,8,1.15);}
function updatePhysics(dt){const grounded=playerY<=0&&velocityY<=0;if(grounded)coyoteTimer=COYOTE_TIME;else coyoteTimer=Math.max(0,coyoteTimer-dt);jumpBufferTimer=Math.max(0,jumpBufferTimer-dt);const dir=Number(input.right)-Number(input.left);if(dir!==0)facing=dir;const accel=grounded?GROUND_ACCEL:AIR_ACCEL;if(dir!==0)playerVX=approach(playerVX,dir*MAX_SPEED,accel*dt);else playerVX=approach(playerVX,0,(grounded?GROUND_FRICTION:AIR_FRICTION)*dt);playerX=clamp(playerX+playerVX*dt,96,WORLD_W-140);if(jumpBufferTimer>0&&coyoteTimer>0)doJump();if(playerY>0||velocityY!==0){playerY+=velocityY*dt;velocityY-=GRAVITY*dt;if(playerY<0){playerY=0;if(!wasGrounded&&Math.abs(velocityY)>240)emitDust(playerX,GROUND_Y-2,12,1.25);velocityY=0;}}const nowGrounded=playerY<=0&&velocityY===0;if(nowGrounded&&Math.abs(playerVX)>120&&Math.floor(currentTime/115)%2===0)emitDust(playerX-facing*10,GROUND_Y-1,1,.55);wasGrounded=nowGrounded;}
function updateCamera(){targetCameraX=clamp(playerX-340+playerVX*.18,0,WORLD_W-VIEW_W);cameraX+=(targetCameraX-cameraX)*CAMERA_LERP;if(Math.abs(cameraX-targetCameraX)<.08)cameraX=targetCameraX;}
function update(now){const dt=Math.min((now-previousTime)/1000,.033);previousTime=now;currentTime=now;updatePhysics(dt);updateCamera();updateParticles(dt);near=entities.find(e=>Math.abs(e.x-playerX)<95)||null;hint.textContent=near?'E / 터치: '+near.title:'A/D 이동 · Space 점프 · E 상호작용 · I 신분철';drawScene();requestAnimationFrame(update);}

function show(title,body,extra=''){panel.innerHTML='<h1>'+title+'</h1><p>'+body+'</p>'+extra+'<button onclick="hide()">닫기</button>';modal.style.display='grid';}
function hide(){modal.style.display='none';}
function describeName(identity){if(identity==='귀환병')return '공감, 낮은 위험. 민간인 대화에 적합.';if(identity==='라에르테스의 아들')return '이타카 왕가 혈통명. 귀향 자격에 적합.';if(identity==='도시를 함락한 자')return '강한 전공명. 생존자에게 반감을 산다.';return '분석적이고 우회적인 이름.';}
function openNames(){const html=['귀환병','라에르테스의 아들','도시를 함락한 자','지략이 많은 자'].map(id=>'<button class="choice" onclick="setName(\''+id+'\')"><b>['+id+']</b><br>'+describeName(id)+'</button>').join('')+'<button class="choice locked" disabled><b>[OUTIS / 아무도 아님]</b><br>폐쇄되지 않은 작전명. 이번 장면에서는 장착 불가.</button>';show('신분철',html,'');}
function setName(identity){equippedName=identity;nameNow.textContent=equippedName;openNames();}
function openTicket(){show('귀향표','<div class="ticket">목적지: <b>이타카</b><br>승객명: 부분 번짐<br>상태: 유효<br>경고: OUTIS 작전명 미폐쇄<br><span class="stamp">'+(inspected?'APPROVED':'VALID')+'</span></div>');}
function talk(id){if(id==='prop')show('선전관','장군님, 수도행 개선 열차가 준비되었습니다. 대륙은 당신의 얼굴을 필요로 합니다.','<button class="choice" onclick="show(\'응답\',\'영웅도 결국 귀환병이라는 말씀이군요.\')"><b>['+equippedName+']</b> 나는 집으로 간다.</button>');if(id==='survivor')show('트로이 생존자','당신이 그 열차를 들여보낸 사람이군요.','<button class="choice" onclick="show(\'응답\',\'당신들에게는 끝났겠죠.\')"><b>['+equippedName+']</b> 전쟁은 끝났습니다.</button>');if(id==='inspector'){inspected=true;show('검표 결과','<div class="ticket">이타카행 연결편: 임시 승인<br>승객명: 부분 일치<br>출신: 이타카<br>군적: 대조 필요<br>작전명: OUTIS — 미폐쇄<br>주의: 포세이돈국 관할선 진입 전 기록 정리 권고<br><span class="stamp">APPROVED</span></div>\n\n검문관: 기록은 사람보다 오래 기다립니다.');}}
function interact(){if(!near)return;if(near.id==='gate'){if(!inspected){show('검표 필요','검문 게이트를 지나려면 먼저 검문관에게 귀향표와 탑승명을 제시해야 한다.');return;}cut.style.display='grid';cut.innerHTML='<article><h1>1장. 트로이 폐허역</h1><p>갈색 객차들이 플랫폼을 가득 메운다. 전쟁은 끝났다. 그러나 그의 이름들은 아직 정리되지 않았다.</p><button onclick="cut.style.display=\'none\'">플랫폼으로 돌아가기</button></article>';return;}if(objectText[near.id])show(objectText[near.id][0],objectText[near.id][1]);else talk(near.id);}

window.hide=hide;window.openNames=openNames;window.setName=setName;window.show=show;
window.onkeydown=e=>{const key=e.key.toLowerCase();if([' ','arrowleft','arrowright','a','d','e','i'].includes(key))e.preventDefault();if(e.repeat)return;if(key==='a'||key==='arrowleft')input.left=true;if(key==='d'||key==='arrowright')input.right=true;if(key===' ')queueJump();if(key==='e')interact();if(key==='i')openNames();};
window.onkeyup=e=>{const key=e.key.toLowerCase();if(key==='a'||key==='arrowleft')input.left=false;if(key==='d'||key==='arrowright')input.right=false;if(key===' '){input.jumpHeld=false;if(velocityY>0)velocityY*=.52;}};
function bindHold(button,property){button.onpointerdown=e=>{e.preventDefault();input[property]=true;button.setPointerCapture?.(e.pointerId);};button.onpointerup=e=>{e.preventDefault();input[property]=false;};button.onpointercancel=()=>{input[property]=false;};button.onpointerleave=()=>{input[property]=false;};}
bindHold(leftBtn,'left');bindHold(rightBtn,'right');jumpBtn.onpointerdown=e=>{e.preventDefault();queueJump();};jumpBtn.onpointerup=e=>{e.preventDefault();input.jumpHeld=false;if(velocityY>0)velocityY*=.52;};actBtn.onclick=interact;nameBtn.onclick=openNames;ticketBtn.onclick=openTicket;
requestAnimationFrame(update);
