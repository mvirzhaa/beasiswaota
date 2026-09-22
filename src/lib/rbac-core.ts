import type { Role } from "@prisma/client";

export interface UserSesi {
  id: string;
  role: Role;
}
