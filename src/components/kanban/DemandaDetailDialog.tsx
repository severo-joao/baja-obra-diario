import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Paperclip, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  DEMANDA_PRIORIDADE,
  type Demanda,
  type KanbanColumn,
} from "@/lib/types";
import { useUpdateDemanda, useDeleteDemanda } from "@/hooks/use-demandas";
import {
  useDemandaAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/hooks/use-demanda-attachments";
import {
  useDemandaComments,
  useAddComment,
  useDeleteComment,
} from "@/hooks/use-demanda-comments";
import { useProfiles } from "@/hooks/use-profiles";
import { toast } from "sonner";

interface DemandaDetailDialogProps {
  demanda: Demanda | null;
  columns: KanbanColumn[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
  lockResponsavel?: boolean;
  myEmail?: string;
}

export function DemandaDetailDialog({
  demanda,
  columns,
  open,
  onOpenChange,
  readOnly = false,
  lockResponsavel = false,
  myEmail = "",
}: DemandaDetailDialogProps) {
  const updateMut = useUpdateDemanda();
  const deleteMut = useDeleteDemanda();
  const { data: attachments } = useDemandaAttachments(demanda?.id ?? null);
  const uploadMut = useUploadAttachment();
  const delAttachMut = useDeleteAttachment();
  const { data: comments } = useDemandaComments(demanda?.id ?? null);
  const addCommentMut = useAddComment();
  const delCommentMut = useDeleteComment();
  const { data: profiles } = useProfiles();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"alta" | "media" | "baixa">("media");
  const [responsavel, setResponsavel] = useState("");
  const [colunaId, setColunaId] = useState<string>("");
  const [prazoDate, setPrazoDate] = useState<Date | undefined>();
  const [comment, setComment] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (demanda) {
      setTitulo(demanda.titulo);
      setDescricao(demanda.descricao);
      setPrioridade(demanda.prioridade);
      setResponsavel(demanda.responsavel ?? "");
      setColunaId(demanda.coluna_id ?? "");
      setPrazoDate(demanda.prazo ? parseISO(demanda.prazo + "T12:00:00") : undefined);
    }
  }, [demanda]);

  if (!demanda) return null;

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync({
        id: demanda.id,
        titulo,
        descricao,
        prioridade,
        responsavel,
        coluna_id: colunaId || null,
        prazo: prazoDate ? format(prazoDate, "yyyy-MM-dd") : null,
      } as any);
      toast.success("Demanda atualizada");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir esta demanda?")) return;
    await deleteMut.mutateAsync(demanda.id);
    toast.success("Demanda excluída");
    onOpenChange(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMut.mutateAsync({ demandaId: demanda.id, file });
      toast.success("Imagem anexada");
    } catch {
      toast.error("Erro no upload");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addCommentMut.mutateAsync({ demandaId: demanda.id, texto: comment.trim() });
      setComment("");
    } catch {
      toast.error("Erro ao comentar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Coluna</Label>
              <Select value={colunaId} onValueChange={setColunaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMANDA_PRIORIDADE.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Responsável</Label>
              <Input
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Quem é responsável?"
              />
            </div>
            <div>
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !prazoDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazoDate ? format(prazoDate, "PPP", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={prazoDate}
                    onSelect={setPrazoDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Anexos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" /> Anexos
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploadMut.isPending}
              >
                {uploadMut.isPending ? "Enviando..." : "Adicionar imagem"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFile}
              />
            </div>
            {attachments && attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="relative group">
                    <a href={a.url} target="_blank" rel="noreferrer">
                      <img
                        src={a.url}
                        alt={a.filename}
                        className="w-full h-24 object-cover rounded border"
                      />
                    </a>
                    <button
                      onClick={() =>
                        delAttachMut.mutate({ id: a.id, demandaId: demanda.id })
                      }
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum anexo.</p>
            )}
          </div>

          {/* Comentários */}
          <div>
            <Label>Comentários</Label>
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
              {comments?.map((c) => (
                <div
                  key={c.id}
                  className="bg-muted/40 border rounded p-2 text-sm flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{c.autor_email || "Anônimo"}</span>
                      <span>{format(parseISO(c.created_at), "dd/MM HH:mm")}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{c.texto}</p>
                  </div>
                  <button
                    onClick={() =>
                      delCommentMut.mutate({ id: c.id, demandaId: demanda.id })
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!comments?.length && (
                <p className="text-xs text-muted-foreground">Sem comentários ainda.</p>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment();
                }}
              />
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim() || addCommentMut.isPending}
              >
                Enviar
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button onClick={handleSave} disabled={updateMut.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
