import { Query, Resolver } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { Burn } from '../../model'

@Resolver()
export class CountResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Query(() => Number)
  async totalBurns(): Promise<number> {
    const manager = await this.tx()
    return await manager.getRepository(Burn).count()
  }
}
