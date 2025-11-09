import { IUser } from "../model/user.type";

interface UserCreateDTO extends Omit<IUser, "id"> {}

interface UserLoginDTO {
  email: string;
  password: string;
}

interface UserDTO extends Omit<IUser, "password"> {}

export { UserCreateDTO, UserLoginDTO, UserDTO };