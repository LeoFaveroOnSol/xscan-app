/**
 * Script para gerar o TELEGRAM_SESSION_STRING
 *
 * Rode com: node scripts/generate-telegram-session.js
 *
 * Vai pedir seu número de telefone e o código de verificação que o Telegram envia.
 * Depois vai imprimir o SESSION_STRING para você copiar e adicionar no Vercel.
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

const API_ID = 30213133;
const API_HASH = 'fd133b6e6690f6ed5542fc4eba6e7234';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔐 Gerador de Session String para Telegram MTProto\n');

  const stringSession = new StringSession('');

  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await question('📱 Seu número de telefone (com código do país, ex: +5511999999999): '),
    password: async () => await question('🔑 Sua senha do Telegram (se tiver 2FA): '),
    phoneCode: async () => await question('📨 Código de verificação recebido no Telegram: '),
    onError: (err) => console.log('Erro:', err),
  });

  console.log('\n✅ Autenticado com sucesso!\n');
  console.log('═'.repeat(60));
  console.log('📋 Sua SESSION_STRING (copie tudo abaixo):');
  console.log('═'.repeat(60));
  console.log(client.session.save());
  console.log('═'.repeat(60));
  console.log('\n⚠️  Adicione como TELEGRAM_SESSION_STRING no Vercel\n');

  rl.close();
  await client.disconnect();
  process.exit(0);
}

main().catch(console.error);
