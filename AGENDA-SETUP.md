CONFIGURAÇÃO DA AGENDA JURÍDICA — COOPERTAXI-BH

Arquivo: agenda.html
Projeto Firebase usado: senha-36ecb
Objetivo: agenda compartilhada com acesso autenticado, links de reuniões, remarcações e relatórios.

ANTES DE USAR
1. No Firebase Console do projeto senha-36ecb, abra Authentication > Sign-in method e ative Email/Password.
2. Em Authentication > Users, crie uma conta individual para a advogada e outra para a recepção. Não compartilhe senhas.
3. Em cada conta, copie o UID. Em Firestore Database, crie a coleção usuarios_juridico e um documento cujo ID seja exatamente o UID.
4. Em cada documento, defina os campos:
   nome: texto
   perfil: "advogada" ou "recepcao"
   ativo: true
5. Em Firestore Rules, adicione as regras para agenda_juridica e usuarios_juridico abaixo, integrando-as às regras existentes. NÃO substitua todas as regras atuais sem revisar as coleções já usadas pela fila pública e pelos painéis existentes.

REGRAS A INTEGRAR (revisar com o administrador antes de publicar)
match /usuarios_juridico/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  // A criação/alteração de perfis deve ser feita manualmente no Console por administrador.
  allow create, update, delete: if false;
}
match /agenda_juridica/{agendamentoId} {
  function autorizado() {
    return request.auth != null
      && exists(/databases/$(database)/documents/usuarios_juridico/$(request.auth.uid))
      && get(/databases/$(database)/documents/usuarios_juridico/$(request.auth.uid)).data.ativo == true
      && get(/databases/$(database)/documents/usuarios_juridico/$(request.auth.uid)).data.perfil in ['advogada', 'recepcao'];
  }
  allow read, create, update, delete: if autorizado();
}

IMPORTANTE
- As regras acima restringem a agenda a contas autorizadas, mas o administrador deve revisar e testar as regras completas no projeto.
- Não armazene o conteúdo jurídico da consulta nem documentos sensíveis no campo de observação.
- O link é inserido pela advogada: o botão "Criar reunião no Google Meet" abre o Meet para criar a reunião; depois é preciso copiar e colar o link no agendamento. A criação automática pelo Google Calendar exigiria integração OAuth separada.
- A conta pública da fila e os demais painéis usam coleções existentes. Preserve suas regras atuais durante a integração e revise a segurança dessas coleções separadamente.
- O sistema não está pronto para uso com dados reais até que Authentication, perfis autorizados e regras do Firestore sejam configurados e testados.
