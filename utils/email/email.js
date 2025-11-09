const { Resend } = require('resend');
const { render } = require('@react-email/render');
const React = require('react');
const { Welcome } = require('./templates/Welcome');
const { AccountVerification } = require('./templates/AccountVerification');
const { PasswordReset } = require('./templates/PasswordReset');
const { PasswordChanged } = require('./templates/PasswordChanged');
const { EmailChanged } = require('./templates/EmailChanged');


const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;
const SUPPORT_EMAIL_ADDRESS = process.env.SUPPORT_EMAIL_ADDRESS;

exports.sendVerificationEmail = async({
    email,
    verificationUrl,
    minutesUntilExpire
}) => {
    const html = await render(React.createElement(AccountVerification, { verificationUrl, minutesUntilExpire }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Verify your Terrarecipes account",
        html: html
    });

    return { data, error };
}

exports.sendWelcomeEmail = async ({
    username,
    email,
    homeUrl
}) => {
    const html = await render(React.createElement(Welcome, { name: username, homeUrl }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Welcome to Terrarecipes 👩‍🍳 — your kitchen companion",
        html: html
    });

    return { data, error };
}

exports.sendPasswordResetEmail = async ({
    email,
    resetUrl,
    minutesUntilExpire
}) => {
    const html = await render(React.createElement(PasswordReset, { resetUrl, minutesUntilExpire }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Reset your Terrarecipes password",
        html: html
    });
    
    return { data, error };
}

exports.sendPasswordChangedEmail = async ({
    email,
    changePasswordUrl
}) => {
    const html = await render(React.createElement(PasswordChanged, { changePasswordUrl }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Your password was recently changed",
        html: html
    });

    return { data, error };
}

exports.sendEmailChangedEmail = async ({
    email,
    changePasswordUrl
}) => {
    const html = await render(React.createElement(EmailChanged, { supportEmail: SUPPORT_EMAIL_ADDRESS }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Your email address was recently changed",
        html: html
    });

    return { data, error };
}