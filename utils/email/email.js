const { Resend } = require('resend');
const { render } = require('@react-email/render');
const React = require('react');
const { Welcome } = require('./templates/Welcome');


const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;

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
    resetUrl
}) => {
    const html = `<p>Reset your password here: <a href="${resetUrl}">${resetUrl}</a></p>`;
    const { data, error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Reset your password",
        html: html
    });
    
    if (error) throw error;

    return data;
}