import { MemberResourceList } from "@/src/app/components/resources/MemberResourceList";

export default function MemberResourcesPage() {
  return (
    <MemberResourceList
      pageTitle="Recursos"
      pageSubtitle="Todo lo que tu entrenador ha compartido contigo. Filtra por tipo; la pestaña Dietas solo muestra planes nutricionales."
      emptyTitle="No hay documentos compartidos"
      emptyDescription="Cuando tu entrenador comparta PDFs u otros archivos contigo, aparecerán aquí."
    />
  );
}
