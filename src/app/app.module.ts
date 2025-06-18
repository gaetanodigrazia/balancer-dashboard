import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { TipoSelezioneComponent } from './pages/tipo-selezione/tipo-selezione.component';
import { ScorteComponent } from './pages/scorte/scorte.component';
import { ListaSpesaComponent } from './pages/lista-spesa/lista-spesa.component';
import { ScontrinoComponent } from './pages/scontrino/scontrino.component';
import { SpeseMensiliComponent } from './spese-mensili/spese-mensili.component';
import { NgChartsModule } from 'ng2-charts';
import { RicetteComponent } from './ricette/ricette.component';
import { SchemaNutrizionaleComponent } from './schema-nutrizionale/schema-nutrizionale.component';

@NgModule({
  declarations: [
    AppComponent,
    ScorteComponent,
    ListaSpesaComponent,
    ScontrinoComponent,
    SpeseMensiliComponent,
    RicetteComponent,
  SchemaNutrizionaleComponent  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule,         
    AppRoutingModule,
    TipoSelezioneComponent,
        NgChartsModule,

  ],
  providers: [],
  bootstrap: [AppComponent],
  
})
export class AppModule { }
