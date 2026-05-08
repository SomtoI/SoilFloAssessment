import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrucksService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: { site: { select: { id: true, name: true } } },
    });
    if (!truck) throw new NotFoundException(`Truck ${id} not found`);
    return truck;
  }
}
