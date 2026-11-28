(function(root){
 function sparkline(values){if(!values?.length)return '<div class="empty-chart">尚無歷史 K 線</div>';const w=720,h=260,min=Math.min(...values),max=Math.max(...values),span=max-min||1;const pts=values.map((v,i)=>`${i/(values.length-1)*w},${h-(v-min)/span*h}`).join(' ');return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="股價走勢"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;}
 root.StockCharts={sparkline};
})(window);
