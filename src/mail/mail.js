import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import { EMAIL } from '../utils/constants';

dotenv.config();
const { EMAIL_SENDGRID_API_KEY, EMAIL_ADDRESS } = process.env;

sgMail.setApiKey(EMAIL_SENDGRID_API_KEY);

// const isDev = NODE_ENV === 'development';

export function sendSignupEmail(to, variables) {
  const msg = {
    to,
    from: EMAIL_ADDRESS,
    subject: EMAIL.SIGNUP.SUBJECT,
    templateId: 'd-aafdf9bab3424fdd866af5734e3a4503',
    dynamic_template_data: {
      activationUrl: EMAIL.SIGNUP.URL({ token: variables.token }),
    },
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log(`Sent email to ${to} for signup`);
    })
    .catch(error => {
      console.error(error.toString());
    });
}

export function sendPasswordResetEmail(to, variables) {
  const msg = {
    to,
    from: EMAIL_ADDRESS,
    subject: EMAIL.SIGNUP,
    text: `Welcome to TSM ! Follow this url to activate your account: https://p.dcdev.pt/tsm/auth/activate/${
      variables.token
    }`,
    html: `<strong> Welcome to TSM ! Follow this url to activate your account: https://p.dcdev.pt/tsm/auth/activate/${
      variables.token
    } </strong>`,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log(`Sent email to ${to} for password reset`);
    })
    .catch(error => {
      console.error(error.toString());
    });
}
