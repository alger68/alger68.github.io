class FakeHttp:
    def __init__(self,data): self.data=data
    def get_json(self,url): return self.data[url]

def test_directory_search_resolves_ticker_and_taiwan_name_variant():
    from app.services.directory import DirectoryService
    urls=DirectoryService.URLS
    http=FakeHttp({
      urls['TWSE']:[{'公司代號':'2395','公司名稱':'研華','公司簡稱':'研華'},{'公司代號':'2330','公司名稱':'台積電','公司簡稱':'台積電'}],
      urls['TPEX']:[{'公司代號':'1240','公司名稱':'茂生農經','公司簡稱':'茂生農經'}],
    })
    s=DirectoryService(http)
    assert s.search('2395')[0]['name']=='研華'
    assert s.search('研華')[0]['ticker']=='2395'
    assert s.search('臺積電')[0]['ticker']=='2330'
    assert s.search('1240')[0]['exchange']=='TPEX'
