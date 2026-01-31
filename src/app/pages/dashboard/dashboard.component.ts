import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimentacaoService } from '../../services/movimentacao.service';

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

type CategoriaMovimentacao =
  | ''
  | 'PAGAMENTO'
  | 'COMISSAO'
  | 'ALMOCO'
  | 'MANUTENCAO';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  dataInicio = '2026-01-01';
  dataFim = '2026-12-31';

  categoriaSaida: CategoriaMovimentacao = '';

  categoriasSaida = [
    { value: '', label: 'Todas as categorias' },
    { value: 'PAGAMENTO', label: 'Pagamento' },
    { value: 'COMISSAO', label: 'Comissão' },
    { value: 'ALMOCO', label: 'Almoço' },
    { value: 'MANUTENCAO', label: 'Manutenção' }
  ] as const;

  totais: any = null;

  // ✅ relatório (tabela)
  relatorio: any[] = [];
  totalRelatorio = 0;

  carregando = false;
  erro: string | null = null;

  private chart: Chart | null = null;

  constructor(private service: MovimentacaoService) {}

ngOnInit(): void {
  this.carregar();
}

ngAfterViewInit(): void {}


  carregar() {
    this.erro = null;
    this.carregando = true;

    // ✅ 1) Cards SEM filtro (não altera entradas e saldo)
    this.service.totais({ dataInicio: this.dataInicio, dataFim: this.dataFim }).subscribe({
      next: (res) => {
        this.totais = res;
      },
      error: () => {
        this.erro = 'Falha ao carregar totais';
      }
    });

    // ✅ 2) Relatório (tabela) — apenas SAÍDAS + categoria (se houver)
    const relatorioParams: any = {
      inicio: this.dataInicio,
      fim: this.dataFim
    };
    if (this.categoriaSaida) relatorioParams.categoria = this.categoriaSaida;

    this.service.relatorioSaidas(relatorioParams).subscribe({
      next: (rows) => {
        this.relatorio = rows || [];
        this.totalRelatorio = this.relatorio.reduce((acc, m) => acc + Number(m.valor ?? 0), 0);
      },
      error: () => {
        this.erro = this.erro ?? 'Falha ao carregar relatório de saídas';
      }
    });

    // ✅ 3) Gráfico mensal (se categoria selecionada, filtra SAÍDA por categoria)
    const mensalParams: any = { inicio: this.dataInicio, fim: this.dataFim };
    if (this.categoriaSaida) {
      mensalParams.tipo = 'SAIDA';
      mensalParams.categoria = this.categoriaSaida;
    }

    this.service.mensal(mensalParams).subscribe({
      next: (rows) => {
        this.carregando = false;
        this.renderChart(rows || []);
      },
      error: () => {
        this.carregando = false;
        this.erro = this.erro ?? 'Falha ao carregar dados mensais';
      }
    });
  }

  limparCategoria() {
    this.categoriaSaida = '';
    this.carregar();
  }

  private renderChart(rows: any[]) {
    const labels = rows.map(r => {
      const mes = String(r.mes).padStart(2, '0');
      return `${mes}/${r.ano}`;
    });

    const entradas = rows.map(r => Number(r.totalEntrada ?? 0));
    const saidas = rows.map(r => Number(r.totalSaida ?? 0));

    const canvas = document.getElementById('graficoFinanceiro') as HTMLCanvasElement | null;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const labelSaidas = this.categoriaSaida
      ? `Saídas (${this.categoriaSaida})`
      : 'Saídas';

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Entradas', data: entradas },
          { label: labelSaidas, data: saidas }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}






