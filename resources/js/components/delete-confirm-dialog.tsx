import { router } from "@inertiajs/react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  title?: string
  description?: string
  onSuccess?: () => void
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  url,
  title = "Êtes-vous sûr ?",
  description = "Cette action est irréversible. Cela supprimera définitivement ces données de nos serveurs.",
  onSuccess,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const onConfirm = () => {
    setLoading(true)
    router.delete(url, {
      onSuccess: () => {
        toast.success("Suppression réussie")
        onOpenChange(false)

        if (onSuccess) {
          onSuccess()
        }
      },
      onFinish: () => setLoading(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
