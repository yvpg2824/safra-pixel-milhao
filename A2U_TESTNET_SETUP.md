# A2U Testnet — diagnóstico inicial (sem envios)

## Por que existe
O checklist **Apply for Mainnet App Wallet** pede transações App-to-User para cinco carteiras únicas no app Testnet pareado. Enviar Test-Pi manualmente em Pi Wallet **não equivale** a gerar pagamentos A2U via API do aplicativo.

O SAFRA Pixel do Milhão continua sendo um app de compras: compradores pagam o aplicativo (U2A). Este diagnóstico administrativo é isolado e não afeta a compra de pixels.

## Implementado neste PR
- GET `/api/pixel/admin/a2u-preflight`, protegido por token administrativo independente.
- Usa a chave Pi já guardada no servidor para consultar `GET /v2/payments/incomplete_server_payments`.
- Retorna apenas o estado dos pagamentos pendentes; **não** envia Pi, não cria pagamentos, não retorna chaves nem identifica destinatários.
- Só funciona com `PIXEL_A2U_NETWORK=testnet`.

## Configuração segura (Netlify > Environment variables)
- `PI_NETWORK_API_KEY`: credencial da **aplicação Testnet** (não publicar).
- `PIXEL_A2U_NETWORK=testnet`.
- `PIXEL_A2U_ADMIN_TOKEN`: segredo aleatório novo de no mínimo 32 caracteres, exclusivo para admin.
- Fazer a consulta apenas por um cliente privado com header `Authorization: Bearer <admin-token>`. Não colocar token em HTML, script público, logs ou screenshots.

## Próximos passos antes de transferir Test-Pi
1. Confirmar no Developer Portal o pareamento exato Testnet/Mainnet.
2. Confirmar autenticação dos destinatários e seus **Pi UIDs**, não apenas endereços públicos de wallet.
3. Criar ledger persistente de tentativas e idempotência, limite de envio, bloqueio de duplicatas e acesso administrativo seguro.
4. Implementar corretamente `POST /v2/payments`, assinatura e envio da transação blockchain **na Testnet**, e `POST /v2/payments/{id}/complete`, com conferência de txid, estados e recuperação de pendências.
5. Testar um pagamento pequeno e verificar registro de A2U; repetir até cinco UIDs distintos com controle de status. Sem ativar na Mainnet automaticamente.

Fontes:
- https://developers.minepi.com/docs/api-reference/PlatformAPI
- https://github.com/pi-apps/pi-platform-docs/blob/master/payments_advanced.md

**Atenção:** isto é uma etapa de diagnóstico, não a implementação completa de A2U. Não mesclar/ativar sem validar deploy e controles de acesso.
