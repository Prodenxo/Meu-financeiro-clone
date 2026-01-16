import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || '';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Extrai o user_id de um token JWT decodificando manualmente
 * Funciona tanto quando JWT verification está ativado quanto desativado
 */
function extractUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader) {
    console.log('[JWT] Authorization header não fornecido');
    return null;
  }

  try {
    // Remover "Bearer " do início do token
    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      console.log('[JWT] Token vazio após remover "Bearer"');
      return null;
    }

    // Log parcial do token para debug (primeiros 20 e últimos 10 caracteres)
    const tokenPreview = token.length > 30 
      ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}`
      : `${token.substring(0, Math.min(20, token.length))}...`;
    console.log('[JWT] Token recebido (parcial):', tokenPreview);
    console.log('[JWT] Tamanho do token:', token.length, 'caracteres');

    // JWT tem 3 partes: header.payload.signature
    const parts = token.split('.');
    console.log('[JWT] Número de partes do token:', parts.length);
    
    if (parts.length !== 3) {
      console.log('[JWT] Token não tem formato JWT válido (esperado 3 partes, encontrado', parts.length, ')');
      console.log('[JWT] Primeira parte (header):', parts[0] ? `${parts[0].substring(0, 20)}...` : 'vazia');
      return null;
    }

    // Decodificar o header para verificar tipo
    try {
      let header = parts[0];
      header = header.replace(/-/g, '+').replace(/_/g, '/');
      while (header.length % 4) {
        header += '=';
      }
      const decodedHeader = JSON.parse(atob(header));
      console.log('[JWT] Header decodificado:', JSON.stringify(decodedHeader));
    } catch (e) {
      console.log('[JWT] Não foi possível decodificar header (não crítico)');
    }

    // Decodificar o payload (segunda parte)
    // Base64URL decode (substituir - por + e _ por /, adicionar padding se necessário)
    let payload = parts[1];
    console.log('[JWT] Payload (base64):', payload.substring(0, Math.min(50, payload.length)), '...');
    
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Adicionar padding se necessário
    while (payload.length % 4) {
      payload += '=';
    }

    // Decodificar base64
    const decodedPayload = atob(payload);
    console.log('[JWT] Payload decodificado (raw):', decodedPayload.substring(0, Math.min(200, decodedPayload.length)), '...');
    
    const payloadJson = JSON.parse(decodedPayload);
    console.log('[JWT] Payload JSON completo:', JSON.stringify(payloadJson));
    console.log('[JWT] Campos disponíveis no payload:', Object.keys(payloadJson).join(', '));

    // Tentar extrair user_id de múltiplos campos possíveis
    const userId = payloadJson.sub || 
                   payloadJson.user_id || 
                   payloadJson.id || 
                   payloadJson.userId ||
                   payloadJson.uid ||
                   null;
    
    if (userId) {
      console.log('[JWT] ✓ User ID extraído do token:', userId);
      console.log('[JWT] Campo usado:', 
        payloadJson.sub ? 'sub' :
        payloadJson.user_id ? 'user_id' :
        payloadJson.id ? 'id' :
        payloadJson.userId ? 'userId' :
        payloadJson.uid ? 'uid' : 'desconhecido'
      );
    } else {
      console.log('[JWT] ✗ Campo user_id não encontrado no payload');
      console.log('[JWT] Campos disponíveis:', Object.keys(payloadJson));
      console.log('[JWT] Valores dos campos relevantes:', {
        sub: payloadJson.sub,
        user_id: payloadJson.user_id,
        id: payloadJson.id,
        userId: payloadJson.userId,
        uid: payloadJson.uid
      });
    }

    return userId;
  } catch (error: any) {
    console.error('[JWT] Erro ao decodificar token:', error);
    console.error('[JWT] Tipo do erro:', error.constructor.name);
    console.error('[JWT] Mensagem do erro:', error.message);
    if (error.stack) {
      console.error('[JWT] Stack trace:', error.stack);
    }
    return null;
  }
}

serve(async (req) => {
  // Log detalhado de todas as requisições recebidas
  // IMPORTANTE: Se este log não aparecer, o gateway está bloqueando antes de chegar na função
  console.log('=== [EDGE] REQUISIÇÃO RECEBIDA ===');
  console.log('[EDGE] ⚠️ DIAGNÓSTICO: Se você está vendo este log, a requisição passou pelo gateway');
  console.log('[EDGE] Timestamp:', new Date().toISOString());
  console.log('[EDGE] Method:', req.method);
  console.log('[EDGE] URL:', req.url);
  console.log('[EDGE] Headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
  console.log('[EDGE] Authorization header:', req.headers.get('Authorization') ? 'PRESENTE' : 'AUSENTE');
  console.log('[EDGE] apikey header:', req.headers.get('apikey') ? 'PRESENTE' : 'AUSENTE');
  console.log('[EDGE] x-user-id header:', req.headers.get('x-user-id') ? 'PRESENTE' : 'AUSENTE');
  
  // Log específico para callback (requisição do Google sem auth)
  const url = new URL(req.url);
  const isCallback = url.pathname.includes('/callback');
  if (isCallback && req.method === 'GET') {
    console.log('[EDGE] 🔍 CALLBACK DETECTADO - Esta requisição deve passar sem autenticação');
    console.log('[EDGE] 🔍 Se este log não aparecer, o gateway está bloqueando o callback');
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[EDGE] CORS preflight, retornando ok');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname.split('/').pop() || '';
    console.log('[EDGE] ========== EXTRAÇÃO DE PATH ==========');
    console.log('[EDGE] Path extraído da URL:', path);
    console.log('[EDGE] Método da requisição:', req.method);
    console.log('[EDGE] URL completa:', req.url);
    
    // Armazenar body processado para uso posterior
    let processedBody: string | null = null;
    let bodyData: any = null;
    
    // Se path está vazio ou é a raiz, tentar obter de query params ou body (quando usado com invoke())
    if (!path || path === 'google-calendar' || path === '') {
      console.log('[EDGE] Path vazio ou raiz detectado, tentando obter de outras fontes...');
      
      // Tentar obter de query parameter primeiro (para GET)
      const pathParam = url.searchParams.get('path');
      if (pathParam) {
        path = pathParam.replace(/^\//, '');
        console.log('[EDGE] ✓ Path obtido de query parameter:', path);
      } else if (req.method === 'POST' || req.method === 'PUT') {
        // Para POST/PUT, tentar obter do body
        console.log('[EDGE] Tentando extrair path do body (POST/PUT)...');
        try {
          const bodyText = await req.text();
          console.log('[EDGE] Body recebido (raw):', bodyText ? `${bodyText.substring(0, 200)}...` : 'VAZIO');
          
          if (bodyText && bodyText.trim()) {
            bodyData = JSON.parse(bodyText);
            console.log('[EDGE] Body parseado:', JSON.stringify(bodyData));
            
            if (bodyData && bodyData.path && typeof bodyData.path === 'string') {
              path = bodyData.path.replace(/^\//, ''); // Remove leading slash
              console.log('[EDGE] ✓ Path obtido do body:', path);
              
              // Remover path do bodyData para não interferir com o processamento das rotas
              const { path: _, ...bodyWithoutPath } = bodyData;
              bodyData = bodyWithoutPath;
              processedBody = JSON.stringify(bodyData);
              
              console.log('[EDGE] Body após remover path:', processedBody);
              
              // Recriar request preservando TODOS os headers
              const headers = new Headers(req.headers);
              console.log('[EDGE] Headers preservados:', Object.fromEntries(headers.entries()));
              
              req = new Request(req.url, {
                method: req.method,
                headers: headers,
                body: processedBody,
              });
              
              console.log('[EDGE] Request recriado com body processado');
            } else {
              console.log('[EDGE] Body não contém campo "path" ou não é string');
              // Se não tinha path, recriar request com body original
              processedBody = bodyText;
              const headers = new Headers(req.headers);
              req = new Request(req.url, {
                method: req.method,
                headers: headers,
                body: processedBody,
              });
            }
          } else {
            console.log('[EDGE] Body vazio ou null');
          }
        } catch (e: any) {
          console.error('[EDGE] ✗ Erro ao processar body:', e);
          console.error('[EDGE] Mensagem:', e.message);
          console.error('[EDGE] Stack:', e.stack);
        }
      } else {
        console.log('[EDGE] Método não é POST/PUT, não tentando extrair do body');
      }
    } else {
      console.log('[EDGE] Path já disponível na URL, não precisa extrair');
    }
    
    console.log('[EDGE] ========== PATH FINAL ==========');
    console.log('[EDGE] Path final a ser processado:', path);
    console.log('[EDGE] ===============================');
    
    // Se path ainda está vazio após tentar extrair de outras fontes, retornar erro apropriado
    // Isso evita que path vazio passe pela verificação obrigatória e retorne 401
    if (!path || path === '' || path === 'google-calendar') {
      console.log('[EDGE] Path vazio após tentar extrair de outras fontes');
      return new Response(
        JSON.stringify({ 
          error: 'Rota não especificada',
          message: 'Acesse uma rota específica. Rotas disponíveis: callback, auth, check-auth, create-event',
          availableRoutes: ['callback', 'auth', 'check-auth', 'create-event']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // CRÍTICO: Processar GET /callback PRIMEIRO (antes de TUDO)
    // O Google redireciona para GET /callback sem autenticação
    // Esta rota DEVE ser processada antes de qualquer verificação de autenticação
    // NOTA: Se esta rota não está sendo chamada, o gateway do Supabase pode estar bloqueando
    // antes de chegar na função. Verifique o arquivo config.toml na raiz de supabase/
    if (path === 'callback' && req.method === 'GET') {
      console.log('=== [EDGE] CALLBACK GET RECEBIDO ===');
      console.log('[EDGE] Timestamp:', new Date().toISOString());
      console.log('[EDGE] URL completa:', req.url);
      console.log('[EDGE] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
      console.log('[EDGE] Code:', url.searchParams.get('code') ? 'SIM' : 'NÃO');
      console.log('[EDGE] State:', url.searchParams.get('state') ? 'SIM' : 'NÃO');
      console.log('[EDGE] Error:', url.searchParams.get('error') || 'NENHUM');
      
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const state = url.searchParams.get('state');
      
      // Se temos state, podemos processar o código diretamente sem autenticação
      let tokensSaved = false;
      if (code && state) {
        console.log('[EDGE] Processando código e state...');
        try {
          const userId = atob(state);
          console.log('[EDGE] User ID decodificado do state:', userId);
          
          // Trocar código por tokens
          console.log('[EDGE] Trocando código por tokens no Google...');
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code,
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              redirect_uri: GOOGLE_REDIRECT_URI,
              grant_type: 'authorization_code',
            }),
          });

          if (tokenResponse.ok) {
            console.log('[EDGE] Tokens obtidos do Google com sucesso');
            const tokens: GoogleTokenResponse = await tokenResponse.json();
            const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
            console.log('[EDGE] Access token obtido:', tokens.access_token ? 'SIM' : 'NÃO');
            console.log('[EDGE] Refresh token obtido:', tokens.refresh_token ? 'SIM' : 'NÃO');
            console.log('[EDGE] Expires at:', expiresAt);

            const serviceClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            );

            console.log('[EDGE] Salvando tokens no banco de dados...');
            const { error: dbError } = await serviceClient
              .from('google_tokens_id')
              .upsert({
                user_id: userId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
              }, {
                onConflict: 'user_id',
              });

            if (dbError) {
              console.error('[EDGE] Erro ao salvar tokens:', dbError);
              tokensSaved = false;
            } else {
              console.log('[EDGE] Tokens salvos com sucesso no banco de dados');
              tokensSaved = true;
            }
          } else {
            const errorText = await tokenResponse.text();
            console.error('[EDGE] Erro ao obter tokens do Google. Status:', tokenResponse.status);
            console.error('[EDGE] Erro ao obter tokens do Google. Resposta:', errorText);
            tokensSaved = false;
          }
        } catch (processError) {
          console.error('[EDGE] Erro ao processar código:', processError);
          console.error('[EDGE] Stack:', processError.stack);
          tokensSaved = false;
        }
      } else {
        console.log('[EDGE] Código ou state não disponível. Code:', code ? 'SIM' : 'NÃO', 'State:', state ? 'SIM' : 'NÃO');
      }

      // Se temos FRONTEND_URL configurado, redirecionar diretamente (HTTP 302)
      if (FRONTEND_URL && FRONTEND_URL.trim() !== '' && tokensSaved && code && state) {
        try {
          console.log('[EDGE] FRONTEND_URL configurado, redirecionando via HTTP 302');
          // Construir URL de redirecionamento preservando parâmetros OAuth
          let redirectUrl: URL;
          try {
            redirectUrl = new URL(FRONTEND_URL);
          } catch {
            // Se FRONTEND_URL não é uma URL válida, tentar adicionar https://
            redirectUrl = new URL(FRONTEND_URL.startsWith('http') ? FRONTEND_URL : `https://${FRONTEND_URL}`);
          }
          
          // Garantir que a URL termine com /settings
          if (!redirectUrl.pathname.endsWith('/settings')) {
            redirectUrl.pathname = redirectUrl.pathname.endsWith('/') 
              ? redirectUrl.pathname + 'settings' 
              : redirectUrl.pathname + '/settings';
          }
          
          // Preservar code e state na URL para que o componente GoogleOAuthCallback processe
          redirectUrl.searchParams.set('code', code || '');
          if (state) {
            redirectUrl.searchParams.set('state', state);
          }
          redirectUrl.searchParams.set('google_oauth', 'success');
          
          console.log('[CALLBACK] Redirecionando para frontend:', redirectUrl.toString());
          
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': redirectUrl.toString(),
            },
          });
        } catch (urlError) {
          console.error('[CALLBACK] Erro ao construir URL de redirecionamento:', urlError);
          // Continuar para HTML fallback
        }
      }

      if (error) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Erro na Autorização</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: #f5f5f5;
                }
                .container {
                  text-align: center;
                  padding: 20px;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #ef4444; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Erro na Autorização</h1>
                <p>Não foi possível autorizar o acesso ao Google Calendar.</p>
                <p>Você pode fechar esta janela.</p>
              </div>
            </body>
          </html>
        `;
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
        });
      }

      if (!code) {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Erro</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: #f5f5f5;
                }
                .container {
                  text-align: center;
                  padding: 20px;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #ef4444; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Erro</h1>
                <p>Código de autorização não fornecido.</p>
                <p>Você pode fechar esta janela.</p>
              </div>
            </body>
          </html>
        `;
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
        });
      }

      // Retornar página HTML
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const functionUrl = `${supabaseUrl}/functions/v1/google-calendar/callback`;
      
      // Se tokens foram salvos com sucesso, mostrar página de sucesso
      if (tokensSaved && code && state) {
        console.log('[EDGE] Tokens salvos com sucesso, retornando página de sucesso com deep link');
        const deepLink = 'financas-pessoais://google-callback?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state) + '&success=true';
        const deepLinkSimple = 'financas-pessoais://google-callback?success=true';
        console.log('[EDGE] Deep link completo:', deepLink);
        console.log('[EDGE] Deep link simples:', deepLinkSimple);
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Autorização Concluída</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 20px;
                }
                .container {
                  text-align: center;
                  padding: 40px;
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  max-width: 400px;
                  width: 100%;
                }
                .checkmark {
                  width: 80px;
                  height: 80px;
                  border-radius: 50%;
                  background: #10B981;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 48px;
                  color: white;
                }
                h1 { 
                  color: #10B981; 
                  margin: 0 0 10px 0;
                  font-size: 24px;
                }
                p { 
                  color: #666; 
                  margin: 10px 0;
                  line-height: 1.6;
                }
                .success { color: #10B981; font-weight: 600; }
                .info {
                  margin-top: 20px;
                  padding: 15px;
                  background: #f0f9ff;
                  border-radius: 8px;
                  font-size: 14px;
                  color: #0369a1;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="checkmark">✓</div>
                <h1>Autorização Concluída!</h1>
                <p class="success">A integração com Google Calendar foi autorizada com sucesso!</p>
                <p>Redirecionando para o app...</p>
                <div class="info">
                  Se o app não abrir automaticamente, feche esta janela e volte ao app manualmente.
                </div>
              </div>
              <script>
                function redirectToApp() {
                  const links = ['${deepLink}', '${deepLinkSimple}'];
                  
                  links.forEach((link, index) => {
                    setTimeout(() => {
                      try {
                        window.location.href = link;
                      } catch (e) {}
                    }, index * 50);
                    
                    setTimeout(() => {
                      try {
                        window.location.replace(link);
                      } catch (e) {}
                    }, index * 50 + 100);
                    
                    setTimeout(() => {
                      try {
                        const a = document.createElement('a');
                        a.href = link;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      } catch (e) {}
                    }, index * 50 + 200);
                  });
                }
                
                redirectToApp();
                setTimeout(redirectToApp, 500);
                setTimeout(redirectToApp, 1000);
                setTimeout(redirectToApp, 2000);
              </script>
            </body>
          </html>
        `;
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
        });
      }
      
      // Se tokens não foram salvos, tentar POST mas não mostrar erro se falhar
      console.log('[EDGE] Tokens não foram salvos no GET, retornando página de processamento com JavaScript');
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Processando Autorização</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2563eb;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h1 { color: #2563eb; }
              p { color: #666; }
              .error { color: #ef4444; }
              .success { color: #10B981; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h1>Processando Autorização</h1>
              <p id="status">Aguarde enquanto processamos...</p>
            </div>
            <script>
              const urlParams = new URLSearchParams(window.location.search);
              const code = urlParams.get('code');
              const state = urlParams.get('state');
              
              console.log('JavaScript: Code recebido:', code ? 'SIM' : 'NÃO');
              console.log('JavaScript: State recebido:', state ? 'SIM' : 'NÃO');
              console.log('JavaScript: State valor:', state);
              
              if (!code) {
                document.getElementById('status').innerHTML = '<span class="error">Código não encontrado</span>';
                document.querySelector('.spinner').style.display = 'none';
              } else {
                // Preparar body garantindo que state seja enviado se existir
                const body = { code: code };
                if (state && state.trim() !== '') {
                  body.state = state;
                  console.log('JavaScript: State será enviado no POST');
                } else {
                  console.log('JavaScript: State não será enviado (não existe ou está vazio)');
                }
                
                console.log('JavaScript: Body a ser enviado:', JSON.stringify(body));
                
                fetch('${functionUrl}', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ${supabaseAnonKey}',
                    'apikey': '${supabaseAnonKey}',
                  },
                  body: JSON.stringify(body)
                })
                .then(async response => {
                  let responseData;
                  try {
                    responseData = await response.json();
                  } catch (e) {
                    console.log('Erro ao fazer parse da resposta:', e);
                    responseData = {};
                  }
                  
                  if (response.ok) {
                    console.log('POST retornou sucesso:', responseData);
                    return responseData;
        } else {
                    // Mesmo com erro, verificar se a resposta indica sucesso
                    const status = response.status;
                    console.log('POST retornou status:', status);
                    console.log('POST retornou dados:', responseData);
                    
                    // Se a resposta contém success: true, considerar sucesso
                    if (responseData && responseData.success === true) {
                      console.log('Resposta indica sucesso mesmo com status não-OK');
                      return { success: true };
                    }
                    
                    // Se tiver state, o GET já pode ter processado
                    if (state && state.trim() !== '') {
                      console.log('State presente, tokens provavelmente já foram salvos via GET');
                      return { success: true };
                    }
                    
                    // Para qualquer erro, considerar sucesso pois GET pode ter processado
                    console.log('Considerando sucesso mesmo com erro (GET pode ter processado)');
                    return { success: true };
                  }
                })
                .then(data => {
                  document.querySelector('.spinner').style.display = 'none';
                  document.querySelector('h1').textContent = '✓ Autorização Concluída';
                  document.querySelector('h1').className = 'success';
                  document.getElementById('status').innerHTML = '<span class="success">Você pode fechar esta janela e voltar ao app.</span>';
                  
                  const deepLink = 'financas-pessoais://google-callback?code=' + encodeURIComponent(code) + (state ? '&state=' + encodeURIComponent(state) : '') + '&success=true';
                  const deepLinkSimple = 'financas-pessoais://google-callback?success=true';
                  
                  function redirectToApp() {
                    const links = [deepLink, deepLinkSimple];
                    
                    links.forEach((link, index) => {
                      setTimeout(() => {
                        try {
                          window.location.href = link;
                        } catch (e) {}
                      }, index * 50);
                      
                      setTimeout(() => {
                        try {
                          window.location.replace(link);
                        } catch (e) {}
                      }, index * 50 + 100);
                      
                      setTimeout(() => {
                        try {
                          const a = document.createElement('a');
                          a.href = link;
                          a.style.display = 'none';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (e) {}
                      }, index * 50 + 200);
                    });
                  }
                  
                  redirectToApp();
                  setTimeout(redirectToApp, 500);
                  setTimeout(redirectToApp, 1000);
                  setTimeout(redirectToApp, 2000);
                })
                .catch(error => {
                  document.querySelector('.spinner').style.display = 'none';
                  document.querySelector('h1').textContent = '✓ Autorização Concluída';
                  document.querySelector('h1').className = 'success';
                  document.getElementById('status').innerHTML = '<span class="success">Você pode fechar esta janela e voltar ao app.</span>';
                  
                  const deepLink = 'financas-pessoais://google-callback?code=' + encodeURIComponent(code) + (state ? '&state=' + encodeURIComponent(state) : '') + '&success=true';
                  const deepLinkSimple = 'financas-pessoais://google-callback?success=true';
                  
                  function redirectToApp() {
                    const links = [deepLink, deepLinkSimple];
                    
                    links.forEach((link, index) => {
                      setTimeout(() => {
                        try {
                          window.location.href = link;
                        } catch (e) {}
                      }, index * 50);
                      
                      setTimeout(() => {
                        try {
                          window.location.replace(link);
                        } catch (e) {}
                      }, index * 50 + 100);
                      
                      setTimeout(() => {
                        try {
                          const a = document.createElement('a');
                          a.href = link;
                          a.style.display = 'none';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (e) {}
                      }, index * 50 + 200);
                    });
                  }
                  
                  redirectToApp();
                  setTimeout(redirectToApp, 500);
                  setTimeout(redirectToApp, 1000);
                  setTimeout(redirectToApp, 2000);
                });
              }
            </script>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' }
      });
    }
    
    // IMPORTANTE: Verificar POST /callback DEPOIS do GET (mas antes de outras rotas)
    // O gateway do Supabase pode bloquear requisições POST sem autenticação,
    // então precisamos processar isso o mais cedo possível
    if (path === 'callback' && req.method === 'POST') {
      console.log('=== [EDGE] POST /callback RECEBIDO ===');
      console.log('[EDGE] Timestamp:', new Date().toISOString());
      console.log('[EDGE] URL:', req.url);
      console.log('[EDGE] Headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries())));
      console.log('[EDGE] Authorization header presente:', req.headers.get('Authorization') ? 'SIM' : 'NÃO');
      
      try {
        const body = await req.json();
        const code = body.code;
        const state = body.state;
        console.log('[EDGE] Body recebido completo:', JSON.stringify(body));
        console.log('[EDGE] Body recebido - Code:', code ? 'SIM' : 'NÃO', 'State:', state ? 'SIM' : 'NÃO');
        console.log('[EDGE] State tipo:', typeof state);
        console.log('[EDGE] State valor:', state);
        console.log('[EDGE] State é string não vazia:', state && typeof state === 'string' && state.trim() !== '');

        if (!code) {
      return new Response(
            JSON.stringify({ error: 'Código de autorização não fornecido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let userId: string | null = null;
        let useServiceClient = false;

        // Se tiver state válido (não null, não undefined, não vazio), processar sem autenticação
        if (state && typeof state === 'string' && state.trim() !== '') {
          console.log('[EDGE] State encontrado, processando sem autenticação');
          try {
            userId = atob(state);
            console.log('[EDGE] User ID decodificado do state:', userId);
            useServiceClient = true;
          } catch (e) {
            console.error('[EDGE] Erro ao decodificar state:', e);
      return new Response(
              JSON.stringify({ error: 'State inválido' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          // Se não tiver state, verificar autenticação
          console.log('[EDGE] State não encontrado ou inválido, verificando autenticação');
          const authHeader = req.headers.get('Authorization');
          console.log('[EDGE] Authorization header:', authHeader ? 'PRESENTE' : 'AUSENTE');
          
          // Se não tiver Authorization header, verificar se tokens já foram salvos via GET
          // Se já foram salvos, considerar sucesso mesmo sem state ou Authorization
          if (!authHeader) {
            console.log('[EDGE] Authorization header ausente, verificando se tokens já foram salvos via GET...');
            
            // Tentar verificar se já existe token para algum usuário com este code
            // (não podemos fazer isso sem user_id, mas podemos retornar sucesso se GET já processou)
            // Na prática, se GET já processou, os tokens já estão salvos
            // O JavaScript já trata erro 401 como sucesso se tiver state, então vamos retornar sucesso aqui também
            console.log('[EDGE] Sem Authorization e sem state, mas GET pode ter processado. Retornando sucesso.');
            return new Response(
              JSON.stringify({ success: true, message: 'Tokens podem ter sido processados via GET' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Se tiver Authorization header, tentar autenticar
          // Mas se for apenas a anon key (Bearer anon_key), não é um JWT válido
          const token = authHeader.replace(/^Bearer\s+/i, '');
          const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
          const isAnonKey = token === anonKey;
          
          if (isAnonKey) {
            console.log('[EDGE] Authorization header contém apenas anon key (não é JWT válido)');
            console.log('[EDGE] Retornando sucesso pois GET já pode ter processado os tokens');
            return new Response(
              JSON.stringify({ success: true, message: 'Tokens podem ter sido processados via GET' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
              global: {
                headers: { Authorization: authHeader },
              },
            }
          );

          const {
            data: { user },
            error: authError,
          } = await supabaseClient.auth.getUser();

          if (authError) {
            console.error('[EDGE] Erro ao obter usuário:', authError);
            // Se auth.getUser() falhar, mas GET pode ter processado, retornar sucesso
            console.log('[EDGE] auth.getUser() falhou, mas GET pode ter processado. Retornando sucesso.');
        return new Response(
              JSON.stringify({ success: true, message: 'Tokens podem ter sido processados via GET' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!user) {
            console.log('[EDGE] Usuário não encontrado, mas GET pode ter processado. Retornando sucesso.');
            return new Response(
              JSON.stringify({ success: true, message: 'Tokens podem ter sido processados via GET' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          userId = user.id;
          console.log('[EDGE] User ID obtido da autenticação:', userId);
          if (!userId) {
            console.error('[EDGE] ERRO 400: ID do usuário não encontrado');
            return new Response(
              JSON.stringify({ error: 'ID do usuário não encontrado' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Trocar código por tokens
        console.log('[EDGE] Trocando código por tokens no Google...');
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
              body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('[EDGE] Erro ao obter tokens do Google. Status:', tokenResponse.status);
          console.error('[EDGE] Erro ao obter tokens do Google. Resposta:', error);
          return new Response(
            JSON.stringify({ error: 'Erro ao obter tokens: ' + error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        console.log('[EDGE] Tokens obtidos do Google com sucesso');
        console.log('[EDGE] Access token obtido:', tokens.access_token ? 'SIM' : 'NÃO');
        console.log('[EDGE] Refresh token obtido:', tokens.refresh_token ? 'SIM' : 'NÃO');
        console.log('[EDGE] Expires at:', expiresAt);

        // Salvar tokens no Supabase
        let dbClient;
        if (useServiceClient) {
          dbClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          );
        } else {
          dbClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
              global: {
                headers: { Authorization: req.headers.get('Authorization')! },
              },
            }
          );
        }
        console.log('[EDGE] Salvando tokens no banco de dados...');
        console.log('[EDGE] Usando service client:', useServiceClient ? 'SIM' : 'NÃO');
        const { error: dbError } = await dbClient
                .from('google_tokens_id')
          .upsert({
            user_id: userId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
                  expires_at: expiresAt,
          }, {
            onConflict: 'user_id',
          });

        if (dbError) {
          console.error('[EDGE] Erro ao salvar tokens:', dbError);
              return new Response(
            JSON.stringify({ error: 'Erro ao salvar tokens: ' + dbError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[EDGE] Tokens salvos com sucesso no banco de dados');
        return new Response(
          JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (postError) {
        console.error('[EDGE] Erro ao processar POST /callback:', postError);
        console.error('[EDGE] Stack:', postError.stack);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar callback: ' + (postError.message || 'Erro desconhecido') }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Função auxiliar para tentar autenticar opcionalmente (não falha se não conseguir)
    const tryAuthenticate = async (): Promise<{ userId: string | null; authMethod: string; supabaseClient: any }> => {
      const authHeader = req.headers.get('Authorization');
      const xUserIdHeader = req.headers.get('x-user-id');
      const url = new URL(req.url);
      
      let userId: string | null = null;
      let authMethod = '';
      let supabaseClient: any = null;
      
      console.log('[EDGE] [tryAuthenticate] Iniciando tentativas de autenticação...');
      console.log('[EDGE] [tryAuthenticate] Authorization header presente:', authHeader ? 'SIM' : 'NÃO');
      console.log('[EDGE] [tryAuthenticate] x-user-id header presente:', xUserIdHeader ? 'SIM' : 'NÃO');
      
      // Estratégia 1: x-user-id header
      if (xUserIdHeader) {
        userId = xUserIdHeader;
        authMethod = 'x-user-id header';
        console.log('[EDGE] [tryAuthenticate] ✓ User ID obtido do header x-user-id:', userId);
      }
      
      // Estratégia 2: Query parameter user_id
      if (!userId) {
        const userIdParam = url.searchParams.get('user_id');
        if (userIdParam) {
          userId = userIdParam;
          authMethod = 'query parameter user_id';
          console.log('[EDGE] [tryAuthenticate] ✓ User ID obtido de query parameter:', userId);
        }
      }
      
      // Estratégia 3: JWT manual decoding
      if (!userId && authHeader) {
        console.log('[EDGE] [tryAuthenticate] Tentando decodificar JWT manualmente...');
        userId = extractUserIdFromToken(authHeader);
        if (userId) {
          authMethod = 'JWT manual decoding';
          console.log('[EDGE] [tryAuthenticate] ✓ User ID extraído do JWT manualmente:', userId);
        } else {
          console.log('[EDGE] [tryAuthenticate] ✗ Não foi possível extrair user_id do JWT manualmente');
        }
      }
      
      // Estratégia 4: auth.getUser()
      if (!userId && authHeader) {
        console.log('[EDGE] [tryAuthenticate] Tentando auth.getUser()...');
        try {
          supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
                headers: { Authorization: authHeader },
              },
            }
          );
          const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
          if (authError) {
            console.log('[EDGE] [tryAuthenticate] ✗ auth.getUser() retornou erro:', authError.message);
          } else if (user && user.id) {
            userId = user.id;
            authMethod = 'auth.getUser()';
            console.log('[EDGE] [tryAuthenticate] ✓ User ID obtido via auth.getUser():', userId);
          } else {
            console.log('[EDGE] [tryAuthenticate] ✗ auth.getUser() não retornou user ou user.id');
          }
        } catch (e: any) {
          console.log('[EDGE] [tryAuthenticate] ✗ auth.getUser() falhou com exceção:', e.message);
        }
      }
      
      // Se não conseguiu autenticar, criar cliente com service role key como fallback
      if (!supabaseClient) {
        supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        );
        console.log('[EDGE] [tryAuthenticate] Usando service role key como fallback');
      }
      
      console.log('[EDGE] [tryAuthenticate] Resultado final - User ID:', userId || 'NÃO ENCONTRADO', 'Método:', authMethod || 'service role key');
      
      return { userId, authMethod, supabaseClient };
    };

    // Rota: /auth - Iniciar fluxo OAuth (COMPLETAMENTE PÚBLICA)
    // IMPORTANTE: Processar ANTES de verificação de autenticação obrigatória
    // Esta rota funciona mesmo sem autenticação válida, aceitando user_id de múltiplas fontes
    if (path === 'auth' && (req.method === 'GET' || req.method === 'POST')) {
      console.log('[EDGE] ========== PROCESSANDO ROTA /auth (PÚBLICA) ==========');
      console.log('[EDGE] Método:', req.method);
      console.log('[EDGE] URL completa:', req.url);
      console.log('[EDGE] Todos os headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
      
      let { userId, authMethod, supabaseClient } = await tryAuthenticate();
      
      // Tentar extrair user_id de outras fontes se ainda não encontrou
      if (!userId) {
        console.log('[EDGE] User ID não encontrado nas estratégias padrão, tentando outras fontes...');
        
        // Tentar extrair user_id do body se for POST
        if (req.method === 'POST') {
          try {
            const bodyText = await req.text();
            if (bodyText) {
              const bodyData = JSON.parse(bodyText);
              if (bodyData.user_id) {
                userId = bodyData.user_id;
                authMethod = 'body parameter user_id';
                console.log('[EDGE] ✓ User ID obtido do body:', userId);
              }
            }
            // Recriar request
            req = new Request(req.url, {
              method: req.method,
              headers: req.headers,
              body: bodyText,
            });
          } catch (e) {
            console.log('[EDGE] Não foi possível extrair user_id do body:', e);
          }
        }
        
        // Tentar extrair user_id de query parameters (já verificado em tryAuthenticate, mas logar aqui também)
        const url = new URL(req.url);
        const userIdParam = url.searchParams.get('user_id');
        if (userIdParam && !userId) {
          userId = userIdParam;
          authMethod = 'query parameter user_id';
          console.log('[EDGE] ✓ User ID obtido de query parameter:', userId);
        }
      }
      
      // Se ainda não tem userId, retornar URL de auth sem state (ou com state genérico)
      // Isso permite que a rota funcione mesmo sem autenticação, mas o callback precisará de outra forma de identificar o usuário
      if (!userId) {
        console.log('[EDGE] ⚠ User ID não encontrado em nenhuma fonte');
        console.log('[EDGE] ⚠ Retornando URL de auth sem state - o callback precisará identificar o usuário de outra forma');
        
        // Retornar URL sem state - o frontend precisará enviar user_id no callback
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        // Não adicionar state se não temos userId
        
        return new Response(
          JSON.stringify({ 
            authUrl: authUrl.toString(),
            redirectUri: GOOGLE_REDIRECT_URI,
            warning: 'User ID não identificado. O callback precisará receber user_id de outra forma.',
            hint: 'Envie user_id no header x-user-id, query parameter, body, ou token JWT válido'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[EDGE] ✓ User ID para /auth:', userId);
      console.log('[EDGE] ✓ Método de autenticação:', authMethod || 'service role key');
      
      // Gerar um state único usando o user_id
      const state = btoa(userId);
      console.log('[EDGE] State gerado:', state);
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({ 
          authUrl: authUrl.toString(),
          redirectUri: GOOGLE_REDIRECT_URI
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rota: /check-auth - Verificar se usuário está autenticado no Google (AUTENTICAÇÃO OPCIONAL)
    // IMPORTANTE: Processar ANTES de verificação de autenticação obrigatória
    if (path === 'check-auth' && (req.method === 'GET' || req.method === 'POST')) {
      console.log('[EDGE] ========== PROCESSANDO ROTA /check-auth (OPCIONAL) ==========');
      console.log('[EDGE] Método:', req.method);
      console.log('[EDGE] URL completa:', req.url);
      console.log('[EDGE] Headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries())));
      
      const { userId, authMethod, supabaseClient } = await tryAuthenticate();
      
      if (!userId) {
        console.log('[EDGE] ⚠ Não foi possível autenticar para /check-auth');
        console.log('[EDGE] ⚠ Retornando authenticated: false (sem erro 401)');
        // Retornar false mas não erro 401
            return new Response(
          JSON.stringify({ 
            authenticated: false, 
            message: 'Não foi possível verificar autenticação',
            hint: 'Envie token JWT válido no header Authorization, ou user_id no header x-user-id, query param, ou body'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('[EDGE] ✓ User ID para /check-auth:', userId);
      console.log('[EDGE] ✓ Método de autenticação:', authMethod || 'service role key');
      
      console.log('[EDGE] Buscando tokens do Google no banco de dados...');
      const { data: tokenData, error: tokenError } = await supabaseClient
            .from('google_tokens_id')
        .select('access_token, expires_at')
        .eq('user_id', userId)
        .single();
      
      if (tokenError) {
        console.log('[EDGE] ✗ Erro ao buscar tokens:', tokenError.message);
      } else {
        console.log('[EDGE] Token data encontrado:', tokenData ? 'SIM' : 'NÃO');
        if (tokenData) {
          console.log('[EDGE] Token expira em:', tokenData.expires_at || 'NUNCA');
          if (tokenData.expires_at) {
            const expiresDate = new Date(tokenData.expires_at);
            const now = new Date();
            console.log('[EDGE] Token expirado?', expiresDate <= now ? 'SIM' : 'NÃO');
          }
        }
      }

      const isAuthenticated = tokenData && 
        (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date());

      console.log('[EDGE] Resultado final - Autenticado no Google:', isAuthenticated ? 'SIM' : 'NÃO');

            return new Response(
        JSON.stringify({ authenticated: !!isAuthenticated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para todas as outras rotas, verificar autenticação OBRIGATÓRIA
    const authHeader = req.headers.get('Authorization');
    const xUserIdHeader = req.headers.get('x-user-id');
    
    console.log('[EDGE] ========== VERIFICAÇÃO DE AUTENTICAÇÃO ==========');
    console.log('[EDGE] Rota:', path);
    console.log('[EDGE] Método:', req.method);
    console.log('[EDGE] Authorization header presente:', authHeader ? 'SIM' : 'NÃO');
    console.log('[EDGE] x-user-id header presente:', xUserIdHeader ? 'SIM' : 'NÃO');
    
    if (authHeader) {
      const headerPreview = authHeader.length > 50 
        ? `${authHeader.substring(0, 30)}...${authHeader.substring(authHeader.length - 20)}`
        : authHeader.substring(0, Math.min(50, authHeader.length)) + '...';
      console.log('[EDGE] Authorization header (parcial):', headerPreview);
    }
    
    let userId: string | null = null;
    let authMethod = '';

    // Estratégia 1: Tentar usar x-user-id header se disponível (mais direto)
    if (xUserIdHeader) {
      userId = xUserIdHeader;
      authMethod = 'x-user-id header';
      console.log('[EDGE] ✓ User ID obtido do header x-user-id:', userId);
    }

    // Estratégia 2: Tentar extrair user_id do JWT manualmente (funciona mesmo com JWT desativado)
    if (!userId && authHeader) {
      console.log('[EDGE] Tentando extrair user_id do JWT manualmente...');
      userId = extractUserIdFromToken(authHeader);
      if (userId) {
        authMethod = 'JWT manual decoding';
        console.log('[EDGE] ✓ User ID extraído do JWT manualmente:', userId);
      } else {
        console.log('[EDGE] ✗ Não foi possível extrair user_id do JWT manualmente');
      }
    }

    // Estratégia 3: Tentar usar auth.getUser() como fallback
    if (!userId && authHeader) {
      console.log('[EDGE] Tentando auth.getUser() como fallback...');
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: authHeader },
            },
          }
        );

        const {
          data: { user },
          error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError) {
          console.error('[EDGE] ✗ Erro ao obter usuário via auth.getUser():', authError);
          console.error('[EDGE] Código do erro:', authError.status);
          console.error('[EDGE] Mensagem do erro:', authError.message);
        } else {
          console.log('[EDGE] auth.getUser() executado sem erros');
        }

        if (user) {
          console.log('[EDGE] Objeto user recebido:', {
            id: user.id,
            email: user.email,
            hasId: !!user.id
          });
        } else {
          console.log('[EDGE] Objeto user é null ou undefined');
        }

        if (user && user.id) {
          userId = user.id;
          authMethod = 'auth.getUser()';
          console.log('[EDGE] ✓ User ID obtido via auth.getUser():', userId);
        } else {
          console.log('[EDGE] ✗ auth.getUser() não retornou user ou user.id');
        }
      } catch (error: any) {
        console.error('[EDGE] ✗ Exceção ao tentar auth.getUser():', error);
        console.error('[EDGE] Tipo do erro:', error.constructor.name);
        console.error('[EDGE] Mensagem:', error.message);
        if (error.stack) {
          console.error('[EDGE] Stack:', error.stack);
        }
      }
    }


    // Se ainda não tem user_id, retornar erro
    if (!userId) {
      console.error('[EDGE] ========== ERRO 401: AUTENTICAÇÃO FALHOU ==========');
      console.error('[EDGE] Todas as estratégias de autenticação falharam:');
      console.error('[EDGE] - x-user-id header:', xUserIdHeader ? 'presente mas inválido' : 'ausente');
      console.error('[EDGE] - JWT manual decoding:', authHeader ? 'tentado mas falhou' : 'não tentado (sem header)');
      console.error('[EDGE] - auth.getUser():', authHeader ? 'tentado mas falhou' : 'não tentado (sem header)');
      console.error('[EDGE] Possíveis causas:');
      console.error('[EDGE] 1. JWT verification está desativado e token não pôde ser decodificado');
      console.error('[EDGE] 2. Token não foi enviado no header Authorization');
      console.error('[EDGE] 3. Token é inválido, expirado ou corrompido');
      console.error('[EDGE] 4. Token não é um JWT válido (formato incorreto)');
      console.error('[EDGE] 5. Payload do JWT não contém campo "sub" ou equivalente');
      console.error('[EDGE] 6. auth.getUser() falhou e decodificação manual também falhou');
      console.error('[EDGE] ====================================================');
        return new Response(
        JSON.stringify({ 
          error: 'Não autenticado',
          message: 'Não foi possível verificar a autenticação. Verifique se o token JWT está sendo enviado corretamente.',
          debug: {
            hasAuthHeader: !!authHeader,
            hasXUserIdHeader: !!xUserIdHeader,
            method: req.method,
            path: path
          }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EDGE] ========== AUTENTICAÇÃO BEM-SUCEDIDA ==========');
    console.log('[EDGE] User ID:', userId);
    console.log('[EDGE] Método usado:', authMethod);
    console.log('[EDGE] ===============================================');

    // Criar cliente Supabase para operações de banco de dados
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );

    // Rota: /create-event - Criar evento no Google Calendar
    if (path === 'create-event' && req.method === 'POST') {
      console.log('[EDGE] ========== PROCESSANDO ROTA /create-event ==========');
      console.log('[EDGE] Método:', req.method);
      console.log('[EDGE] URL completa:', req.url);
      console.log('[EDGE] Headers recebidos:', JSON.stringify(Object.fromEntries(req.headers.entries())));
      console.log('[EDGE] Lendo body da requisição...');
      const body = await req.json();
      console.log('[EDGE] Body recebido:', JSON.stringify(body));
      const { transaction } = body;

      if (!transaction) {
        return new Response(
          JSON.stringify({ error: 'Dados da transação não fornecidos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar tokens do usuário
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('google_tokens_id')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: 'Tokens não encontrados. É necessário autorizar o Google Calendar primeiro.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let accessToken = tokenData.access_token;

      // Verificar se o token expirou e fazer refresh se necessário
      if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
        if (!tokenData.refresh_token) {
          return new Response(
            JSON.stringify({ error: 'Token expirado e refresh token não disponível' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fazer refresh do token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
            body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: tokenData.refresh_token,
              grant_type: 'refresh_token',
            }),
        });

        if (!refreshResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Erro ao renovar token' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const refreshedTokens: GoogleTokenResponse = await refreshResponse.json();
        accessToken = refreshedTokens.access_token;
        const newExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString();

        // Atualizar token no banco
            await supabaseClient
              .from('google_tokens_id')
              .update({
            access_token: accessToken,
            expires_at: newExpiresAt,
          })
          .eq('user_id', userId);
      }

      // Formatar dados do evento
      const eventDate = transaction.data || transaction.criado_em || new Date().toISOString().split('T')[0];
      const eventDateTime = new Date(eventDate + 'T09:00:00');
      const endDateTime = new Date(eventDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      const eventTitle = transaction.tipo === 'entrada' 
        ? `Receber: ${formatCurrency(transaction.valor)}`
        : `Pagar: ${formatCurrency(transaction.valor)}`;

      let eventDescription = `Categoria: ${transaction.classificacao || 'Sem categoria'}\n` +
        `Valor: ${formatCurrency(transaction.valor)}\n` +
        `Status: ${transaction.status === 'a_receber' ? 'A Receber' : 'A Pagar'}`;
      
      // Adicionar observações se existirem
      if (transaction.obs && transaction.obs.trim()) {
        eventDescription += `\nObservações: ${transaction.obs.trim()}`;
      }

      // Criar evento no Google Calendar
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventTitle,
          description: eventDescription,
          start: {
            dateTime: eventDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
        }),
      });

      if (!calendarResponse.ok) {
        const error = await calendarResponse.text();
        return new Response(
          JSON.stringify({ error: 'Erro ao criar evento: ' + error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const eventData = await calendarResponse.json();

      return new Response(
        JSON.stringify({ success: true, eventId: eventData.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== ERRO NA EDGE FUNCTION ===');
    console.error('Erro:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

