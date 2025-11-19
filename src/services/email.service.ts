import { Resend } from 'resend';

// Inicialización lazy - solo se crea cuando se necesita
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    resendInstance = new Resend(apiKey);
    console.log('✅ Resend initialized');
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// Email de bienvenida
export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const resend = getResend(); // Obtener instancia lazy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to BackendKit! 🚀',
      html: `
        <h1>Welcome ${name || 'there'}!</h1>
        <p>Thanks for signing up to BackendKit.</p>
        <p>You're now ready to start building amazing things.</p>
        <p>If you have any questions, just reply to this email.</p>
        <br>
        <p>Happy coding!</p>
        <p>The BackendKit Team</p>
      `,
    });
    console.log('✅ Welcome email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error };
  }
}

// Email de confirmación de suscripción
export async function sendSubscriptionConfirmation(
  email: string,
  plan: string
) {
  try {
    const resend = getResend(); // Obtener instancia lazy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Subscription Confirmed! 🎉',
      html: `
        <h1>Subscription Confirmed</h1>
        <p>Your <strong>${plan}</strong> subscription is now active!</p>
        <p>You now have access to all the features of your plan.</p>
        <p>Thank you for choosing BackendKit.</p>
        <br>
        <p>The BackendKit Team</p>
      `,
    });
    console.log('✅ Subscription confirmation email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending subscription confirmation:', error);
    return { success: false, error };
  }
}

// Email de pago fallido
export async function sendPaymentFailedEmail(email: string) {
  try {
    const resend = getResend(); // Obtener instancia lazy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Payment Failed - Action Required',
      html: `
        <h1>Payment Failed</h1>
        <p>We couldn't process your payment for your BackendKit subscription.</p>
        <p>Please update your payment method to continue using our service.</p>
        <p><a href="https://your-app.com/billing">Update Payment Method</a></p>
        <br>
        <p>The BackendKit Team</p>
      `,
    });
    console.log('✅ Payment failed email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending payment failed email:', error);
    return { success: false, error };
  }
}

// Email de suscripción cancelada
export async function sendSubscriptionCanceledEmail(
  email: string,
  endDate: Date
) {
  try {
    const resend = getResend(); // Obtener instancia lazy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Subscription Canceled',
      html: `
        <h1>Subscription Canceled</h1>
        <p>Your subscription has been canceled.</p>
        <p>You'll continue to have access until <strong>${endDate.toLocaleDateString()}</strong>.</p>
        <p>We're sorry to see you go. If you change your mind, you can resubscribe anytime.</p>
        <br>
        <p>The BackendKit Team</p>
      `,
    });
    console.log('✅ Cancellation email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
    return { success: false, error };
  }
}