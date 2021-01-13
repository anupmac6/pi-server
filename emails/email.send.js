const config = require("config");
const EMAIL = config.get("Email");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(EMAIL.key);

exports.sendEmail = async (to, subject, email) => {
  const msg = {
    to, // Change to your recipient
    from: "anupmac6@gmail.com", // Change to your verified sender
    subject,
    html: email,
  };
  try {
    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }
    return error;
  }
};
