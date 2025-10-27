import { MenuDTO } from "../dto/menu.dto";
import { IMenu } from "../model/menu.type";

export abstract class MenuRepository {
    abstract create (data: MenuDTO): Promise<IMenu>;
}