# git-exe — Regra de atalho

Sempre que o utilizador digitar **git-exe**, executar automaticamente os seguintes comandos em sequência, sem pedir confirmação:

1. `npm run build` — verificar que o build de produção está limpo
2. `git status` — mostrar ficheiros modificados e não rastreados
3. `git diff --stat` — resumo das alterações
4. `git log --oneline -5` — últimos 5 commits
5. `git add -A` — adicionar todos os ficheiros modificados e novos (exceto os cobertos pelo `.gitignore`)
6. `git commit -m "<mensagem automática descritiva baseada nos ficheiros alterados>"` — commitar com mensagem gerada a partir do diff
7. `git push` — fazer push para `origin/main`

## Regras adicionais

- Se `npm run build` falhar, **parar imediatamente** e reportar o erro — não fazer commit de código que não compila.
- A mensagem de commit deve ser gerada automaticamente com base nos ficheiros alterados (prefixo `fix:`, `feat:`, `docs:`, `chore:` conforme o tipo de alteração).
- Se não houver nada para commitar (`nothing to commit`), reportar o estado e não executar `git commit` nem `git push`.
- Os ficheiros untracked `Avaliação independente*.md` e `pocketmind-compliance.csv` **não devem ser adicionados** — estão fora do scope do repositório.
- Nunca commitar ficheiros `.env`, tokens, chaves ou segredos.
