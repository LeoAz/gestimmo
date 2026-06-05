import { AlertCircle } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormAlertProps {
    message?: string | null;
}

export function FormAlert({ message }: FormAlertProps) {
    if (!message) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
}
