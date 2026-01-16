const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'frontend', 'dist');
const destDir = path.join(__dirname, '..', 'dist');

// Função para copiar recursivamente
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Verificar se o diretório source existe
if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Diretório ${sourceDir} não encontrado!`);
  process.exit(1);
}

// Limpar o diretório de destino se existir
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

// Copiar os arquivos
try {
  copyRecursiveSync(sourceDir, destDir);
  console.log(`✓ Arquivos copiados de ${sourceDir} para ${destDir}`);
} catch (error) {
  console.error('❌ Erro ao copiar arquivos:', error);
  process.exit(1);
}
