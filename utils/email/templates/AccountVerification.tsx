import * as React from "react";

exports.AccountVerification = ({ verificationUrl, minutesUntilExpire }: { verificationUrl: string, minutesUntilExpire: number }) => {
    return (
        <div style={{ fontFamily: "ui-sans-serif, system-ui" }}>
            <p>{`Please verify your account by clicking the link below: `}</p>
            <a href={`${verificationUrl}`}>Verify Account</a>
            <p>{`This link expires in ${minutesUntilExpire} minutes.`}</p>
            <p>If you didn’t sign up, ignore this email</p>
        </div>
    );
}