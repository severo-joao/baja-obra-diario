import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, isBefore, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, MessageSquare, Paperclip, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEMANDA_PRIORIDADE, type Demanda } from "@/lib/types";

interface KanbanCardProps {
  demanda: Demanda;
  attachmentsCount?: number;
  commentsCount?: number;
  onClick: () => void;
}

export function KanbanCard({ demanda, attachmentsCount = 0, commentsCount = 0, onClick }: KanbanCardProps) {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick();
      }}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2 bg-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm leading-tight flex-1">{demanda.titulo}</h4>
        {prioridade && (
          <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", prioridade.color)}>
            {prioridade.label}
          </Badge>
        )}
      </div>

      {demanda.descricao && (
        <p className="text-xs text-muted-foreground line-clamp-2">{demanda.descricao}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        {prazo && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              overdue && "text-destructive font-medium",
              dueToday && "text-amber-600 font-medium"
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
    </Card>
  );
}
