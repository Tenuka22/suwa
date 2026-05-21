import { createDoctorFileRoute } from "./routes/create-doctor-file";
import { deleteDoctorFileRoute } from "./routes/delete-doctor-file";
import { getDoctorFileRoute } from "./routes/get-doctor-file";
import { listDoctorFilesRoute } from "./routes/list-doctor-files";
import { myDoctorFilesRoute } from "./routes/my-doctor-files";
import { updateDoctorFileRoute } from "./routes/update-doctor-file";

export const doctorFilesRouter = {
  listDoctorFiles: listDoctorFilesRoute,
  myDoctorFiles: myDoctorFilesRoute,
  createDoctorFile: createDoctorFileRoute,
  updateDoctorFile: updateDoctorFileRoute,
  deleteDoctorFile: deleteDoctorFileRoute,
  getDoctorFile: getDoctorFileRoute,
};
