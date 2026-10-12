/** Gera a textura de nove fatias para botões e painéis CSS, sem arquivos externos. */
export function makeNineSlice(): string {
  const canvas=document.createElement("canvas");
  canvas.width=24;canvas.height=24;
  const g=canvas.getContext("2d");
  if(!g) return "";
  g.fillStyle="#0C1A2C";g.fillRect(0,0,24,24);
  g.fillStyle="#C7A477";g.fillRect(1,1,22,22);
  g.fillStyle="#5D7190";g.fillRect(3,3,18,18);
  g.fillStyle="#20324F";g.fillRect(4,4,16,16);
  g.fillStyle="rgba(255,245,213,.24)";g.fillRect(4,4,16,3);
  g.fillStyle="#E8C38B";
  for (const [x,y] of [[3,3],[19,3],[3,19],[19,19]]) g.fillRect(x,y,2,2);
  return canvas.toDataURL("image/png");
}
