# Hog OSC — Especificação para módulo Bitfocus Companion

Documento de referência com tudo confirmado empiricamente por captura de tráfego OSC
(Wireshark + logs do Companion + Protokol) contra uma consola **Gig Hog** a correr
**Hog OS 5.2.0 (build 212)**.

Todos os comportamentos aqui descritos foram verificados com evidência ao nível do pacote,
não assumidos a partir do manual. Onde o manual contradiz o observado, está assinalado.

---

## 1. Objetivo do módulo

Substituir o workaround atual (módulo `generic-osc` + 36 triggers + variáveis personalizadas),
que é **estruturalmente pouco fiável**.

**Porquê:** o `generic-osc` só expõe duas variáveis partilhadas e voláteis
(`latest_received_path` e `latest_received_args`), sobrescritas a cada mensagem que chega.
A Hog envia **rajadas de 20+ mensagens em ~350 ms**, com intervalos de 5–60 ms entre elas.
Não há forma fiável de capturar cada valor a tempo — testado por eventos, por dispatcher
único e por polling a 100 ms; todos falham de forma intermitente.

**Solução:** o módulo mantém um **dicionário interno** (`Map<path, value>`) atualizado a cada
mensagem recebida, e expõe **uma variável Companion por caminho**. Sem estado partilhado,
sem corrida, imune a rajadas.

---

## 2. Ligação

| | |
|---|---|
| Transporte | UDP (só UDP — ver §7) |
| Consola → Companion | Consola envia de `172.31.0.1:7000` |
| Porta de escuta | 7009 (configurável) |
| Companion → Consola | Envia para `172.31.0.1:7000` |

A consola usa a **mesma porta (7000)** para enviar estado e receber comandos.

---

## 3. Caminhos OSC confirmados (entrada — consola → Companion)

### 3.1 Command keys (h-keys)

| Caminho | Tipo | Notas |
|---|---|---|
| `/hog/status/h<N>/line1` | string | Nome do objeto atribuído |
| `/hog/status/h<N>/line2` | string | Estado (`on`, `on 1`, `....`, `Cue 1`, texto livre) |
| `/hog/status/led/h<N>` | float 0/1 | Estado aceso/apagado |
| `/hog/status/led/h<N>color` | string hex | **Sem barra antes de `color`** — ver §6 |

> **Atenção ao offset** — ver §5.

### 3.2 Botões nomeados (front panel)

Todos com o par `<nome>` (float 0/1) e `<nome>color` (string hex):

```
blind, clear, highlight, macro, ratedisabled, dbo, thruster upper,
intensity, position, colour, beam, effects, time,
maingo, mainhalt, mainback,
play, pause, go back,
flash
```

Nota: `colour` (grafia britânica) para o botão; mas o sufixo de cor é sempre `color`
(americana). Ex.: `/hog/status/led/colourcolor`.

Nota: `thruster upper` e `go back` contêm **espaço** no caminho.

### 3.3 Masters de playback

Confirmado de **0 a 35** (36 masters):

```
/hog/status/led/go/<M>          float 0/1   + /go/<M>color
/hog/status/led/pause/<M>       float 0/1   + /pause/<M>color
/hog/status/led/goback/<M>      float 0/1   + /goback/<M>color
/hog/status/led/flash/<M>       float 0/1   + /flash/<M>color
/hog/status/led/choose/<M>      float 0/1
```

> **Contradiz o manual.** A secção 22.5.1 do manual v5.2.0 afirma que o Hog OS não envia
> atividade de playback via OSC. É falso — envia, e de forma detalhada.

### 3.4 Encoder wheels

```
/hog/status/encoderwheel<1-5>/label    string
/hog/status/encoderwheel<1-5>/value    string
```

Ex.: `label="Playback Rate"`, `value="100%"`; `label="Intensity"`, `value="Full"`.
Os labels mudam conforme o contexto (ex. `Scroll Up/Down`, `Zoom`).

**Cuidado:** os labels chegam **fragmentados** — primeiro truncados a 7 caracteres, depois
completos. Ex.: `"Playbac"` seguido de `"Playback Rate"`. O módulo deve aceitar sempre o
último valor recebido.

### 3.5 Sistema

```
/hog/system/time              string HH:MM:SS   heartbeat, ~1–2 s
/hog/status/commandline       string            eco em tempo real da linha de comando
/hog/status/led/flash         float 0/1         + flashcolor — pisca continuamente
```

O `commandline` reflete o que está a ser escrito, carácter a carácter
(ex.: `"Scene 1"` → `"Scene 1 Move To"` → `"Scene 1 Record Command 1 "`).
Útil para mostrar a linha de comando ao vivo no Stream Deck.

