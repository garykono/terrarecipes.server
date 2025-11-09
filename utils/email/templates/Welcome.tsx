import * as React from "react";
import { baseStyles } from "../BaseStyles";

exports.Welcome = ({ name, homeUrl }: { name: string, homeUrl: string }) => {
    return (
        <div style={baseStyles.container}>
            <div style={baseStyles.hiddenPreview}>
                Save recipes, plan meals, and discover new favorites.
            </div>
            <div style={baseStyles.hiddenSpacer}>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>

            <h2 style={baseStyles.h2}>Welcome to Terrarecipes!</h2>
            <p style={baseStyles.p}>We’re excited to have you, {name}. You can now:</p>
            <ul style={{ margin: '12px 0 12px 20px' }}>
                <li>Save your favorite recipes</li>
                <li>Search by ingredient, course, or diet</li>
                <li>Add your own recipes with smart ingredient parsing</li>
            </ul>
            <div style={baseStyles.center}>
                <div style={baseStyles.btnWrap}>
                    <a href={homeUrl} style={baseStyles.btn}>
                        Start Cooking
                    </a>
                </div>
            </div>
            <p style={baseStyles.p}>
                Need help? Reply to this email or visit our Help Center.
            </p>
            <hr style={baseStyles.hr} />
            
            <div style={baseStyles.center}>
                <p style={baseStyles.footer}>Happy cooking — The Terrarecipes Team</p>
            </div>
        </div>
    );
}