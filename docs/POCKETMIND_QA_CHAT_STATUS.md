# Estado do chat de perguntas e respostas

## O que eu estava tentando corrigir

O botão **Send question** passou a habilitar quando havia texto, mas isso, por si só, não gerava uma resposta. O chat ainda precisa de um modo de IA autorizado para chamar o modelo.

O workspace inicia em **Hybrid** quando o Firebase está configurado, ou em **On-device only** caso contrário. O modo **Demo** mostra dados ilustrativos e, intencionalmente, não chama Firebase AI; se estiver ativo, o envio é interrompido com uma orientação para escolher outro modo. Cloud e Hybrid também exigem consentimento explícito.

## Ajustes feitos no fluxo

- Manter o botão de envio habilitado quando existe uma pergunta, para que o usuário possa enviar ou receber uma explicação sobre o que falta.
- Mostrar uma área permanente de conversa identificada como **Answer**. Respostas bem-sucedidas aparecem ali como texto.
- Exibir o controle de leitura em voz alta junto à resposta quando o navegador oferece síntese de voz; informar quando esse recurso não está disponível.
- Preservar a pergunta digitada ou ditada ao abrir **Processing & privacy** para escolher o modo ou rever o consentimento. Assim, ela não precisa ser escrita novamente ao voltar à análise.
- Manter as validações de modo, consentimento e pesquisa externa. A habilitação do botão não autoriza uma chamada de IA nem envia conteúdo sem os consentimentos necessários.

## Como testar

1. Abra a análise do documento e escreva ou dite uma pergunta.
2. Se o modo atual for **Demo**, abra **Processing & privacy** e escolha **On-device only**, **Cloud AI** ou **Hybrid inference**.
3. Para Cloud ou Hybrid, dê o consentimento de nuvem. Volte a **Document analysis**; a pergunta deve continuar no campo.
4. Envie a pergunta. A resposta deve aparecer na área **Answer**. Se a chamada falhar, o chat deve mostrar uma mensagem de erro em vez de uma resposta fictícia.
5. Se o navegador suportar leitura em voz alta, use o botão de áudio na resposta.

O modo On-device pode falhar se o navegador ou dispositivo não oferecer o modelo local. Isso não deve provocar fallback silencioso para a nuvem. Erros de Firebase/modelo também podem impedir uma resposta real.

## Verificações e publicação

O teste focado do chat e o build de produção passaram após as alterações. A correção foi validada no código local; ela só aparece no site publicado depois de um novo deploy. Nenhuma credencial ou valor de `.env` faz parte desta nota.
