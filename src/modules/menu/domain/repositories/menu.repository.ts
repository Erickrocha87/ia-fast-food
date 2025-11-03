import { MenuDTO, MenuInputDTO } from "../dto/menu.dto";
import { IMenuItem } from "../model/menu.type";

export abstract class IMenuRepository {
    abstract create (data: MenuInputDTO): Promise<IMenuItem>;
    abstract findAll(): Promise<IMenuItem[]>;
    abstract findByName(name: string): Promise<IMenuItem | null>;
    abstract deleteById(id: number): Promise<IMenuItem | null>;
}