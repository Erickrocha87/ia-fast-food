import { MenuInputDTO } from "../domain/dto/menu.dto";
import { IMenuRepository } from "../domain/repositories/menu.repository";

class MenuService {
  menuRepository: IMenuRepository;

  constructor(menuRepository: IMenuRepository) {
    this.menuRepository = menuRepository;
  }

  create = async (data: MenuInputDTO) => {
    const createdMenu = await this.menuRepository.create(data);
    return createdMenu;
  };

  findAll = async () => {
    const menus = await this.menuRepository.findAll();
    return menus;
  };

  findByName = async (name: string) => {
    const menu = await this.menuRepository.findByName(name);

    if (!menu) {
      throw new Error(`Item "${name}" não encontrado no cardápio.`);
    }
   
    return menu;
  };

  deleteById = async (id: number) => {
    const deletedMenu = await this.menuRepository.deleteById(id);
    return deletedMenu;
  };
}

export { MenuService };
