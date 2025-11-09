import { PrismaClient } from "@prisma/client";
import { UserCreateDTO } from "../../domain/dto/user";
import { toUserDTO } from "../../domain/map/user-map";

export class AuthRepository {
    constructor(private prisma: PrismaClient) {}

    async registerUser(data: UserCreateDTO ) {

        const user = await this.prisma.user.create({
            data: {
                ...data
            }
        });

        const userDTO = toUserDTO(user);

        return userDTO;
    }

    async findUserByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        });
        
        return user;
    }
}