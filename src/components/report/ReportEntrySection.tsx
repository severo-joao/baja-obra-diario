import { ReportEntry, WEATHER_OPTIONS } from "@/lib/types";
import type { Tool } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportEntrySectionProps {
  entry: ReportEntry;
  index: number;
  clientName: string;
  obraName: string;
  tools: Tool[];
}

export default function ReportEntrySection({ entry, index, clientName, obraName, tools }: ReportEntrySectionProps) {
  const weather = WEATHER_OPTIONS.find((w) => w.value === entry.condicoes_climaticas);
  const usedTools = tools.filter((t) => entry.ferramentas_ids?.includes(t.id));

  return (
    <div>
      {/* Title */}
      <h2
        className="text-center font-bold uppercase tracking-wide mb-5"
        style={{ color: "#1A2B4A", fontSize: 18 }}
      >
        Relatório Diário de Obra
      </h2>

      {/* Info block */}
      <div
        className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 p-4 rounded"
        style={{ backgroundColor: "#F8F9FA", fontSize: 13 }}
      >
        <div>
          <span className="font-semibold uppercase text-xs tracking-wide" style={{ color: "#6B7280" }}>Obra: </span>
          <span className="font-medium" style={{ color: "#1A2B4A" }}>{obraName}</span>
        </div>
        <div>
          <span className="font-semibold uppercase text-xs tracking-wide" style={{ color: "#6B7280" }}>Cliente: </span>
          <span className="font-medium" style={{ color: "#1A2B4A" }}>{clientName}</span>
        </div>
        <div>
          <span className="font-semibold uppercase text-xs tracking-wide" style={{ color: "#6B7280" }}>Data: </span>
          <span className="font-medium" style={{ color: "#1A2B4A" }}>
            {format(new Date(entry.data_relato), "dd/MM/yyyy")}
          </span>
        </div>
        <div>
          <span className="font-semibold uppercase text-xs tracking-wide" style={{ color: "#6B7280" }}>Relato #: </span>
          <span className="font-medium" style={{ color: "#1A2B4A" }}>{index + 1}</span>
        </div>
      </div>

      {/* Weather */}
      {weather && (
        <SectionBlock title="Condições Climáticas">
          <p style={{ fontSize: 13 }}>{weather.icon} {weather.label.replace(weather.icon + " ", "")}</p>
        </SectionBlock>
      )}

      {/* Equipe */}
      {entry.equipe && (
        <SectionBlock title="Equipe">
          <p className="whitespace-pre-wrap" style={{ fontSize: 13 }}>{entry.equipe}</p>
        </SectionBlock>
      )}

      {/* Ferramentas */}
      {usedTools.length > 0 && (
        <SectionBlock title="Ferramentas Utilizadas">
          <div className="flex flex-wrap gap-1.5">
            {usedTools.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">{t.nome}</Badge>
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Atividades */}
      <SectionBlock title="Atividades do Dia" accent>
        <p className="whitespace-pre-wrap" style={{ fontSize: 13 }}>{entry.atividades_dia}</p>
      </SectionBlock>

      {/* Observações */}
      {entry.observacoes && (
        <SectionBlock title="Observações Importantes" accent>
          <p className="whitespace-pre-wrap" style={{ fontSize: 13 }}>{entry.observacoes}</p>
        </SectionBlock>
      )}

      {/* Fotos */}
      {entry.images && entry.images.length > 0 && (
        <SectionBlock title="Registros Fotográficos">
          <div className="grid grid-cols-2 gap-3">
            {entry.images.map((img) => (
              <div key={img.id} className="border rounded overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                />
                <p className="text-center py-1" style={{ fontSize: 9, color: "#9CA3AF" }}>
                  {img.filename}
                </p>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}
    </div>
  );
}

function SectionBlock({ title, accent, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p
        className="font-semibold uppercase tracking-wide mb-1"
        style={{ color: "#1A2B4A", fontSize: 11 }}
      >
        {title}
      </p>
      <div
        className={accent ? "pl-3" : ""}
        style={accent ? { borderLeft: "3px solid #E87722" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
