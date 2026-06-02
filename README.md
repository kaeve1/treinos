# Treino App 💪

App PWA mobile de treino personalizado. Dark theme, offline-ready, histórico persistente.

## Stack
- HTML + CSS + Vanilla JS (zero dependências)
- PWA com Service Worker (instala no celular)
- localStorage para persistência de dados

## Deploy no GitHub Pages (grátis)

```bash
# 1. Crie um repositório no GitHub (ex: "treino-app")

# 2. Clone e adicione os arquivos
git clone https://github.com/SEU_USER/treino-app
cd treino-app
# Copie todos os arquivos desta pasta aqui

# 3. Commit e push
git add .
git commit -m "Initial commit"
git push origin main

# 4. Ative o GitHub Pages
# GitHub → Settings → Pages → Source: Deploy from branch → main → / (root)
# Seu app vai estar em: https://SEU_USER.github.io/treino-app
```

## Instalar no celular como app

### Android (Chrome)
1. Abra o site no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"

### iPhone (Safari)
1. Abra o site no Safari
2. Botão de compartilhar → "Adicionar à Tela de Início"

## Estrutura
```
treino-app/
├── index.html     # Estrutura da app
├── style.css      # Estilos dark theme
├── app.js         # Lógica principal
├── data.js        # Dados dos treinos
├── sw.js          # Service Worker (PWA/offline)
├── manifest.json  # Manifesto PWA
└── README.md
```

## Personalizar
- **Treinos**: edite `data.js` → `WORKOUT_DATA`
- **Nutrição/Suplementos**: edite `data.js` → `INFO_DATA`
- **Cores**: edite variáveis em `style.css` → `:root`

## Próximas features (sugestões)
- [ ] Registro de peso por série
- [ ] Gráfico de evolução de carga
- [ ] Timer de descanso entre séries
- [ ] Notificação de horário de treino
- [ ] Exportar histórico como CSV
