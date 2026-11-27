# PocketMind AI — Project Status

> Baseline oficial estabelecido após merge do PR #2 (PACT-01).
> Atualizar este ficheiro a cada fase PACT concluída.

## Baseline aprovado

| Campo | Valor |
|-------|-------|
| Commit | `c9ccde7` (merge PR #2) |
| Branch | `main` |
| Data | 2025-01-24 |
| Testes | 190 passing, 0 failures |
| TypeScript | clean (`tsc --noEmit` exit 0) |
| CI checks | 3/3 passed (PR #2) |
| Deploy | https://ai-mind-law.vercel.app/ |

## Fases PACT

| Fase | Nome | Estado | Commit/PR |
|------|------|--------|-----------|
| PACT-00 | Phase 0 Audit | ✅ Concluído | baseline `5305ca9` |
| PACT-01 | Restore CI Integrity | ✅ Concluído | PR #2 · `c9ccde7` |
| PACT-02 | Document Identity Contract | 🔲 Pendente | — |
| PACT-03 | Routes & Navigation | 🔲 Pendente | — |
| PACT-04 | Processing Pipeline | 🔲 Pendente | — |
| PACT-05 | Test Coverage | 🔲 Pendente | — |
| PACT-06 | UX & Responsiveness | 🔲 Pendente | — |
| PACT-07 | Security Gate | 🔲 Pendente | — |
| PACT-08 | Acceptance | 🔲 Pendente | — |

## PACT-01 — Detalhes

### O que foi feito
- Bun fixado em `1.4.5` no CI (`bun-version: "1.4.5"`)
- `bun.lock` regenerado com versão correta
- Correções de identidade documental B1/B2/B3 em `PocketMindApp.tsx`
- Chave `analysis_saved_result` adicionada em EN/PT/ES
- Documentação de governança PACT criada em `docs/`

### O que foi confirmado
- 190 testes passaram localmente
- PR #2 integrado com 3 checks aprovados no GitHub
- Merge commit `c9ccde7` é o novo baseline de `main`

### O que ainda não foi verificado
- Branch protection rules de `main` (acesso negado anteriormente)
- Verificação independente dos 3 checks do GitHub (nomes dos checks não capturados)

## Trabalho em curso (não commitado)

Os seguintes ficheiros têm alterações locais na branch `fix/pact-01-ci-integrity`
que ainda não foram commitadas nem fazem parte do baseline:

- `.amazonq/rules/memory-bank/git-exe.md`
- `src/components/pocketmind/PocketMindApp.tsx`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/es.ts`
- `src/lib/i18n/pt.ts`

Estas alterações devem ser avaliadas antes do próximo commit.

## Gaps de governança conhecidos

| Gap | Prioridade | Fase PACT |
|-----|-----------|-----------|
| `Analysis` sem campo `documentId` | Alta | PACT-02 |
| Sem testes de regressão para B1/B2/B3 | Alta | PACT-05 |
| Branch protection rules não verificadas | Média | PACT-01 (pendente) |
| 4 ficheiros de teste com `act()` warnings | Baixa | PACT-05 |
| Sem testes E2E automatizados | Baixa | PACT-05 |
