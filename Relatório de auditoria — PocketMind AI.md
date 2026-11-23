# Relatório de auditoria — PocketMind AI

**Data:** 21/11/2026
**Projeto:** `maurolima-sys/ai-mind-law`
**Demo:** https://ai-mind-law.vercel.app/
**Commit analisado:** `737e31a` (`main`)

---

## Atualização de estado — reconciliação com `main` atual

**Data desta atualização:** 21/11/2026

O corpo deste relatório preserva os resultados da auditoria original de `737e31a`. Os números de testes, lint, dependências e deploy são **históricos**, não uma nova verificação do estado atual. Esta secção reconcilia o estado operacional atual com as divergências documentais identificadas.

| Item | Estado na auditoria (`737e31a`) | Estado atual (`9d2910c`) |
|---|---|---|
| Commit de produção referenciado | `ed19ed4` (histórico) | `9d2910c` (HEAD); `1d99a29` = tag `hackathon-stable` |
| Erros em produção | Nenhum no fluxo demo | Zero erros verificados em `1d99a29` |
| TypeScript gate no CI | Ausente | `bunx tsc --noEmit` obrigatório antes dos testes (`9d2910c`) |
| `ReferenceError: onLoadDiscoveredDocument` | Não existia | Corrigido em `1d99a29` |
| Smart Discovery / Company Profile | Não existia | Implementado em `3ce64f3` – `4980d14` |
| Divergência documental `ed19ed4` vs deploy | Identificada como P2 | Reconciliada no README e CHANGELOG nesta atualização |

**Revisão do histórico até `5cac563` (mantida):**

- `ae14f7b` atualizou Vite, Vitest e TypeScript ESLint e adicionou overrides de `js-yaml` e `seroval`. Isso não comprova que todas as vulnerabilidades anteriormente reportadas foram resolvidas; é necessário um novo audit.
- `5cac563` adicionou `executionReport` aos resultados de análises bem-sucedidas e reduziu os limites Cloud de 30 s por tentativa / 100 s por secção para, no máximo, 15 s / 55 s. Não há comparação controlada de tempo e sucesso antes e depois. O limite de geração local permanece em 180 s por secção.
- Em 21/11/2026, um teste híbrido local no Chrome concluiu a análise de um PDF real de 17 páginas e exportou `hybrid`: 45 requisitos, 17 prazos, 18 especificações e 13 riscos; das 93 referências de evidência, 84 estavam marcadas como verificadas e 9 como não verificadas. O monitor relatou validação local das secções 1 e 4 e fallback Cloud nas secções 2, 3 e 5. Não foram capturados os valores brutos do SDK, o histórico completo das secções, tempos, número total de tentativas ou o estado do consentimento dessa execução. O resultado não comprova análise inteiramente local nem implantação em produção.
- O relatório técnico foi introduzido **depois** desse teste: o JSON anterior não contém esses rastros. No código atual, tempos não incluem extração, inicialização do modelo ou verificação de evidências; tentativas falhadas ou subdivididas podem não ser registadas, `timedOut` não regista fiavelmente timeouts anteriores, falhas não devolvem relatório e o consentimento não é registado. As exportações contêm achados derivados do documento e podem incluir mensagens de erro. Não tratar os campos como trilha de auditoria completa; rever exportações antes de partilhá-las.
- Os testes e a comparação de erros TypeScript relatados anteriormente precedem `5cac563`; não são evidência de validação do commit atual. O deploy atual, o consentimento daquela execução, uma análise completa exclusivamente `ON_DEVICE` e a nova configuração de timeouts continuam por verificar.

**Problemas P1 da auditoria original que permanecem em aberto:**
- Lint completo (`npm run lint`) ainda reporta erros de Prettier fora do subconjunto coberto pelo CI.
- Dependências com vulnerabilidades reportadas pelo `npm audit` não foram atualizadas de forma controlada.
- Toolchain sem versão Node fixada.

Esses três itens não foram introduzidos pelos commits recentes e não afetam o fluxo funcional verificado. Continuam como dívida técnica a resolver pós-hackathon.

---

## Auditoria original — `737e31a`

## Resumo executivo

O aplicativo está acessível e o fluxo principal de demonstração funciona. O dashboard, a análise preparada, a matriz de conformidade, a tela de processamento, as configurações e a exportação JSON foram testados no demo público. Não houve erro no console durante o carregamento e o JSON exportado foi validado como JSON válido.

