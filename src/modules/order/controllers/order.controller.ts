import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { OrderService } from "../services/order.service";
import { AddOrderItemDTO, RemoveOrderItemDTO } from "src/modules/orderItem/domain/dto/order-item";
import { UpdateOrderStatusDTO } from "../domain/dto/order";


export class OrderController {
  constructor(private readonly service: OrderService) {}

  async createOrAttachToOpen(
    req: FastifyRequest<{ Body: { tableNumber: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { tableNumber } = req.body;
      const order = await this.service.findOrCreateOpen(tableNumber);
      return reply.send({
        success: true,
        message: `Pedido ativo encontrado/criado para a mesa ${tableNumber}`,
        order,
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  }

  async addItem(
    req: FastifyRequest<{ Body: AddOrderItemDTO }>,
    reply: FastifyReply
  ) {
    try {
      const dto = req.body;
      const updated = await this.service.addItem(dto);
      const summary = await this.service.getSummary(updated.id);
      return reply.send({
        success: true,
        message: "Item adicionado com sucesso.",
        order: summary,
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  }

  async removeItem(
    req: FastifyRequest<{ Body: RemoveOrderItemDTO }>,
    reply: FastifyReply
  ) {
    try {
      const dto = req.body;
      const updated = await this.service.removeItem(dto);
      const summary = await this.service.getSummary(updated.id);
      return reply.send({
        success: true,
        message: "Item removido com sucesso.",
        order: summary,
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  }

  async getSummary(
    req: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const orderId = Number(req.params.orderId);
      const summary = await this.service.getSummary(orderId);
      return reply.send({ success: true, order: summary });
    } catch (error: any) {
      return reply.status(404).send({ success: false, error: error.message });
    }
  }

  async updateStatus(
    req: FastifyRequest<{ Params: { orderId: string }; Body: UpdateOrderStatusDTO }>,
    reply: FastifyReply
  ) {
    try {
      const orderId = Number(req.params.orderId);
      const { status } = req.body;
      const updated = await this.service.updateStatus(orderId, { status });
      return reply.send({
        success: true,
        message: `Status atualizado para ${updated.status}`,
        order: updated,
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  }
}
