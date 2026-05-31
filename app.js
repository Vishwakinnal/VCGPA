
let state={branch:'CSE',group:'physics',sem:0,student:{name:'',usn:'',college:'',year:''},marks:{},custom:{},targetCGPA:'',semsRemaining:''};
const $=id=>document.getElementById(id);function allSems(){return [...firstYearFor(state.group),...DATA[state.branch]]}function key(si,code,type){return `${state.branch}|${state.group}|${si}|${code}|${type}`}
function load(){try{const x=JSON.parse(localStorage.getItem('vcgpa.v2')||'{}');state={...state,...x}}catch(e){}}function save(){localStorage.setItem('vcgpa.v2',JSON.stringify(state))}
function grade(total,max){if(total==null)return{g:'-',p:null,include:true};const pct=total/max*100;if(pct>=90)return{g:'O',p:10,include:true};if(pct>=80)return{g:'A+',p:9,include:true};if(pct>=70)return{g:'A',p:8,include:true};if(pct>=60)return{g:'B+',p:7,include:true};if(pct>=55)return{g:'B',p:6,include:true};if(pct>=50)return{g:'C',p:5,include:true};if(pct>=40)return{g:'P',p:4,include:true};return{g:'F',p:0,include:true}}
function parts(si,sub){const c=parseFloat(state.marks[key(si,sub.code,'cie')]);const e=parseFloat(state.marks[key(si,sub.code,'see')]);return{cie:c,see:e,hasCIE:!isNaN(c),hasSEE:!isNaN(e)}}
function total(si,sub){if(sub.mandatory||sub.credits===0)return null;const m=parts(si,sub);if(sub.cieOnly)return m.hasCIE?m.cie:null;if(!m.hasCIE||!m.hasSEE)return null;return m.cie+m.see}function max(sub){return sub.cieOnly?sub.maxCIE:sub.maxCIE+sub.maxSEE}
function courseGrade(si,sub){const t=total(si,sub);if(t==null)return{g:'-',p:null,include:true};const m=parts(si,sub);if(!sub.cieOnly&&m.cie<sub.maxCIE*.40)return{g:'DX',p:0,include:false};if(!sub.cieOnly&&m.see<sub.maxSEE*.35)return{g:'F',p:0,include:true};if(t<max(sub)*.40)return{g:'F',p:0,include:true};return grade(t,max(sub))}
function sgpa(si){let pts=0,cr=0,en=0;allSems()[si].subs.forEach(sub=>{const t=total(si,sub);if(t!=null&&sub.credits>0){const gr=courseGrade(si,sub);if(gr.p!==null&&gr.include!==false){pts+=gr.p*sub.credits;cr+=sub.credits}en++}});return cr?{sgpa:(pts/cr).toFixed(2),credits:cr,entered:en}:null}
function cgpa(){let pts=0,cr=0,sems=0;allSems().forEach((sem,si)=>{let any=false;sem.subs.forEach(sub=>{const t=total(si,sub);if(t!=null&&sub.credits>0){const gr=courseGrade(si,sub);if(gr.p!==null&&gr.include!==false){pts+=gr.p*sub.credits;cr+=sub.credits}any=true}});if(any)sems++});return cr?{cgpa:(pts/cr).toFixed(2),credits:cr,sems}:null}
function overallGrade(c){return c?grade(parseFloat(c)*10,100).g:'-'}
function cls(c){const m=parseFloat(c)*10;if(isNaN(m))return null;if(m>=70)return['First Class with Distinction','dist'];if(m>=60)return['First Class','first'];if(m>=50)return['Second Class','second'];if(m>=40)return['Pass Class','pass'];return['Below Pass','fail']}
function custom(si,code,field,fallback){return state.custom[key(si,code,field)]??fallback}
function setCustom(si,code,field,val){state.custom[key(si,code,field)]=val;save();render()}
function render(){const sems=allSems();$('branchSelect').value=state.branch;$('groupSelect').value=state.group;['Name','USN','College','Year'].forEach(n=>{$('stu'+n).value=state.student[n.toLowerCase()]||''});$('tabs').innerHTML=sems.map((s,i)=>`<button class="tab ${i===state.sem?'on':''} ${sgpa(i)?'done':''}" onclick="state.sem=${i};save();render()">Sem ${s.sem}</button>`).join('');const sem=sems[state.sem];$('semTitle').textContent=sem.title;$('semMeta').textContent=`${BRANCHES[state.branch]} | ${sem.subs.filter(x=>x.credits>0).reduce((a,b)=>a+b.credits,0)} credit-bearing credits listed` ;const r=sgpa(state.sem);$('sgpaChip').textContent='SGPA: '+(r?r.sgpa:'-');$('table').innerHTML=table(sem,state.sem);$('targetCGPA').value=state.targetCGPA||'';$('semsRemaining').value=state.semsRemaining||'';renderSide();}
function table(sem,si){return `<div class="table-wrap"><table class="marks"><thead><tr><th>Subject</th><th>Cr.</th><th>CIE</th><th>SEE</th><th>Total</th><th>Grade</th><th>GP</th></tr></thead><tbody>${sem.subs.map(sub=>{const t=total(si,sub);const gr=courseGrade(si,sub);const gcls='g'+gr.g.replace('+','p');const code=custom(si,sub.code,'code',sub.code),name=custom(si,sub.code,'name',sub.name);return `<tr><td>${sub.editable?`<input class="subject-edit" value="${esc(code)}" onchange="setCustom(${si},'${escAttr(sub.code)}','code',this.value)"><input class="subject-edit name" value="${esc(name)}" onchange="setCustom(${si},'${escAttr(sub.code)}','name',this.value)">`:`<b>${esc(name)}</b><div class="code">${esc(code)}</div>`}</td><td><span class="credit">${sub.credits}</span></td><td><input type="number" min="0" max="${sub.maxCIE}" step="0.5" value="${state.marks[key(si,sub.code,'cie')]??''}" onchange="mark(${si},'${escAttr(sub.code)}','cie',this.value,${sub.maxCIE})" ${sub.credits===0?'placeholder="MC"':''}></td><td>${sub.cieOnly?'<span class="muted">N/A</span>':`<input type="number" min="0" max="${sub.maxSEE}" step="0.5" value="${state.marks[key(si,sub.code,'see')]??''}" onchange="mark(${si},'${escAttr(sub.code)}','see',this.value,${sub.maxSEE})">`}</td><td>${t==null?'-':t.toFixed(1)+' / '+max(sub)}</td><td class="grade ${gcls}">${gr.g}</td><td class="grade">${gr.p??'-'}</td></tr>`}).join('')}</tbody></table></div>`}
function mark(si,code,type,val,m){if(val==='' ){delete state.marks[key(si,code,type)]}else{const v=parseFloat(val);if(isNaN(v)||v<0||v>m){alert(`Enter marks between 0 and ${m}`);return}state.marks[key(si,code,type)]=v}save();render()}
function predictTargetCGPA(){
  const targetVal = parseFloat(state.targetCGPA);
  const semsRemVal = parseInt(state.semsRemaining);
  const outputEl = $('predictionOutput');
  if (!outputEl) return;
  if (isNaN(targetVal) || isNaN(semsRemVal) || semsRemVal <= 0) {
    outputEl.innerHTML = '';
    return;
  }
  let earnedCredits = 0;
  let earnedPoints = 0;
  allSems().forEach((sem, si) => {
    sem.subs.forEach(sub => {
      const t = total(si, sub);
      if (t != null && sub.credits > 0) {
        const gr = courseGrade(si, sub);
        if (gr.p !== null && gr.include !== false) {
          earnedPoints += gr.p * sub.credits;
          earnedCredits += sub.credits;
        }
      }
    });
  });
  let remCredits = 0;
  const sems = allSems();
  const remSems = sems.slice(-semsRemVal);
  remSems.forEach(sem => {
    sem.subs.forEach(sub => {
      if (sub.credits > 0) {
        remCredits += sub.credits;
      }
    });
  });
  if (remCredits === 0) {
    outputEl.innerHTML = '<div class="muted" style="margin-top:10px;font-size:12px;color:var(--red)">No credits in remaining semesters.</div>';
    return;
  }
  const gpReq = targetVal * (earnedCredits + remCredits);
  const gpFuture = gpReq - earnedPoints;
  const reqSGPA = gpFuture / remCredits;
  let badgeText = '';
  let badgeClass = '';
  if (reqSGPA > 10.0) {
    badgeText = 'Impossible';
    badgeClass = 'fail';
  } else if (reqSGPA > 9.0) {
    badgeText = 'Highly Challenging';
    badgeClass = 'dist';
  } else if (reqSGPA >= 4.0) {
    badgeText = 'Achievable';
    badgeClass = 'first';
  } else {
    badgeText = 'On Track';
    badgeClass = 'first';
  }
  outputEl.innerHTML = `<div style="margin-top:12px;font-size:13px;line-height:1.5"><div>Required Future SGPA: <b>${reqSGPA.toFixed(2)}</b></div><div style="margin-top:6px">Feasibility: <span class="pill ${badgeClass}">${badgeText}</span></div></div>`;
}
function renderSide(){const c=cgpa();$('cgpaDisplay').textContent=c?c.cgpa:'-';$('pctDisplay').textContent='Percentage: '+(c?(parseFloat(c.cgpa)*10).toFixed(1)+'%':'-');const cc=c?cls(c.cgpa):null;$('classDisplay').innerHTML=cc?`<span class="pill ${cc[1]}">${cc[0]}</span><div class="muted" style="margin-top:6px">Overall Grade: ${overallGrade(c.cgpa)}</div>`:'';$('downloadBtn').disabled=!c;$('bars').innerHTML=allSems().map((s,i)=>{const r=sgpa(i),v=r?parseFloat(r.sgpa):0;return `<div class="bar"><span>S${s.sem}</span><span class="track"><span class="fill" style="display:block;width:${v*10}%"></span></span><span>${r?r.sgpa:'-'}</span></div>`}).join('');predictTargetCGPA();}
function esc(x){return String(x).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}function escAttr(x){return String(x).replace(/'/g,"\\'")}
function pdf(){const {jsPDF}=window.jspdf;const doc=new jsPDF();const W=210;let y=14;doc.setFillColor(16,63,120);doc.rect(0,0,W,34,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI',W/2,12,{align:'center'});doc.setFontSize(11);doc.text('PROVISIONAL GRADE REPORT - 2022 SCHEME',W/2,21,{align:'center'});doc.setFontSize(8);doc.text('Generated by V CGPA | For student reference only',W/2,28,{align:'center'});y=42;doc.setTextColor(20);doc.setFontSize(9);const lines=[['Name',state.student.name||'-'],['USN',state.student.usn||'-'],['College',state.student.college||'-'],['Branch',BRANCHES[state.branch]],['Academic Year',state.student.year||'-']];lines.forEach((r,i)=>{const x=i%2?112:14;const yy=y+Math.floor(i/2)*8;doc.setFont('helvetica','bold');doc.text(r[0]+':',x,yy);doc.setFont('helvetica','normal');doc.text(String(r[1]).slice(0,42),x+27,yy)});y+=28;allSems().forEach((sem,si)=>{const r=sgpa(si);if(!r)return;if(doc.internal.getNumberOfPages()===1&&y>235){doc.addPage();y=16}else if(y>250){doc.addPage();y=16}doc.setFillColor(232,240,251);doc.rect(14,y,182,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(16,63,120);doc.text(`${sem.title}   SGPA: ${r.sgpa}`,16,y+5.5);y+=11;doc.setFontSize(7);doc.setTextColor(80);['Code','Subject','Cr','CIE','SEE','Total','Gr','GP'].forEach((h,i)=>doc.text(h,[14,34,117,128,141,154,176,187][i],y));y+=5;sem.subs.forEach(sub=>{const t=total(si,sub);if(t==null&&sub.credits>0)return;if(doc.internal.getNumberOfPages()===1&&y>235){doc.addPage();y=16}else if(y>282){doc.addPage();y=16}const gr=courseGrade(si,sub);doc.setTextColor(30);doc.setFont('helvetica','normal');const code=custom(si,sub.code,'code',sub.code),name=custom(si,sub.code,'name',sub.name);const cie=state.marks[key(si,sub.code,'cie')]??'-',see=sub.cieOnly?'N/A':(state.marks[key(si,sub.code,'see')]??'-');doc.text(String(code).slice(0,14),14,y);doc.text(String(name).slice(0,43),34,y);doc.text(String(sub.credits),119,y);doc.text(String(cie),129,y);doc.text(String(see),142,y);doc.text(t==null?'-':t.toFixed(1)+'/'+max(sub),154,y);doc.setFont('helvetica','bold');doc.text(gr.g,177,y);doc.text(gr.p==null?'-':String(gr.p),188,y);y+=5});y+=4});const c=cgpa(),cc=c?cls(c.cgpa):null;if(y>240){doc.addPage();y=16}doc.setFillColor(16,63,120);doc.roundedRect(14,y,182,36,2,2,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Academic Summary',W/2,y+9,{align:'center'});doc.setFontSize(10);doc.text(`CGPA: ${c?c.cgpa:'-'}     Percentage: ${c?(parseFloat(c.cgpa)*10).toFixed(1)+'%':'-'}     Overall Grade: ${c?overallGrade(c.cgpa):'-'}`,W/2,y+21,{align:'center'});doc.text(`Classification: ${cc?cc[0]:'-'}`,W/2,y+29,{align:'center'});const targetVal=parseFloat(state.targetCGPA);const semsRemVal=parseInt(state.semsRemaining);if(!isNaN(targetVal)&&!isNaN(semsRemVal)&&semsRemVal>0){let earnedCredits=0;let earnedPoints=0;allSems().forEach((sem,si)=>{sem.subs.forEach(sub=>{const t=total(si,sub);if(t!=null&&sub.credits>0){const gr=courseGrade(si,sub);if(gr.p!==null&&gr.include!==false){earnedPoints+=gr.p*sub.credits;earnedCredits+=sub.credits}}});});let remCredits=0;const sems=allSems();const remSems=sems.slice(-semsRemVal);remSems.forEach(sem=>{sem.subs.forEach(sub=>{if(sub.credits>0){remCredits+=sub.credits}})});if(remCredits>0){const gpReq=targetVal*(earnedCredits+remCredits);const gpFuture=gpReq-earnedPoints;const reqSGPA=gpFuture/remCredits;let badgeText='';if(reqSGPA>10.0)badgeText='Impossible';else if(reqSGPA>9.0)badgeText='Highly Challenging';else if(reqSGPA>=4.0)badgeText='Achievable';else badgeText='On Track';const currentActivePage=doc.internal.getNumberOfPages();doc.setPage(1);const yProj=245;doc.setFillColor(232,240,251);doc.setDrawColor(16,63,120);doc.setLineWidth(0.5);doc.roundedRect(14,yProj,182,32,2,2,'FD');doc.setTextColor(16,63,120);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('Target Projections',20,yProj+8);doc.setFontSize(9);doc.setTextColor(30);doc.setFont('helvetica','normal');doc.text(`Current CGPA: ${c?c.cgpa:'-'}`,20,yProj+17);doc.text(`Target CGPA: ${targetVal.toFixed(2)}`,20,yProj+25);doc.text(`Semesters Remaining: ${semsRemVal}`,90,yProj+17);doc.setFont('helvetica','bold');doc.text(`Required Future SGPA: ${reqSGPA.toFixed(2)}`,90,yProj+25);doc.text(`Status: ${badgeText}`,155,yProj+17);doc.setPage(currentActivePage)}}doc.save(`VTU_2022_Report_${state.student.usn||state.branch}.pdf`)}
function init(){load();$('branchSelect').innerHTML=Object.entries(BRANCHES).map(([k,v])=>`<option value="${k}">${v} (${k})</option>`).join('');$('branchSelect').onchange=e=>{state.branch=e.target.value;state.sem=0;save();render()};$('groupSelect').onchange=e=>{state.group=e.target.value;state.sem=0;save();render()};['Name','USN','College','Year'].forEach(n=>{$('stu'+n).oninput=e=>{state.student[n.toLowerCase()]=e.target.value;save()}});$('targetCGPA').oninput=e=>{state.targetCGPA=e.target.value;save();predictTargetCGPA()};$('semsRemaining').oninput=e=>{state.semsRemaining=e.target.value;save();predictTargetCGPA()};$('prevBtn').onclick=()=>{state.sem=Math.max(0,state.sem-1);save();render()};$('nextBtn').onclick=()=>{state.sem=Math.min(allSems().length-1,state.sem+1);save();render()};$('clearSem').onclick=()=>{Object.keys(state.marks).forEach(k=>{if(k.includes(`|${state.sem}|`))delete state.marks[k]});save();render()};$('clearAll').onclick=()=>{if(confirm('Clear all saved marks and details?')){localStorage.removeItem('vcgpa.v2');location.reload()}};$('downloadBtn').onclick=pdf;render()}init();

