import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var __cipMongoose: Promise<typeof mongoose> | undefined
}

async function connectUri(uri: string) {
  mongoose.set('strictQuery', true)
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 })
}

async function connectEmbedded() {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const dbPath = path.resolve(process.cwd(), '.data/mongo')
  await mkdir(dbPath, { recursive: true })
  const mem = await MongoMemoryServer.create({
    instance: {
      dbName: 'cip',
      dbPath,
      storageEngine: 'wiredTiger'
    }
  })
  console.info('[cip] MongoDB embarqué démarré (pas de Docker détecté)')
  return connectUri(mem.getUri('cip'))
}

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    await seedApp()
    return mongoose
  }

  if (!globalThis.__cipMongoose) {
    const config = useRuntimeConfig()
    globalThis.__cipMongoose = connectUri(config.mongodbUri).catch(async (error) => {
      console.warn('[cip] MongoDB distant injoignable, bascule sur l\'instance locale embarquée', error.message)
      return connectEmbedded()
    })
  }

  await globalThis.__cipMongoose
  await seedApp()
  return mongoose
}
