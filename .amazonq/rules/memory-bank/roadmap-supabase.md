# Roadmap — Supabase Integration (PocketMind AI)

> Decisão registada em sessão de trabalho. Não implementar agora — referência para fases pós-hackathon.

## Decisão arquitetural

Não substituir IndexedDB pelo Supabase. Usar os dois com responsabilidades distintas:

| Camada           | Tecnologia                         | Responsabilidade                                                            |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| Browser          | IndexedDB                          | Documentos originais, textos extraídos, análises privadas — soberania local |
| Backend opcional | Supabase (PostgreSQL + Auth + RLS) | Projetos, membros, atribuições, auditoria, sincronização autorizada         |
| IA               | Firebase AI Logic                  | Gemini, on-device, App Check — não muda                                     |

Sincronização com Supabase é sempre uma escolha explícita do utilizador, nunca automática.

## Casos de uso por fase

| Fase      | Funcionalidade                                                           | Supabase          |
| --------- | ------------------------------------------------------------------------ | ----------------- |
| Agora     | Settings e Integrations locais                                           | ❌ não usar       |
| Próxima   | Auditoria do projeto Supabase existente                                  | leitura apenas    |
| Projects  | Dossiês: número do edital, órgão, prazo, categoria, histórico            | PostgreSQL        |
| Team      | Autenticação de especialistas, atribuição de requisitos, permissões, RLS | Auth + RLS        |
| Auditoria | Quem alterou um requisito, quando uma evidência foi validada             | PostgreSQL        |
| Sync      | Acesso autorizado em múltiplos dispositivos                              | PostgreSQL + Auth |

## Integração Firebase ↔ Supabase

Duas funcionalidades distintas disponíveis no Supabase:

- **Firebase Wrapper** (`wrappers` extension): consulta Firebase Auth e Firestore via SQL — somente leitura.
- **Firebase Auth Third-Party**: usa identidades Firebase para controlar acesso a recursos Supabase via RLS.

Nenhuma delas conecta Gemini ou Firebase AI Logic ao Supabase — são camadas independentes.

Caso de uso concreto: utilizador autentica com Firebase Auth → Supabase reconhece o token → RLS aplica permissões aos dados colaborativos do projeto.

## Regras que nunca mudam

- `service_role` e chaves secretas Supabase nunca no frontend nem em `VITE_*`.
- Autenticação Supabase nunca obrigatória para usar o PocketMind (modo local sempre disponível).
- Documentos privados nunca migrados para a nuvem automaticamente.
- Todas as tabelas com políticas RLS definidas antes de qualquer dado entrar.
- Publishable key Supabase pode ir em `VITE_*`; anon key com RLS ativo é aceitável; service_role nunca.

## Próximo passo concreto

Antes de qualquer implementação: auditoria somente de leitura do projeto Supabase existente (`bksgztuqvflsvoffilay`) para confirmar tabelas, migrations e funcionalidades já presentes.

## Questão arquitetural em aberto

O PocketMind AI deverá permitir que vários especialistas trabalhem juntos no mesmo dossiê, cada um com acesso e responsabilidades próprias?

Se sim → Firebase Auth + Supabase PostgreSQL/RLS é a combinação a estudar.
