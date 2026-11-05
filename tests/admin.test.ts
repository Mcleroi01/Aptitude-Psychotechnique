import { describe, expect, it } from "vitest";
import { accountChangeRefusal } from "@/lib/admin-rules";

const admin = (id: string) => ({ id, platformRole: "SUPER_ADMIN" as const, isActive: true });
const user = (id: string) => ({ id, platformRole: "USER" as const, isActive: true });

describe("garde-fous de l'administration", () => {
  it("interdit de se désactiver ou de se rétrograder soi-même", () => {
    expect(accountChangeRefusal({ actorId: "a", target: admin("a"), activeSuperAdmins: 3, change: { kind: "deactivate" } })).toMatch(/propre compte/);
    expect(accountChangeRefusal({ actorId: "a", target: admin("a"), activeSuperAdmins: 3, change: { kind: "role", role: "USER" } })).toMatch(/propre compte/);
  });

  it("garde toujours au moins un super-administrateur actif", () => {
    expect(accountChangeRefusal({ actorId: "a", target: admin("b"), activeSuperAdmins: 1, change: { kind: "deactivate" } })).toMatch(/au moins un/);
    expect(accountChangeRefusal({ actorId: "a", target: admin("b"), activeSuperAdmins: 2, change: { kind: "deactivate" } })).toBeNull();
  });

  it("autorise les changements sans risque", () => {
    expect(accountChangeRefusal({ actorId: "a", target: user("b"), activeSuperAdmins: 1, change: { kind: "deactivate" } })).toBeNull();
    expect(accountChangeRefusal({ actorId: "a", target: user("b"), activeSuperAdmins: 1, change: { kind: "role", role: "SUPER_ADMIN" } })).toBeNull();
    expect(accountChangeRefusal({ actorId: "a", target: { ...admin("b"), isActive: false }, activeSuperAdmins: 1, change: { kind: "activate" } })).toBeNull();
  });
});
