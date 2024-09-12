// heaviy inspired by https://github.com/Joystream/orion
import _, { isObject } from 'lodash'
import { Args, Query, Resolver, Root, Subscription, ObjectType, Int, Field } from 'type-graphql'
import type { EntityManager } from 'typeorm'
import { globalEm } from '../../utils/globalEm'
import { Burn } from '../../model'

@ObjectType()
export class ProcessorState {
  @Field(() => Int, { nullable: false })
  lastProcessedBlock!: number
}

class ProcessorStateRetriever {
  public state: ProcessorState | undefined
  private em: EntityManager | undefined

  public run(intervalMs: number) {
    this.updateLoop(intervalMs)
      .then(() => {
        /* Do nothing */
      })
      .catch((err) => {
        console.error(err)
        process.exit(-1)
      })
  }

  private async updateLoop(intervalMs: number) {
    this.em = await globalEm
    while (true) {
      try {
        this.state = await this.getUpdatedState()
      } catch (e) {
        console.error('Cannot get updated state', e)
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }

  private async getUpdatedState() {
    if (this.em === undefined) return undefined
    const dbResult: unknown = await this.em.query('SELECT "height" FROM "squid_processor"."status"')
    return {
      lastProcessedBlock:
        Array.isArray(dbResult) &&
        isObject(dbResult[0]) &&
        'height' in dbResult[0] &&
        typeof dbResult[0].height === 'number'
          ? dbResult[0].height
          : -1,
    }
  }
}

const processorStateRetriever = new ProcessorStateRetriever()
processorStateRetriever.run(1000)

async function* processorStateGenerator(): AsyncGenerator<ProcessorState | undefined> {
  let lastState: ProcessorState | undefined
  while (1) {
    const currentState = processorStateRetriever.state
    if (!_.isEqual(currentState, lastState)) {
      yield currentState
      lastState = currentState
    }
    // 100ms interval when checking for updates
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

@Resolver()
export class StateResolver {
  constructor(private tx: () => Promise<EntityManager>) {}

  @Subscription({
    subscribe: () => processorStateGenerator(),
  })
  processorState(@Root() state: ProcessorState): ProcessorState {
    return state
  }

  // a regular @Query must be present, or @Resolver will be considered invalid
  @Query(() => Number)
  async totalBurns(): Promise<number> {
    const manager = await this.tx()
    return await manager.getRepository(Burn).count()
  }
}
