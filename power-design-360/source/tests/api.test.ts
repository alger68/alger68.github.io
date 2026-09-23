import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRequest, preflight } from '../lib/power/api.ts';
import { defaultSpec } from '../lib/power/model.ts';
const req = (body: string, contentType='application/json') => new Request('https://example.test/api/calculate',{method:'POST',headers:{'Content-Type':contentType,'Origin':'https://alger68.github.io'},body});
test('API returns a calculated versioned result and allows only configured cross-origin client', async () => {
  const r = await calculateRequest(req(JSON.stringify(defaultSpec)));
  assert.equal(r.status,200); assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://alger68.github.io');
  assert.equal((await r.json() as {metrics:{outputW:number}}).metrics.outputW,480);
  const cors = await preflight(new Request('https://example.test',{headers:{Origin:'https://untrusted.test'}}));
  assert.equal(cors.headers.get('Access-Control-Allow-Origin'),null);
});
test('API rejects malformed, invalid, wrong-type and oversized streamed bodies', async () => {
  assert.equal((await calculateRequest(req('{broken'))).status,400);
  assert.equal((await calculateRequest(req(JSON.stringify({...defaultSpec, outputA:0})))).status,422);
  assert.equal((await calculateRequest(req('{}','text/plain'))).status,415);
  assert.equal((await calculateRequest(req(' '.repeat(17000)))).status,413);
});