A suíte automatizada está saudável: **29 arquivos e 119 testes passaram**. O build de produção também passou. Porém, o repositório não está totalmente limpo para CI/local porque o **lint completo falha com 34 erros de Prettier**. Há ainda **13 vulnerabilidades de produção reportadas pelo `npm audit --omit=dev`**, incluindo 10 de severidade alta, e o `npm install` em Node 22 emite avisos porque pacotes Firebase instalados declaram Node `>=24.12.0`.

Não executei uma análise Cloud AI real no demo: essa ação enviaria conteúdo a um provedor externo e exigiria consentimento explícito para uso de dados. O teste online foi realizado no modo Demo, que declara não enviar dados reais.

## O que foi testado online

1. **Carregamento inicial:** o demo abriu sem autenticação e exibiu o Dashboard.
2. **Dashboard:** métricas, documento fictício e navegação carregaram.
3. **Análise:** abriu o documento fictício com 6 páginas, findings, requisitos, riscos e citações.
4. **Matriz de conformidade:** exibiu 11 requisitos, filtros, estados de avaliação/revisão e exportação CSV.
5. **Processing:** exibiu os modos local, Cloud AI e Demo; o Cloud AI mostra consentimento explícito.
6. **Demo mode:** selecionado e confirmado sem chamada de IA externa; a aplicação abriu a análise preparada.
7. **Export JSON:** baixou `Riverside Civic Centre - Construction Tender-analysis.json`; o arquivo tem as chaves `analysis` e `document` e foi validado com sucesso.
8. **Settings:** mostrou idioma, modos local/Cloud/híbrido, controles de voz, governança de dados locais e exclusão protegida.
9. **Console:** nenhum erro foi registrado durante o fluxo inicial e navegação testada.

### Observação do deploy

O demo mostra `v0.4.0 · 737e31a · 2026-11-20 21:52 UTC`, que coincide com o `origin/main` analisado. O README e textos históricos ainda descrevem uma verificação anterior em `ed19ed4`. Isso é uma inconsistência documental, não uma falha funcional confirmada.

## Resultado dos checks locais

| Check | Resultado |
|---|---|
| `npm ci` | Passou; emitiu avisos de engine do Firebase para Node 24.12+ |
| `npm test -- --reporter=dot` | **Passou: 119/119 testes em 29 arquivos** |
| `npm run build` | **Passou** |
| `npm run lint` | **Falhou: 34 erros e 14 warnings** |
| `npm audit --omit=dev` | **13 vulnerabilidades de produção: 3 moderadas, 10 altas** |
| Checkout Git | Limpo; `main` alinhado com `origin/main`, sem alterações feitas |

Os warnings dos testes incluem atualizações React fora de `act(...)` em alguns testes, principalmente `DocumentQaPanel`, `IntegrationsScreen`, `SettingsScreen` e `processing-provenance`. Não quebram a suíte hoje, mas reduzem a qualidade dos testes e podem esconder comportamento assíncrono frágil.

## Defeitos e riscos encontrados

### P1 — Lint completo quebrado

O comando documentado `npm run lint` falha por erros de formatação Prettier espalhados por `ChangelogPage.tsx`, `vite.config.ts`, `supabase.ts`, testes e `scripts/probe-models.mjs`, entre outros. O CI atual não executa o lint completo; executa somente um subconjunto de arquivos.

**Impacto:** uma verificação local padrão falha e parte do código não é coberta pelo lint do CI.

**Correção recomendada:** executar Prettier somente nos arquivos apontados, revisar o diff, e depois ampliar o CI para rodar `bun run lint` completo. Não aplicar `--fix` cegamente sem revisar o diff.

### P1 — Dependências com vulnerabilidades de produção

`npm audit --omit=dev` reportou vulnerabilidades em:

- `@grpc/grpc-js`, transitivo de `@firebase/firestore`/`firebase`;
- `brace-expansion`;
- `js-yaml`;
- `nanoid`;
- `source-map-js`;
- `vite`;
- `zod`.

O `npm audit fix --force` sugere mudanças potencialmente quebradoras, inclusive downgrade/alteração grande do pacote Firebase. Portanto, não deve ser executado automaticamente em produção.

**Correção recomendada:** atualizar dependências de forma controlada, começando por versões compatíveis do Firebase/Vite/Zod; gerar novo lockfile; rodar testes, build e um smoke test do demo. Para dependências transitivas sem atualização segura, avaliar `overrides` apenas quando a versão corrigida for compatível e coberta por testes.

### P1 — Toolchain sem versão Node fixada

O CI usa Bun latest, enquanto o deploy usa `npm install`/`npm run build`, e não há `.nvmrc`, `.node-version` nem campo `engines`. A instalação local em Node 22.23.4 emitiu avisos porque pacotes Firebase declararam Node `>=24.12.0`.

