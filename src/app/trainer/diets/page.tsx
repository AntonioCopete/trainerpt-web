import { TrainerResourceManager } from "@/src/app/components/resources/TrainerResourceManager";

export default function TrainerDietsPage() {
  return (
    <TrainerResourceManager
      fixedResourceType="diet"
      pageTitle="Dietas (documentos)"
      pageSubtitle="Planes nutricionales en PDF u otros documentos que compartes con tus clientes. El generador de dietas dentro de la app llegará más adelante; por ahora centraliza aquí los archivos que ya uses con tu cartera."
      emptyTitle="No hay planes de dieta subidos"
      emptyDescription="Sube un PDF o imagen con el plan de tu cliente y compártelo desde «Compartir». Todo queda aparte de formularios y rutinas."
      showLinkToAllResources
    />
  );
}
