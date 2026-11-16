---
name: apple-design
description: Regras de design e animação de interface estilo Apple (baseadas em "Designing Fluid Interfaces" da WWDC 2018, "The Details of UI Typography" e "Principles of Great Design"), traduzidas para CSS, Pointer Events e bibliotecas de mola (Motion, Framer Motion). Use sempre que for construir ou revisar QUALQUER interação tocável/arrastável — botões, gavetas, modais, carrosséis, toggles, cards arrastáveis, barras translúcidas, tipografia de display — ou qualquer pedido vago como "deixa mais bonito/premium/fluido" ou "parece travado". Também use para auditar interfaces existentes (movimento, material, tipografia) e decidir entre transição CSS e mola. Não é tema nem pacote de componentes — é o conjunto de regras (damping/response, física de gesto, material translúcido, escala tipográfica, redução de movimento) que troca adjetivo por execução verificável.
---

# Apple Design

## Por que essa skill existe

Pedir "deixa mais premium" pra um agente de IA é um chute. Ele não tem régua pra saber o que isso significa e vai inventar alguma coisa plausível. Esta skill dá a régua: valores concretos de física de mola, fórmulas de projeção de gesto, regras de material e tipografia, e critérios que dá pra checar linha por linha. Sempre que a tarefa envolver algo que a pessoa toca com o dedo ou o mouse, é aqui que mora a diferença entre uma interface que parece viva e uma que parece só "estar lá".

Esta skill não é um tema visual nem um pacote de componentes prontos. Ela não deixa nada "com cara de Apple" — ela dá o porquê por trás do resultado, pra qualquer interface, em qualquer estilo visual.

## Quando aplicar cada parte

- **Qualquer coisa arrastável, deslizável ou com toggle/gaveta/modal/carrossel** → seção "Movimento: mola em vez de transição".
- **Soltar o dedo e o elemento precisa ir a algum lugar (arremesso, snap, scroll)** → seção "Projeção de impulso".
- **O elemento bate numa borda (fim de lista, limite de arrasto, pull-to-refresh)** → seção "Resistência elástica".
- **Barra, painel, cabeçalho fixo, cartão sobreposto** → seção "Material e profundidade".
- **Título grande, hierarquia de texto, corpo de texto** → seção "Tipografia".
- **Qualquer animação, sempre** → seção "Movimento reduzido e acessibilidade" (não é opcional, é parte do mesmo trabalho).
- **Pedido vago tipo "melhora o design", "audita minha interface", "deixa mais fluido"** → rode o processo de auditoria descrito no fim deste arquivo.

## Movimento: mola em vez de transição

Uma interface parece viva quando o movimento começa do valor que está desenhado na tela agora, herda a velocidade do gesto, projeta pra onde esse impulso levaria, e pode ser agarrado e revertido a qualquer instante. `transition` e `@keyframes` do CSS não conseguem fazer isso — eles têm duração fixa e não sabem ser interrompidos no meio. Mola sim, porque o movimento dela é consequência de dois parâmetros, não de um tempo pré-definido.

**Os dois parâmetros (a Apple simplificou o modelo físico massa/rigidez/amortecimento pra só dois números que dá pra pensar):**

- **damping** — controla o repique. `1.0` assenta liso, sem passar do alvo. Abaixo de `1.0`, estica e volta.
- **response** — quão rápido o valor chega perto do alvo, em segundos. Não é duração fixa: o tempo de assentar é consequência dos dois parâmetros juntos, não um `duration` que você define direto.

**Valores de partida por tipo de interação:**

| Interação | damping | response |
|---|---|---|
| Mover ou reposicionar | 1.0 | 0.4 |
| Rotação | 0.8 | 0.4 |
| Gaveta / bottom sheet | 0.8 | 0.3 |

Regra de bolso: `damping 1.0` é o padrão da casa. Só use repique (`< 1.0`) quando o próprio gesto trouxe impulso — um arremesso, um flick, uma soltada rápida. Repique num menu que só apareceu sozinho parece bug; repique num card que a pessoa jogou parece física de verdade.

**Cinco regras que valem pra qualquer implementação de mola:**

