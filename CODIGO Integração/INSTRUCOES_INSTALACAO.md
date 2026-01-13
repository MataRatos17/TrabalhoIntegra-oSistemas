# 📋 Instruções de Instalação - Museu Virtual da Escola

## O que precisa ter instalado?

Para executar esta aplicação, precisa ter instalado:
1. **Node.js** (versão 12 ou superior recomendada)
2. **npm** (geralmente vem instalado com o Node.js)

## Como verificar se já tem instalado?

### 1. Abrir o Terminal/PowerShell
- Pressione `Windows + R`
- Digite `powershell` ou `cmd`
- Pressione Enter

### 2. Verificar se tem Node.js
Digite no terminal:
```bash
node --version
```

**Se aparecer um número de versão** (ex: v18.17.0) → ✅ Já tem Node.js instalado!

**Se aparecer erro** → Precisa instalar Node.js (veja abaixo)

### 3. Verificar se tem npm
Digite no terminal:
```bash
npm --version
```

**Se aparecer um número de versão** (ex: 9.6.7) → ✅ Já tem npm instalado!

**Se aparecer erro** → Precisa instalar Node.js (o npm vem junto)

---

## Como instalar Node.js (se não tiver)?

### Opção 1: Download direto (Recomendado)
1. Aceda a: https://nodejs.org/
2. Faça download da versão **LTS** (Long Term Support)
3. Execute o instalador
4. Siga as instruções (aceite tudo por defeito)
5. Reinicie o terminal após instalar

### Opção 2: Via Chocolatey (se tiver)
```bash
choco install nodejs
```

---

## Onde executar os comandos?

### Passo 1: Abrir o Terminal/PowerShell
- Pressione `Windows + R`
- Digite `powershell`
- Pressione Enter

### Passo 2: Navegar para a pasta do projeto
No terminal, digite:
```powershell
cd "C:\Users\User\Desktop\CODIGO Integração"
```

**OU** se estiver no Desktop:
```powershell
cd Desktop
cd "CODIGO Integração"
```

**Dica:** Pode também:
1. Abrir a pasta do projeto no Explorador de Ficheiros
2. Clicar com botão direito na pasta
3. Selecionar "Abrir no Terminal" ou "Abrir no PowerShell"

### Passo 3: Verificar que está na pasta correta
Digite:
```powershell
dir
```

Deve ver os ficheiros:
- `package.json`
- `server.js`
- `data/`
- `public/`
- `README.md`

---

## Como instalar as dependências?

### Passo 1: Certifique-se que está na pasta do projeto
```powershell
cd "C:\Users\User\Desktop\CODIGO Integração"
```

### Passo 2: Executar o comando de instalação
```powershell
npm install
```

Este comando vai:
- Ler o ficheiro `package.json`
- Instalar todas as dependências necessárias (Express, CORS)
- Criar uma pasta `node_modules/` com as bibliotecas

**Tempo estimado:** 1-2 minutos

**O que verá:**
```
npm WARN deprecated ...
added 57 packages in 15s
```

---

## Como iniciar o servidor?

### Passo 1: Certifique-se que está na pasta do projeto
```powershell
cd "C:\Users\User\Desktop\CODIGO Integração"
```

### Passo 2: Executar o servidor
```powershell
npm start
```

**O que verá:**
```
Servidor a correr em http://localhost:3000
Dados do museu carregados com sucesso
```

### Passo 3: Abrir no navegador
1. Abra o navegador (Chrome, Edge, Firefox, etc.)
2. Aceda a:
   - **Página pública:** http://localhost:3000/index.html
   - **Página privada:** http://localhost:3000/admin.html

---

## Resumo dos comandos

```powershell
# 1. Ir para a pasta do projeto
cd "C:\Users\User\Desktop\CODIGO Integração"

# 2. Instalar dependências (só precisa fazer uma vez)
npm install

# 3. Iniciar o servidor
npm start
```

---

## Problemas comuns

### ❌ "npm não é reconhecido como comando"
**Solução:** Precisa instalar Node.js (veja secção "Como instalar Node.js")

### ❌ "Cannot find module 'express'"
**Solução:** Precisa executar `npm install` primeiro

### ❌ "Port 3000 is already in use"
**Solução:** Outra aplicação está a usar a porta 3000. Feche-a ou altere a porta no `server.js`

### ❌ Erro ao aceder http://localhost:3000
**Solução:** Certifique-se que o servidor está a correr (deve ver a mensagem "Servidor a correr...")

---

## Precisa de ajuda?

Se tiver problemas, verifique:
1. ✅ Node.js está instalado? (`node --version`)
2. ✅ npm está instalado? (`npm --version`)
3. ✅ Está na pasta correta? (`dir` deve mostrar `package.json`)
4. ✅ Executou `npm install`? (deve existir pasta `node_modules/`)
