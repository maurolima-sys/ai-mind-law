# Localization — PocketMind AI

## Decisão de política linguística (pendente confirmação)

| Configuração | Opções | Decisão |
|---|---|---|
| Idioma padrão da interface | EN / PT / auto (navigator.language) | ⚠️ pendente |
| Idioma das respostas da IA | automático (segue pergunta) / fixo (preferência) | ⚠️ pendente |
| Idiomas da v1 | EN+PT+ES simultâneo / EN+PT primeiro | ⚠️ pendente |

## Três camadas linguísticas

| Camada | Escopo |
|---|---|
| Interface language | Menus, botões, labels, erros, estados, exportações |
| Preferred response language | Idioma das respostas da IA |
| Document language | Idioma original do documento — nunca traduzido |

**Regra fundamental:** traduzir a explicação, nunca modificar a evidência original.

## Exemplo de fluxo multilíngue

- Documento: EN — "Tenderers must hold a valid electrical contractor licence."
- Pergunta: PT — "Que licença é obrigatória?"
- Resposta: PT — explicação em português
- Evidência: EN — excerto original preservado, página verificada

## Fases de implementação

1. **Auditoria** — inventariar todos os textos hardcoded nos componentes React, prompts da IA, dados demo, exportações CSV/JSON
2. **i18n da interface** — sistema centralizado de traduções (EN / PT / ES)
3. **Inteligência linguística** — prompts detetam idioma da pergunta, respondem no idioma correto, preservam JSON estruturado e evidências originais
4. **Documentos multilíngues** — testar tenders em PT, EN, ES com atenção a terminologia jurídica, datas, valores
5. **Testes de consistência** — matriz completa de combinações interface × pergunta × documento × resposta esperada

## Matriz de testes

| Interface | Pergunta | Documento | Resposta esperada |
|---|---|---|---|
| EN | EN | EN | EN |
| PT | PT | EN | PT |
| EN | PT | PT | PT |
| ES | ES | EN | ES |
| PT | EN | ES | PT ou idioma preferido |
| EN | ES | PT | EN ou idioma preferido |

## Regras de implementação

- Nomes de campos do schema JSON nunca são traduzidos
- Citações originais permanecem intactas
- Páginas das evidências continuam corretas após tradução
- Tradução não altera valores, datas ou obrigações
- Textos PT/ES são mais longos — testar responsividade em conjunto com alterações de layout
- Não misturar alterações funcionais de i18n com alterações de layout responsivo

## Relação com o hackathon

Suporte multilíngue reforça a proposta de valor para juízes internacionais e diferencia o projeto na categoria Best Web/Chrome. Não é requisito técnico do #BuildHybridAI 2026, mas contribui para a qualidade da submissão.

## Prioridade atual

**Bloqueador antes de iniciar i18n:** validar App Check + Firebase AI Logic em produção (https://ai-mind-law.vercel.app). A localização é fase de refinamento — começa após o gate técnico estar aprovado.
