import { IMenuItem } from "../model/menu.type";

interface MenuDTO extends Omit<IMenuItem, "id" | "createdAt" | "updatedAt"> {}

type MenuInputDTO = Partial<MenuDTO>;

export { MenuDTO, MenuInputDTO };