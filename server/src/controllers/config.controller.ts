import { UserRole } from '@/db/schema/users';
import { CreateConfigRequest, UpdateConfigRequest } from '@/schemas/config.schema';
import { ConfigService } from '@/services/config';
import { HonoEnv } from '@/types/hono-env';
import { HttpStatusCode } from '@/types/http';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export class ConfigController {
  constructor(private configService: ConfigService) {}

  public async getIsConfigured(c: Context<HonoEnv>) {
    const configuration = this.configService.getConfigOrNull();
    return c.json({ isConfigured: !!configuration });
  }

  public async getConfig(c: Context<HonoEnv>) {
    const configuration = this.configService.getConfigOrNull();
    const { user } = c.var;
    if (!configuration) {
      throw new HTTPException(HttpStatusCode.NOT_FOUND);
    }
    if (!user) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    return c.json(configuration);
  }

  public async createConfig(
    c: Context<HonoEnv, string, { out: { json: CreateConfigRequest } }>,
  ) {
    try {
      const { user } = c.var;
      const data = c.req.valid('json');

      const existingConfig = this.configService.getConfigOrNull();
      if (existingConfig && (!user || user.role !== UserRole.ADMIN)) {
        throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
      }

      await this.configService.createConfig(data);
    } catch (e) {
      console.error('Error creating configuration:', e);
      throw new HTTPException(HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  public async updateConfig(
    c: Context<HonoEnv, '/config', { out: { json: UpdateConfigRequest } }>,
  ) {
    const { user } = c.var;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new HTTPException(HttpStatusCode.UNAUTHORIZED);
    }
    const existingConfig = this.configService.getConfigOrNull();
    if (!existingConfig) {
      throw new HTTPException(HttpStatusCode.NOT_FOUND);
    }

    const updatedConfig = await this.configService.updateConfig(c.req.valid('json'));
    return c.json(updatedConfig);
  }
}
