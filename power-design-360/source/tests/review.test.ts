import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject,fingerprint} from '../lib/power/model.ts';
import {reviewStatus,reviewCounts} from '../lib/power/review.ts';
test('missing and stale evidence never passes; not-applicable remains a distinct verdict',()=>{
 const p=newProject();assert.equal(reviewCounts(p).pending,38);assert.equal(reviewStatus(p,'mission'),'pending');
 p.evidence.mission={verdict:'pass',method:'review',note:'EVT mission profile revision A reviewed.',specKey:fingerprint(p.spec),updatedAt:new Date().toISOString()};
 assert.equal(reviewStatus(p,'mission'),'pass');p.spec.outputA=12;assert.equal(reviewStatus(p,'mission'),'stale');assert.equal(reviewCounts(p).pass,0);
 p.evidence.mission={...p.evidence.mission,verdict:'na',specKey:fingerprint(p.spec)};assert.equal(reviewCounts(p).na,1);assert.equal(reviewCounts(p).pass,0);
 p.spec.outputA=0;assert.equal(reviewStatus(p,'mission'),'stale');
});
