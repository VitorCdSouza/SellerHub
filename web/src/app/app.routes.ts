import { Routes } from '@angular/router';
import { sessaoGuard } from './autenticacao/sessao.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./login/login.component').then((modulo) => modulo.LoginComponent),
    title: 'Entrar | SellerHub',
  },
  {
    path: 'sessao-indisponivel',
    loadComponent: () =>
      import('./autenticacao/sessao-indisponivel.component').then(
        (modulo) => modulo.SessaoIndisponivelComponent,
      ),
    title: 'Verificar acesso | SellerHub',
  },
  {
    path: '',
    loadComponent: () =>
      import('./estrutura/estrutura.component').then((modulo) => modulo.EstruturaComponent),
    canActivateChild: [sessaoGuard],
    children: [
      {
        path: 'produtos',
        loadComponent: () =>
          import('./produtos/produtos.component').then((m) => m.ProdutosComponent),
        title: 'Produtos | SellerHub',
      },
      {
        path: 'anuncios',
        loadComponent: () =>
          import('./anuncios/anuncios.component').then((modulo) => modulo.AnunciosComponent),
        title: 'Anúncios | SellerHub',
      },
      {
        path: 'estoque',
        loadComponent: () =>
          import('./estoque/estoque.component').then((modulo) => modulo.EstoqueComponent),
        title: 'Estoque | SellerHub',
      },
      {
        path: 'indicadores',
        loadComponent: () =>
          import('./indicadores/indicadores.component').then(
            (modulo) => modulo.IndicadoresComponent,
          ),
        title: 'Indicadores | SellerHub',
      },
      {
        path: 'administracao',
        loadComponent: () =>
          import('./administracao/administracao.component').then(
            (modulo) => modulo.AdministracaoComponent,
          ),
        title: 'Administração | SellerHub',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./estrutura/nao-encontrada.component').then(
        (modulo) => modulo.NaoEncontradaComponent,
      ),
    title: 'Página não encontrada | SellerHub',
  },
];
