import * as React from "react";

exports.PasswordChanged = () => {
    return (
        <div style={{ fontFamily: "ui-sans-serif, system-ui" }}>
            <p>{`Your password was recently changed.`}</p>
            <p>If you didn’t change your password, please contact support.</p>
        </div>
    );
}