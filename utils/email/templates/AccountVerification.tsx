import * as React from "react";
import { baseStyles } from "../BaseStyles";

exports.AccountVerification = ({ verificationUrl, minutesUntilExpire }: { verificationUrl: string, minutesUntilExpire: number }) => {
    return (
        <div style={baseStyles.container}>
            <div style={baseStyles.hiddenPreview}>
                Verify your email address for access to more features!
            </div>
            <div style={baseStyles.hiddenSpacer}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
                        
            <div style={baseStyles.center}>
                <p style={baseStyles.p}>Please verify your account by clicking the button below:</p>
                <div style={baseStyles.btnWrap}>
                    <a href={verificationUrl} style={baseStyles.btn}>Verify My Email</a>
                </div>
                <p style={baseStyles.p}>
                    This link expires in <strong>{minutesUntilExpire} minutes</strong>.
                </p>
                <p style={baseStyles.p}>If you didn’t sign up or change your email address, you can safely ignore this email.</p>
                <hr style={baseStyles.hr} />
                <p style={baseStyles.footer}>Terrarecipes · Your kitchen companion</p>
            </div>
        </div>
    );
}