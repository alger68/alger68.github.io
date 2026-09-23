import type { Project } from './model.ts';
import { fingerprint, specSchema } from './model.ts';
import { domains } from './catalog.ts';
export function reviewStatus(project: Project, id: string): 'pass'|'fail'|'na'|'pending'|'stale' {
  const e = project.evidence[id];
  if (!e) return 'pending';
  if (!specSchema.safeParse(project.spec).success || e.specKey !== fingerprint(project.spec)) return 'stale';
  return e.verdict;
}
export function reviewCounts(p: Project) {
  const counts = {pass:0,fail:0,na:0,pending:0,stale:0,total:0};
  for (const d of domains) for (const [id] of d.items) {counts[reviewStatus(p,id)]++; counts.total++;}
  return counts;
}
