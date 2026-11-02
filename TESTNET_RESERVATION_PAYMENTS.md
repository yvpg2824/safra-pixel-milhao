# Pagamento de reserva em Test-Pi (U2A) — integração em revisão

Objetivo: permitir que o interessado escolha pixels, autorize um pagamento **de teste** pelo Pi Browser, e receba confirmação de reserva de teste após conclusão validada pelo servidor. Isso não atribui propriedade Mainnet, não habilita venda real e não substitui as 5 transações **A2U** exigidas pelo checklist da App Wallet Mainnet.

Arquivos adicionados nesta branch: `pixel-payment-approve.mjs` e `pixel-payment-complete.mjs`. Ambos **desabilitados** salvo `PIXEL_PAYMENTS_ENABLED=true` e `PIXEL_PAYMENT_NETWORK=testnet`.

## Bloqueios antes de habilitar
- Integrar o frontend `Pi.authenticate(['username','payments'])`, `Pi.createPayment`, e os callbacks com sessão emitida pelo backend, **sem salvar token em localStorage**.
- Criar mecanismo robusto de reserva expirável antes do pagamento. A função SQL atual bloqueia a área por 72h antes de receber um Pi de teste; não ativar sem corrigir expiração, cancelamento e liberação da área, além de tratamento de concorrência.
- Conferir a função de validação de pagamento, vínculo do pedido e idempotência / reprocessamento de pagamentos incompletos.
- As funções assumem que a API retorna `transaction.txid` e `status.completed`; verificar a resposta real na Testnet antes de habilitar. Conferir que o app Testnet e suas credenciais correspondem ao ambiente publicado.
- Revisar segurança das chamadas ao banco (service role somente no servidor) e autorização de execução das funções SQL (SECURITY DEFINER).
- Configurar variáveis na hospedagem, testar em ambiente de preview, analisar registros; só então aprovar a publicação.
- Ajustar o texto da interface para esclarecer que as reservas são simulações e não garantem direitos sobre espaços.
- Não cobrar Pi real nem habilitar Mainnet.

Documentação: https://developers.minepi.com/docs/accept-payment/Payments

## Estado
**Somente endpoints preparados em branch isolada. Não publicados, sem frontend integrado e sem transações realizadas.**
