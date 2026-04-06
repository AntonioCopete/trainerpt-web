import { MemberResourceList } from "@/src/app/components/resources/MemberResourceList";

export default function MemberDietsPage() {
  return (
    <MemberResourceList
      fixedResourceType="diet"
      pageTitle="Mis dietas"
      pageSubtitle="Solo planes nutricionales en PDF u otros documentos marcados como dieta. El resto está en Recursos."
      emptyTitle="No tienes planes de dieta compartidos"
      emptyDescription="Cuando tu entrenador suba un documento de tipo dieta y te lo asigne, lo verás aquí."
      showLinkToAllResources
    />
  );
}
