# Issues Log — PocketMind AI

> Gerado a partir de `git log --oneline -47`. Problemas ordenados do mais recente ao mais antigo.

---

## Problemas Resolvidos

### 1. Timeout de geração muito curto para o modelo on-device
- **Commit**: `d2b0356`
- **Sintoma**: Análise falhava com `Firebase AI Logic request timed out after 20 seconds` ao usar o modelo on-device (Chrome Prompt API), que é significativamente mais lento que cloud.
- **Causa**: `GENERATION_TIMEOUT_MS = 20_000` e `TOTAL_GENERATION_BUDGET_MS = 60_000` subdimensionados para latência on-device.
- **Fix**: `GENERATION_TIMEOUT_MS → 60_000`, `TOTAL_GENERATION_BUDGET_MS → 180_000`.

---

### 2. Modo de processamento padrão era "demo"
- **Commit**: `1ff7ff3`
- **Sintoma**: QA panel mostrava `preference = null`; utilizador tinha de selecionar manualmente um modo antes de poder fazer perguntas.
- **Causa**: `processingChoice` inicializado com `"demo"` em `PocketMindApp.tsx`.
- **Fix**: Pré-selecionar `"hybrid"` se Firebase configurado, `"local"` caso contrário.

---

### 3. `responseConstraint` não suportado pelo Chrome Prompt API (on-device)
- **Commit**: `95e2844`
- **Sintoma**: Chamadas on-device falhavam silenciosamente ou retornavam erro de parse.
- **Causa**: `responseConstraint` passado em `onDeviceParams` — a Chrome Prompt API não suporta JSON schema constraint, `responseMimeType`, nem structured output.
- **Fix**: Removido `responseConstraint` e `onDeviceParams` de `createTenderModel`.

---

### 4. Respostas on-device em texto livre causavam "Invalid format"
- **Commit**: `2698478`
- **Sintoma**: `parseResponse` lançava erro `"Invalid format"` para respostas do modelo on-device que não seguiam o schema JSON estrito.
- **Causa**: Schema Zod com `min(1)` em arrays e `regex` em `researchSourceIds`; sem fallback para texto livre.
- **Fix**: Arrays com `.default([])`, removido `min(1)` e `regex`; `parseResponse` usa `extractJsonBlock()` e faz fallback para envolver texto simples como `answer`.

---

### 5. SSR hydration mismatch no `LocaleProvider`
- **Commit**: `ca14c05`
- **Sintoma**: Erro de hidratação React no cliente; locale do servidor (`"en"`) divergia do locale armazenado no `localStorage` (ex: `"pt"`).
- **Causa**: `useState` no `LocaleProvider` lia `localStorage` diretamente no inicializador — executado no servidor onde `localStorage` não existe.
- **Fix**: Inicializar sempre com `"en"` (SSR-safe); sincronizar com `localStorage` em `useEffect`.

---

### 6. Nome do modelo incorreto (`gemini-2.0-flash` → 404)
- **Commits**: `14129f2` (introduziu o erro), `1b3529c` (reverteu para `gemini-3.8-flash`)
- **Sintoma**: Todas as chamadas cloud retornavam 404.
- **Causa**: Commit `14129f2` alterou o nome do modelo para `gemini-2.0-flash`, que não existe no endpoint Firebase AI Logic.
- **Fix**: Revertido para `gemini-3.8-flash`.

---

### 7. Erros transitórios 429/500/502/503 sem retry
- **Commit**: `1b3529c`
- **Sintoma**: Análise falhava definitivamente em erros de rate-limit ou instabilidade temporária do servidor.
- **Causa**: Sem lógica de retry com backoff.
- **Fix**: Adicionado retry com backoff exponencial para códigos 429/500/502/503.

---

### 8. Ausência de fallback entre modelos
- **Commit**: `4f88d44`
- **Sintoma**: Se `gemini-3.8-flash` falhasse, análise terminava em erro sem tentar alternativas.
- **Causa**: Sem cadeia de fallback de modelos.
- **Fix**: Cadeia `gemini-3.8-flash` (×2) → `gemini-3.7-flash` → `gemini-3.6-flash` → `gemini-3.5-flash-lite`.

---

