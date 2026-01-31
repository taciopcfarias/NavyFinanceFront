import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimentacaoService } from '../../services/movimentacao.service';
import { NgClass } from '@angular/common';

type Tipo = 'ENTRADA' | 'SAIDA';
type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO';
type Categoria = 'ALUGUEL' | 'PAGAMENTO' | 'COMISSAO' | 'ALMOCO' | 'MANUTENCAO';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass, CurrencyPipe, DatePipe],
  templateUrl: './movimentacoes.component.html',
  styleUrl: './movimentacoes.component.css'
})
export class MovimentacoesComponent implements OnInit {

  carregando = false;
  erro: string | null = null;
  msg: string | null = null;

  itens: any[] = [];

  // filtros
  dataInicio = '2026-01-01';
  dataFim = '2026-12-31';

  // formulário
  editandoId: number | null = null;

  tipo: Tipo = 'ENTRADA';
  categoria: Categoria = 'ALUGUEL';
  formaPagamento: FormaPagamento = 'PIX';

  valor: number | null = null;
  data: string = new Date().toLocaleDateString('sv-SE'); // ✅ local YYYY-MM-DD
  observacao: string = '';

  salvando = false;

  constructor(private service: MovimentacaoService) {}

  ngOnInit(): void {
    this.buscar();
  }

  buscar() {
    this.carregando = true;
    this.erro = null;

    this.service.search({
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
      page: 0,
      size: 50,
      sort: 'data,desc'
    }).subscribe({
      next: (res) => {
        this.itens = res?.content ?? [];
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Falha ao carregar movimentações';
        this.carregando = false;
      }
    });
  }

  onTipoChange() {
    this.msg = null;
    this.erro = null;

    // mantém defaults sempre válidos
    if (!this.formaPagamento) this.formaPagamento = 'PIX';

    // se trocar pra SAIDA, sugere categoria de saída
    if (this.tipo === 'SAIDA' && this.categoria === 'ALUGUEL') {
      this.categoria = 'MANUTENCAO';
    }
  }

  private montarBody() {
    // ✅ Como você quer SAÍDA com forma de pagamento,
    // sempre enviamos categoria + formaPagamento.
    return {
      tipo: this.tipo,
      categoria: this.categoria,
      formaPagamento: this.formaPagamento,
      valor: this.valor,
      data: this.data, // yyyy-MM-dd
      observacao: this.observacao || null
    };
  }

  salvar() {
    this.msg = null;
    this.erro = null;

    if (!this.valor || this.valor <= 0) {
      this.erro = 'Informe um valor maior que zero';
      return;
    }
    if (!this.data) {
      this.erro = 'Informe a data';
      return;
    }
    if (!this.categoria) {
      this.erro = 'Selecione a categoria';
      return;
    }
    if (!this.formaPagamento) {
      this.erro = 'Selecione a forma de pagamento';
      return;
    }

    // atenção: backend pode bloquear data futura (@PastOrPresent)
    const body = this.montarBody();

    this.salvando = true;

    const req$ = this.editandoId
      ? this.service.atualizar(this.editandoId, body)
      : this.service.criar(body);

    req$.subscribe({
      next: () => {
        this.salvando = false;
        this.msg = this.editandoId ? 'Atualizado com sucesso!' : 'Salvo com sucesso!';
        this.limparFormulario();
        this.buscar();
      },
      error: (e) => {
        this.salvando = false;
        this.erro = e?.error?.message ?? 'Erro ao salvar/atualizar';
      }
    });
  }

  editar(m: any) {
    this.msg = null;
    this.erro = null;

    this.editandoId = m.id;

    this.tipo = m.tipo;
    this.formaPagamento = (m.formaPagamento ?? 'PIX');
    this.valor = Number(m.valor);
    this.data = (m.data ?? '').slice(0, 10);
    this.observacao = m.observacao ?? '';
  }

  cancelarEdicao() {
    this.limparFormulario();
  }

  deletar(id: number) {
    this.msg = null;
    this.erro = null;

    const ok = confirm('Deseja excluir esta movimentação?');
    if (!ok) return;

    this.service.deletar(id).subscribe({
      next: () => {
        this.msg = 'Excluído com sucesso!';
        this.buscar();
      },
      error: () => {
        this.erro = 'Erro ao excluir';
      }
    });
  }

  limparFormulario() {
    this.editandoId = null;
    this.tipo = 'ENTRADA';
    this.categoria = 'ALUGUEL';
    this.formaPagamento = 'PIX';
    this.valor = null;
    this.data = new Date().toLocaleDateString('sv-SE');
    this.observacao = '';
  }


}

