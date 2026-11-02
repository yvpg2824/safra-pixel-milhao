# SAFRA Pixel do Milhão — U2A Testnet (integração incompleta)

## Oferta confirmada
- Produto: pré-reserva de um bloco de pixels publicitários.
- Zonas: Bronze 10 Pi/pixel, Prata 20 Pi/pixel, Ouro 40 Pi/pixel.
- Entrada: 40% do preço base, calculada no servidor conforme tamanho e zona.
- Memo planejado: `Reserva SAFRA Pixel do Milhão`.
- Metadata planejada: `{draftId, product:"pixel_presale_deposit"}`.
- Ao confirmar o pagamento: registrar a pré-reserva no Supabase, associada ao Pi UID verificado. **Não** conceder propriedade/edição antes da quitação integral.
- A regra comercial de taxa e reembolso ainda necessita revisão antes de qualquer cobrança.

## Estado real
- `safra_pi_payment_intents`: tabela de rascunhos de pedidos no Supabase, protegida por RLS.
- Edge Function `pixel-presale-draft`: valida geometria e preço, consulta identidade Pi, grava rascunho; retorna `paymentEnabled:false`. Não aprova, conclui nem cria pagamento.
- Cobrança U2A **desativada**, sem testes financeiros concluídos.
- Carteira pública fornecida pelo desenvolvedor a confirmar na App Wallet do Developer Portal: `GBCTEQWAKXHNW6N26SWXO5MHFIV6T3S7VDWW3ZKVSFH5F3TB6HTLVO5Q`. Endereço público, NÃO credencial.
- Nunca copiar chaves privadas, seed ou API Key para este repositório.

## Integração restante (somente servidor)
Credencial `PI_NETWORK_API_KEY` inserida exclusivamente no secret manager do backend. Nenhuma chave é necessária no frontend.

1. `POST /api/pi/presale/start` com `{accessToken,x,y,size}`: validar identidade pelo serviço App Studio, preço e disponibilidade no banco; criar intenção idempotente e bloquear área em transação. Responder `{draftId,amount,memo,metadata}`.
2. Autenticar no cliente com escopos `['username','payments']`, e iniciar `Pi.createPayment({amount,memo,metadata}, callbacks)` apenas após habilitação explícita do backend.
3. `POST /api/pi/presale/approve` com `{accessToken,draftId,paymentId}`: resolver identidade, buscar pagamento na API Pi, conferir direção U2A, usuário, quantidade, valor, metadata e unicidade; persistir identificador antes de enviar `POST https://api.minepi.com/v2/payments/:id/approve`.
4. `POST /api/pi/presale/complete` com `{accessToken,draftId,paymentId,txid}`: revalidar todos os campos e status na API Pi, invocar `POST https://api.minepi.com/v2/payments/:id/complete`; confirmar a transação e registrar a pré-reserva **uma única vez**; lidar com reenvios/reconexões e pagamento incompleto.
5. Retomar `onIncompletePaymentFound` via backend: nunca ignorar pagamento pendente.
6. Implementar consulta de status, cancelamento, conciliação, prazo pós-lançamento e edição após quitação. Não concluir compra por callback isolado.

## Pré-requisitos de teste
- Conferir App Wallet em Pi Developers do *aplicativo correto*. Não presumir que endereço do App Studio seja a mesma carteira.
- Configurar `PI_NETWORK_API_KEY` no backend e não no GitHub/cliente.
- Verificar testes: valores alterados pelo browser, outra conta Pi, metadados inconsistentes, pagamento duplicado, txid repetida, áreas sobrepostas, timeout, falha de API, pagamentos incompletos e retomada.
- Somente então executar pagamento de Testnet pelo Pi Browser e comparar a transação com o Blockexplorer: https://blockexplorer.minepi.com/testnet/accounts/GBCTEQWAKXHNW6N26SWXO5MHFIV6T3S7VDWW3ZKVSFH5F3TB6HTLVO5Q (se confirmada como App Wallet Testnet). Nenhum pagamento on-chain foi verificado ainda.
