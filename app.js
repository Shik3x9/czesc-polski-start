const app=document.querySelector("#app");
const notice=document.querySelector("#announcement");
const key="czesc-polski-v1";
const initial=()=>({done:{},quiz:{},spoken:{},slow:false,resume:""});
let state=initial();
try{const data=JSON.parse(localStorage.getItem(key)||"null");if(data?.done&&data?.quiz&&data?.spoken)state={...state,...data};}catch{}
let route="",lessonId="",timer,letterIndex=0,media,playingButton,recording,mic,micRequest=0,voiceUrl="",voiceLesson="";
const clean=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const one=(selector,root=document)=>root.querySelector(selector);
const many=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const btn=(label,action,arg="",style="")=>'<button type="button" class="btn '+style+'" data-action="'+action+'" data-arg="'+clean(arg)+'">'+label+'</button>';
const href=(label,route,style="")=>'<a class="btn '+style+'" href="#'+route+'">'+label+'</a>';
const card=(html,style="",id="")=>'<section class="card '+style+'"'+(id?' id="'+id+'"':"")+'>'+html+'</section>';
const badge=(text,style="")=>'<span class="pill '+style+'">'+clean(text)+'</span>';
const heading=(top,title,text)=>'<p class="eyebrow">'+clean(top)+'</p><h1>'+clean(title)+'</h1>'+(text?'<p class="lead">'+clean(text)+'</p>':"");
const play=(text,label="Слушать")=>btn('▶ <span>'+clean(label)+'</span>',"audio",text,"tiny soft play");
const textPL=text=>'<span lang="pl">'+clean(text)+'</span>';
const lessonLink=id=>"lesson/"+id;
const firstPending=()=>{
  const last=course.findIndex(x=>x.id===state.resume);
  const unfinished=x=>!state.done[x.id];
  return course.slice(Math.max(0,last)).find(unfinished)||course.find(unfinished);
};
const hasStarted=unit=>state.resume===unit.id||progress()>0||state.quiz[unit.id]||state.spoken[unit.id];
const num=id=>course.findIndex(x=>x.id===id)+1;
const progress=()=>course.filter(x=>state.done[x.id]).length;
const courseArt='<svg class="art" aria-hidden="true" viewBox="0 0 350 280"><circle cx="180" cy="143" r="119" fill="#ebbc70" opacity=".52"/><circle cx="180" cy="143" r="116" stroke="#902e33" stroke-width="1" fill="none" stroke-dasharray="2 7" opacity=".55"/><g transform="rotate(-11 152 123)"><rect x="60" y="49" width="158" height="139" rx="17" fill="#902e33"/><text x="105" y="145" font-family="Georgia,serif" font-size="86" font-style="italic" fill="#fff9ef">ł</text><path d="M177 81h15m-15 11h15m-15 11h15" stroke="#fff9ef" opacity=".55"/></g><g transform="rotate(13 231 172)"><rect x="163" y="114" width="144" height="111" rx="14" fill="#e9e0f3" stroke="#b9a8c9"/><text x="188" y="183" font-family="Georgia,serif" font-size="45" fill="#3f3051">Cześć!</text></g><path d="M48 209c22-5 35 22 58 12m170-161c9-17 24-19 36-12m-30 20c11-6 22-4 29 0" fill="none" stroke="#902e33" stroke-width="2.5" stroke-linecap="round"/><path d="M90 31h12m-6-6v12m212 190h12m-6-6v12" stroke="#902e33" stroke-width="2.2" stroke-linecap="round"/></svg>';
function announce(text){
  notice.textContent=text;clearTimeout(timer);
  timer=setTimeout(()=>{notice.textContent="";},4500);
}
function save(){
  try{localStorage.setItem(key,JSON.stringify(state));}
  catch{announce("Браузер не сохранил прогресс. Попробуйте обычное окно браузера.");}
}
function go(){
  const [page,slug=""]=location.hash.slice(1).split("/");
  route=["course","sounds","videos","lesson"].includes(page)?page:"home";
  lessonId=slug;
  if(route==="lesson"&&course.some(unit=>unit.id===lessonId)&&state.resume!==lessonId){
    state.resume=lessonId;save();
  }
  stopAudio();stopRecord(true);
  render(true);
}
function render(focus=false){
  const section=route==="lesson"?"course":route;
  const nav=[["home","Главная"],["course","Занятия"],["sounds","Звуки"],["videos","Видео"]];
  const views={home:home,course:routePage,sounds:sounds,videos:videos,lesson:lesson};
  app.innerHTML='<header class="bar"><div class="wrap"><a class="brand" href="#home"><img src="icon.svg" alt=""><span>Cześć!<small>Польский с нуля</small></span></a><nav class="nav" aria-label="Разделы">'+nav.map(([url,name])=>'<a href="#'+url+'" '+(section===url?'aria-current="page"':"")+'>'+name+'</a>').join("")+'</nav></div></header>'+
    '<main id="main" class="wrap" tabindex="-1">'+views[route]()+'</main><footer class="footer"><div class="wrap between"><p>Cześć! · Бесплатный курс для начинающих</p><p>Прогресс хранится в этом браузере</p></div></footer>';
  if(focus){window.scrollTo(0,0);one("main").focus({preventScroll:true});}
}
function progressCard(){
  const n=progress(),next=firstPending();
  return card('<div class="between"><div><p class="eyebrow">Ваш маршрут</p><h2 class="panel-title">'+(next?'Занятие '+num(next.id)+' · '+clean(next.title):"Базовый маршрут пройден")+'</h2></div>'+badge(n+" из "+course.length,"lilac")+'</div><progress class="progress" value="'+n+'" max="'+course.length+'" aria-label="Пройдено занятий"></progress><div class="row tabs">'+
    (next?href(hasStarted(next)?"Продолжить →":"Начать занятие →",lessonLink(next.id),"primary"):href("Повторить звуки","sounds","primary"))+href("Все занятия","course","clear")+'</div>');
}
function home(){
  const next=firstPending();
  return '<section class="hero"><div class="hero-content"><p class="eyebrow">A0 → A1 · Слушайте и говорите</p><h1>Польский с нуля</h1><p>Начните с «привет» и «добрый день». Дальше — буквы, польские звуки и разговоры, которые пригодятся в обычной жизни.</p><div class="row">'+
    href(next?(hasStarted(next)?"Продолжить занятия →":"Начать занятие 1 →"):"Повторить курс →",next?lessonLink(next.id):"course","primary")+
    href("Смотреть видео","videos","clear")+'</div></div>'+courseArt+'</section>'+
    '<section class="section">'+progressCard()+'</section><section class="section"><h2>Как устроено занятие</h2><div class="grid">'+
    [["01","Послушайте","Включите короткие фразы. Если быстро, переключите на медленный темп.","sounds","К звукам"],["02","Повторите","Послушайте реплику, поставьте на паузу и скажите её вслух.","videos","К видео"],["03","Проверьте себя","Ответьте на три вопроса и разыграйте ситуацию своими словами.","course","К занятиям"]].map(([n,t,d,r,l])=>card('<span class="tile-num">'+n+'</span><h3>'+t+'</h3><p>'+d+'</p>'+href(l,r,"tiny clear"),"feature")).join("")+'</div></section>';
}
function routePage(){
  return heading("14 занятий · польский для начинающих","Ваши занятия","Двигайтесь по порядку или откройте тему, которую хочется повторить. В среднем занятие занимает 10–15 минут.")+
    progressCard()+'<div class="stack section">'+course.map((x,i)=>{
      const done=state.done[x.id];
      return '<a href="#'+lessonLink(x.id)+'" class="card list-item"><span class="num '+(done?"done":"")+'">'+(done?"✓":String(i+1).padStart(2,"0"))+'</span><div><h3>'+clean(x.title)+'</h3><p class="muted">'+clean(x.goal)+'</p></div><span class="pill '+(done?"good":"lilac")+'">'+(done?"Пройдено":x.minutes+" мин")+'</span></a>';
    }).join("")+'</div>';
}
function clipHTML(clip,withLink){
  const base="video/"+clip.id;
  return '<video controls playsinline preload="none" poster="'+base+'.jpg" src="'+base+'.mp4" aria-label="'+clean(clip.title)+'"><a href="'+base+'.mp4">Скачать видео</a></video><div class="clip-body">'+badge(clip.tag)+"<h3>"+clean(clip.title)+"</h3><p class='muted'>"+clean(clip.description)+'</p>'+(withLink?href("К занятию "+num(clip.lesson)+" →",lessonLink(clip.lesson),"tiny clear"):"")+'</div>';
}
function videos(){
  return heading("Wideo · До минуты","Короткие видео","Смотрите с озвучкой или читайте подписи на экране. После видео повторите слова из связанного занятия.")+
    '<div class="video-grid">'+clips.map(c=>card(clipHTML(c,true),"clip")).join("")+'</div>';
}
function speedToolbar(){
  return '<div class="row audio-toolbar"><label><input id="slow" type="checkbox" '+(state.slow?"checked":"")+'> Медленнее (0,8×)</label>'+btn("■ Стоп","stop","","tiny clear")+'</div>';
}
function sounds(){
  return heading("Alfabet i dźwięki","Буквы и звуки","Нажмите на букву, чтобы услышать её в слове. Для ł пригодится белорусское ў, а похожие звуки можно сравнить в парах ниже.")+speedToolbar()+
    '<div class="letter-grid section">'+alphabet.map(([l,word,ru],i)=>'<button class="letter" type="button" data-action="letter" data-arg="'+i+'" aria-pressed="'+(i===letterIndex)+'"><b lang="pl">'+l+'</b><span lang="pl">'+clean(word)+'</span><small>'+clean(ru)+'</small></button>').join("")+'</div>'+
    '<div class="card sound-detail" id="letter-detail" aria-live="polite">'+letterDetail(letterIndex)+'</div>'+
    '<section class="section"><h2>Сравните на слух</h2><div class="video-grid">'+contrasts.map(([name,a,b,help])=>card('<h3 lang="pl">'+clean(name)+'</h3><p>'+clean(help)+'</p><div class="row">'+play(a,a)+play(b,b)+'</div>',"contrast")).join("")+'</div></section>';
}
function letterDetail(i){
  const [l,word,ru,hint]=alphabet[i];return '<h2 lang="pl">'+l+' · '+clean(word)+'</h2><p>'+clean(ru)+'. '+clean(hint)+'</p>'+play(word,"Ещё раз");
}
function soundGuideHTML(unit){
  return (unit.soundGuide||[]).map(({title,tip,examples})=>card(
    '<h2>'+clean(title)+'</h2><p>'+clean(tip)+'</p>'+examples.map(([word,hint])=>
      '<div class="phrase"><div><div class="polish">'+textPL(word)+'</div><p>'+clean(hint)+'</p></div>'+
      '<div class="row">'+play(word,word)+btn('▶ Медленно','audio-slow',word,'tiny clear')+'</div></div>'
    ).join(""),"sound-guide"
  )).join("");
}
const quizRevision=unit=>unit.quizRevision??1;
function quizAnswers(unit){
  const saved=state.quiz[unit.id];
  const answers=(saved?.revision??1)===quizRevision(unit)?saved?.answers:null;
  return unit.quiz.map((q,i)=>{
    const choice=answers?.[i];
    return Number.isInteger(choice)&&choice>=0&&choice<q.options.length?choice:null;
  });
}
function quizScore(unit,answers){
  return unit.quiz.filter((q,i)=>q.answer===answers[i]).length;
}
function quizSummary(unit,answers){
  const answered=answers.filter(a=>a!==null).length;
  if(!answered)return "";
  return "Верных ответов: "+quizScore(unit,answers)+" из "+unit.quiz.length+" · Отвечено: "+answered+" из "+unit.quiz.length;
}
function answerFeedback(q,choice){
  if(choice===null)return "";
  return (choice===q.answer?"Верно. ":"Правильный ответ: "+q.options[q.answer]+". ")+q.why;
}
function optionResult(q,choice,i){
  if(choice===null)return "";
  if(i===q.answer)return " is-correct";
  return i===choice?" is-incorrect":"";
}
function quizHTML(unit){
  const saved=quizAnswers(unit);
  return unit.quiz.map((q,i)=>'<fieldset class="card" data-question="'+i+'"><legend>'+(i+1)+'. '+clean(q.prompt)+'</legend>'+
    (q.mode==="listen"?'<div class="row">'+play(q.audio)+'</div><p><small>Сначала включите запись, затем выберите ответ.</small></p>':"")+
    (q.examples?'<div class="row quiz-examples">'+q.examples.map(word=>play(word,word)).join("")+'</div>':"")+
    '<div class="options">'+q.options.map((value,j)=>'<label class="option'+optionResult(q,saved[i],j)+'"><input type="radio" name="q'+i+'" value="'+j+'" '+(saved[i]===j?"checked":"")+'><span>'+clean(value)+'</span></label>').join("")+'</div>'+
    '<p class="feedback'+(saved[i]!==null&&saved[i]!==q.answer?' bad':'')+'" role="status">'+clean(answerFeedback(q,saved[i]))+'</p></fieldset>').join("");
}
function lesson(){
  const x=course.find(item=>item.id===lessonId);
  if(!x)return routePage();
  const n=num(x.id),next=course[n];
  const video=clips.find(c=>c.lesson===x.id);
  const nextLink=(style="")=>next?href("Следующее занятие →",lessonLink(next.id),style):href("К списку занятий","course",style);
  return '<article class="narrow"><a class="kicker" href="#course">← Все занятия</a><div class="section">'+heading("Занятие "+n+" из "+course.length+" · "+x.minutes+" мин",x.title,x.goal)+'</div>'+
    '<div class="row lesson-status">'+badge(x.polish,"lilac")+(state.done[x.id]?badge("✓ Пройдено","good"):"")+'</div>'+
    '<nav class="steps" aria-label="Шаги занятия">'+(video?btn("Видео","scroll","video-step","tiny clear"):"")+[["phrases","Слушать фразы"],["dialogue","Диалог"],["test","Проверка"],["say","Сказать вслух"]].map(([id,t])=>btn(t,"scroll",id,"tiny clear")).join("")+'</nav>'+
    '<div class="stack">'+(video?card('<h2>Посмотрите видео</h2>'+clipHTML(video,false),"lesson-video","video-step"):"")+
    card('<h2>На что обратить внимание</h2><p>'+clean(x.tip)+'</p>',"tip")+soundGuideHTML(x)+
    card('<h2>1. Слушайте и повторяйте</h2><p class="muted">Включите фразу и повторите её вслух два раза. Подсказку можно открыть после первого прослушивания.</p>'+speedToolbar()+
    x.phrases.map(p=>'<div class="phrase"><div><div class="polish">'+textPL(p.pl)+'</div><p>'+clean(p.ru)+'</p>'+(p.hint?'<details><summary>Подсказка</summary><p>'+clean(p.hint)+'</p></details>':"")+'</div>'+play(p.pl)+'</div>').join(""),"","phrases")+
    card('<h2>2. Послушайте диалог</h2><p class="muted">Сначала целиком, затем по репликам. Попробуйте сказать одну реплику вместо собеседника.</p>'+play(x.dialogue.map(d=>d.pl).join(" "),"Весь диалог")+
    x.dialogue.map(d=>'<div class="dialog-line"><div><span class="speaker">'+clean(d.who)+'</span><div class="polish">'+textPL(d.pl)+'</div><p class="muted">'+clean(d.ru)+'</p></div>'+play(d.pl)+'</div>').join(""),"","dialogue")+
    '<section id="test" class="stack"><div><h2>3. Проверьте себя</h2><p class="muted">Выберите ответ — разбор появится сразу. Можно менять ответы, вернуться позже или перейти к следующему занятию с любым результатом.</p></div>'+quizHTML(x)+
    '<div class="quiz-end"><p id="score">'+clean(quizSummary(x,quizAnswers(x)))+'</p><div class="row">'+btn("Попробовать сказать вслух ↓","scroll","say","clear")+nextLink("primary")+'</div></div></section>'+
    card('<h2>4. Скажите вслух</h2><p>'+clean(x.say.prompt)+'</p><details><summary>Открыть пример ответа</summary><p class="model" lang="pl">'+clean(x.say.model)+'</p>'+play(x.say.model,"Слушать пример")+'</details>'+
      '<div class="recording"><div class="row">'+btn("Записать себя","record",x.id,"tiny clear")+'<small id="record-status">По желанию · запись только в этой вкладке</small></div><div id="voice">'+voiceHTML(x.id)+'</div></div>'+
      '<label class="checked"><input type="checkbox" id="spoken" '+(state.spoken[x.id]?"checked":"")+'> Я сказал(а) ответ вслух</label>',"","say")+
    card('<div class="between"><div><h2>Завершение занятия</h2><p class="muted">Если уже попрактиковались, отметьте занятие пройденным. К нему всегда можно вернуться.</p></div><div class="row">'+btn(state.done[x.id]?"✓ Занятие пройдено":"Отметить пройденным","finish",x.id,"clear")+nextLink("primary")+'</div></div>')+'</div></article>';
}
function stopAudio(){
  if(media)media.pause();
  if(playingButton?.isConnected)playingButton.removeAttribute("aria-pressed");
  playingButton=null;
}
let playToken=0;
async function speak(text,control,speed=state.slow?0.8:1){
  stopAudio();
  many("video").forEach(v=>v.pause());
  const token=++playToken;
  try{
    const path=Object.hasOwn(audioFiles,text)?audioFiles[text]:"";
    if(!path)throw new Error("Missing audio");
    if(token!==playToken||!control.isConnected)return;
    media??=new Audio();
    media.src=path;media.playbackRate=speed;
    playingButton=control;control.setAttribute("aria-pressed","true");
    media.onended=()=>{if(token===playToken)stopAudio();};
    await media.play();
  }catch{if(token===playToken){stopAudio();announce("Не удалось включить запись. Попробуйте ещё раз.");}}
}
function voiceHTML(code){
  return voiceUrl&&voiceLesson===code?'<audio controls aria-label="Ваша запись" src="'+voiceUrl+'"></audio>':"";
}
function stopRecord(invalidate=false){
  if(invalidate)micRequest++;
  if(recording?.state==="recording")recording.stop();
  mic?.getTracks().forEach(track=>track.stop());mic=null;
}
async function record(code,control){
  if(recording?.state==="recording"){stopRecord();return;}
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){announce("В этом браузере запись недоступна. Произнесите ответ вслух.");return;}
  const token=++micRequest;
  try{
    stopAudio();const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(token!==micRequest||!control.isConnected){stream.getTracks().forEach(track=>track.stop());return;}
    mic=stream;const recorder=new MediaRecorder(stream),chunks=[];recording=recorder;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      stream.getTracks().forEach(track=>track.stop());
      if(recording===recorder)recording=null;
      if(token!==micRequest||!control.isConnected)return;
      if(chunks.length){
        if(voiceUrl)URL.revokeObjectURL(voiceUrl);
        voiceUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));voiceLesson=code;
      }
      control.textContent="Записать снова";
      one("#record-status").textContent=chunks.length?"Запись готова":"Запись пуста";
      one("#voice").innerHTML=voiceHTML(code);
    };
    recorder.start();control.textContent="Остановить запись";one("#record-status").textContent="Идёт запись…";
  }catch{stopRecord();announce("Микрофон недоступен. Вы можете ответить вслух без записи.");}
}
function finish(code,button){
  if(state.done[code]){announce("Это занятие уже отмечено пройденным.");return;}
  state.done[code]=true;save();
  button.textContent="✓ Занятие пройдено";
  one(".lesson-status").insertAdjacentHTML("beforeend",badge("✓ Пройдено","good"));
  announce("Занятие "+num(code)+" пройдено.");
}
document.addEventListener("click",event=>{
  const skip=event.target.closest(".skip");
  if(skip){event.preventDefault();one("main").focus();return;}
  const button=event.target.closest("[data-action]");
  if(!button)return;
  const {action,arg}=button.dataset;
  switch(action){
    case "audio":speak(arg,button);break;
    case "audio-slow":speak(arg,button,0.65);break;
    case "stop":playToken++;stopAudio();break;
    case "letter":{
      letterIndex=Number(arg);
      many(".letter").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
      one("#letter-detail").innerHTML=letterDetail(letterIndex);
      speak(alphabet[letterIndex][1],one("#letter-detail button"));break;
    }
    case "scroll":{const block=document.getElementById(arg);block?.scrollIntoView({block:"start"});if(block){block.tabIndex=-1;block.focus({preventScroll:true});}break;}
    case "record":record(arg,button);break;
    case "finish":finish(arg,button);break;
  }
});
document.addEventListener("play",event=>{if(event.target.tagName==="VIDEO"){playToken++;stopAudio();many("video").filter(v=>v!==event.target).forEach(v=>v.pause());}},true);
document.addEventListener("change",event=>{
  const input=event.target;
  if(input.id==="slow"){state.slow=input.checked;if(media)media.playbackRate=state.slow ? 0.8 : 1;save();}
  if(input.id==="spoken"){state.spoken[lessonId]=input.checked;save();}
  const field=input.closest("[data-question]");
  if(!field||input.type!=="radio"||!input.checked)return;
  const unit=course.find(item=>item.id===lessonId),i=Number(field.dataset.question);
  const q=unit.quiz[i],choice=Number(input.value),answers=quizAnswers(unit);
  answers[i]=choice;
  state.quiz[unit.id]={answers,revision:quizRevision(unit)};save();
  many(".option",field).forEach((label,j)=>{label.className="option"+optionResult(q,choice,j);});
  const out=one(".feedback",field);
  out.classList.toggle("bad",choice!==q.answer);
  out.textContent=answerFeedback(q,choice);
  one("#score").textContent=quizSummary(unit,answers);
});
window.addEventListener("hashchange",go);
go();
