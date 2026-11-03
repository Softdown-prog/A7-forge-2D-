import {Controller,Get,Options} from '@nestjs/common';

/** Probe only: no /v1, Firebase, payment or saved-game routes. */
@Controller('__nest_probe')
export class PreviewController{
 @Get('health')
 health():{readonly ok:true;readonly service:'lhs-nest-preview';readonly production:false}{
  return {ok:true,service:'lhs-nest-preview',production:false};
 }
 @Options('health')
 preflight():void{}
}