**Impacto:** resultados diferentes entre CI, Vercel e desenvolvimento local; risco de uma futura versão do Firebase deixar de funcionar em Node 22.

**Correção recomendada:** escolher e documentar uma versão suportada (preferencialmente Node 24 LTS se compatível com o ambiente de deploy), fixá-la em `package.json`/`.nvmrc` e alinhar CI, Vercel e desenvolvimento. Se Bun continuar sendo o padrão do CI, fixar também a versão do Bun em vez de `latest`.

### P2 — Documentação de release desatualizada

O README e a tela de changelog mantêm referências históricas ao build `ed19ed4`, enquanto o demo e `main` estão em `737e31a`. O texto também chama algumas verificações antigas de "production build".

**Impacto:** dificulta saber qual comportamento e configuração realmente correspondem ao deploy atual.

**Correção recomendada:** separar "histórico de verificação" de "estado atual do deploy", atualizar o README para apontar o commit realmente publicado e automatizar a exibição do SHA/build time a partir do CI/deploy quando possível.

### P2 — Dependência de configuração externa ainda não comprovada em todos os caminhos

O demo mostra "Firebase configured · not yet verified". O próprio README reconhece que on-device/hybrid e OCR de PDF escaneado ainda não foram comprovados de ponta a ponta. O teste realizado aqui não validou uma chamada Cloud AI real nem OCR externo.

**Impacto:** o caminho de maior risco operacional — análise real, App Check, fallback de modelos e OCR — permanece dependente de configuração e ambiente.

**Correção recomendada:** em ambiente controlado, com um documento fictício e consentimento explícito, executar uma matriz de smoke tests para local, Cloud, híbrido, App Check, fallback e OCR escaneado. Registrar status HTTP, fonte de inferência e mensagem de erro, sem capturar tokens ou dados sensíveis.

### P3 — Warnings assíncronos nos testes

A suíte passa, mas há warnings React sobre atualizações fora de `act(...)`.

**Impacto:** baixa confiabilidade dos testes de componentes e maior chance de regressões assíncronas passarem despercebidas.

**Correção recomendada:** envolver ações assíncronas em `await act(...)` ou usar `waitFor`/assertions assíncronas do Testing Library, especialmente nos testes de Q&A, Settings, Integrations e Processing.

### P3 — Bundles grandes

O build alerta chunks acima de 500 kB, incluindo ExcelJS, PDF.js e o bundle principal.

**Impacto:** primeira carga mais pesada, especialmente em conexões móveis ou computadores modestos.

**Correção recomendada:** carregar PDF.js, ExcelJS e fluxos de análise por `import()` sob demanda; medir o impacto com budgets de bundle antes e depois.

## Pontos positivos

- O fluxo central é coerente e navegável.
- Os dados fictícios estão claramente marcados como Demo/Illustrative.
- O consentimento Cloud aparece explicitamente antes do processamento em nuvem.
- A matriz separa verificação da fonte, avaliação de conformidade e revisão humana.
- O app informa que IndexedDB não é criptografado nem sincronizado, reduzindo falsa expectativa de segurança.
- A exportação JSON funcionou no demo.
- Os testes cobrem serviços críticos de análise, processamento, compliance, OCR, preferências, projetos e integrações.
- O checkout auditado ficou sem alterações; nenhuma correção foi aplicada ou publicada nesta auditoria.

## Plano recomendado de correção

1. **Corrigir e revisar o Prettier** nos 34 erros; então fazer o CI executar o lint completo.
2. **Fixar o toolchain**: versão de Node compatível com Firebase, versão do Bun no CI e estratégia única de instalação/deploy.
3. **Atualizar dependências vulneráveis** em uma branch própria, sem `npm audit fix --force`; validar testes e build após cada grupo de atualizações.
4. **Atualizar a documentação de release** para remover a ambiguidade entre `ed19ed4` e `737e31a`.
5. **Executar smoke tests controlados** de Cloud, on-device, hybrid, App Check e OCR com dados fictícios e consentimento explícito.
6. **Eliminar warnings `act(...)`** dos testes de UI.
7. **Otimizar chunks** depois da estabilização funcional e de segurança.

## Conclusão

Não há evidência de que o demo esteja quebrado no fluxo preparado: ele carrega, navega, mostra a análise, abre a matriz, salva preferências e exporta JSON. À data da auditoria, os principais problemas identificados eram lint quebrado, dependências reportadas como vulneráveis, toolchain não fixado e documentação de release divergente. Sua situação atual exige nova verificação.
