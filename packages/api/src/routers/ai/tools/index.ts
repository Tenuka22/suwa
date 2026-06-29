import type { ClerkRequestContext } from "../../../context";
import { createCheckAvailabilityTool } from "./check-availability";
import { createGetDoctorProfileTool } from "./get-doctor-profile";
import { createGetUpcomingSessionsTool } from "./get-upcoming-sessions";
import { createSearchDoctorsTool } from "./search-doctors";
import { createSearchHospitalsTool } from "./search-hospitals";
import { createTransferToAgentTool } from "./transfer-to-agent";

export function getAgentInfo() {
  return [
    {
      id: "coordinator",
      name: "Coordinator",
      description: "Routes queries to the right agent",
      tools: ["transfer_to_agent"],
    },
    {
      id: "db",
      name: "Database Assistant",
      description: "Doctor search, profiles, appointments, availability, hospital lookup",
      tools: [
        "search_doctors",
        "search_hospitals",
        "get_doctor_profile",
        "check_availability",
        "get_upcoming_sessions",
      ],
    },
  ];
}

export function createAiTools(_context: ClerkRequestContext) {
  return {
    transferToAgent: createTransferToAgentTool(_context),
    searchDoctors: createSearchDoctorsTool(_context),
    searchHospitals: createSearchHospitalsTool(_context),
    getDoctorProfile: createGetDoctorProfileTool(_context),
    checkAvailability: createCheckAvailabilityTool(_context),
    getUpcomingSessions: createGetUpcomingSessionsTool(_context),
  };
}
