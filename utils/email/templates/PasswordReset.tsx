import * as React from "react";

exports.PasswordReset = ({ resetUrl, minutesUntilExpire }: { resetUrl: string, minutesUntilExpire: number }) => {
    return (
        <div style={{ fontFamily: "ui-sans-serif, system-ui" }}>
            <p>Reset your password here:</p>
            <a href={`${resetUrl}`}>Reset Password</a>
            <p>{`This link expires in ${minutesUntilExpire} minutes.`}</p>
            <p>If you didn’t attempt a password reset, ignore this email.</p>
        </div>
    );
}