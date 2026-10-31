// Annotates authentic, unmodified live screenshots with measured CSS-pixel
// guides. No DOM overlays are injected into the user's Bilibili tab.
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const directory=resolve(process.argv[2]||'tests/artifacts/carousel-live');
const states={};
for(const name of ['before','native','after']) {
  let audits;
  try{audits=JSON.parse(await readFile(join(directory,name+'-metrics.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')continue;throw error;}
  states[name]=audits;
  for(const s of audits) {
    const [width,height]=s.viewport,photo=await readFile(join(directory,`${name}-${width}.jpg`));
    const y=s.body.bottom,y2=Math.max(...s.secondBottoms),left=s.slot.left,right=width-20;
    const label=(y,text,color)=>`<rect x="${left+8}" y="${y-28}" width="390" height="23" rx="3" fill="#101820" fill-opacity=".94"/><text x="${left+14}" y="${y-12}" font-family="Arial" font-size="14" fill="${color}">${text}</text>`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <image width="${width}" height="${height}" href="data:image/jpeg;base64,${photo.toString('base64')}"/>
      <path d="M${left} ${y}H${right}" stroke="#35e5ff" stroke-width="2"/>
      <path d="M${left} ${y2}H${right}" stroke="#ff914d" stroke-width="2" stroke-dasharray="9 5"/>
      ${label(y,`Carousel bottom ${y.toFixed(2)}px${Math.abs(y-y2)<=2?' / row 2 aligned':''}`,'#35e5ff')}
      ${Math.abs(y-y2)>2?label(y2,`Row 2 bottom ${y2.toFixed(2)}px / gap ${s.delta.toFixed(2)}px`,'#ffad70'):''}
    </svg>`;
    await writeFile(join(directory,`${name}-${width}-guides.svg`),svg);
  }
}
if(states.before&&states.after) {
  const rows=states.after.map(a=>{
    const b=states.before.find(s=>s.viewport[0]===a.viewport[0]);
    if(a.delta>2)throw Error(a.viewport[0]+': live carousel alignment failed: '+a.delta);
    for(const key of ['slot','span']) {
      if(JSON.stringify(a[key])!==JSON.stringify(b[key]))throw Error(a.viewport[0]+': changed '+key);
    }
    // A refresh can return different recommendations and load more later rows.
    // Compare this two-row block exactly; full same-content card/grid parity is
    // independently asserted by carousel-alignment.mjs.
    for(const key of ['columns','gap'])if(a.grid[key]!==b.grid[key])throw Error(a.viewport[0]+': changed grid '+key);
    if(a.grid.rows.split(' ').slice(0,2).join(' ')!==b.grid.rows.split(' ').slice(0,2).join(' '))throw Error(a.viewport[0]+': changed first two grid tracks');
    for(const key of ['left','top','width'])if(a.grid.box[key]!==b.grid.box[key])throw Error(a.viewport[0]+': changed grid '+key);
    for(const [i,row] of a.rows.slice(0,2).entries()) {
      if(JSON.stringify(row)!==JSON.stringify(b.rows[i]))throw Error(a.viewport[0]+': changed ordinary-card geometry in row '+(i+1));
    }
    return `| ${a.viewport[0]} | ${b.body.bottom.toFixed(2)} | ${b.secondBottoms.map(v=>v.toFixed(2)).join(', ')} | ${a.body.bottom.toFixed(2)} | ${a.secondBottoms.map(v=>v.toFixed(2)).join(', ')} | ${a.delta.toFixed(2)} |`;
  });
  await writeFile(join(directory,'LIVE-CAROUSEL.md'),`# Live carousel alignment\n\nActual connected Bilibili screenshots. Cyan solid guides mark the visible carousel bottom; orange dashed guides mark row 2 information bottoms. The photographs are embedded unchanged in SVG annotations. Widths and coordinates are CSS pixels.\n\n| Width | Carousel before | Row 2 before | Carousel after | Row 2 after | After max difference |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nThe first two grid tracks, columns, gaps, carousel grid allocation/span and every measured ordinary cover/info/title/metadata rectangle in those two rows match the enabled before baseline exactly. Recommendations changed on refresh and later-row counts differ; this is not a same-content screenshot diff. The local regression separately checks all card/grid rectangles using identical content.\n\nNative/theme-off measurements are recorded separately in native-metrics.json. That state retains a 40px offset in one second-row card; all adjacent cards, including the displaced one, are included. Slide navigation, autoplay, loading and resize observations are in interactions.json.\n`);
  console.log(rows.join('\n'));
}
