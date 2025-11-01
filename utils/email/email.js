const { Resend } = require('resend');
const { render } = require('@react-email/render');
const React = require('react');
const { Welcome } = require('./templates/Welcome');
const { AccountVerification } = require('./templates/AccountVerification');
const { PasswordReset } = require('./templates/PasswordReset');
const { PasswordChanged } = require('./templates/PasswordChanged');


const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;

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

    console.log("data: ", data, "\nerror: ", error)

    if (error) throw error;

    return data;
}

exports.sendWelcomeEmail = async ({
    username,
    email
}) => {
    const html = await render(React.createElement(Welcome, { name: username }));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Welcome!",
        html: html
    });

    if (error) throw error;

    return data;
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
        subject: "Reset your password",
        html: html
    });
    
    if (error) throw error;

    return data;
}

exports.sendPasswordChangedEmail = async ({
    email
}) => {
    const html = await render(React.createElement(PasswordChanged));
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Your password was recently changed",
        html: html
    });
    
    if (error) throw error;

    return data;
}