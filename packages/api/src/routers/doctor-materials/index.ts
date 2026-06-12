import { createMaterialRoute } from "./routes/create-material";
import { deleteMaterialRoute } from "./routes/delete-material";
import { getMaterialRoute } from "./routes/get-material";
import { listMaterialsRoute } from "./routes/list-materials";
import { updateMaterialRoute } from "./routes/update-material";
import { createPlaylistRoute } from "./routes/create-playlist";
import { deletePlaylistRoute } from "./routes/delete-playlist";
import { getPlaylistRoute } from "./routes/get-playlist";
import { listPlaylistsRoute } from "./routes/list-playlists";
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