1. **Sempre anime a partir do valor atual desenhado na tela, nunca do valor alvo anterior.** Começar do valor lógico (em vez do que está visualmente ali) é a causa mais comum do salto feio.
2. **Nunca bloqueie a entrada do usuário durante uma transição.** Se o gesto pode continuar, a interface tem que continuar respondendo, mesmo no meio de uma animação em andamento.
3. **Na reversão de um gesto, misture a velocidade em vez de cortar pra outra animação.** Trocar de animação no instante em que o gesto inverte cria uma "parede" invisível que a pessoa sente mesmo sem saber nomear. Use uma biblioteca de mola que reaproveita a velocidade atual ao mudar de alvo (Motion e Framer Motion fazem isso nativamente).
4. **Decomponha movimento 2D em duas molas independentes, uma pro eixo X e outra pro eixo Y.** Uma mola só montada em cima da distância 2D dessincroniza assim que os dois eixos ganham velocidades diferentes — o movimento vira uma curva estranha em vez de reto.
5. **Anime só `transform` e `opacity`.** São as duas propriedades que o navegador consegue animar sem recalcular layout, e é o motivo de tudo continuar liso mesmo em 60fps.

**Feedback e captura do gesto:**

- Dê o primeiro retorno visual no `pointerdown`, nunca esperando o `click` (que só dispara ao soltar). Esperar o dedo soltar pra reagir é o que faz a interface parecer morta ao toque.
- Use Pointer Events com `setPointerCapture`, e respeite o offset de onde a pessoa realmente tocou o elemento — não recentralize o elemento embaixo do dedo no início do arrasto. Isso quebra a ilusão de que a pessoa está segurando o objeto de verdade.
- Entrada e saída pelo mesmo caminho: o que entra pela direita sai pela direita. Inverter o caminho de saída quebra a continuidade espacial que a pessoa construiu na cabeça.

```
Bloco de requisitos pra colar em qualquer pedido de interação:

- Mola, nunca transição de CSS nem keyframes, em qualquer coisa que o usuário possa tocar ou arrastar.
- Damping 1.0 por padrão. Só use 0.8 se o gesto anterior carregou impulso.
- Response entre 0.3 e 0.4 segundos.
- Toda animação tem que ser interrompível: anime sempre a partir do valor atual desenhado na tela, nunca do valor alvo.
- Nunca bloqueie a entrada do usuário durante uma transição.
- Decomponha movimento 2D em duas molas independentes, uma pro X e uma pro Y.
- Feedback visual no pointerdown, contínuo durante o gesto inteiro, não só no fim.
- Use Pointer Events com setPointerCapture e respeite o offset de onde o usuário agarrou.
- Anime só transform e opacity.
- Entrada e saída pelo mesmo caminho: o que entra pela direita sai pela direita.
```

## Projeção de impulso

Quando o dedo solta, o erro comum é encaixar no ponto mais próximo de onde ele soltou. O jeito certo é usar a velocidade do gesto pra projetar onde o elemento pararia se continuasse deslizando (igual à desaceleração natural de um scroll), e só então escolher o alvo mais próximo *desse ponto projetado* — não da posição de soltura. É isso que faz um arremesso parecer um arremesso de verdade.

Essa é a função que a própria Apple usa. Não é a fórmula de física de colégio (v²/2a) — é decaimento exponencial:

```javascript
// decelerationRate 0.998 pro feel de scroll normal, 0.99 pra algo mais seco/rápido
function project(initialVelocity /* px/s */, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

const pontoProjetado = posicaoAtual + project(velocidadeNaSoltada);
const alvo = encaixeMaisProximo(pontoProjetado);      // escolha o alvo pela posição projetada
animarComMola(alvo, { velocity: velocidadeNaSoltada }); // entregue a velocidade real pra mola
```

A emenda entre arrastar e animar importa tanto quanto a fórmula: quando o gesto termina, a animação de assentamento precisa continuar exatamente na velocidade que o dedo tinha. Qualquer diferença cria uma costura visível entre "arrastando" e "animando", e é essa costura que separa uma interface fluida de uma só ok. Se a biblioteca de mola pedir velocidade relativa em vez de absoluta, divida a velocidade do gesto pela distância que falta até o alvo — Motion e Framer Motion aceitam o valor bruto em px/s direto na opção `velocity`.

