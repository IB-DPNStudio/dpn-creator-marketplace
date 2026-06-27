import LabsClient from "./LabsClient";
import { getLabsPlaylists } from "@/app/actions/labs";
import { createClient } from "@/utils/supabase/server";

export default async function LabsPage() {
  const initialPlaylists = await getLabsPlaylists();
  
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === "studio@ideabrews.com";

  return <LabsClient initialPlaylists={initialPlaylists} isAdmin={isAdmin} />;
}
