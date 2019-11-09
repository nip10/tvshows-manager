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
  return sgMail.send(msg);
}

export function sendPasswordResetEmail(to, variables) {
  const msg = {
    to,
    from: EMAIL_ADDRESS,
    subject: EMAIL.RESET_PW.SUBJECT,
    templateId: 'd-8b15899ace694779b7a85867f1f92376',
    dynamic_template_data: {
      resetPasswordUrl: EMAIL.RESET_PW.URL({
        email: to,
        token: variables.token,
      }),
    },
  };
  return sgMail.send(msg);
}

export function sendActivationEmail(to, variables) {
  const msg = {
    to,
    from: EMAIL_ADDRESS,
    subject: EMAIL.ACTIVATE.SUBJECT,
    templateId: 'd-332cdb8c7cd94a13ab4f4dd538986327',
    dynamic_template_data: {
      activationUrl: EMAIL.ACTIVATE.URL({ email: to, token: variables.token }),
    },
  };
  return sgMail.send(msg);
}
