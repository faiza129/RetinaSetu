function img(){
  const WORK = 300;
  const state = {
    caseId: null,
    patient: null,
    img: null,
    quality: null,
    enhancedQuality: null,
    enhancementApplied: false
  };
 
  const DIFFERENTIALS = [
    {name:'Hypertensive retinopathy', desc:'Flame-shaped hemorrhages and cotton-wool spots driven by high blood pressure rather than diabetes — worth a BP check before assuming DR.'},
    {name:'Retinal vein occlusion', desc:'Sudden, usually one-sided, widespread hemorrhage following a single vessel\u2019s territory, not the scattered dot-and-blot pattern typical of DR.'},
    {name:'Age-related macular degeneration', desc:'Drusen and macular changes in an older patient, without the scattered microaneurysms seen across the retina in DR.'},
    {name:'High myopia / myopic degeneration', desc:'A thinned, pale, \u201ctessellated\u201d fundus in someone with a strong glasses prescription — not lesions.'},
    {name:'Central serous retinopathy', desc:'A fluid pocket under the macula, often in younger patients under stress — no hemorrhages or exudates elsewhere.'},
    {name:'Retinal artery occlusion', desc:'Sudden, painless vision loss with a pale retina and a \u201ccherry-red spot\u201d at the macula — an emergency, not gradual DR change.'},
    {name:'Sickle cell retinopathy', desc:'Peripheral vessel changes in a patient with known sickle cell disease, rather than the central lesion pattern of DR.'},
    {name:'Cataract or vitreous haze', desc:'A hazy, low-quality image from a cloudy lens or vitreous, not true retinal pathology — usually caught by the quality gate, not scored as DR.'},
    {name:'Retinitis pigmentosa', desc:'Bone-spicule pigmentation with a history of night blindness, unrelated to diabetes.'},
    {name:'Radiation retinopathy', desc:'A DR-like hemorrhage and exudate pattern in a patient with a history of radiotherapy near the eye or head.'}
  ];
 
  function renderDifferentials(container, interactive){
    container.innerHTML = DIFFERENTIALS.map((d,i)=>
      '<li class="diff-item">'+
      (interactive ? '<input type="checkbox" class="diff-check" data-idx="'+i+'">' : '')+
      '<div><div class="diff-name">'+d.name+'</div><div class="diff-desc">'+d.desc+'</div></div>'+
      '</li>'
    ).join('');
  }
 
  function maskAadhaar(v){
    const digits = (v||'').replace(/\D/g,'');
    if(!digits) return '—';
    const last4 = digits.slice(-4);
    return 'XXXX XXXX '+last4;
  }
 
  // ---------- helpers ----------
  function $(id){return document.getElementById(id);}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function newCaseId(){
    const n = Math.floor(1000+Math.random()*9000);
    return "RS-2026-"+n;
  }
  function setStepState(name, cls){
    const li = document.querySelector('.step[data-step="'+name+'"]');
    if(!li) return;
    li.classList.remove('done','active');
    if(cls) li.classList.add(cls);
  }
  function markDone(names){ names.forEach(n=>setStepState(n,'done')); }
  function clearAllSteps(){
    document.querySelectorAll('.step').forEach(s=>s.classList.remove('done','active'));
    if(state.patient) setStepState('patient','done');
  }
 
  // ---------- sample fundus generator ----------
  function drawSample(kind){
    const c = document.createElement('canvas');
    c.width = WORK; c.height = WORK;
    const ctx = c.getContext('2d');
 
    // base retina
    const grad = ctx.createRadialGradient(WORK*0.42,WORK*0.4,10, WORK*0.5,WORK*0.5,WORK*0.62);
    grad.addColorStop(0,'#E8956B');
    grad.addColorStop(0.55,'#C9663C');
    grad.addColorStop(1,'#7A2E1E');
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0,0,WORK,WORK);
    ctx.beginPath();
    ctx.arc(WORK/2,WORK/2,WORK*0.47,0,Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.save();
    ctx.clip();
 
    // optic disc
    ctx.beginPath();
    ctx.ellipse(WORK*0.38, WORK*0.5, 16,13,0,0,Math.PI*2);
    const discGrad = ctx.createRadialGradient(WORK*0.38,WORK*0.5,2,WORK*0.38,WORK*0.5,16);
    discGrad.addColorStop(0,'#F4D9A8');
    discGrad.addColorStop(1,'#E3A863');
    ctx.fillStyle = discGrad;
    ctx.fill();
 
    // vessels
    ctx.strokeStyle = 'rgba(120,30,25,0.55)';
    ctx.lineCap='round';
    const seed = kind.length;
    for(let i=0;i<10;i++){
      ctx.beginPath();
      const ang = (i/10)*Math.PI*2 + seed;
      const sx = WORK*0.38 + Math.cos(ang)*8;
      const sy = WORK*0.5 + Math.sin(ang)*8;
      ctx.moveTo(sx,sy);
      const midx = WORK/2 + Math.cos(ang)*90 + Math.sin(ang*2)*20;
      const midy = WORK/2 + Math.sin(ang)*90 + Math.cos(ang*2)*20;
      const endx = WORK/2 + Math.cos(ang)*140;
      const endy = WORK/2 + Math.sin(ang)*140;
      ctx.quadraticCurveTo(midx,midy,endx,endy);
      ctx.lineWidth = 3.2 - i*0.15;
      ctx.stroke();
    }
 
    // lesions by severity
    const counts = {healthy:0, mild:2, moderate:6, severe:13, poor:1}[kind] || 0;
    function rand(seedNum){ return function(){ seedNum = (seedNum*9301+49297)%233280; return seedNum/233280; }; }
    const rnd = rand(kind.charCodeAt(0)*97+13);
    for(let i=0;i<counts;i++){
      const a = rnd()*Math.PI*2;
      const r = 40 + rnd()*100;
      const x = WORK/2 + Math.cos(a)*r;
      const y = WORK/2 + Math.sin(a)*r;
      if(rnd()>0.45){
        // hemorrhage / microaneurysm - dark red blob
        ctx.beginPath();
        ctx.fillStyle = 'rgba(60,10,8,0.75)';
        ctx.arc(x,y, 3+rnd()*4, 0, Math.PI*2);
        ctx.fill();
      } else {
        // exudate - yellow-white blob
        ctx.beginPath();
        ctx.fillStyle = 'rgba(250,232,150,0.85)';
        ctx.arc(x,y, 2.5+rnd()*3.5, 0, Math.PI*2);
        ctx.fill();
      }
    }
 
    // vignette
    const vg = ctx.createRadialGradient(WORK/2,WORK/2,WORK*0.2, WORK/2,WORK/2,WORK*0.48);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,WORK,WORK);
    ctx.restore();
 
    if(kind === 'poor'){
      // degrade quality: blur + darken + lower contrast
      const c2 = document.createElement('canvas');
      c2.width=WORK; c2.height=WORK;
      const ctx2 = c2.getContext('2d');
      ctx2.filter = 'blur(4px) brightness(0.55) contrast(0.6)';
      ctx2.drawImage(c,0,0);
      return c2;
    }
    return c;
  }
 
  // ---------- patient intake ----------
  function validatePatient(){
    const name = $('pName').value.trim();
    const age = $('pAge').value.trim();
    const gender = $('pGender').value;
    const district = $('pDistrict').value.trim();
    const town = $('pTown').value.trim();
    const pincode = $('pPincode').value.trim();
    const diabetic = $('pDiabetic').value;
    const aadhaarRaw = $('pAadhaar').value.trim();
    const aadhaarDigits = aadhaarRaw.replace(/\D/g,'');
 
    if(!name) return {ok:false, msg:'Enter the patient\u2019s name.'};
    if(!age || isNaN(age) || age<1 || age>120) return {ok:false, msg:'Enter a valid age (1\u2013120).'};
    if(!gender) return {ok:false, msg:'Select a gender.'};
    if(!district) return {ok:false, msg:'Enter a district.'};
    if(!town) return {ok:false, msg:'Enter a town or village.'};
    if(!/^\d{6}$/.test(pincode)) return {ok:false, msg:'Enter a valid 6-digit pincode.'};
    if(!diabetic) return {ok:false, msg:'Select the patient\u2019s diabetic status.'};
    if(aadhaarDigits && aadhaarDigits.length!==12) return {ok:false, msg:'Aadhaar number should be 12 digits, or left blank.'};
 
    return {ok:true, patient:{name,age,gender,district,town,pincode,diabetic,aadhaar:aadhaarDigits}};
  }
 
  function renderPatientSummary(p){
    $('patientSummaryBar').innerHTML =
      '<b>'+p.name+'</b> \u00b7 '+p.age+' \u00b7 '+p.gender+' \u00b7 '+p.town+', '+p.district+' \u2014 '+p.pincode+
      ' \u00b7 Diabetic: '+p.diabetic+
      (p.aadhaar ? ' \u00b7 Aadhaar '+maskAadhaar(p.aadhaar) : '');
  }
 
  $('patientContinueBtn').addEventListener('click', ()=>{
    const res = validatePatient();
    if(!res.ok){ $('patientError').textContent = res.msg; return; }
    $('patientError').textContent = '';
    state.patient = res.patient;
    renderPatientSummary(res.patient);
    $('panel-patient').classList.add('hidden');
    $('panel-upload').classList.remove('hidden');
    setStepState('patient','done');
    setStepState('upload','active');
    $('panel-upload').scrollIntoView({behavior:'smooth', block:'start'});
  });
 
  let diffRefRendered = false;
  $('refToggleBtn').addEventListener('click', ()=>{
    const panel = $('panel-differentials');
    const nowHidden = panel.classList.toggle('hidden');
    if(!diffRefRendered){ renderDifferentials($('diffListRef'), false); diffRefRendered = true; }
    $('refToggleBtn').textContent = nowHidden
      ? 'View conditions that are commonly mistaken for DR'
      : 'Hide conditions that are commonly mistaken for DR';
    if(!nowHidden) panel.scrollIntoView({behavior:'smooth', block:'start'});
  });
 
  // ---------- image loading ----------
  function loadImageToWorkCanvas(imgEl){
    const c = document.createElement('canvas');
    c.width = WORK; c.height = WORK;
    const ctx = c.getContext('2d');
    const iw = imgEl.naturalWidth || imgEl.width;
    const ih = imgEl.naturalHeight || imgEl.height;
    const side = Math.min(iw,ih);
    const sx = (iw-side)/2, sy=(ih-side)/2;
    ctx.drawImage(imgEl, sx, sy, side, side, 0, 0, WORK, WORK);
    return c;
  }
 
  // Heuristic sanity check that the uploaded picture actually looks like a
  // fundus photo — a roughly circular, reddish-orange retinal image — rather
  // than an arbitrary photo. Not a certified image-type classifier, just a
  // colour/uniformity gate to catch obviously wrong uploads before anything
  // downstream runs.
  function fundusLikelihood(canvas){
    const {data,width,height} = getImageData(canvas);
    let sumR=0,sumG=0,sumB=0,n=0;
    for(let i=0;i<data.length;i+=4){
      sumR+=data[i]; sumG+=data[i+1]; sumB+=data[i+2]; n++;
    }
    const avgR=sumR/n, avgG=sumG/n, avgB=sumB/n;
    const total = avgR+avgG+avgB || 1;
    const redShare = avgR/total;
    const blueShare = avgB/total;
    const warmth = avgR-avgB;
 
    // colour uniformity across a coarse grid — fundus photos are a smooth
    // warm gradient; most other photos have far more varied regions/colours
    const gridN = 6;
    const cellW = Math.floor(width/gridN), cellH = Math.floor(height/gridN);
    const cellWarmths = [];
    for(let gy=0; gy<gridN; gy++){
      for(let gx=0; gx<gridN; gx++){
        let cr=0,cg=0,cb=0,cn=0;
        for(let y=gy*cellH; y<gy*cellH+cellH; y++){
          for(let x=gx*cellW; x<gx*cellW+cellW; x++){
            const idx=(y*width+x)*4;
            cr+=data[idx]; cg+=data[idx+1]; cb+=data[idx+2]; cn++;
          }
        }
        const cbright=(cr+cg+cb)/(3*cn);
        if(cbright>15){ cellWarmths.push((cr-cb)/cn); }
      }
    }
    let consistency = 100;
    if(cellWarmths.length>2){
      const m = cellWarmths.reduce((a,b)=>a+b,0)/cellWarmths.length;
      const variance = cellWarmths.reduce((a,b)=>a+(b-m)**2,0)/cellWarmths.length;
      consistency = clamp(100 - Math.sqrt(variance)*0.6, 0, 100);
    }
 
    const warmthScore = clamp((warmth/45)*100, 0, 100);
    const redShareScore = clamp(((redShare-0.30)/0.20)*100, 0, 100);
    const blueShareScore = clamp(((0.34-blueShare)/0.20)*100, 0, 100);
 
    const score = 0.4*warmthScore + 0.25*redShareScore + 0.15*blueShareScore + 0.20*consistency;
    return {score, pass: score>=50};
  }
 
  function beginCase(sourceCanvas){
    resetPipelineUI();
    $('uploadError').textContent = '';
    state.caseId = newCaseId();
    $('caseIdInline').textContent = state.caseId;
    state.img = sourceCanvas;
    const dst = $('cvOriginal');
    dst.getContext('2d').drawImage(sourceCanvas,0,0,WORK,WORK,0,0,300,300);
    $('panel-upload').classList.add('hidden');
    $('panel-pipeline').classList.remove('hidden');
    setStepState('upload','done');
    setStepState('quality','active');
  }
 
  function resetPipelineUI(){
    $('panel-pipeline').classList.add('hidden');
    $('analysisSection').classList.add('hidden');
    clearAllSteps();
    $('qualityStatusWrap').innerHTML = '';
    $('enhanceNote').textContent = '';
    ['barBright','barContrast','barSharp','barQuality'].forEach(id=>$(id).style.width='0%');
    ['valBright','valContrast','valSharp','valQuality'].forEach(id=>$(id).textContent='—');
    $('runBtn').disabled = false;
    $('runBtn').textContent = 'Run quality check & enhancement';
  }
 
  // ---------- image analysis ----------
  function getImageData(canvas){
    return canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
  }
 
  function grayscaleStats(canvas){
    const {data,width,height} = getImageData(canvas);
    const gray = new Float32Array(width*height);
    let sum=0;
    for(let i=0,j=0;i<data.length;i+=4,j++){
      const g = 0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
      gray[j]=g; sum+=g;
    }
    const mean = sum/gray.length;
    let sq=0;
    for(let j=0;j<gray.length;j++){ sq += (gray[j]-mean)*(gray[j]-mean); }
    const std = Math.sqrt(sq/gray.length);
 
    // laplacian variance (sharpness), sampled every 2px for speed
    let lsum=0, lsq=0, lcount=0;
    for(let y=2;y<height-2;y+=2){
      for(let x=2;x<width-2;x+=2){
        const idx=y*width+x;
        const lap = -4*gray[idx]+gray[idx-1]+gray[idx+1]+gray[idx-width]+gray[idx+width];
        lsum+=lap; lsq+=lap*lap; lcount++;
      }
    }
    const lmean=lsum/lcount;
    const lapVar = lsq/lcount - lmean*lmean;
 
    return {gray,width,height,mean,std,lapVar};
  }
 
  function scoreQuality(stats){
    const brightScore = clamp(100 - Math.abs(stats.mean-130)/130*140, 0, 100);
    const contrastScore = clamp((stats.std/48)*100, 0, 100);
    const sharpScore = clamp((Math.sqrt(Math.max(stats.lapVar,0))/32)*100, 0, 100);
    const overall = 0.3*brightScore + 0.3*contrastScore + 0.4*sharpScore;
    let label='Good', cls='good';
    if(overall<45){label='Poor'; cls='bad';}
    else if(overall<75){label='Borderline'; cls='warn';}
    return {brightScore,contrastScore,sharpScore,overall,label,cls};
  }
 
  function renderQualityBars(q){
    $('barBright').style.width = q.brightScore.toFixed(0)+'%';
    $('valBright').textContent = q.brightScore.toFixed(0);
    $('barContrast').style.width = q.contrastScore.toFixed(0)+'%';
    $('valContrast').textContent = q.contrastScore.toFixed(0);
    $('barSharp').style.width = q.sharpScore.toFixed(0)+'%';
    $('valSharp').textContent = q.sharpScore.toFixed(0);
    $('barQuality').style.width = q.overall.toFixed(0)+'%';
    $('valQuality').textContent = q.overall.toFixed(0);
    $('qualityStatusWrap').innerHTML = '<span class="status-badge '+q.cls+'"><span class="status-dot"></span>'+q.label+' quality</span>';
    $('qualitySub').textContent = q.label;
  }
 
  function enhanceCanvas(canvas){
    const src = canvas.getContext('2d');
    const imageData = src.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;
    // find 2nd/98th percentile per channel roughly via sampling
    function stretch(channelOffset){
      let mn=255, mx=0;
      for(let i=channelOffset;i<data.length;i+=4){
        if(data[i]<mn) mn=data[i];
        if(data[i]>mx) mx=data[i];
      }
      mn = Math.max(mn,0); mx = Math.min(mx,255);
      const range = Math.max(mx-mn,1);
      for(let i=channelOffset;i<data.length;i+=4){
        let v = (data[i]-mn)/range*255;
        v = clamp(v*1.08 + 6, 0, 255);
        data[i]=v;
      }
    }
    stretch(0); stretch(1); stretch(2);
 
    const out = document.createElement('canvas');
    out.width=canvas.width; out.height=canvas.height;
    out.getContext('2d').putImageData(imageData,0,0);
 
    // light unsharp mask to lift sharpness score
    const ctx2 = out.getContext('2d');
    const base = ctx2.getImageData(0,0,out.width,out.height);
    const blurred = document.createElement('canvas');
    blurred.width=out.width; blurred.height=out.height;
    const bctx = blurred.getContext('2d');
    bctx.filter='blur(1.6px)';
    bctx.drawImage(out,0,0);
    const bd = bctx.getImageData(0,0,out.width,out.height).data;
    const od = base.data;
    for(let i=0;i<od.length;i+=4){
      for(let k=0;k<3;k++){
        const sharpened = od[i+k] + (od[i+k]-bd[i+k])*0.6;
        od[i+k]=clamp(sharpened,0,255);
      }
    }
    ctx2.putImageData(base,0,0);
    return out;
  }
 
  // ---------- pipeline runner ----------
  function delay(ms){return new Promise(res=>setTimeout(res,ms));}
 
  async function runPipeline(){
    $('runBtn').disabled = true;
    $('runBtn').textContent = 'Running…';
 
    // STEP 3: quality
    setStepState('quality','active');
    await delay(500);
    const stats = grayscaleStats(state.img);
    const q = scoreQuality(stats);
    state.quality = q;
    renderQualityBars(q);
    setStepState('quality','done');
 
    // STEP 4: enhancement
    setStepState('enhance','active');
    await delay(450);
    let workingCanvas = state.img;
    if(q.label !== 'Good'){
      workingCanvas = enhanceCanvas(state.img);
      state.enhancementApplied = true;
      const eStats = grayscaleStats(workingCanvas);
      const eq = scoreQuality(eStats);
      state.enhancedQuality = eq;
      $('enhanceNote').textContent = 'Enhancement applied — quality improved from '+q.overall.toFixed(0)+' to '+eq.overall.toFixed(0)+'/100.'+(eq.overall<40 ? ' Still below threshold — recapture recommended.' : '');
      renderQualityBars(eq);
    } else {
      state.enhancedQuality = q;
      $('enhanceNote').textContent = 'Quality already sufficient — enhancement step skipped.';
    }
    $('cvEnhanced').getContext('2d').drawImage(workingCanvas,0,0,WORK,WORK,0,0,220,220);
    setStepState('enhance','done');
    $('analysisSection').classList.remove('hidden');
 
    $('runBtn').disabled = true;
    $('runBtn').textContent = 'Enhancement complete';
  }
 
 
  // ---------- wiring ----------
  $('dropzone').addEventListener('click', ()=>$('fileInput').click());
  $('dropzone').addEventListener('dragover', e=>{e.preventDefault(); $('dropzone').classList.add('drag');});
  $('dropzone').addEventListener('dragleave', ()=>$('dropzone').classList.remove('drag'));
  $('dropzone').addEventListener('drop', e=>{
    e.preventDefault(); $('dropzone').classList.remove('drag');
    if(e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  $('fileInput').addEventListener('change', e=>{
    if(e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });
  function handleFile(file){
    const reader = new FileReader();
    reader.onload = ev=>{
      const img = new Image();
      img.onload = ()=>{
        const canvas = loadImageToWorkCanvas(img);
        const check = fundusLikelihood(canvas);
        if(!check.pass){
          $('uploadError').textContent = 'This doesn\u2019t look like a fundus (retina) photo — expected a roughly circular, reddish-orange retinal image. Please upload an actual fundus photo, or use one of the sample images below.';
          $('fileInput').value = '';
          return;
        }
        $('uploadError').textContent = '';
        beginCase(canvas);
      };
      img.onerror = ()=>{
        $('uploadError').textContent = 'Couldn\u2019t read that file as an image. Please choose a JPG or PNG fundus photo.';
        $('fileInput').value = '';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
 
  document.querySelectorAll('[data-sample]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const canvas = drawSample(btn.getAttribute('data-sample'));
      beginCase(canvas);
    });
  });
 
  $('runBtn').addEventListener('click', runPipeline);
  $('resetBtn').addEventListener('click', ()=>{
    // same patient, just pick a different image
    $('panel-pipeline').classList.add('hidden');
    $('panel-upload').classList.remove('hidden');
    clearAllSteps();
    setStepState('upload','active');
  });
  $('newCaseBtn').addEventListener('click', ()=>{
    // brand new screening — new patient too
    ['panel-pipeline','panel-differentials'].forEach(id=>$(id).classList.add('hidden'));
    $('panel-patient').classList.remove('hidden');
    ['pName','pAge','pDistrict','pTown','pPincode','pAadhaar'].forEach(id=>$(id).value='');
    ['pGender','pDiabetic'].forEach(id=>$(id).value='');
    $('patientError').textContent = '';
    state.patient = null;
    document.querySelectorAll('.step').forEach(s=>s.classList.remove('done','active'));
    setStepState('patient','active');
    window.scrollTo({top:0, behavior:'smooth'});
  });
 
  // ---------- init ----------
  setStepState('patient','active');
}

img();