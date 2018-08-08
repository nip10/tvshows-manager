import Email from 'email-templates';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { NODE_ENV, EMAIL_HOST, EMAIL_PORT, EMAIL_AUTH_USER, EMAIL_AUTH_PASSWORD, EMAIL_REPLYTO, HOSTNAME } = process.env;
const isDev = NODE_ENV === 'development';

  async sendEmail(to, template, locals) {
const Mail = {
    const email = new Email({
      message: {
        from: `${EMAIL_AUTH_USER}@${HOSTNAME}`,
        to,
        replyTo: `${EMAIL_REPLYTO}@${HOSTNAME}`,
      },
      send: !isDev,
      transport: {
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: false,
        auth: {
          user: EMAIL_AUTH_USER,
          pass: EMAIL_AUTH_PASSWORD,
        },
        debug: isDev,
        requireTLS: true,
      },
      views: {
        root: path.join(__dirname, 'templates'),
      },
      juiceResources: {
        webResources: {
          relativeTo: path.join(__dirname, 'templates', template),
        },
      },
    });
    try {
      await email.send({
        template,
        message: { to },
        locals,
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },
};

module.exports = Mail;
