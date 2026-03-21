import { ReactNode } from "react";

interface A4ReportPageProps {
  children: ReactNode;
  pageNumber?: number;
  totalPages?: number;
}

export default function A4ReportPage({ children, pageNumber, totalPages }: A4ReportPageProps) {
  return (
    <div className="a4-page" style={{ padding: "32px" }}>
      {/* Navy border frame (inset 8px) */}
      <div className="a4-page-border" />

      {/* Left vertical line */}
      <div className="a4-left-line" />

      {/* Footer diagonal decoration */}
      <div className="a4-footer-diagonal" />

      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between mb-6">
        {/* Left: Logo box */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 70,
            height: 70,
            backgroundColor: "#1A2B4A",
            borderRadius: 4,
          }}
        >
          <span className="font-extrabold text-white" style={{ fontSize: 32 }}>B</span>
        </div>

        {/* Right: Company info */}
        <div className="text-right">
          <p className="font-bold" style={{ color: "#1A2B4A", fontSize: 14 }}>
            Baja Engenharia & Construções
          </p>
          <p style={{ color: "#6B7280", fontSize: 11 }}>
            CNPJ: 34.526.647/0001-73
          </p>
          <div className="mt-2" style={{ borderBottom: "1px solid #D1D5DB" }} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10" style={{ paddingLeft: 24, minHeight: "calc(1123px - 32px - 32px - 86px - 140px)" }}>
        {children}
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 left-0 right-0 z-10" style={{ padding: "0 32px 16px 100px" }}>
        <p style={{ color: "#9CA3AF", fontSize: 10 }}>
          Copacabana | Rio de Janeiro
        </p>
        <p style={{ color: "#9CA3AF", fontSize: 10 }}>
          Rua Ministro de Castro | 15 1118 &nbsp;|&nbsp; www.bajaengenharia.com.br &nbsp;|&nbsp; contato@bajaengenharia.com.br
        </p>
        {pageNumber && totalPages && (
          <p className="text-center mt-2" style={{ color: "#9CA3AF", fontSize: 10 }}>
            Página {pageNumber} de {totalPages}
          </p>
        )}
      </div>
    </div>
  );
}
