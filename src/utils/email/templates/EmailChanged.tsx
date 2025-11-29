import * as React from "react";
import { baseStyles } from "../BaseStyles";

export default function EmailChanged({
    supportEmail,
}: {
    supportEmail: string;
}) {
    return (
        <div style={baseStyles.container}>
            {/* Hidden preview for inbox snippet */}
            <div style={baseStyles.hiddenPreview}>
                Your Terrarecipes email address has been changed. Didn’t request this? Secure your account right away.
            </div>

            <div style={baseStyles.hiddenSpacer}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>

            <div style={baseStyles.center}>
                <h2 style={baseStyles.h2}>Your Terrarecipes email address has been changed</h2>

                <p style={baseStyles.p}>
                    This is a confirmation that the email address on your Terrarecipes account was successfully updated.
                </p>

                <p style={baseStyles.p}>
                    If you made this change, you can safely ignore this message.
                </p>

                <p style={baseStyles.p}>
                    If you <strong>did not</strong> request this change, your account security may be at risk.
                    Please contact our support team for assistance.
                </p>

                {/* <div style={baseStyles.btnWrap}>
                    <a href={changePasswordUrl} style={baseStyles.btn}>
                        Reset Password
                    </a>
                </div> */}

                <p style={baseStyles.p}>
                    Need help? Contact us at{" "}
                    <a href={`mailto:${supportEmail}`} style={baseStyles.link}>
                        {supportEmail}
                    </a>
                    .
                </p>

                <hr style={baseStyles.hr} />
                <p style={baseStyles.footer}>Terrarecipes · Security Notification</p>
            </div>
        </div>
    );
};