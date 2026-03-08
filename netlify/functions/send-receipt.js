import { Resend } from 'resend';

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { full_name, email } = JSON.parse(event.body);

    if (!full_name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Full name and email are required' }),
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Send notification to the foundation
    const { data: adminData, error: adminError } = await resend.emails.send({
      from: 'Corazones of Courage <info@corazonesofcouragefoundation.org>',
      to: 'rega1237@gmail.com',
      subject: 'New Receipt Request - Corazones of Courage',
      html: `
        <h2>New Donation Receipt Request</h2>
        <p><strong>Name:</strong> ${full_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <p>This message was sent from the Corazones of Courage Foundation website.</p>
      `,
    });

    if (adminError) {
      console.error('Resend Error (Admin):', adminError);
      throw adminError;
    }

    // 2. Clear success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Receipt request sent successfully',
        id: adminData.id
      }),
    };
  } catch (error) {
    console.error('Error handling form submission:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send receipt request. Please try again later.' }),
    };
  }
};
