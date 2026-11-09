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
        path: 'inicio',
        loadComponent: () =>
          import('./estrutura/inicio.component').then((modulo) => modulo.InicioComponent),
        title: 'Início | SellerHub',
      },
      {
        path: 'produtos/novo',
        loadComponent: () =>
          import('./produtos/novo-produto/novo-produto.component').then(
            (modulo) => modulo.NovoProdutoComponent,
          ),
        title: 'Novo produto | SellerHub',
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./produtos/produtos.component').then(
            (m) => m.ProdutosComponent
          ),
        title: 'Produtos | SellerHub',
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
