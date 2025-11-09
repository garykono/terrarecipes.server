import React from "react";

export const baseStyles = {
    container: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        maxWidth: '560px',
        margin: '0 auto',
        padding: '24px 20px',
        color: '#111827',
        lineHeight: '1.55',
    } as React.CSSProperties,
    hiddenPreview: {
        display: 'none',
        color: 'transparent',
        maxHeight: 0,
        maxWidth: 0,
        opacity: 0,
        overflow: 'hidden',
        msoHide: 'all', // helps hide from Outlook
    },
    hiddenSpacer: {
        display: 'none',
        fontSize: '1px',
        lineHeight: '1px',
        maxHeight: '0px',
        maxWidth: '0px',
        opacity: 0,
        overflow: 'hidden',
        msoHide: 'all',
    },
    center: {
        textAlign: 'center'
    } as React.CSSProperties,
    h2: { margin: '0 0 12px', fontSize: '20px' } as React.CSSProperties,
    p: { margin: '12px 0' } as React.CSSProperties,
    hr: { border: '0', borderTop: '1px solid #E5E7EB', margin: '24px 0' } as React.CSSProperties,
    btnWrap: { margin: '20px 0', display: 'inline-block' } as React.CSSProperties,
    btn: {
        display: 'inline-block',
        backgroundColor: '#16a34a',
        color: '#ffffff',
        padding: '12px 18px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 600,
    } as React.CSSProperties,
    link: {
        color: '#16a34a',
        textDecoration: 'underline',
        fontWeight: 500,
    } as React.CSSProperties,
    footer: { 
        display: 'inline-block',
        fontSize: '12px', 
        color: '#6B7280',
    } as React.CSSProperties,
};