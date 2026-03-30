import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExitExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ExitExerciseDialog({ open, onOpenChange, onConfirm }: ExitExerciseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Sair do exercício?</DialogTitle>
          <DialogDescription>
            Se você sair agora, o progresso desta atividade será perdido.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continuar estudando
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Sair mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}