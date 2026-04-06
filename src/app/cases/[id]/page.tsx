import CaseDetail from "./CaseDetail";

// Pre-render demo case IDs for static export
export function generateStaticParams() {
  return [
    { id: "5001" },
    { id: "5002" },
    { id: "5003" },
    { id: "5004" },
    { id: "5005" },
    { id: "5006" },
  ];
}

export default function CaseDetailPage() {
  return <CaseDetail />;
}
