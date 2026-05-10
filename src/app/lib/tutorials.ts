export type TutorialKey =
  | "clientView"
  | "uploadResources"
  | "routines"
  | "inviteClients"
  | "forms";

const VIDEOS_BASE =
  "https://yqpwuyvutwccljtjutmi.supabase.co/storage/v1/object/public/trainerpt/videos";

export const TUTORIALS: Record<
  TutorialKey,
  { title: string; src: string; description?: string }
> = {
  clientView: {
    title: "Cómo se ve la vista de tu cliente",
    src: `${VIDEOS_BASE}/demo-member-view.mp4`,
  },
  uploadResources: {
    title: "Subir recursos al dashboard",
    src: `${VIDEOS_BASE}/demo-resources.mp4`,
  },
  routines: {
    title: "Crear y asignar rutinas",
    src: `${VIDEOS_BASE}/demo-routines.mp4`,
  },
  inviteClients: {
    title: "Invitar clientes a la plataforma",
    src: `${VIDEOS_BASE}/demo-invite.mp4`,
  },
  forms: {
    title: "Crear y asignar formularios",
    src: `${VIDEOS_BASE}/demo-forms.mp4`,
  },
};
