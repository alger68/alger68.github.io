import {useEffect,useRef} from 'react';
import type {Project,Result} from '@/lib/power/model';
type Tool={name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown|Promise<unknown>};
type Context={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
function emptyInput(input:unknown){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('This tool accepts an empty object only.');}
export function usePowerTools(project:Project|undefined,result:Result|null,run:(p:Project)=>Promise<Result|undefined>){
 const state=useRef({project,result,run});
 useEffect(()=>{state.current={project,result,run};},[project,result,run]);
 useEffect(()=>{
  const context=(document as Document&{modelContext?:Context}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tools:Tool[]=[
   {name:'read_current_power_design',title:'Read current power design',description:'Read the selected project specifications and the currently displayed analytical metrics. Does not modify the project.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input){emptyInput(input);const s=state.current;if(!s.project)throw new Error('Workspace is loading.');return {name:s.project.name,spec:s.project.spec,metrics:s.result?.metrics??null,modelVersion:s.result?.version??null};}},
   {name:'calculate_current_power_design',title:'Calculate current power design',description:'Run the same server calculation as the visible Execute calculation button. Sends current numeric specifications to this site calculation API and updates the displayed results. Does not approve engineering evidence.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){emptyInput(input);const s=state.current;if(!s.project)throw new Error('Workspace is loading.');const r=await s.run(s.project);if(!r)throw new Error('Calculation failed; see the visible validation or connection message.');await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));return {version:r.version,metrics:r.metrics,checks:r.checks};}},
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability; the regular UI remains available. */}}
  return()=>lifecycle.abort();
 },[]);
}
