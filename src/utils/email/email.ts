import { Resend } from 'resend';
import { render } from '@react-email/render';
import React = require('react');
import Welcome from './templates/Welcome';
import AccountVerification from './templates/AccountVerification';
import PasswordReset from './templates/PasswordReset';
import PasswordChanged from './templates/PasswordChanged';
import EmailChanged from './templates/EmailChanged';
import logger from '../logger';
import env from "../env"

const resend = new Resend(env.RESEND_API_KEY);
const FROM = env.EMAIL_FROM || "Terra Recipes <no-reply@terrarecipes.xyz>";
const SUPPORT_EMAIL_ADDRESS = env.SUPPORT_EMAIL_ADDRESS || "terrarecipes.us@gmail.com";

export const sendVerificationEmail = async({
    email,
    verificationUrl,
    minutesUntilExpire
}: {
    email: string;
    verificationUrl: string;
    minutesUntilExpire: number;
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

export const sendWelcomeEmail = async ({
    username,
    email,
    homeUrl
}: {
    username: string;
    email: string;
    homeUrl: string;
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

export const sendPasswordResetEmail = async ({
    email,
    resetUrl,
    minutesUntilExpire
}: {
    email: string;
    resetUrl: string;
    minutesUntilExpire: number;
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

export const sendPasswordChangedEmail = async ({
    email,
    changePasswordUrl
}: {
    email: string;
    changePasswordUrl: string;
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

export const sendEmailChangedEmail = async ({
    email,
    changePasswordUrl
}: {
    email: string;
    changePasswordUrl: string;
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