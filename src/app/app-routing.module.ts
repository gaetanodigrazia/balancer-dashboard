import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TipoSelezioneComponent } from './pages/tipo-selezione/tipo-selezione.component';
import { ScorteComponent } from './pages/scorte/scorte.component';
import { ListaSpesaComponent } from './pages/lista-spesa/lista-spesa.component';
import { ScontrinoComponent } from './pages/scontrino/scontrino.component';
import { SpeseMensiliComponent } from './spese-mensili/spese-mensili.component';
import { RicetteComponent } from './ricette/ricette.component';
import { SchemaNutrizionaleComponent } from './schema-nutrizionale/schema-nutrizionale.component';

const routes: Routes = [
  { path: '', component: TipoSelezioneComponent },
  { path: 'scorte', component: ScorteComponent },
  { path: 'listaSpesa', component: ListaSpesaComponent },
  { path: 'scontrino', component: ScontrinoComponent },
  { path: 'spese', component: SpeseMensiliComponent },
  { path: 'ricette', component: RicetteComponent },
  { path: 'schema', component: SchemaNutrizionaleComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
