import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { NgChartsModule } from 'ng2-charts';
import { RicetteComponent } from './pages/ricette/ricette.component';
import { SchemaNutrizionaleComponent } from './pages/schema-nutrizionale/schema-nutrizionale.component';
import { RiepilogoSchemiComponent } from './pages/riepilogo-schemi/riepilogo-schemi.component';
import { InserisciSchemaComponent } from './pages/inserisci-schema/inserisci-schema.component';
import { GestioneSchemaComponent } from './components/gestione-schema/gestione-schema.component';
import { GestionePastiComponent } from './components/gestione-pasti/gestione-pasti.component';
import { HomeComponent } from './pages/home/home.component';
import { EsportaComponent } from './pages/esporta/esporta.component';
import { GeneraRicetteComponent } from './components/genera-ricette/genera-ricette.component';
import { AuthInterceptor } from '../app/auth/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgcCookieConsentModule, NgcCookieConsentConfig } from 'ngx-cookieconsent';

const cookieConfig:NgcCookieConsentConfig = {
  cookie: {
    domain: 'localhost'// it is recommended to set your domain, for cookies to work properly
  },
  palette: {
    popup: {
      background: '#000'
    },
    button: {
      background: '#f1d600'
    }
  },
  theme: 'edgeless',
  type: 'opt-out',
  layout: 'my-custom-layout',
  layouts: {
    "my-custom-layout": '{{messagelink}}{{compliance}}'
  },
  elements:{
    messagelink: `
    <span id="cookieconsent:desc" class="cc-message">{{message}} 
      <a aria-label="learn more about cookies" tabindex="0" class="cc-link" href="{{cookiePolicyHref}}" target="_blank" rel="noopener">{{cookiePolicyLink}}</a>, 
      <a aria-label="learn more about our privacy policy" tabindex="1" class="cc-link" href="{{privacyPolicyHref}}" target="_blank" rel="noopener">{{privacyPolicyLink}}</a> and our 
      <a aria-label="learn more about our terms of service" tabindex="2" class="cc-link" href="{{tosHref}}" target="_blank" rel="noopener">{{tosLink}}</a>
    </span>
    `,
  },
  content:{
    message: 'By using our site, you acknowledge that you have read and understand our ',
    
    cookiePolicyLink: 'Cookie Policy',
    cookiePolicyHref: 'https://cookie.com',

    privacyPolicyLink: 'Privacy Policy',
    privacyPolicyHref: 'https://privacy.com',

    tosLink: 'Terms of Service',
    tosHref: 'https://tos.com',
  }
};




@NgModule({
  declarations: [
    AppComponent,
    RicetteComponent,
  SchemaNutrizionaleComponent,
RiepilogoSchemiComponent,
InserisciSchemaComponent,
GestioneSchemaComponent,
GestionePastiComponent,
HomeComponent,
EsportaComponent,
GeneraRicetteComponent,
],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule,         
    AppRoutingModule,
        NgChartsModule,
          NgcCookieConsentModule.forRoot(cookieConfig)


  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  
})
export class AppModule { }
