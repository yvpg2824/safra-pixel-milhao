# Pixel do Milhão — fluxo de pagamentos em desenvolvimento

**Estado atual:** autenticação Pi verificada via Netlify Function. **Nenhuma compra ou reserva real é habilitada.**

## Controle seguro de disponibilidade

A migração `supabase/migrations/20261030_pixel_orders.sql` contém a tabela experimental `safra_pixel_orders`, com proteção de sobreposição de regiões ativas usando `EXCLUDE USING gist` no PostgreSQL e RLS sem acesso público.

**Atenção:** o SQL ainda não foi executado no seu projeto Supabase. Ele não altera as tabelas antigas `pixel_blocks` e `pixel_transactions`. Não misturar o esquema novo com o antigo sem migração supervisionada.

## Antes de ativar um pagamento

1. Configurar credenciais de teste no ambiente seguro da Netlify (Pi API Key **server-side**, Supabase URL e chave apropriada; nunca no JS ou GitHub).
2. Criar uma sessão autenticada e verificável por chamada (tokens Pi verificados no backend).
3. Verificar bloco, zona, preço e disponibilidade usando regras mantidas no servidor.
4. Criar uma reserva atômica com prazo de expiração, impedindo compras simultâneas da mesma área; tratar retorno de conflito.
5. Fazer `Pi.authenticate(['username','payments'])`, `Pi.createPayment`, aprovação e conclusão no servidor após confirmar o pagamento na API Pi.
6. Confirmar `uid`, `amount`, `metadata`, `paymentId`, `txid`, estado na API; marcar venda de modo idempotente e recuperar pagamentos incompletos.
7. Testar na Testnet, incluindo disputa concorrente, falhas de conexão, pagamento cancelado e retorno duplicado. Revisar conformidade antes da Mainnet.

**Nunca** marcar pixels como vendidos só porque o frontend recebeu `onReadyForServerCompletion`. A documentação oficial exige aprovação/conclusão do backend.
