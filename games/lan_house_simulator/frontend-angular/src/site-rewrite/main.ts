import {bootstrapApplication} from '@angular/platform-browser';
import {SiteApp} from './site-app';
bootstrapApplication(SiteApp).catch(error=>console.error('Falha ao iniciar Angular:',error));
