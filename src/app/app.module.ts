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
GeneraRicetteComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule,         
    AppRoutingModule,
        NgChartsModule,

  ],
  providers: [],
  bootstrap: [AppComponent],
  
})
export class AppModule { }
