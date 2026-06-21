import { createMaterialRoute } from "./routes/create-material";
import { createPlaylistRoute } from "./routes/create-playlist";
import { deleteMaterialRoute } from "./routes/delete-material";
import { deletePlaylistRoute } from "./routes/delete-playlist";
import { getMaterialRoute } from "./routes/get-material";
import { getPlaylistRoute } from "./routes/get-playlist";
import { listMaterialsRoute } from "./routes/list-materials";
import { listPlaylistsRoute } from "./routes/list-playlists";
import { updateMaterialRoute } from "./routes/update-material";
import { updatePlaylistRoute } from "./routes/update-playlist";

export const doctorMaterialsRouter = {
  createMaterial: createMaterialRoute,
  listMaterials: listMaterialsRoute,
  getMaterial: getMaterialRoute,
  updateMaterial: updateMaterialRoute,
  deleteMaterial: deleteMaterialRoute,
  createPlaylist: createPlaylistRoute,
  listPlaylists: listPlaylistsRoute,
  getPlaylist: getPlaylistRoute,
  updatePlaylist: updatePlaylistRoute,
  deletePlaylist: deletePlaylistRoute,
};
