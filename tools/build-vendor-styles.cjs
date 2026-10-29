// Preserve the installed Bootstrap styles used anywhere in the app, including
// lazy routes, component styles and TS-driven classes. Regenerated before builds.
const fs=require('fs');
const path=require('path');
const postcss=require('postcss');
const selectors=require('postcss-selector-parser');
const root=path.resolve(__dirname,'..');
let sources='';
function scan(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())scan(file);
    else if(/\.(html|ts|scss)$/.test(file)&&!file.endsWith('.spec.ts'))sources+='\n'+fs.readFileSync(file,'utf8');
  }
}
scan(path.join(root,'src'));
const used=new Set(sources.match(/[A-Za-z_][A-Za-z0-9_-]*/g)||[]);
// Classes managed at runtime by Bootstrap / validation and Angular state changes.
for(const name of ['active','show','fade','disabled','collapse','collapsing','modal-open','modal-backdrop','offcanvas-backdrop','was-validated','is-valid','is-invalid'])used.add(name);
function prune(input){
  const css=postcss.parse(input);
  css.walkRules(rule=>{
    if(rule.parent.type==='atrule'&&/keyframes$/i.test(rule.parent.name))return;
    const kept=[];
    try{
      selectors(ast=>ast.each(selector=>{
        let keep=true;
        selector.walkClasses(node=>{
          let parent=node.parent,negated=false;
          while(parent){if(parent.type==='pseudo'&&parent.value===':not')negated=true;parent=parent.parent;}
          if(!negated&&!used.has(node.value))keep=false;
        });
        if(!/<legend\b/i.test(sources)&&selector.toString().includes('legend'))keep=false;
        if(keep)kept.push(selector.toString());
      })).processSync(rule.selector);
    }catch{
      // Invalid selectors never applied in browsers. Do not ship them to the
      // older critical-CSS parser used by this Angular build.
    }
    if(kept.length)rule.selector=kept.join(',');else rule.remove();
  });
  css.walkAtRules(rule=>{if(rule.nodes&&rule.nodes.length===0)rule.remove();});
  return css.toString();
}
const bootstrap=fs.readFileSync(path.join(root,'node_modules/bootstrap/dist/css/bootstrap.min.css'),'utf8');
const icons=fs.readFileSync(path.join(root,'node_modules/bootstrap-icons/font/bootstrap-icons.css'),'utf8')
  .replace(/\.\/fonts\//g,'../../node_modules/bootstrap-icons/font/fonts/');
const result='/* Generated from installed Bootstrap and Bootstrap Icons. Run npm run styles:vendor after adding dynamic classes. */\n'+prune(bootstrap)+'\n'+prune(icons);
fs.mkdirSync(path.join(root,'src/styles'),{recursive:true});
fs.writeFileSync(path.join(root,'src/styles/vendor.css'),result);
console.log(`Vendor CSS: ${Buffer.byteLength(result)} bytes (full libraries: ${Buffer.byteLength(bootstrap)+Buffer.byteLength(icons)} bytes)`);
