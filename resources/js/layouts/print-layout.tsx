import * as React from "react";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 print:bg-white">
            <main>{children}</main>
        </div>
    );
}
