import { TrainerResourceManager } from "@/src/app/components/resources/TrainerResourceManager";

export default function TrainerResourcesPage() {
  return (
    <TrainerResourceManager
      pageTitle="Recursos"
      pageSubtitle="Sube PDFs u otros documentos, organízalos por tipo y compártelos con los clientes que elijas. Un solo archivo puede compartirse con muchas personas sin volver a subirlo."
      emptyTitle="Aún no hay recursos"
      emptyDescription="Usa el formulario de arriba para subir tu primer documento. Cuando el backend exponga GET /resources, aparecerán aquí."
    />
  );
}
