const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('Enviando email de prueba...');
    console.log('API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'avaldez.ford@gmail.com', // ← CAMBIA ESTO
      subject: 'Test desde BackendKit',
      html: '<h1>Funciona!</h1><p>Si recibes esto, Resend está configurado correctamente.</p>',
    });
    
    console.log('✅ Email enviado exitosamente!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Error al enviar email:');
    console.error(error);
  }
}

testEmail();