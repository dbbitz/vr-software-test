#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Caminhos dos arquivos
const ENV_FILE = path.join(__dirname, "..", ".env");
const ENV_EXAMPLE = path.join(__dirname, "..", "env.example");
const ENV_TS = path.join(
  __dirname,
  "..",
  "src",
  "environments",
  "environment.ts"
);
const ENV_PROD_TS = path.join(
  __dirname,
  "..",
  "src",
  "environments",
  "environment.prod.ts"
);

console.log("🔧 Gerando arquivos de environment a partir do .env...");

// Função para ler variáveis de ambiente do arquivo
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const vars = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return vars;
}

// Função para gerar conteúdo do arquivo environment
function generateEnvironmentContent(vars, isProduction = false) {
  const apiUrl = vars.NG_APP_API_URL || "http://localhost:3000/api";
  const websocketUrl =
    vars.NG_APP_WEBSOCKET_URL || "http://localhost:3000/notifications";
  const enableConsoleLog = isProduction
    ? vars.NG_APP_ENABLE_CONSOLE_LOG === "true"
    : vars.NG_APP_ENABLE_CONSOLE_LOG !== "false";
  const transports = vars.NG_APP_WEBSOCKET_TRANSPORTS
    ? vars.NG_APP_WEBSOCKET_TRANSPORTS.split(",")
        .map((t) => `'${t.trim()}'`)
        .join(", ")
    : "'websocket'";
  const autoConnect = vars.NG_APP_WEBSOCKET_AUTO_CONNECT !== "false";

  return `// Arquivo gerado automaticamente a partir do .env
// NÃO EDITE ESTE ARQUIVO MANUALMENTE

export const environment = {
  production: ${isProduction},
  apiUrl: '${apiUrl}',
  websocketUrl: '${websocketUrl}',
  enableConsoleLog: ${enableConsoleLog},
  websocketConfig: {
    transports: [${transports}],
    autoConnect: ${autoConnect}
  }
};
`;
}

// Carrega variáveis do .env ou .env.example
let envVars = {};
if (fs.existsSync(ENV_FILE)) {
  envVars = loadEnvFile(ENV_FILE);
  console.log("✅ Carregado do arquivo .env");
} else if (fs.existsSync(ENV_EXAMPLE)) {
  envVars = loadEnvFile(ENV_EXAMPLE);
  console.log("⚠️ Arquivo .env não encontrado, usando env.example");
} else {
  console.log(
    "⚠️ Nenhum arquivo de configuração encontrado, usando valores padrão"
  );
}

// Gera arquivos de environment
try {
  // Garante que o diretório existe
  const envDir = path.dirname(ENV_TS);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Gera environment.ts (desenvolvimento)
  const devContent = generateEnvironmentContent(envVars, false);
  fs.writeFileSync(ENV_TS, devContent);
  console.log("✅ Gerado: src/environments/environment.ts");

  // Gera environment.prod.ts (produção)
  const prodContent = generateEnvironmentContent(envVars, true);
  fs.writeFileSync(ENV_PROD_TS, prodContent);
  console.log("✅ Gerado: src/environments/environment.prod.ts");

  console.log("🎉 Arquivos de environment gerados com sucesso!");
} catch (error) {
  console.error("❌ Erro ao gerar arquivos:", error.message);
  process.exit(1);
}
