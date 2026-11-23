"use strict";

const pages = Array.from(document.querySelectorAll(".rule-page"));
const tabs = Array.from(document.querySelectorAll(".tabs a"));
const previous = document.querySelector("#prev");
const next = document.querySelector("#next");
const printControl = document.querySelector("#print-rules");
const status = document.querySelector("#page-count");
const timers = [];
let position = 0;

function makeTimer(panel) {
  const seconds = Number(panel.dataset.duration);
  const output = panel.querySelector("output");
  const start = panel.querySelector("[data-start]");
  const note = panel.querySelector('[role="status"]');
  let interval = null;
  let deadline = 0;
  function stop() {
    window.clearInterval(interval);
    interval = null;
    start.disabled = false;
  }
  function reset() {
    stop();
    output.value = seconds + " 秒";
    note.textContent = "";
    start.textContent = "開始 " + seconds + " 秒";
  }
  function update() {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    output.value = left + " 秒";
    if (left === 0) {
      stop();
      note.textContent = "時間到";
      start.textContent = "再玩一次";
    }
  }
  start.addEventListener("click", () => {
    stop();
    deadline = Date.now() + seconds * 1000;
    start.disabled = true;
    note.textContent = "開始計時";
    interval = window.setInterval(update, 150);
    update();
  });
  panel.querySelector("[data-reset]").addEventListener("click", reset);
  return { reset };
}

function showPage() {
  const found = pages.findIndex(p => "#" + p.id === location.hash);
  position = found < 0 ? 0 : found;
  pages.forEach((page, index) => { page.hidden = index !== position; });
  tabs.forEach((link, index) => {
    if (index === position) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  previous.disabled = position === 0;
  next.disabled = position === pages.length - 1;
  status.textContent = (position + 1) + " / " + pages.length;
  timers.forEach(timer => timer.reset());
}
function step(direction) {
  const target = pages[position + direction];
  if (target) location.hash = target.id;
}
previous.addEventListener("click", () => step(-1));
next.addEventListener("click", () => step(1));
window.addEventListener("hashchange", showPage);
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    step(e.key === "ArrowRight" ? 1 : -1);
  }
});
document.querySelectorAll(".timer").forEach(panel => timers.push(makeTimer(panel)));
document.documentElement.classList.add("has-js");
document.querySelector("#pager").hidden = false;
printControl.hidden = false;
printControl.addEventListener("click", () => window.print());
showPage();
