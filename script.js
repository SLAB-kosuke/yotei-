import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* Firebase設定 */

const firebaseConfig = {
   apiKey: "AIzaSyDWq1YgFGl2e38Wgu603caujNfxCiXfCgQ",
    authDomain: "company-schedule-70cbb.firebaseapp.com",
    projectId: "company-schedule-70cbb",
    storageBucket: "company-schedule-70cbb.firebasestorage.app",
    messagingSenderId: "1020464054709",
    appId: "1:1020464054709:web:343e5498206fcb28c7d9fc"
};


/* Firebase開始 */

const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);

const auth =
  getAuth(app);


/* 匿名ログイン */

signInAnonymously(auth)
  .then(() => {

    console.log("匿名ログイン成功");

  })
  .catch((error) => {

    console.error(error);

  });


/* パスワード */

const APP_PASSWORD = "7201";


/* ログイン */

window.login = function(){

  const pass =
    document.getElementById("passwordInput").value;

  if(pass === APP_PASSWORD){

    document.getElementById("loginScreen")
      .style.display = "none";

  }else{

    alert("パスワードが違います");

  }

};


/* 基本 */

let currentDate = new Date();

let selectedDay = null;

let events = {};


/* 時間 */

const hourSelect =
  document.getElementById("hour");

for(let i=0;i<24;i++){

  const option =
    document.createElement("option");

  const value =
    i.toString().padStart(2,"0");

  option.value = value;

  option.textContent = value;

  hourSelect.appendChild(option);

}


/* 色 */

function getClass(name){

  switch(name){

    case "社長":
      return "boss";

    case "井手":
      return "ide";

    case "小助川":
      return "kosuke";

    default:
      return "";

  }

}


/* カレンダー */

window.renderCalendar = function(){

  const calendar =
    document.getElementById("calendar");

  calendar.innerHTML = "";

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  document.getElementById("monthYear")
    .innerText =
      `${year}年 ${month+1}月`;

  const dayNames =
    ["日","月","火","水","木","金","土"];

  dayNames.forEach(day=>{

    const div =
      document.createElement("div");

    div.className =
      "day-name";

    div.innerText = day;

    calendar.appendChild(div);

  });

  const firstDay =
    new Date(year,month,1).getDay();

  const lastDate =
    new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++){

    const empty =
      document.createElement("div");

    empty.className =
      "day empty";

    calendar.appendChild(empty);

  }

  for(let day=1;day<=lastDate;day++){

    const dateKey =
      `${year}-${month+1}-${day}`;

    const dayDiv =
      document.createElement("div");

    dayDiv.className =
      "day";

    dayDiv.innerHTML =
      `<div class="date">${day}</div>`;

    if(events[dateKey]){

      events[dateKey]
        .slice(0,5)
        .forEach(ev=>{

          const evDiv =
            document.createElement("div");

          evDiv.className =
            `event ${getClass(ev.name)}`;

          evDiv.innerHTML =
            `
            ${ev.time}
            ${ev.name}
            <br>
            ${ev.schedule}
            `;

          dayDiv.appendChild(evDiv);

        });

    }

    dayDiv.onclick = ()=>{

      openModal(dateKey);

    };

    calendar.appendChild(dayDiv);

  }

  renderMonthlyList();

};


/* モーダル */

window.openModal = function(date){

  selectedDay = date;

  document.getElementById("selectedDate")
    .innerText =
      `${date} の予定`;

  document.getElementById("modal")
    .style.display = "flex";

  renderDayEvents();

};


window.closeModal = function(){

  document.getElementById("modal")
    .style.display = "none";

};


/* group id */

function createGroupId(){

  return "group_" + Date.now();

}


/* 保存 */