---

## 4. Caminhos OSC de saída (comando — Companion → consola)

```
/hog/hardware/h<N>       0 = up, 1 = down     command keys
/hog/hardware/pig        0/1                  modificador Pig
/hog/hardware/release    0/1
/hog/hardware/blind      0/1
/hog/hardware/highlight  0/1
/hog/hardware/clear      0/1
/hog/playback/release/0 <lista>   liberta cuelist por número de lista
/hog/playback/release/1 <cena>
/hog/playback/release/2 <macro>
```

---

## 5. BUG CONFIRMADO — offset de +1 nas command keys

**Tecla física N ⟶ `h(N+1)` em todos os caminhos.**

| Tecla física | Caminho OSC |
|---|---|
| 1 | `h2` |
| 2 | `h3` |
| … | … |
| 12 | `h13` |

Aplica-se tanto ao **envio** (`/hog/hardware/h<N>`) como à **receção** (`/hog/status/h<N>/...`).

Contradiz o próprio manual, cujo exemplo documenta `/hog/status/h1/line1` para a tecla 1.
Reportado no fórum ETC ("BUG Report - OSC - Function Keys numbers are off by 1").

**O módulo deve esconder isto**: o utilizador escolhe "Command Key 5", o módulo trata
internamente de `h6`.

**Exceção importante:** no dump completo gerado por log off + relaunch, a consola envia
`h1`–`h12` **sem offset**. Ou seja, a indexação interna real é 1–12; o offset parece ser um
bug apenas nos eventos individuais.

---

## 6. Formato dos caminhos de cor

O sufixo de cor é **concatenado ao nome, sem barra**:

```
✅ /hog/status/led/h2color
✅ /hog/status/led/flashcolor
✅ /hog/status/led/go/1color
❌ /hog/status/led/h2/color
```

---

## 7. TCP não é viável

A consola oferece TCP com framing SLIP ou HDR. Testado exaustivamente contra ambos os modos
TCP do `generic-osc` (TCP e TCP RAW): ou não liga, ou liga e morre ao fim de segundos.

**Usar apenas UDP.**

---

## 8. Quando é que `line1` (nome) é enviado

`line1` **não** é transmitido continuamente. É enviado apenas quando o nome apresentado muda:

| Ação | Envia `line1`? |
|---|---|
| Rename (selecionar objeto → `SET` → texto → Enter) | ✅ |
| `[Objeto] Move To [tecla]` | ✅ |
| `[Objeto] Copy To [tecla]` | ✅ |
| `Delete Command <N>` | ✅ (string vazia) |
| Copiar na diretoria (gera `"Copy of <nome>"`) | ✅ |
| Disparar a tecla (Go/Off) | ❌ |
| Mudar a cor do objeto | ❌ |
| Undo / Redo | ❌ |

Na Hog **toda** a atribuição passa pela sintaxe da linha de comando
(`Move To`, `Copy To`, `Record To`, `Merge To`, `Update To`, `Delete To`) — não existe
drag-and-drop. Portanto o fluxo de trabalho normal já mantém `line1` sincronizado.

**Consequência para o módulo:** deve **persistir** os valores recebidos. Não há forma de
pedir o estado atual a qualquer momento (ver §9).

---

## 9. BUG CONFIRMADO — comandos de refresh não funcionam

Documentados no manual (secção 22.4.5), mas sem qualquer efeito na v5.2.0:

```
/hog/command  refreshall
/hog/command  consoleledrefresh
/hog/command  consolefaderrefresh
```

Não produzem resposta nenhuma. Reportado no fórum ETC.

**Único mecanismo de sincronização completa:** fazer **log off + relaunch da sessão** na
consola. Isso gera um dump completo do estado — todos os `h1`–`h12` (sem offset), os 36
masters de playback, e todos os botões nomeados.

> **Regra prática obrigatória:** o Companion tem de estar ligado e a ouvir no momento em que
> a sessão é lançada, senão perde-se esta oportunidade e fica com dados desatualizados até
> cada tecla mudar individualmente.

---

## 10. A cor real do objeto NÃO existe via OSC

`/hog/status/led/h<N>color` **não** reflete a cor atribuída à cuelist/scene/page.
Transmite apenas o ciclo genérico de piscar do LED:

```
ffffff  aceso
000000  apagado
0000ff  transição/inativo
```

Testado isoladamente: cuelist alternada entre laranja e vermelho, com a tecla ativa, com e
sem Undo/Redo. **Nenhuma dessas cores apareceu em momento algum.**

Faz sentido: a cor é atribuída por um módulo separado (botão direito → color picker) e é um
atributo do objeto, não do estado da tecla.

