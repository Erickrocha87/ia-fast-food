import { IMenu } from "../model/menu.type";

export interface MenuDTO extends Omit<IMenu, "id" | "createdAt" | "updatedAt"> {}