window.saveEvent = async function(){

  const saveBtn =
    document.querySelector(".save-btn");

  saveBtn.disabled = true;

  saveBtn.innerText = "保存中...";

  const name =
    document.getElementById("name").value;

  const schedule =
    document.getElementById("schedule").value;

  const hour =
    document.getElementById("hour").value;

  const minute =
    document.getElementById("minute").value;

  const repeat =
    document.getElementById("repeatType").value;

  const time =
    `${hour}:${minute}`;

  if(!name || !schedule){

    alert("入力してください");

    saveBtn.disabled = false;

    saveBtn.innerText = "決定";

    return;

  }

  const groupId =
    createGroupId();

  await addDoc(

    collection(db,"companyEvents"),

    {

      date: selectedDay,

      name,

      schedule,

      time,

      repeat,

      groupId

    }

  );

  if(repeat !== "none"){

    await createRepeatEvents(
      selectedDay,
      name,
      schedule,
      time,
      repeat,
      groupId
    );

  }

  saveBtn.disabled = false;

  saveBtn.innerText = "決定";

  setTimeout(()=>{

    document.getElementById("name").value = "";

    document.getElementById("schedule").value = "";

    document.getElementById("hour").value = "00";

    document.getElementById("minute").value = "00";

    document.getElementById("repeatType").value = "none";

  },200);

};


/* 繰り返し */

async function createRepeatEvents(
  startDate,
  name,
  schedule,
  time,
  repeat,
  groupId
){

  let base =
    new Date(startDate);

  for(let i=1;i<=365;i++){

    let next =
      new Date(base);

    if(repeat==="daily"){

      next.setDate(
        base.getDate()+i
      );

    }

    if(repeat==="weekly"){

      next.setDate(
        base.getDate()+(7*i)
      );

    }

    if(repeat==="monthly"){

      next.setMonth(
        base.getMonth()+i
      );

    }

    if(
      repeat==="monthly" &&
      i > 12
    ){

      break;

    }

    if(
      repeat==="weekly" &&
      i > 52
    ){

      break;

    }

    const y =
      next.getFullYear();

    const m =
      next.getMonth()+1;

    const d =
      next.getDate();

    const key =
      `${y}-${m}-${d}`;

    await addDoc(

      collection(db,"companyEvents"),

      {

        date: key,

        name,

        schedule,

        time,

        repeat,

        groupId

      }

    );

  }

}


/* 削除 */

async function deleteEvent(id){

  if(
    !confirm(
      "削除しますか？"
    )
  ){

    return;

  }

  await deleteDoc(
    doc(db,"companyEvents",id)
  );

}


/* 当日削除 */

async function deleteSingleDay(
  groupId,
  targetDate
){

  if(
    !confirm(
      "この日だけ削除しますか？"
    )
  ){

    return;

  }

  if(!events[targetDate]){

    return;

  }

  for(const ev of events[targetDate]){

    if(ev.groupId === groupId){

      await deleteDoc(
        doc(db,"companyEvents",ev.id)
      );

    }

  }

}


/* 以降削除 */

async function deleteRepeatEvents(
  groupId,
  fromDate
){

  if(
    !confirm(
      "この日以降を削除しますか？"
    )
  ){

    return;

  }

  const start =
    new Date(fromDate);

  for(const date in events){

    const target =
      new Date(date);

    if(target >= start){

      for(const ev of events[date]){

        if(ev.groupId === groupId){

          await deleteDoc(
            doc(db,"companyEvents",ev.id)
          );

        }

      }

    }

  }

}


/* 全削除 */

async function deleteAllRepeatEvents(
  groupId
){

  if(
    !confirm(
      "繰り返し予定を全部削除しますか？"
    )
  ){

    return;

  }

  for(const date in events){

    for(const ev of events[date]){

      if(ev.groupId === groupId){

        await deleteDoc(
          doc(db,"companyEvents",ev.id)
        );

      }

    }

  }

}


/* 日別一覧 */

