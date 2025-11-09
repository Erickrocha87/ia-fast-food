import { UserDTO } from "../dto/user";
import { IUser } from "../model/user.type";

export function toUserDTO(user: IUser): UserDTO {
    const { password, ...userDTO } = user;
    return userDTO;
}
