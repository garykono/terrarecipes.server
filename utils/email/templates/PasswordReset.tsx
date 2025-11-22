import * as React from "react";
import { baseStyles } from "../BaseStyles";


export default function PasswordReset({ 
    resetUrl,
     minutesUntilExpire 
}: { resetUrl: string, minutesUntilExpire: number }) {
    return (
        <div style={baseStyles.container}>
            <div style={baseStyles.hiddenPreview}>
                You requested a password reset — link valid for {minutesUntilExpire} minutes.
            </div>
            <div style={baseStyles.hiddenSpacer}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>

            <div style={baseStyles.center}>
                <h2 style={baseStyles.h2}>Reset your password</h2>
                <p style={baseStyles.p}>We received a request to reset your Terrarecipes password.</p>
                <p style={baseStyles.p}>Click below to choose a new one:</p>
                <div style={baseStyles.btnWrap}>
                    <a href={resetUrl} style={baseStyles.btn}>Reset Password</a>
                </div>
                <p style={baseStyles.p}>
                    This link will expire in <strong>{minutesUntilExpire} minutes</strong>.
                </p>
                <p style={baseStyles.p}>If you didn’t request this, you can ignore this email.</p>
                <hr style={baseStyles.hr} />
                <p style={baseStyles.footer}>Terrarecipes · Security</p>
            </div>
        </div>
    );
}