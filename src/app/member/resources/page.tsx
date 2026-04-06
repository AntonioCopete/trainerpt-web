import { MemberResourceList } from "@/src/app/components/resources/MemberResourceList";

export default function MemberResourcesPage() {
  return (
    <MemberResourceList
      pageTitle="Recursos"
      pageSubtitle="Todo lo que tu entrenador ha compartido contigo. Usa el filtro «Dieta» para ver planes nutricionales en PDF u otros documentos."
      emptyTitle="No hay documentos compartidos"
      emptyDescription="Cuando tu entrenador comparta PDFs u otros archivos contigo, aparecerán aquí."
    />
  );
}
