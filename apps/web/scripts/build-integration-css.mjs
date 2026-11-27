import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const sourceDir=path.resolve("src/styles");
const outputDir=path.resolve("dist");
const files=["tokens.css","global.css","academy.css","labs.css","auth.css","platform.css","progression.css"];
const contents=await Promise.all(files.map(file=>readFile(path.join(sourceDir,file),"utf8")));
const fontImport='@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap");';
const normalized=contents.map(css=>css.replace(/^\s*@import\s+url\("[^"]+"\);\s*/gm,"")).join("\n");
const prefix=".cyberbreach-root";

function isInsideKeyframes(rule){
 let parent=rule.parent;
 while(parent){if(parent.type==="atrule"&&parent.name.toLowerCase().includes("keyframes"))return true;parent=parent.parent;}
 return false;
}
function scopeSelector(selector){
 const value=selector.trim();
 if(value===":root"||value==="html"||value==="body")return prefix;
 if(value.startsWith(":root"))return value.replace(/^:root/,prefix);
 if(value.startsWith("html"))return value.replace(/^html/,prefix);
 if(value.startsWith("body"))return value.replace(/^body/,prefix);
 if(value==="*")return `${prefix} *`;
 return `${prefix} ${value}`;
}
const scopePlugin={postcssPlugin:"cyberbreach-css-scope",Rule(rule){
 if(isInsideKeyframes(rule))return;
 rule.selector=rule.selectors.map(scopeSelector).join(", ");
}};
const result=await postcss([scopePlugin]).process(`${fontImport}\n${normalized}`,{from:path.join(sourceDir,"integration-source.css")});
await mkdir(outputDir,{recursive:true});
await writeFile(path.join(outputDir,"cyberbreach.integration.css"),result.css,"utf8");
console.log("Wrote dist/cyberbreach.integration.css");
