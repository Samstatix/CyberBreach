import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import prefixSelector from "postcss-prefix-selector";

const sourceDir=path.resolve("src/styles");
const outputDir=path.resolve("dist");
const files=["tokens.css","global.css","academy.css","labs.css","auth.css","platform.css"];
const contents=await Promise.all(files.map(file=>readFile(path.join(sourceDir,file),"utf8")));
const fontImport='@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap");';
const normalized=contents.map(css=>css.replace(/^\s*@import\s+url\([^;]+;\s*/m,"")).join("\n");
const result=await postcss([prefixSelector({prefix:".cyberbreach-root",transform(prefix,selector,prefixedSelector,filePath,rule){
 if(selector===":root"||selector==="html"||selector==="body")return prefix;
 if(selector==="*")return `${prefix} *`;
 if(rule?.parent?.type==="atrule"&&rule.parent.name.toLowerCase().includes("keyframes"))return selector;
 return prefixedSelector;
}})]).process(`${fontImport}\n${normalized}`,{from:path.join(sourceDir,"integration-source.css")});
await mkdir(outputDir,{recursive:true});
await writeFile(path.join(outputDir,"cyberbreach.integration.css"),result.css,"utf8");
console.log("Wrote dist/cyberbreach.integration.css");
