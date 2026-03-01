import { transport, sender } from "./mailer.js";

const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new Error("Missing email params");
  }
  await transport.sendMail({
    from: sender.address,
    to,
    subject,
    html,
  });
};

export default sendEmail;
