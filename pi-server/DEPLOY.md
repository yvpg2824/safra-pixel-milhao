# Implantação segura do verificador Pi — Pixel do Milhão

O frontend está hospedado como site estático na Netlify/GitHub Pages; o Node.js **não é executado** nesses provedores sem serviço de backend. Este servidor **verifica apenas o token de autenticação Pi**. Nenhuma compra, reserva ou pagamento está ativado.

## Publicar

1. No Render, crie um Blueprint apontando para a branch `main` deste repositório, que contém `render.yaml` (ou crie um Web Service Node com raiz `pi-server`, `npm start` e health `/health`).
2. Aguarde o serviço passar a retornar `{"status":"ok","paymentsEnabled":false}` em `https://SEU-HOST/health`. **Não publique tokens de acesso ou chaves API.**
3. No HTML da branch `pi-testnet` hospedada pela Netlify, defina a meta tag `pi-verification-endpoint` para `https://SEU-HOST/api/pi/verify`. No HTML principal, faça o mesmo quando desejar habilitar a verificação.
4. Abra o app dentro do Pi Browser e clique em **Entrar com Pi**. Só exiba identidade validada quando o backend retornar `verified:true`. Verifique também erros de rede e rejeição.
5. Antes de publicar em produção, configure as origens exatas de frontend em `ALLOWED_ORIGINS` (sem caminhos). Não use `*` para autenticação.

## Próximas etapas — pagamentos

**Não habilitar compras ainda.** É necessária implantação de persistência, identidade/sessões, controle transacional contra sobreposição de pixels, autorização com preço validado no servidor, endpoints de aprovação e conclusão com a chave de API **exclusivamente no servidor**, verificação de status da Pi e callbacks idempotentes. Testar em Testnet e revisar regras da plataforma antes de Mainnet. O fluxo de login sozinho não vende pixels.

## Testes

Execute `node --test pi-server/server.test.mjs` na raiz do projeto, ou `node --test server.test.mjs` em `pi-server`. Os testes são de contrato/segurança de requisição; não simulam a plataforma Pi completa.
