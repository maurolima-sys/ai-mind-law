# git-exe — Quality & Security Gate

Sempre que o utilizador digitar **git-exe**, executar automaticamente a sequência abaixo, sem pedir confirmação.

## Sequência de execução

1. **Verificações sem staging** — branch, remote sync, lint, TypeScript, testes, auditoria, build

   ```
   node scripts/pre-push-check.mjs
   ```

   Se o script terminar com código de saída diferente de zero, **parar imediatamente** — não fazer staging, commit nem push.

2. **Estado do repositório**

   ```
   git status
   git diff --stat
   git log --oneline -5
   ```

3. **Staging seletivo**

   ```
   git add -A
   git reset HEAD -- "Avaliação independente*.md" pocketmind-compliance.csv
   ```

4. **Secret scan sobre o staging final** — corre _depois_ do `git add` para inspeccionar exactamente o que vai entrar no commit

   ```
   node scripts/pre-push-check.mjs --staged
   ```

   Se detectar ficheiros `.env*`, ficheiros bloqueados ou padrões de segredos no staging, **parar imediatamente**.

5. **Commit**

   ```
   git commit -m "<mensagem gerada automaticamente>"
   ```

   Se não houver nada para commitar, reportar o estado e parar.

6. **Push**
   ```
   git push origin main
   ```

---

## O que o gate verifica (scripts/pre-push-check.mjs)

| Passo                     | Comando                                                                                                   | Bloqueia                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------- |
| Branch                    | `git branch --show-current` → deve ser `main`                                                             | ✅                        |
| Sincronização remota      | `git fetch origin` + `git status -sb` (actualiza refs remotas locais, não modifica ficheiros de trabalho) | ✅                        |
| Scan de segredos          | Inspeciona o staging final após `git add` — nomes e conteúdo                                              | ✅                        |
| Whitespace                | `git diff --check`                                                                                        | ✅                        |
| Lint                      | `npm run lint`                                                                                            | ✅                        |
| TypeScript                | `npx tsc --noEmit`                                                                                        | ✅                        |
| Testes                    | `npm run test -- --run`                                                                                   | ✅                        |
| Auditoria de dependências | `npm audit --omit=dev` — compara CVE IDs contra baseline explícita, não apenas contagens                  | ✅ se CVE novo não aceite |
| Build de produção         | `npm run build`                                                                                           | ✅                        |

---

## Regras adicionais

- Se qualquer verificação obrigatória falhar, **não fazer commit nem push**.
- A mensagem de commit é gerada automaticamente com prefixo `fix:`, `feat:`, `docs:` ou `chore:` conforme os ficheiros alterados.
- Os ficheiros `Avaliação independente*.md` e `pocketmind-compliance.csv` nunca são adicionados ao staging.
- Ficheiros `.env`, `.env.local` e variantes nunca são commitados — o gate aborta se detetados.
- Nunca executar `npm audit fix --force` automaticamente — atualizações de dependências são operações separadas.
- Nunca executar `git push --force`.
- A auditoria usa uma baseline (10 high, 0 critical) para não bloquear vulnerabilidades já conhecidas; bloqueia apenas novas ocorrências acima da baseline.

---

## Atalho de verificação sem commit

Sempre que o utilizador digitar **git-check**, executar apenas:

```
node scripts/pre-push-check.mjs
```

Não modifica ficheiros de trabalho, não faz staging, não faz commit, não faz push. `git fetch origin` actualiza as refs remotas locais (não os ficheiros de trabalho) — é necessário para detectar divergências. Útil para verificar o projeto antes de decidir publicar.
