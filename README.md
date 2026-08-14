# Atlas Fit — Treino pessoal

App estático e instalável para registrar treinos pessoais, carga, repetições, descanso e evolução. Foi pensado para uso privado no GitHub Pages, sem backend, sem login e sem banco externo.

## Principais recursos

- Dashboard com treino do dia, aderência semanal, streak e volume.
- Registro por série com carga, repetições, RPE e conclusão.
- Timer de descanso flutuante.
- Histórico de sessões finalizadas.
- Gráfico de volume dos últimos treinos.
- Cálculo de volume por músculo.
- Melhores marcas estimadas por exercício (1RM estimado pela fórmula de Epley).
- Construtor de treino dentro do app: adicionar, remover e reordenar exercícios.
- Backup em JSON e exportação CSV.
- Importação de backup.
- Migração automática de dados de versões anteriores.
- PWA offline com service worker.
- Manifest corrigido para funcionar em subpasta do GitHub Pages.
- Interface responsiva para celular.

## Interface

<img width="512" height="606" alt="Tela inicial do Atlas Fit" src="https://github.com/user-attachments/assets/4f9e7050-1ce6-447f-8248-614fff01f85b" />

<img width="523" height="617" alt="Tela de treino do Atlas Fit" src="https://github.com/user-attachments/assets/6a161e4d-9fbe-4a16-8f4c-654df54166c6" />

## Como rodar localmente

Abra `index.html` direto no navegador ou use um servidor local simples:

```bash
python -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

Servir por HTTP em vez de abrir o arquivo direto garante que o service worker e o comportamento de PWA funcionem como em produção.

## Deploy no GitHub Pages

1. Crie um repositório, por exemplo `atlas-fit`.
2. Envie todos os arquivos para a raiz do repositório.
3. No GitHub, vá em **Settings → Pages**.
4. Em **Source**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta **root**.
6. Acesse o endereço publicado pelo GitHub Pages.

O manifest usa `start_url: "."` e o service worker usa caminhos relativos. Isso evita o erro comum de PWA quebrar quando o projeto fica em `https://usuario.github.io/repositorio/`.

## Personalizar seus treinos

Você pode editar de duas formas:

### Pelo próprio app

Abra **Biblioteca → Construtor de treino** e adicione, remova ou reordene exercícios. As alterações ficam salvas no navegador.

### Pelo código

Edite `data.js`, no objeto `DEFAULT_PLAN`. Cada dia possui:

- `id`
- `day`
- `label`
- `focus`
- `color`
- `warmup`
- `exercises`

Cada exercício aceita:

- `name`
- `sets`
- `reps`
- `rest`
- `muscles`
- `secondary`
- `equipment`
- `tempo`
- `cues`

## Dados e privacidade

Os dados ficam no `localStorage` do navegador. Isso significa:

- não existe servidor;
- não existe sincronização automática entre celular e computador;
- limpar os dados do navegador apaga o histórico;
- exporte backup JSON periodicamente.

## Arquivos

```text
index.html
style.css
app.js
data.js
sw.js
manifest.json
icon-192.png
icon-512.png
README.md
```

## Próximas evoluções possíveis

- Fotos de evolução salvas localmente.
- Deload automático por fadiga/RPE alto.
- Tela de calendário mensal.
- Comparação exercício por exercício.
- Sincronização opcional com GitHub Gist ou Firebase.