### 9. Timeout de 60s insuficiente para `generateContent` (primeira versão)
- **Commit**: `578042d`
- **Sintoma**: Análise de documentos longos falhava por timeout antes do fix definitivo.
- **Causa**: Timeout inicial de 60s adicionado mas ainda insuficiente para on-device (resolvido definitivamente em `d2b0356`).
- **Fix parcial**: Adicionado timeout de 60s; tolerância a `inferenceSource` ausente no SDK.

---

### 10. `ReferenceError` em `OverviewScreen` / `AnalysisScreen` — `modeLabel` fora de escopo
- **Commit**: `312f31e`
- **Sintoma**: Crash em runtime ao renderizar os ecrãs de overview e análise após introdução do i18n.
- **Causa**: `modeLabel` definido dentro de um componente mas referenciado fora do seu escopo.
- **Fix**: Movido `modeLabel` para escopo de módulo com parâmetro `t`.

---

### 11. Vercel deployment — framework incorreto em `vercel.json`
- **Commit**: `7938769`
- **Sintoma**: Deploy Vercel falhava ou servia assets incorretos.
- **Causa**: `vercel.json` sem `framework: "tanstack-start"` e com `outputDirectory` incorreto.
- **Fix**: Definido `framework: "tanstack-start"`, removido `outputDirectory`.

---

### 12. Strings hardcoded em inglês após introdução do i18n
- **Commit**: `374bef4`
- **Sintoma**: Partes da UI não traduziam ao mudar de idioma.
- **Causa**: Strings literais em inglês espalhadas pelos componentes em vez de chamadas `t()`.
- **Fix**: Substituídas todas as strings hardcoded por `t()` com chaves EN/PT/ES.

---

### 13. Ficheiros stray (`firebaseAi.ts`, `model-fallback.test.ts`) na raiz do repo
- **Commits**: `a197013`, `fad6010`
- **Sintoma**: Ficheiros duplicados na raiz causavam confusão e potenciais conflitos de build.
- **Causa**: Ficheiros criados acidentalmente fora de `src/`.
- **Fix**: Adicionados ao `.gitignore`, removidos do tracking.

---

### 14. App Check debug token não registado / Firebase não conectado
- **Contexto**: Identificado durante sessão de trabalho (não tem commit único).
- **Sintoma**: Firebase AI Logic mostrava "not connected"; análise cloud falhava silenciosamente.
- **Causa**: Token `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` presente no `.env` mas não registado na Firebase Console.
- **Fix**: Token `531CF450-EA03-4EBE-81EB-3CFE3FCC690D` deve ser registado manualmente na Firebase Console → App Check → Debug tokens.

---

### 15. Variáveis de ambiente não sincronizadas com Vercel
- **Commit**: `006a685` (script criado)
- **Sintoma**: Produção em `ai-mind-law.vercel.app` não tinha as variáveis Firebase/API configuradas.
- **Causa**: `.env.local` nunca sincronizado com Vercel.
- **Fix**: Script `scripts/set-vercel-vars.ps1` que lê `.env` e sincroniza via Vercel CLI (`vercel env rm` + `vercel env add`). 15 vars sincronizadas.

---

## Problemas em Aberto / A Monitorizar

| # | Problema | Risco | Próximo passo |
|---|----------|-------|---------------|
| A | App Check em produção usa debug provider | Alto — não deve ir a produção com debug provider | Configurar reCAPTCHA Enterprise para `ai-mind-law.vercel.app` |
| B | On-device inference depende de Chrome + hardware disponível | Médio — utilizadores sem suporte veem fallback cloud sem aviso claro | Verificar mensagem de fallback na UI |
| C | LlamaParse OCR sem teste real com PDF digitalizado | Médio — fluxo OCR não validado end-to-end | Testar com PDF real sem texto selecionável |
| D | `FIRECRAWL_API_KEY` como variável server-side — nunca em `VITE_*` | Alto — exposição de chave se colocada no lado cliente | Confirmar que está apenas em variável server-side no Vercel |
| E | Contas, workspaces partilhados e armazenamento cloud não implementados | Baixo (v1 scope) | Roadmap pós-hackathon |
| F | i18n: textos PT/ES mais longos podem quebrar layout em ecrãs pequenos | Baixo | Testar responsividade com PT/ES após gate técnico Firebase |

---

*Última atualização: HEAD `d2b0356`*
