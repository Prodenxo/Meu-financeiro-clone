const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Adicionar delay para visualizar melhor
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log de console do navegador
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  const results = {
    step1: { status: 'PENDING', description: 'Acessar http://localhost:3000/login' },
    step2: { status: 'PENDING', description: 'Fazer login com credenciais' },
    step3: { status: 'PENDING', description: 'Navegar para http://localhost:3000/guias-mei' },
    step4: { status: 'PENDING', description: 'Validar texto do alerta vermelho', expectedText: 'Atenção: para emissão de notas fiscais, a empresa emitente precisa estar cadastrada com certificado digital A1 válido.', actualText: '' },
    step5: { status: 'PENDING', description: 'Validar outros elementos da página' },
    finalUrl: '',
    overallResult: 'PENDING'
  };

  try {
    // Passo 1: Acessar página de login
    const BASE_URL = 'http://localhost:3002';
    console.log(`\n=== PASSO 1: Acessar ${BASE_URL}/login ===`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    results.step1.status = 'PASS';
    console.log('✓ Página de login carregada');

    // Passo 2: Fazer login
    console.log('\n=== PASSO 2: Fazer login ===');
    
    // Screenshot antes do login
    await page.screenshot({ path: 'screenshot-before-login.png', fullPage: true });
    
    // Aguardar o campo de email estar visível
    await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', { timeout: 10000 });
    
    // Preencher email usando diferentes métodos
    try {
      await page.fill('input[type="email"]', 'smoke.ui.1773413280987@example.com');
      console.log('Email preenchido via type="email"');
    } catch (e) {
      try {
        await page.fill('input[name="email"]', 'smoke.ui.1773413280987@example.com');
        console.log('Email preenchido via name="email"');
      } catch (e2) {
        await page.fill('input[id="email"]', 'smoke.ui.1773413280987@example.com');
        console.log('Email preenchido via id="email"');
      }
    }
    
    // Preencher senha
    try {
      await page.fill('input[type="password"]', 'Smoke@12345Aa!');
      console.log('Senha preenchida');
    } catch (e) {
      console.log('Erro ao preencher senha:', e.message);
    }
    
    // Screenshot após preencher
    await page.screenshot({ path: 'screenshot-filled.png', fullPage: true });
    
    // Aguardar um pouco antes de clicar
    await page.waitForTimeout(1000);
    
    // Clicar no botão de submit e aguardar navegação
    try {
      await Promise.all([
        page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle' }).catch(() => console.log('Timeout na navegação')),
        page.click('button[type="submit"]')
      ]);
      console.log('Botão de login clicado e navegação aguardada');
    } catch (e) {
      console.log('Erro ao clicar no botão:', e.message);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
    }
    
    // Screenshot após login
    await page.screenshot({ path: 'screenshot-after-login.png', fullPage: true });
    
    // Verificar se o login foi bem-sucedido (URL mudou ou não está mais na página de login)
    const currentUrl = page.url();
    console.log('URL após login:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      // Verificar se há mensagem de erro
      const bodyText = await page.textContent('body');
      results.step2.status = 'FAIL';
      results.step2.error = 'Ainda na página de login após submeter credenciais';
      console.log('✗ Login falhou - ainda na página de login');
      
      // Capturar possível mensagem de erro
      const errorMessages = await page.$$eval('[role="alert"], .error, .alert-error', elements => 
        elements.map(el => el.textContent.trim())
      ).catch(() => []);
      
      if (errorMessages.length > 0) {
        console.log('Mensagens de erro encontradas:', errorMessages);
      }
    } else {
      results.step2.status = 'PASS';
      console.log('✓ Login realizado com sucesso');
    }

    // Passo 3: Navegar para guias-mei
    console.log(`\n=== PASSO 3: Navegar para ${BASE_URL}/guias-mei ===`);
    await page.goto(`${BASE_URL}/guias-mei`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Clicar na aba "NFSe" para exibir o bloco "Emitir NFSe"
    console.log('Procurando pela aba/botão "NFSe"...');
    try {
      // Usar JavaScript para clicar no elemento que contém "NFSe" e tem texto curto (provavelmente uma aba)
      const clicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a, div[role="button"], [onclick]'));
        for (const el of elements) {
          const text = el.textContent?.trim() || '';
          // Procurar por elemento com texto exato "NFSe" ou que comece com "NFSe"
          if (text === 'NFSe' || (text.startsWith('NFSe') && text.length < 50)) {
            console.log('Clicando em:', text);
            el.click();
            return text;
          }
        }
        return null;
      });
      
      if (clicked) {
        console.log('✓ Clicou no elemento "NFSe":', clicked);
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠ Não encontrou elemento clicável com texto "NFSe"');
      }
    } catch (e) {
      console.log('Aviso: erro ao clicar na aba NFSe:', e.message);
    }
    
    results.step3.status = 'PASS';
    results.finalUrl = page.url();
    console.log('✓ Página guias-mei carregada');
    console.log('URL final:', results.finalUrl);

    // Passo 4: Validar texto do alerta vermelho
    console.log('\n=== PASSO 4: Validar texto do alerta vermelho ===');
    
    // Aguardar a página carregar completamente
    await page.waitForTimeout(2000);
    
    // Capturar todo o texto da página para análise
    const pageText = await page.textContent('body');
    console.log('\n--- TEXTO DA PÁGINA (primeiros 2000 caracteres) ---');
    console.log(pageText.substring(0, 2000));
    console.log('--- FIM DO TEXTO ---\n');
    
    // Procurar pelo texto esperado no corpo da página
    const expectedText = 'Atenção: para emissão de notas fiscais, a empresa emitente precisa estar cadastrada com certificado digital A1 válido.';
    
    let alertText = '';
    
    // Buscar por diferentes variações do texto
    if (pageText.includes(expectedText)) {
      alertText = expectedText;
    } else if (pageText.includes('certificado digital A1')) {
      // Extrair o texto que contém "certificado digital A1"
      const lines = pageText.split('\n');
      for (const line of lines) {
        if (line.includes('certificado digital A1')) {
          alertText = line.trim();
          break;
        }
      }
    } else if (pageText.includes('Certificado pendente')) {
      alertText = 'Certificado pendente';
    }
    
    results.step4.actualText = alertText;
    
    if (alertText === expectedText) {
      results.step4.status = 'PASS';
      console.log('✓ Texto do alerta vermelho está correto');
      console.log('Texto encontrado:', alertText);
    } else {
      results.step4.status = 'FAIL';
      console.log('✗ Texto do alerta vermelho NÃO corresponde ao esperado');
      console.log('Esperado:', expectedText);
      console.log('Encontrado:', alertText);
    }

    // Passo 5: Validar outros elementos
    console.log('\n=== PASSO 5: Validar outros elementos ===');
    const checks = {
      dadosMinimos: false,
      botaoEnviar: false,
      semConfiguracaoPlugNotas: false
    };

    const bodyText = await page.textContent('body');
    
    // Verificar "Dados minimos para emisão de notas fiscais"
    if (bodyText.includes('Dados minimos para emisão de notas fiscais') || 
        bodyText.includes('Dados mínimos para emissão de notas fiscais')) {
      checks.dadosMinimos = true;
      console.log('✓ Texto "Dados minimos para emisão de notas fiscais" encontrado');
    } else {
      console.log('✗ Texto "Dados minimos para emisão de notas fiscais" NÃO encontrado');
    }

    // Verificar botão "Enviar certificado"
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const buttonText = await button.textContent();
      if (buttonText.includes('Enviar certificado') || buttonText.includes('Enviando e configurando')) {
        checks.botaoEnviar = true;
        console.log('✓ Botão "Enviar certificado" encontrado:', buttonText.trim());
        break;
      }
    }
    if (!checks.botaoEnviar) {
      console.log('✗ Botão "Enviar certificado" NÃO encontrado');
    }

    // Verificar ausência de "Configuração PlugNotas (Opção B via API)"
    if (!bodyText.includes('Configuração PlugNotas (Opção B via API)')) {
      checks.semConfiguracaoPlugNotas = true;
      console.log('✓ Texto "Configuração PlugNotas (Opção B via API)" NÃO está presente (correto)');
    } else {
      console.log('✗ Texto "Configuração PlugNotas (Opção B via API)" está presente (incorreto)');
    }

    if (checks.dadosMinimos && checks.botaoEnviar && checks.semConfiguracaoPlugNotas) {
      results.step5.status = 'PASS';
    } else {
      results.step5.status = 'FAIL';
      results.step5.checks = checks;
    }

    // Resultado geral
    const allPassed = Object.keys(results).every(key => {
      if (key === 'finalUrl' || key === 'overallResult') return true;
      return results[key].status === 'PASS';
    });

    results.overallResult = allPassed ? 'PASS' : 'FAIL';

  } catch (error) {
    console.error('\n❌ ERRO durante execução:', error.message);
    results.overallResult = 'FAIL';
    results.error = error.message;
  }

  // Aguardar um pouco antes de fechar para visualização
  await page.waitForTimeout(3000);

  await browser.close();

  // Imprimir resultado final
  console.log('\n\n========================================');
  console.log('RESULTADO FINAL DO TESTE');
  console.log('========================================');
  console.log('URL Final:', results.finalUrl);
  console.log('\nPasso 1 (Acessar login):', results.step1.status);
  console.log('Passo 2 (Fazer login):', results.step2.status);
  console.log('Passo 3 (Navegar para guias-mei):', results.step3.status);
  console.log('Passo 4 (Validar alerta vermelho):', results.step4.status);
  if (results.step4.status === 'FAIL') {
    console.log('  Texto esperado:', results.step4.expectedText);
    console.log('  Texto encontrado:', results.step4.actualText);
  }
  console.log('Passo 5 (Validar outros elementos):', results.step5.status);
  console.log('\n========================================');
  console.log('RESULTADO GERAL:', results.overallResult);
  console.log('========================================\n');

  process.exit(results.overallResult === 'PASS' ? 0 : 1);
})();
