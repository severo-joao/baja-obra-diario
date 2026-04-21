import { useDroppable } from "@dnd-kit/core";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Demanda, KanbanColumn as KanbanColumnT } from "@/lib/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  column: KanbanColumnT;
  demandas: Demanda[];
  onAddCard: (columnId: string) => void;
  onCardClick: (demanda: Demanda) => void;
  onRename: (column: KanbanColumnT) => void;
  onDelete: (column: KanbanColumnT) => void;
}

export function KanbanColumn({
  column,
  demandas,
  onAddCard,
  onCardClick,
  onRename,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div className="flex flex-col w-72 shrink-0 bg-muted/40 rounded-lg border">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.cor }}
          />
          <h3 className="font-semibold text-sm truncate">{column.titulo}</h3>
          <span className="text-xs text-muted-foreground bg-background border rounded-full px-2 py-0.5">
            {demandas.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(column)}>
              <Pencil className="h-4 w-4 mr-2" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(column)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 min-h-[120px] transition-colors",
          isOver && "bg-accent/40"
        )}
      >
        {demandas.map((d) => (
          <KanbanCard key={d.id} demanda={d} onClick={() => onCardClick(d)} />
        ))}
      </div>

      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAddCard(column.id)}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar tarefa
        </Button>
      </div>
    </div>
  );
}
