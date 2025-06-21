import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RicetteComponent } from './pages/ricette/ricette.component';
import { SchemaNutrizionaleComponent } from './pages/schema-nutrizionale/schema-nutrizionale.component';
import { HomeComponent } from './pages/home/home.component';
import { InserisciSchemaComponent } from './pages/inserisci-schema/inserisci-schema.component';
import { EsportaComponent } from './pages/esporta/esporta.component';
import { GestioneSchemaComponent } from './components/gestione-schema/gestione-schema.component';
import { GestionePastiComponent } from './components/gestione-pasti/gestione-pasti.component';
import { RiepilogoSchemiComponent } from './pages/riepilogo-schemi/riepilogo-schemi.component';
import { GeneraRicetteComponent } from './components/genera-ricette/genera-ricette.component';
import { LoginComponent } from './pages/login/login.component';

import { authGuard } from './auth/auth.guard'; // 👈 Importa il functional guard

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent }, // pubblica
  { path: 'ricette', component: RicetteComponent, canActivate: [authGuard] },
  { path: 'modelli', component: RiepilogoSchemiComponent, canActivate: [authGuard] },
  { path: 'riepilogo', component: RiepilogoSchemiComponent, canActivate: [authGuard] },
  { path: 'inserisci', component: InserisciSchemaComponent, canActivate: [authGuard] },
  { path: 'esporta', component: RiepilogoSchemiComponent, canActivate: [authGuard] },
  { path: 'gestione-schema', component: RiepilogoSchemiComponent, canActivate: [authGuard] },
  { path: 'gestione-pasti', component: RiepilogoSchemiComponent, canActivate: [authGuard] },
  { path: 'gestione-pasti/:id', component: GestionePastiComponent, canActivate: [authGuard] },
  { path: 'gestione-schema/:id', component: GestioneSchemaComponent, canActivate: [authGuard] },
  { path: 'genera-ricette/:id', component: GeneraRicetteComponent, canActivate: [authGuard] },

  // Redirect unknown routes to login (facoltativo ma utile)
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
