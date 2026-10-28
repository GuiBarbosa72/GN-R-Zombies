# Palco dos Mortos 3D

Site estático (um único `index.html`, three.js r128 e Google Fonts via CDN). Não precisa de build.

## Deploy na Vercel

**Pela CLI**
```bash
npm i -g vercel
cd palco-dos-mortos
vercel        # preview
vercel --prod # produção
```
Quando perguntar: Framework = **Other**, Build Command = vazio, Output Directory = `.` (raiz).

**Pelo GitHub**
1. Suba esta pasta para um repositório.
2. Em vercel.com/new importe o repositório.
3. Framework Preset: **Other** — deixe Build Command e Output Directory em branco → Deploy.

**Arrastar e soltar:** `vercel` também aceita deploy direto da pasta pelo dashboard (Add New → Project → upload via Git ou CLI).

## Rodar local
```bash
npx serve .
```
