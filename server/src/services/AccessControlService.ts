import { ClassroomRecord, CurrentUser, TermRecord } from "../types";
import { mainSettingsService } from "./MainSettingsService";

class AccessControlService {
  public getCurrentUser(): CurrentUser {
    const email = this.getActiveEmail();
    const users = mainSettingsService.getUsers();

    if (users.length === 0) {
      return {
        email,
        role: "admin",
        displayName: email || "Initial admin",
        allowedTermKeys: [],
        allowedClassrooms: [],
        isActive: true,
        isConfigured: false,
      };
    }

    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.isActive) {
      return {
        email,
        role: "teacher",
        displayName: email || "Unknown user",
        allowedTermKeys: [],
        allowedClassrooms: [],
        isActive: false,
        isConfigured: true,
      };
    }

    return {
      ...user,
      isConfigured: true,
    };
  }

  public assertActiveUser(): CurrentUser {
    const user = this.getCurrentUser();
    if (!user.isActive) {
      throw new Error("Your account is not allowed to use this application.");
    }
    return user;
  }

  public assertAdmin(): CurrentUser {
    const user = this.assertActiveUser();
    if (user.role !== "admin") {
      throw new Error("Admin permission is required.");
    }
    return user;
  }

  public filterTerms(terms: TermRecord[]): TermRecord[] {
    const user = this.assertActiveUser();
    if (user.role === "admin" || user.allowedTermKeys.length === 0) {
      return terms;
    }
    return terms.filter((term) => user.allowedTermKeys.includes(term.termKey));
  }

  public filterClassrooms(classrooms: ClassroomRecord[]): ClassroomRecord[] {
    const user = this.assertActiveUser();
    if (user.role === "admin" || user.allowedClassrooms.length === 0) {
      return classrooms;
    }
    return classrooms.filter((classroom) => user.allowedClassrooms.includes(classroom.sheetName));
  }

  public assertTermAccess(termKey: string): void {
    const user = this.assertActiveUser();
    if (user.role === "admin" || user.allowedTermKeys.length === 0) return;
    if (!user.allowedTermKeys.includes(termKey)) {
      throw new Error(`You do not have access to term ${termKey}.`);
    }
  }

  public assertClassroomAccess(classroom: string): void {
    const user = this.assertActiveUser();
    if (user.role === "admin" || user.allowedClassrooms.length === 0) return;
    if (!user.allowedClassrooms.includes(classroom)) {
      throw new Error(`You do not have access to classroom ${classroom}.`);
    }
  }

  private getActiveEmail(): string {
    try {
      return Session.getActiveUser().getEmail().toLowerCase();
    } catch (error) {
      Logger.log(error);
      return "";
    }
  }
}

export const accessControlService = new AccessControlService();
