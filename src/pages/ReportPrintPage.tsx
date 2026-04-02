import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import A4ReportPage from "@/components/report/A4ReportPage";
import ReportEntrySection from "@/components/report/ReportEntrySection";
import type { ReportEntry, Tool } from "@/lib/types";

export default function ReportPrintPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Token não fornecido");
      setLoading(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    fetch(`${supabaseUrl}/functions/v1/validate-print-token?token=${encodeURIComponent(token)}`)
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.error || "Token inválido");
        }
        return resp.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fff" }}>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Carregando relatório...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#fff" }}>
        <p style={{ color: "#EF4444", fontSize: 14 }}>{error || "Erro desconhecido"}</p>
      </div>
    );
  }

  const { client, entries, tools } = data;

  const FIRST_PAGE_IMAGES = 4;
  const CONTINUATION_IMAGES = 6;

  const pageSlots: {
    entry: (typeof entries)[0];
    entryIdx: number;
    imageOffset: number;
    maxImages: number;
  }[] = [];

  entries.forEach((entry, entryIdx) => {
    const imgs = entry.images ?? [];
    pageSlots.push({ entry, entryIdx, imageOffset: 0, maxImages: FIRST_PAGE_IMAGES });
    for (let offset = FIRST_PAGE_IMAGES; offset < imgs.length; offset += CONTINUATION_IMAGES) {
      pageSlots.push({ entry, entryIdx, imageOffset: offset, maxImages: CONTINUATION_IMAGES });
    }
  });

  const totalPages = pageSlots.length;

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {pageSlots.map((slot, pageIdx) => (
          <A4ReportPage
            key={`${slot.entry.id}-${slot.imageOffset}`}
            pageNumber={pageIdx + 1}
            totalPages={totalPages}
          >
            <ReportEntrySection
              entry={slot.entry}
              index={slot.entryIdx}
              clientName={client.nome_cliente}
              obraName={client.nome_empreitada}
              tools={tools}
              imageOffset={slot.imageOffset}
              maxImages={slot.maxImages}
            />
          </A4ReportPage>
        ))}
      </div>
    </div>
  );
}