function renderDayEvents(){

  const dayEvents =
    document.getElementById("dayEvents");

  dayEvents.innerHTML = "";

  if(
    !events[selectedDay] ||
    events[selectedDay].length===0
  ){

    dayEvents.innerHTML =
      "予定はありません";

    return;

  }

  events[selectedDay]
    .forEach(ev=>{

      const div =
        document.createElement("div");

      div.className =
        "modal-event-item";

      const left =
        document.createElement("div");

      left.innerHTML =
        `
        ${ev.time}
        ｜ ${ev.name}
        ｜ ${ev.schedule}
        `;

      div.appendChild(left);

      const group =
        document.createElement("div");

      group.className =
        "button-group";
const editBtn =
  document.createElement("button");

editBtn.className =
  "repeat-delete-btn";

editBtn.innerText =
  "編集";

editBtn.onclick = ()=>{

  editEvent(ev);

};

group.appendChild(editBtn);
      const deleteBtn =
        document.createElement("button");

      deleteBtn.className =
        "delete-btn";

      deleteBtn.innerText =
        "削除";

      deleteBtn.onclick = ()=>{

        if(ev.repeat !== "none"){

          deleteSingleDay(
            ev.groupId,
            selectedDay
          );

        }else{

          deleteEvent(ev.id);

        }

      };

      group.appendChild(deleteBtn);

      if(ev.repeat !== "none"){

        const futureBtn =
          document.createElement("button");

        futureBtn.className =
          "repeat-delete-btn";

        futureBtn.innerText =
          "以降削除";

        futureBtn.onclick = ()=>{

          deleteRepeatEvents(
            ev.groupId,
            selectedDay
          );

        };

        group.appendChild(futureBtn);

        const allBtn =
          document.createElement("button");

        allBtn.className =
          "repeat-delete-btn";

        allBtn.innerText =
          "全削除";

        allBtn.onclick = ()=>{

          deleteAllRepeatEvents(
            ev.groupId
          );

        };

        group.appendChild(allBtn);

      }

      div.appendChild(group);

      dayEvents.appendChild(div);

    });

}


/* 月変更 */

window.changeMonth = function(num){

  currentDate.setMonth(
    currentDate.getMonth()+num
  );

  renderCalendar();

};


/* 一覧 */

function renderMonthlyList(){

  const monthlyList =
    document.getElementById("monthlyList");

  monthlyList.innerHTML = "";

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth()+1;

  let list = [];

  for(const date in events){

    const sp =
      date.split("-");

    if(
      Number(sp[0])===year &&
      Number(sp[1])===month
    ){

      events[date]
        .forEach(ev=>{

          list.push({

            date,
            ...ev

          });

        });

    }

  }

  list.sort((a,b)=>{

    if(a.date===b.date){

      return a.time.localeCompare(b.time);

    }

    return new Date(a.date)
      - new Date(b.date);

  });

  if(list.length===0){

    monthlyList.innerHTML =
      "予定はありません";

    return;

  }

  list.forEach(item=>{

    const div =
      document.createElement("div");

    div.className =
      "list-item";

    div.innerHTML =
      `
      ${item.date}
      ｜ ${item.time}
      ｜ ${item.name}
      ｜ ${item.schedule}
      `;

    monthlyList.appendChild(div);

  });

}


/* リアルタイム同期 */

onSnapshot(

  collection(db,"companyEvents"),

  (snapshot)=>{

    events = {};

    snapshot.forEach(docSnap=>{

      const data =
        docSnap.data();

      if(!events[data.date]){

        events[data.date] = [];

      }

      events[data.date].push({

        id: docSnap.id,

        ...data

      });

    });

    renderCalendar();

    if(selectedDay){

      renderDayEvents();

    }

  }

);


/* 初期表示 */

renderCalendar();


/* グローバル */

window.login = login;
window.saveEvent = saveEvent;
window.closeModal = closeModal;
window.changeMonth = changeMonth;
async function editEvent(ev){

  const newTime =
    prompt(
      "新しい時間",
      ev.time
    );

  if(!newTime){
    return;
  }

  const newSchedule =
    prompt(
      "新しい予定",
      ev.schedule
    );

  if(!newSchedule){
    return;
  }

  await updateDoc(
    doc(db,"companyEvents",ev.id),
    {
      time: newTime,
      schedule: newSchedule
    }
  );

}
window.openModal = openModal;


/* Service Worker */

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("./service-worker.js")
    .then(() => {

      console.log("Service Worker登録成功");

    });

}