**Implicação:** o módulo pode usar `h<N>color` como indicador de atividade (pisca enquanto
a tecla está ativa), mas nunca como "a cor da cuelist". Recomenda-se filtrar `000000` para
evitar cintilação visual.

---

## 11. BUG — tecla 12 e mudança de página

A tecla 12 por vezes provoca o envio de um endereço malformado:

```
/hog/status/led/Invalid input        FLOAT(1)
/hog/status/led/Invalid inputcolor   STRING(ffffff)
```

em vez dos esperados `/hog/status/led/h13` e `/hog/status/led/h13color`.
Capturado ao nível do pacote, correlacionado com a ativação de h13.

**Hipótese confirmada (2026-08-13):** a tecla física 12 funciona como **mudança de página do
diretório de comandos**, alternando a vista em blocos de 12 em 12 — não é um defeito da tecla,
é o comportamento normal da consola quando há mais de 12 comandos disponíveis. Confirmado por
conhecimento direto do operador sobre o funcionamento da consola (não capturado ao nível do
pacote como o resto deste documento). Isto explica o endereço malformado: ao mudar de página,
a tecla 12 deixa de corresponder a um `h<N>` fixo, daí o endereço `Invalid input`.

O módulo deve tolerar endereços malformados sem falhar.

---

## 12. Comportamento das rajadas

Qualquer operação de atribuição/remoção provoca uma **varredura completa** de h2 a h13:

```
09:47:52.770  h2/line1  = "test"
09:47:52.778  h2/line2  = "...."      (+8 ms)
09:47:52.815  h3/line1  = ""          (+45 ms)
...
09:47:53.135  h10/line2 = ""          (~365 ms no total)
```

É precisamente isto que torna a variável partilhada do `generic-osc` inutilizável, e o que
o dicionário interno do módulo resolve.

**Nota adicional:** libertar muitos cuelists em simultâneo ("release all") provoca perda de
pacotes UDP — alguns indicadores não atualizam. Libertar um a um é 100 % fiável. É uma
limitação do UDP, não da consola; o módulo pode mitigar reagindo a qualquer atualização
posterior do mesmo caminho.

---

## 13. Requisitos do módulo

### Variáveis (uma por caminho — o ponto central)

```
h<N>_line1        h<N>_line2        h<N>_led        h<N>_color     (N = 1..12, já sem offset)
master<M>_go      master<M>_pause   master<M>_goback   master<M>_flash   master<M>_choose
encoder<E>_label  encoder<E>_value  (E = 1..5)
commandline
blind, clear, highlight, dbo, macro, ...
```

### Feedbacks

- Estado do LED da command key (boolean)
- Cor do LED (para borda/preenchimento)
- Estado dos botões nomeados
- Estado de go/pause por master

### Ações

- Premir command key (com offset tratado internamente)
- Premir botão nomeado (Pig, Blind, Clear, Highlight, Release…)
- Libertar cuelist/scene/macro por número
- Enviar comando arbitrário na linha de comando

### Implementação

- Dicionário interno `Map<path, value>`, atualizado a cada mensagem
- Persistir valores entre reinícios (não há refresh sob pedido — §9)
- Tolerar endereços malformados (§11)
- Aceitar sempre o último valor em labels fragmentados (§3.4)

---

## 14. Estado reportado à ETC

Reportado no fórum da comunidade ETC:

1. Offset de +1 nas command keys
2. `refreshall` / `consoleledrefresh` / `consolefaderrefresh` sem efeito
3. `line1` não atualiza em reatribuição (desatualizado — ver §8: atualiza sim, via `Move To`)

Comentado na issue **#7** do repositório `bitfocus/companion-module-highend-hog4`
(pedido de feedback OSC nativo), com estas descobertas.

Relacionadas no módulo `generic-osc`: issues **#76**, **#78**, **#82** — todas a pedir
captura de valor por caminho para variável. Continuam por implementar na v2.8.2, que é a
versão mais recente.

---

## 15. Nomes longos e espaços — quebra de linha imprevisível entre line1/line2

Confirmado por teste em 2026-08-13: a consola faz **word-wrap automático** do nome do objeto
entre `line1` e `line2` quando não cabe numa só linha, partindo no espaço mais próximo do
limite.

| Nome atribuído | `line1` | `line2` |
|---|---|---|
| `"again"` (5 carateres) | `again` | *(vazio)* |
| `"test SC"` (7 carateres, com espaço) | `test` | `SC` |

Isto **não é** um indicador de tipo de objeto (ver descoberta falsa em baixo) — é apenas
comportamento de quebra de linha do ecrã físico da consola, aplicável a qualquer objeto
(cuelist, scene, macro) cujo nome seja demasiado longo.

