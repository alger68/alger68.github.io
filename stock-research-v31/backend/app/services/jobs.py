from uuid import uuid4

class JobStore:
    def __init__(self): self.jobs={}
    def create(self):
        job_id=str(uuid4()); self.jobs[job_id]={'job_id':job_id,'status':'pending'}; return self.jobs[job_id]
    def finish(self,job_id,status='complete',result=None):
        self.jobs[job_id]={'job_id':job_id,'status':status,'result':result}; return self.jobs[job_id]
    def get(self,job_id): return self.jobs.get(job_id)

jobs=JobStore()
