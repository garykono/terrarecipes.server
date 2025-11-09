import * as React from "react";
import { baseStyles } from "../BaseStyles";

exports.PasswordChanged = ({ changePasswordUrl }: { changePasswordUrl: string }) => {
    return (
        <div style={baseStyles.container}>
            <div style={baseStyles.hiddenPreview}>
                Your Terrarecipes password has been changed. Didn’t request it? Reset it now.
            </div>
            <div style={baseStyles.hiddenSpacer}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
            
            <div style={baseStyles.center}>
                <h2 style={baseStyles.h2}>Your Terrarecipes password has been changed</h2>
                <p style={baseStyles.p}>
                    This is a confirmation that your password was successfully updated.
                </p>
                <p style={baseStyles.p}>
                    If you made this change, you can safely ignore this message.
                </p>
                <p style={baseStyles.p}>
                    If you <strong>did not</strong> change your password, please reset it immediately:
                </p>
                <div style={baseStyles.btnWrap}>
                    <a href={changePasswordUrl} style={baseStyles.btn}>
                        Reset Password
                    </a>
                </div>
                <hr style={baseStyles.hr} />
                <p style={baseStyles.footer}>Terrarecipes · Security Notification</p>
            </div>
        </div>
    );
}