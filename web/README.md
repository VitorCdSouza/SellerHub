# SellerHub — Angular

Tela de login da PoC, construída sobre o projeto Angular CLI 21.2 existente.

## Executar

Na pasta do front-end:

```powershell
npm ci
npm start
```

Abra http://localhost:4200. Para entrar, é necessário executar a API Go e preparar o PostgreSQL conforme o [README principal](../README.md).

Usuário público de demonstração: `teste@email.com`, senha `123456`.

## Organização

- `src/app/login/`: formulário reativo, validação, carregamento e mensagens de sucesso/erro.
- `src/app/services/auth.service.ts`: envia `email` e `password` com `HttpClient` para `http://localhost:8080/login`.
- `src/app/app.config.ts`: configura HTTP e roteamento.
- `src/app/app.routes.ts`: carrega a tela de login sob demanda.

O componente usa signals e OnPush. Durante a requisição, impede novos envios; ao concluir, limpa a senha. Labels, avisos por campo e regiões de mensagem dão suporte à navegação por teclado e leitores de tela. Não há sessão nem armazenamento de senha no navegador.

## Verificar

```powershell
npm test -- --watch=false
npm run build
```

Os testes usam HTTP simulado para conferir formulário, contrato do AuthService, sucesso, credenciais inválidas e indisponibilidade da API. A demonstração completa requer o banco e o Go em execução.

O build fica em `dist/SellerHub`. A aplicação mantém o endereço local da API porque esta entrega é uma PoC para execução na mesma máquina.
