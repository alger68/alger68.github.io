(function(){'use strict';
const $=s=>document.querySelector(s);
function render(){const box=$('#v3-decision-body');if(box)box.innerHTML='<p class="v3-muted">V3 dashboard modules loaded.</p>';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();
