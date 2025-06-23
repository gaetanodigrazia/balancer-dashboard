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

import { LayoutComponent } from '../app/pages/layout/layout.component';
import { authGuard } from './auth/auth.guard';

const routes: Routes = [
  // Route pubblica (fuori dal layout)
  { path: 'login', component: LoginComponent },

  // Layout protetto da authGuard
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'riepilogo', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'ricette', component: RicetteComponent },
      { path: 'modelli', component: RiepilogoSchemiComponent },
      { path: 'riepilogo', component: RiepilogoSchemiComponent },
      { path: 'inserisci', component: InserisciSchemaComponent },
      { path: 'esporta', component: RiepilogoSchemiComponent },
      { path: 'gestione-schema', component: RiepilogoSchemiComponent },
      { path: 'gestione-pasti', component: RiepilogoSchemiComponent },
      { path: 'gestione-pasti/:id', component: GestionePastiComponent },
      { path: 'gestione-schema/:id', component: GestioneSchemaComponent },
      { path: 'genera-ricette/:id', component: GeneraRicetteComponent }
    ]
  },

  // Catch-all
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
