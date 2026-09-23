import {projectSchema,type Project} from './model.ts';
export const STORAGE_KEY='power-design-360.v1';
export type Workspace={projects:Project[];activeId:string};
export function readWorkspace(text:string|null):Workspace {
 if(!text)return {projects:[],activeId:''};
 const data=JSON.parse(text);
 if(!Array.isArray(data.projects)||data.projects.length>30||typeof data.activeId!=='string')throw new Error('Invalid workspace');
 const projects=data.projects.map((p:unknown)=>projectSchema.parse(p));
 if(new Set(projects.map((p:Project)=>p.id)).size!==projects.length)throw new Error('Duplicate project IDs');
 return {projects,activeId:data.activeId};
}
/** Optimistic local snapshot check prevents stale tabs from overwriting newer work. */
export function writeWorkspace(storage:Pick<Storage,'getItem'|'setItem'>,expected:string|null,next:Workspace):string {
 if(storage.getItem(STORAGE_KEY)!==expected)throw new Error('STORAGE_CONFLICT');
 const serialized=JSON.stringify(next);readWorkspace(serialized);
 storage.setItem(STORAGE_KEY,serialized);return serialized;
}
