import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Demanda, KanbanColumn as KanbanColumnT } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface KanbanBoardProps {
  columns: KanbanColumnT[];
  demandas: Demanda[];
  onMove: (demandaId: string, columnId: string, ordem: number) => void;
  onAddCard: (columnId: string) => void;
  onCardClick: (demanda: Demanda) => void;
  onRenameColumn: (column: KanbanColumnT) => void;
  onDeleteColumn: (column: KanbanColumnT) => void;
}

export function KanbanBoard({
  columns,
  demandas,
  onMove,
  onAddCard,
  onCardClick,
  onRenameColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map: Record<string, Demanda[]> = {};
    columns.forEach((c) => (map[c.id] = []));
    demandas.forEach((d) => {
      const key = d.coluna_id ?? columns[0]?.id;
      if (key && map[key]) map[key].push(d);
    });
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    );
    return map;
  }, [columns, demandas]);

  const activeDemanda = activeId ? demandas.find((d) => d.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const demandaId = String(active.id);
    const overData = over.data.current as any;
    let targetColumnId: string | null = null;
    if (overData?.type === "column") targetColumnId = overData.column.id;
    else if (overData?.type === "demanda") targetColumnId = overData.demanda.coluna_id;

    if (!targetColumnId) return;
    const list = grouped[targetColumnId] ?? [];
    const maxOrdem = list.reduce((m, d) => Math.max(m, d.ordem ?? 0), 0);
    onMove(demandaId, targetColumnId, maxOrdem + 1);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            demandas={grouped[col.id] ?? []}
            onAddCard={onAddCard}
            onCardClick={onCardClick}
            onRename={onRenameColumn}
            onDelete={onDeleteColumn}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDemanda && (
          <KanbanCard demanda={activeDemanda} onClick={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
