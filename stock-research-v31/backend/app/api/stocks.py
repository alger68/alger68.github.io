from fastapi import APIRouter, HTTPException, Request
from app.services.jobs import jobs

router=APIRouter(prefix='/api')

def service(request: Request):
    s=getattr(request.app.state,'stock_service',None)
    if s is None: raise HTTPException(503,'stock_service_unconfigured')
    return s

@router.get('/stocks/search')
def search(request: Request, q: str=''):
    directory=getattr(request.app.state,'directory_service',None)
    return {'query':q,'results':directory.search(q) if directory else []}

@router.get('/stocks/{ticker}/summary')
def summary(ticker: str, request: Request, exchange: str='TWSE'):
    return service(request).summary(exchange,ticker)

@router.get('/stocks/{ticker}/price')
def price(ticker: str, request: Request, exchange: str='TWSE'):
    return service(request).summary(exchange,ticker)['price']

@router.post('/stocks/{ticker}/refresh')
def refresh(ticker: str, request: Request, exchange: str='TWSE'):
    job=jobs.create()
    result=service(request).refresh(exchange,ticker)
    status='complete' if result.get('price') else 'warning'
    jobs.finish(job['job_id'],status,result)
    return jobs.get(job['job_id'])

@router.get('/jobs/{job_id}')
def job(job_id: str):
    item=jobs.get(job_id)
    if not item: raise HTTPException(404,'job_not_found')
    return item
