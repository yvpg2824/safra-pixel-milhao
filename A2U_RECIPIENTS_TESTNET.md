# A2U Testnet — cadastro de destinatários
Este branch prepara o primeiro passo para enviar pagamentos App-to-User (A2U) para cinco usuários diferentes, sem mexer em vendas U2A.

Endpoint novo: `GET /api/pixel/a2u/my-id`. Só retorna o Pi UID do usuário autenticado quando `PIXEL_A2U_NETWORK=testnet` e a sessão `PIXEL_SESSION_SECRET` está configurada.

Ainda NÃO há página de cadastro publicada, ordem de envio, assinatura blockchain, chave de carteira ou transação realizada. O usuário precisa entrar no app Testnet com cada uma das cinco contas, com consentimento, para obter cinco UIDs distintos. Endereços `G...` por si sós não cumprem o vínculo exigido pela API.

Para integrar ao site, usar a sessão do endpoint de login já existente (`/api/pixel/login`) e transmitir o bearer token exclusivamente ao endpoint de consulta. Nenhuma chave privada deve ser enviada ao navegador, GitHub ou chat.

Próximo estágio, antes de enviar: confirmar Testnet app pareado, verificar ambiente de deploy, armazenar a fila em backend protegido com idempotência, consultar o pagamento A2U e implementar a transação assinada na blockchain Testnet com segredo em ambiente servidor. Cinco destinatários únicos devem ser verificados pelo app e por pagamentos concluídos.