**Descoberta falsa, corrigida:** inicialmente pareceu que `line2 === "SCENE"` distinguia uma
scene de uma cuelist — coincidência: o nome de teste da scene continha literalmente a palavra
"SCENE", que calhou de ficar isolada em `line2` após a quebra. **Não existe nenhum campo OSC
que indique o tipo do objeto** (cuelist vs. scene vs. macro). Ver §13 do README do módulo para
a conclusão de design (estilo por botão tem de ser escolhido manualmente pelo operador).

**Fio solto, não confirmado:** durante um rename ao vivo, `line2` mostrou momentaneamente o
texto a ser digitado (ex. `"222"`) enquanto `line1` ainda tinha o nome antigo confirmado —
possível eco de digitação em tempo real antes do Enter, semelhante ao `commandline` (§3.5).
Por confirmar se o mesmo acontece com cuelists, não só scenes.

**Limitação a reportar à ETC:** não há forma de reconstruir o nome completo original a partir
de `line1`+`line2` de forma fiável — nem sempre a quebra acontece num espaço previsível, e o
próprio comportamento pode mudar em versões futuras do Hog OS. Vale a pena testar novamente
após cada atualização da consola.

---

## 16. U-Keys — confirmado apenas o modo de pressão simples

A consola tem **12 U-Keys** (teclas macro configuráveis pelo utilizador), cada uma com **4
modos de interação** possíveis: pressão simples, duplo clique, Pig+U-key, e Open+U-key.

**Confirmado por teste em 2026-08-13 (pressão simples, 4 teclas testadas):**

```
/hog/hardware/u<N>   0 = up, 1 = down
```

Corresponde exatamente ao que o manual da ETC documenta — **sem offset** (ao contrário das
command keys, §5). `u1` é `u1`, não `u2`.

**Por confirmar (não testado ainda):**
- Se existe algum caminho de status/feedback (`/hog/status/u<N>/...`) quando a tecla é premida
  fisicamente na consola — o manual não documenta nenhum.
- Os outros 3 modos de interação (duplo clique, Pig+U-key, Open+U-key) — desconhece-se se
  produzem o mesmo caminho `/hog/hardware/u<N>` ou algo distinto.

**Como aplicar:** implementar ações de press/release para pressão simples usando o caminho
confirmado acima. Não assumir comportamento para os outros 3 modos nem para feedback de status
sem evidência de pacote — testar cada um antes de os implementar, seguindo a mesma regra de
evidência do resto deste documento.

**Falsa pista testada e refutada (2026-08-13):** `/hog/hardware/open` foi tentado como o
caminho da tecla modificadora "Open" (usada em combos como Pig+Open+U-key), por analogia com
"pig" e por corresponder ao que o projeto separado `companion-module-highend-hog4` já usa no
seu `HardwareKey`. Testado via Companion contra a consola real — **não fez nada**. Removido de
`HARDWARE_BUTTON_CHOICES`. O caminho real da tecla Open (se existir) continua desconhecido.

**A consola não ecoa a tecla física Open diretamente, mas produz um sinal indireto (corrigido
2026-08-14):** captura Protokol de ~16s incluindo 3 pressões físicas da tecla Open na consola —
sem nenhum evento tipo "hardware key pressed" dedicado, mas com um padrão que se repete
exatamente 3 vezes, coincidindo com as 3 pressões:

```
/hog/status/encoderwheel1/label   STRING(Scroll Up/Down)
/hog/status/encoderwheel2/label   STRING(Scroll Left/Right)
/hog/status/encoderwheel3/label   STRING(Zoom)
... ~0.3s depois ...
/hog/status/encoderwheel1/label   STRING()
/hog/status/encoderwheel2/label   STRING()
/hog/status/encoderwheel3/label   STRING()
```

Estas labels correspondem exatamente à documentação oficial da ETC
(chap-magic_keys_combos.htm): "Open + encoder wheels: Controls vertical/horizontal scrolling
and zooming". Conclusão: Open não tem o seu próprio caminho hardware/status — em vez disso,
**premir Open faz a consola re-rotular temporariamente os encoder wheels** para refletir a
função que passam a ter enquanto Open está premido, e as labels voltam a vazio quando Open é
largado. Isto é um sinal indireto mas real e reproduzível de "Open está premido/largado", útil
como proxy caso seja preciso construir uma feedback para isto no futuro - mas não é um caminho
`/hog/hardware/open` dedicado, e continua sem se saber se existe algum caminho send-only para
simular a própria pressão de Open a partir do Companion.
