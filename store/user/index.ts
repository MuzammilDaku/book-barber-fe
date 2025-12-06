import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

export type UserType = "customer" | "barber" | "admin";

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  fullName: string;
  email: string;
  phone: string;
  userType: UserType;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