## Resistência elástica

Parada seca numa borda (fim de uma lista, limite de um arrasto) lê como travado ou quebrado. Resistência que aumenta quanto mais a pessoa insiste além do limite lê como "a interface está respondendo, só não tem mais nada aqui" — a diferença entre achar que quebrou e entender que acabou.

```javascript
// quanto mais além do limite, menos o elemento acompanha o dedo
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

Use em qualquer lista, carrossel ou painel arrastável que tenha um limite físico — scroll no topo/fim, gaveta que abre até um ponto máximo, pull-to-refresh.

## Material e profundidade

- **Barra e painel são camada translúcida, não faixa opaca.** `backdrop-filter: blur()` com fundo semitransparente, com o conteúdo passando por baixo. Uma faixa sólida come um pedaço fixo da tela e mata a sensação de profundidade.

```css
.toolbar {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.4); /* aresta clara = luz pegando no material */
}
```

- **O peso do material carrega a hierarquia.** Material mais pesado (mais opaco, mais blur) separa uma região estrutural, tipo barra lateral. Material mais leve chama atenção pro que é clicável. Nunca empilhe uma superfície translúcida clara sobre outra — a legibilidade desaba.
- **Superfície grande precisa parecer mais grossa** que uma pequena: mais desfoque e sombra mais profunda numa superfície grande do que num chip pequeno.
- **Escurecer o fundo pra focar, deslocar sem escurecer pra manter o fluxo.** Uma tarefa modal, que bloqueia o resto, pede escurecimento do fundo. Um painel paralelo, que não bloqueia nada, usa translucidez e deslocamento — sem escurecer.
- **Texto sobre vidro nunca é cinza chapado.** Aumente o contraste, engorde um pouco o peso da fonte, e dê uma folga a mais no espaçamento entre letras. Cor forte de destaque vai na camada sólida, nunca direto no texto por cima do translúcido.
- **No cabeçalho fixo, troque a borda de 1px por um degradê de desfoque** exatamente onde o conteúdo encontra a barra flutuante — só onde ela de fato sobrepõe conteúdo, não em toda a largura.

## Tipografia

O erro mais comum: usar o mesmo `letter-spacing` pra todos os tamanhos de texto. Isso está errado em algum ponto da escala, porque letras grandes parecem se afastar mais conforme crescem, e letras pequenas precisam de um respiro extra pra continuar legíveis.

- Texto grande de display → espaçamento **negativo** entre letras, entrelinha **apertada**.
- Texto pequeno/corpo → espaçamento levemente **positivo**, entrelinha **mais folgada**.
- A entrelinha caminha ao contrário do tamanho: quanto maior o texto, mais apertada a entrelinha; quanto menor, mais folgada.

```css
:root { font: 100%/1.5 system-ui, sans-serif; } /* corpo: fonte do sistema, entrelinha confortável */

.display {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;        /* entrelinha apertada no texto grande */
  letter-spacing: -0.02em;  /* espaçamento negativo conforme cresce */
  font-optical-sizing: auto;
}
```

Monte a hierarquia visual com peso, tamanho e entrelinha juntos, não só com tamanho — peso adiciona presença sem ocupar mais espaço na tela. E comece pela fonte do sistema antes de escolher uma fonte customizada: ela já vem com tamanho óptico, tabela de espaçamento e ajuste de legibilidade prontos. Só troque quando houver um motivo defensável.

## Movimento reduzido e acessibilidade

Isso não é opcional nem um "extra depois". São três sinais independentes do sistema operacional, e cada um resolve um problema diferente:

- **`prefers-reduced-motion`** → troca deslizamento, mola e parallax por uma transição curta de opacidade, sem elástico e sem passar do ponto.
- **`prefers-reduced-transparency`** → deixa a superfície translúcida mais sólida: sobe a opacidade do fundo e tira o blur.
- **`prefers-contrast: more`** → pede um fundo quase sólido com borda bem definida.

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; transform: none !important; }
}

@media (prefers-reduced-transparency: reduce) {
  .toolbar { background: white; backdrop-filter: none; }
}
```

