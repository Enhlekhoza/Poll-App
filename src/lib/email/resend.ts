import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPollClosingEmail = async (to: string, pollTitle: string, pollId: string) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: `Your poll "${pollTitle}" is closing soon!`,
      html: `<p>Your poll, "${pollTitle}", is closing in 24 hours. You can view your poll <a href="http://localhost:3000/polls/${pollId}">here</a>.</p>`,
    });
  } catch (error) {
    console.error('Error sending poll closing email:', error);
  }
};