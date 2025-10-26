import * as React from "react";

exports.Welcome = ({ name }: { name: string }) => {
    return (
        <div style={{ fontFamily: "ui-sans-serif, system-ui" }}>
            <h2>Welcome, {name}!</h2>
            <p>Thanks for joining our recipe site.</p>
        </div>
    );
}