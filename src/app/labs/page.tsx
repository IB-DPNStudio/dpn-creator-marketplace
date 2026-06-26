import LabsClient from "./LabsClient";
import { getLabsPlaylists } from "@/app/actions/labs";

export default async function LabsPage() {
  const initialPlaylists = await getLabsPlaylists();

  return <LabsClient initialPlaylists={initialPlaylists} />;
}
