import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, isBefore, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MessageSquare, Paperclip, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DEMANDA_PRIORIDADE, type Demanda } from "@/lib/types";

interface KanbanCardProps {
  demanda: Demanda;
  attachmentsCount?: number;
  commentsCount?: number;
  onClick: () => void;
  onToggleConcluida?: (demanda: Demanda) => void;
  canToggle?: boolean;
}

export function KanbanCard({
  demanda,
  attachmentsCount = 0,
  commentsCount = 0,
  onClick,
  onToggleConcluida,
  canToggle = true,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: demanda.id,
    data: { type: "demanda", demanda },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const prioridade = DEMANDA_PRIORIDADE.find((p) => p.value === demanda.prioridade);
  const prazo = demanda.prazo ? parseISO(demanda.prazo + "T12:00:00") : null;
  const overdue = prazo ? isBefore(prazo, new Date()) && !isToday(prazo) : false;
  const dueToday = prazo ? isToday(prazo) : false;
  const concluida = demanda.status === "concluida";

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (!isDragging) onClick();
      }}
      className={cn(
        "p-3 hover:shadow-md transition-all space-y-2 bg-card",
        concluida && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        {onToggleConcluida && (
          <div
            onPointerDown={stop}
            onMouseDown={stop}
            onClick={stop}
            className="pt-0.5"
          >
            <Checkbox
              checked={concluida}
              disabled={!canToggle}
              onCheckedChange={() => onToggleConcluida(demanda)}
              aria-label="Marcar como concluída"
            />
          </div>
        )}
        <div
          {...attributes}
          {...listeners}
          className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-medium text-sm leading-tight flex-1",
                concluida && "line-through text-muted-foreground"
              )}
            >
              {demanda.titulo}
            </h4>
            {prioridade && (
              <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", prioridade.color)}>
                {prioridade.label}
              </Badge>
            )}
          </div>

          {demanda.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {demanda.descricao}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-2">
            {prazo && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  !concluida && overdue && "text-destructive font-medium",
                  !concluida && dueToday && "text-amber-600 font-medium"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {format(prazo, "dd/MM", { locale: ptBR })}
              </span>
            )}
            {demanda.responsavel && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{demanda.responsavel}</span>
              </span>
            )}
            {commentsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {commentsCount}
              </span>
            )}
            {attachmentsCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {attachmentsCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
