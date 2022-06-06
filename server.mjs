import { promisify } from 'util'
import { exec } from 'child_process'
import fs from 'fs'

import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import { encode } from 'borc'

const execWithPromise = promisify(exec)

const fastify = Fastify({
  logger: true
})

fastify.register(fastifyCors)

fastify.post('/compile', async (request, reply) => {
  const action = request.body['action']
  if ( action ) {
    switch ( action ) {
      case 1:  {
        const {stdout, stderr} = await execWithPromise(
            './lotus chain install-actor ../web/fil-hello-world-actor/target/debug/wbuild/fil_hello_world_actor/fil_hello_world_actor.compact.wasm',
            {
              cwd: '../lotus'
            }
        )
        return {
          success: true,
          logs: stdout,
        }
      }
      case 2:  {
        const cid = request.body['cid']
        const cmd_create = './lotus chain create-actor ' + cid
        const {stdout, stderr} = await execWithPromise(
            cmd_create,
            {
              cwd: '../lotus'
            }

        )
        return {
          success: true,
          logs: stdout,
        }
      }

      case 3:  {
        const actorId = request.body['actorId']
        const method = request.body['method']
        const params = request.body['params']
        const cmd_invoke = './lotus chain invoke ' + actorId + " " + method + " " + params
        const {stdout, stderr} = await execWithPromise(
            cmd_invoke.trim(),
            {
              cwd: '../lotus'
            }

        )
        return {
          success: true,
          logs: stdout,
        }
      }

      case 4:  {
        const actorId = request.body['actorId']
        const method = request.body['method']
        const params = request.body['params']
        const cmd_send = './lotus send ' + actorId + " " + params
        const {stdout, stderr} = await execWithPromise(
            cmd_send.trim(),
            {
                cwd: '../lotus'
            }

        )
        return {
            success: true,
            logs: stdout,
        }
      }

      case 5:  {
            const actorId = request.body['actorId']
            const method = request.body['method']
            const params = request.body['params']
            const value = request.body['value']
            const cmd_invoke2 = './lotus chain invoke2 ' + actorId + " " + method + " " + params +" "+ value
            const {stdout, stderr} = await execWithPromise(
                cmd_invoke2.trim(),
                {
                    cwd: '../lotus'
                }

            )
            return {
                success: true,
                logs: stdout,
            }
      }

      default: return (
          reply
              .code(400)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send({
                success: false,
                error: "action not supported"
              })
      )
    }
  }else {
    if (!request.body || !request.body['lib.rs']) {
      return (
          reply
              .code(400)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send({
                error: 'Missing data for lib.rs'
              })
      )
    }
    // fs.writeFileSync('fil-hello-world-actor/src/lib.rs', request.body['lib.rs'])
    // if (request.body['Cargo.toml']) {
    //   fs.writeFileSync('fil-hello-world-actor/Cargo.toml', request.body['Cargo.toml'])
    // }

    try {
      const { stdout, stderr } = await execWithPromise(
          'cargo build',
          {
            cwd: 'fil-hello-world-actor'
          }
      )
      const buffer = fs.readFileSync(
          'fil-hello-world-actor/target/debug/wbuild/' +
          'fil_hello_world_actor/fil_hello_world_actor.compact.wasm'
      )
      const encoded = encode([ buffer ])
      const base64Encoded = encoded.toString('base64')
      const result_data = stderr
      return {
        success: true,
        logs: result_data,
        wasmBinaryParamsEncoded: base64Encoded
      }
    } catch (e) {
      console.log("-----------", e)
      console.error('Exception:', e.message)
      console.error('Code:', e.code)
      console.error('stdout:\n', e.stdout)
      console.error('stderr:\n', e.stderr)
      return (
          reply
              .code(400)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send({
                success: false,
                code: e.code,
                error: e.stderr,
                msg: e.message,
                out: e.stdout,
              })
      )
    }
  }
})

// const port = process.env.PORT || 3000
const port = 4000

const start = async () => {
  try {
    await fastify.listen(port, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