Outros cuidados que valem a pena:

- Evite fundo animado ocupando a tela inteira e oscilação lenta em loop — perto de um ciclo a cada 5 segundos é a faixa que mais incomoda quem tem sensibilidade a movimento.
- Suavize a troca de brilho entre tema claro e escuro em vez de cortar seco de um pro outro.
- Objeto grande atravessando a tela fica melhor semitransparente durante o trajeto; superfície grande que se reposiciona longe pode sumir e reaparecer já assentada, em vez de percorrer o caminho todo visível.

## Os oito princípios (vocabulário pra diagnosticar, não só pra decorar)

Metade do problema de pedir design é não ter a palavra certa. "Ficou estranho" não é um diagnóstico. "Isso quebra familiaridade porque o botão de fechar mudou de lugar entre duas telas" é. Use estes oito nomes tanto pra avaliar uma interface existente quanto pra explicar o que você quer construir:

- **Propósito** — construa com intenção e decida o que NÃO construir. Toda função cobra tempo, atenção e confiança de quem usa.
- **Autonomia** — mantenha a pessoa no controle: ofereça caminhos, não force um só. Desfazer fácil no lugar de confirmação pra tudo.
- **Responsabilidade** — aja no interesse de quem usa. Peça permissão na hora certa, só o necessário, e antecipe o mau uso — principalmente em funcionalidades com IA.
- **Familiaridade** — construa sobre o que a pessoa já sabe. Coisas parecidas se comportam igual e ficam no mesmo lugar. Só quebre o padrão se conseguir defender que é melhor.
- **Flexibilidade** — contextos, aparelhos e habilidades diferentes. Quando nenhum layout serve pra todo mundo, deixe personalizar.
- **Simplicidade** — não é minimalismo. Enterrar tudo num lugar só parece limpo e não é simples. Caminho comum primeiro, avançado um nível abaixo.
- **Ofício** — nada é aleatório: cada espaçamento, tempo e alinhamento é uma escolha defensável. Scroll tremido lê como descuido.
- **Encanto** — é o resultado de acertar os outros sete, não um confete jogado por cima. Decida a emoção que você quer causar e reforce em cada decisão.

Quatro regras táticas que valem em qualquer projeto:

- **Retorno** tem quatro tipos: status, conclusão, aviso e erro. Valide no meio do caminho, não só quando a pessoa envia o formulário inteiro.
- **Orientação**: toda tela deveria responder onde estou, pra onde posso ir, o que tem aqui e como eu saio.
- **Agrupamento**: proximidade sugere relação. Se você precisa de um rótulo pra explicar por que dois controles estão juntos, a relação está fraca — reorganize em vez de rotular.
- **Rótulo específico** ganha do genérico: dê nome ao que a seção realmente contém ("Progresso", "Biblioteca"), nunca um guarda-chuva vago tipo "Início".

## Processo de auditoria

Quando o pedido for pra revisar ou melhorar uma interface já existente (não construir do zero), siga esta ordem — não misture leitura com edição:

1. **Leia o código sem alterar nada ainda.**
2. **Liste cada violação encontrada**, com arquivo e linha.
3. **Aponte qual regra desta skill ela quebra**, citando a regra (ex: "anima com `transition` num elemento arrastável — viola a regra de mola interrompível").
4. **Descreva o impacto percebido**: o que a pessoa sente de errado por causa disso, não só o que está tecnicamente errado.
5. **Dê a correção concreta**, com o valor exato a usar (damping/response, letter-spacing, blur), não uma sugestão vaga.
6. **Ordene por impacto**, do mais grave (quebra a interação) pro mais cosmético (ajuste fino de espaçamento).
7. **Separe o relatório em três blocos**: movimento, tipografia, material e profundidade.

Depois de entregar o relatório, espere confirmação antes de aplicar as correções. Uma auditoria que já sai editando o código vira um diff gigante que ninguém revisa de verdade — e aí o problema deixou de ser de design e passou a ser de confiança no próprio código. Aplique as correções uma de cada vez, na ordem de impacto, só depois que a pessoa validar o relatório.
