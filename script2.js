
document.addEventListener("click", (e)=>{
  const tile = e.target.closest(".tile");
  if(!tile) return;
  const num = tile.querySelector(".num")?.textContent.trim();
  if(false && num==="01") openModal();
});
