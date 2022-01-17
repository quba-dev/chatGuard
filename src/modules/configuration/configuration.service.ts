import { Inject, Injectable } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import configuration from './index';

@Injectable()
export class AppConfig {
  constructor(
    @Inject(configuration.KEY)
    protected conf: ConfigType<typeof configuration>,
    public service: ConfigService,
  ) {}

  public get values() {
    return this.conf;
  }
}
