import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

type TotaisParams = {
  dataInicio: string;
  dataFim: string;
};

type MensalParams = {
  inicio: string;
  fim: string;
  tipo?: string;
  categoria?: string;
  formaPagamento?: string;
};

type RelatorioSaidasParams = {
  inicio: string;
  fim: string;
  categoria?: string;
};

@Injectable({ providedIn: 'root' })
export class MovimentacaoService {
  private baseUrl = 'http://localhost:8080/api/movimentacoes';
  private relatorioUrl = 'http://localhost:8080/api/relatorios';

  constructor(private http: HttpClient) {}

  // ✅ Cards (geral do período) - NÃO recebe categoria aqui
  // GET /api/movimentacoes/totais?dataInicio=...&dataFim=...
  totais(params: TotaisParams): Observable<any> {
    const httpParams = new HttpParams()
      .set('dataInicio', params.dataInicio)
      .set('dataFim', params.dataFim);

    return this.http.get<any>(`${this.baseUrl}/totais`, { params: httpParams });
  }

  // ✅ Gráfico (pode filtrar SAÍDA por categoria se quiser)
  // GET /api/movimentacoes/mensal?inicio=...&fim=...&tipo=...&categoria=...
  mensal(params: MensalParams): Observable<any[]> {
    let httpParams = new HttpParams()
      .set('inicio', params.inicio)
      .set('fim', params.fim);

    if (params.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params.formaPagamento) httpParams = httpParams.set('formaPagamento', params.formaPagamento);

    return this.http.get<any[]>(`${this.baseUrl}/mensal`, { params: httpParams });
  }

  // ✅ NOVO: Relatório de SAÍDAS por período e categoria
  // GET /api/relatorios/saidas?inicio=...&fim=...&categoria=...
  relatorioSaidas(params: RelatorioSaidasParams): Observable<any[]> {
    let httpParams = new HttpParams()
      .set('inicio', params.inicio)
      .set('fim', params.fim);

    if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);

    return this.http.get<any[]>(`${this.relatorioUrl}/saidas`, { params: httpParams });
  }

  // (mantém seus métodos já usados no Movimentações)
  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach((k) => {
      if (params[k] !== null && params[k] !== undefined && params[k] !== '') {
        httpParams = httpParams.set(k, params[k]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/search`, { params: httpParams });
  }

  criar(body: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, body);
  }

  atualizar(id: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, body);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
  
}


